// composables/useIdleLogoff.ts
//
// WP-32 (U4): client-side idle auto-logoff. After N minutes without user activity we show a
// 60-second warning countdown, then log the user out locally and send them to the login screen.
// N comes from /auth/me (`idleLogoffMinutes`, a Site attribute); 0 disables the feature entirely.
//
// This is UX hygiene, NOT token security — the access token is not invalidated server-side
// (documented limitation; server-enforced idle expiry is a follow-up). We deliberately mirror the
// authBridge session-expiry landing (auth.logout() -> router push 'login' -> notification) rather
// than call authBridge.notifyUnauthorized(), because that path hard-codes the "session expired"
// copy and we want the "inactivity" variant.
//
// Correctness under tab-sleep: idle is computed from a wall-clock timestamp in localStorage
// (`pc_last_activity`), not by counting ticks — so throttled/slept timers still resolve correctly
// when they next fire. That same shared key makes it multi-tab aware: activity in ANY tab keeps
// all tabs alive, and a logout in one tab cascades (refresh token cleared -> other tabs die on
// their next 401/refresh).

import { computed, onScopeDispose, ref, watch, type Ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '../stores/auth';
import { useNotificationsStore } from '../stores/notifications';

const LAST_ACTIVITY_KEY = 'pc_last_activity';
const POLL_INTERVAL_MS = 30_000; // background idle poll — coarse on purpose (survives tab sleep)
const COUNTDOWN_INTERVAL_MS = 1_000; // fine-grained ticker, only runs while the warning shows
const WARNING_LEAD_MS = 60_000; // show the warning this long before expiry
const ACTIVITY_THROTTLE_MS = 5_000; // don't rewrite localStorage on every pointermove
const ACTIVITY_EVENTS = ['keydown', 'pointerdown', 'pointermove', 'touchstart', 'scroll'] as const;

export interface IdleLogoffController {
  /** Whether the warning countdown modal should be shown. */
  warningVisible: Ref<boolean>;
  /** Seconds left before automatic logout while the warning is visible. */
  secondsRemaining: Ref<number>;
  /** "I'm still here" — resets the idle clock and dismisses the warning. */
  stayActive: () => void;
  /** "Sign out now" — logs out immediately (no inactivity toast; the user chose this). */
  signOutNow: () => void;
}

export function useIdleLogoff(): IdleLogoffController {
  const router = useRouter();
  const auth = useAuthStore();
  const notifications = useNotificationsStore();
  const { isAuthenticated, idleLogoffMinutes } = storeToRefs(auth);

  const warningVisible = ref(false);
  const secondsRemaining = ref(0);

  const expiryMs = computed(() => idleLogoffMinutes.value * 60_000);

  let armed = false;
  let loggingOut = false;
  let pollId: ReturnType<typeof setInterval> | undefined;
  let countdownId: ReturnType<typeof setInterval> | undefined;
  let lastWrite = 0;

  function now(): number {
    return Date.now();
  }

  function writeActivity(ts: number): void {
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(ts));
    } catch {
      // localStorage can throw in private mode; degrade to same-tab-only via a fallback below.
    }
  }

  function idleMs(): number {
    let last: number;
    try {
      const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
      last = raw ? Number(raw) : now();
    } catch {
      last = now();
    }
    if (!Number.isFinite(last)) return 0;
    return now() - last;
  }

  function recordActivity(): void {
    // While the warning is up, only the explicit buttons (or another tab) reset the clock —
    // passive movement in THIS tab must not silently cancel the countdown.
    if (warningVisible.value) return;
    const ts = now();
    if (ts - lastWrite < ACTIVITY_THROTTLE_MS) return;
    lastWrite = ts;
    writeActivity(ts);
  }

  function onVisibility(): void {
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      recordActivity();
    }
  }

  function attachListeners(): void {
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, recordActivity, { passive: true }));
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }
  }

  function detachListeners(): void {
    ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, recordActivity));
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibility);
    }
  }

  function stopCountdown(): void {
    if (countdownId !== undefined) {
      clearInterval(countdownId);
      countdownId = undefined;
    }
  }

  function hideWarning(): void {
    warningVisible.value = false;
    stopCountdown();
  }

  function showWarning(): void {
    warningVisible.value = true;
    tickCountdown(); // seed secondsRemaining immediately so the modal opens with a real number
    if (countdownId === undefined) {
      countdownId = setInterval(tickCountdown, COUNTDOWN_INTERVAL_MS);
    }
  }

  // Runs once per second while the warning is visible: refreshes the countdown, dismisses if
  // activity (possibly from another tab) pushed us back out of the window, and fires the logout
  // when the clock runs out.
  function tickCountdown(): void {
    const remaining = expiryMs.value - idleMs();
    if (remaining <= 0) {
      expireLogout();
      return;
    }
    if (idleMs() < expiryMs.value - WARNING_LEAD_MS) {
      hideWarning();
      return;
    }
    secondsRemaining.value = Math.ceil(remaining / 1000);
  }

  // Coarse background poll: decides whether we're inside the warning window yet.
  function poll(): void {
    const idle = idleMs();
    if (idle >= expiryMs.value) {
      expireLogout();
    } else if (idle >= expiryMs.value - WARNING_LEAD_MS) {
      if (!warningVisible.value) showWarning();
    } else if (warningVisible.value) {
      hideWarning();
    }
  }

  function performLogout(reason?: string): void {
    if (loggingOut) return;
    loggingOut = true;
    disarm();
    auth.logout();
    if (router.currentRoute.value.name !== 'login') {
      // Fresh login on idle — no redirect query; the user stepped away.
      void router.push({ name: 'login' });
    }
    if (reason) notifications.error(reason);
  }

  function expireLogout(): void {
    const mins = idleLogoffMinutes.value;
    performLogout(`Signed out after ${mins} minute${mins === 1 ? '' : 's'} of inactivity.`);
  }

  function stayActive(): void {
    lastWrite = now();
    writeActivity(lastWrite);
    hideWarning();
  }

  function signOutNow(): void {
    performLogout(); // no toast — the user clicked "Sign out now"
  }

  function arm(): void {
    if (armed) return;
    armed = true;
    loggingOut = false;
    lastWrite = now();
    writeActivity(lastWrite); // seed so a just-logged-in user isn't instantly "idle"
    attachListeners();
    pollId = setInterval(poll, POLL_INTERVAL_MS);
  }

  function disarm(): void {
    if (!armed) return;
    armed = false;
    detachListeners();
    if (pollId !== undefined) {
      clearInterval(pollId);
      pollId = undefined;
    }
    hideWarning();
  }

  // Arm only while authenticated with a positive timeout; 0 (or logout) disarms cleanly.
  watch(
    [isAuthenticated, idleLogoffMinutes],
    ([authed, mins]) => {
      if (authed && mins > 0) arm();
      else disarm();
    },
    { immediate: true }
  );

  onScopeDispose(disarm);

  return { warningVisible, secondsRemaining, stayActive, signOutNow };
}
