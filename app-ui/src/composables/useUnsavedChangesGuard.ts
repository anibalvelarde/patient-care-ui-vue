// composables/useUnsavedChangesGuard.ts
//
// WP-64 (owner request 2026-11-14): a form drawer with unsaved edits must not vanish on a stray
// click. While `isDirty` is true, every way out asks first:
//   - the drawer's own close paths (backdrop click, X, Cancel) → call `confirmLeave()` and close
//     only when it resolves true;
//   - leaving the page in the app (sidebar, links, back button) → a route-leave guard;
//   - browser refresh / tab close → the browser's own "Leave site?" prompt (its text can't be set).
// Logoff is never blocked: a route change to `login` (manual logout, idle logoff, session
// expiry) always goes through — losing an unsaved draft beats keeping a session open.
//
// Usage (pair with <UnsavedChangesDialog>):
//   const { confirmVisible, confirmLeave, keepEditing, discard } = useUnsavedChangesGuard(isDirty);
//   const requestClose = async () => { if (await confirmLeave()) emit('close'); };

import { inject, onBeforeUnmount, onMounted, ref, type Ref } from 'vue';
import { matchedRouteKey, onBeforeRouteLeave } from 'vue-router';

export function useUnsavedChangesGuard(isDirty: Readonly<Ref<boolean>>) {
  const confirmVisible = ref(false);
  let pending: ((leave: boolean) => void) | null = null;

  /** Resolves true when it's OK to leave (nothing unsaved, or the user chose Discard). */
  function confirmLeave(): Promise<boolean> {
    if (!isDirty.value) return Promise.resolve(true);
    pending?.(false); // a second ask supersedes the first (the first stays put)
    confirmVisible.value = true;
    return new Promise<boolean>((resolve) => { pending = resolve; });
  }

  function settle(leave: boolean) {
    confirmVisible.value = false;
    const resolve = pending;
    pending = null;
    resolve?.(leave);
  }
  const keepEditing = () => settle(false);
  const discard = () => settle(true);

  // Only inside a routed component (unit specs often mount without a router).
  if (inject(matchedRouteKey, null)) {
    onBeforeRouteLeave((to) => (to.name === 'login' ? true : confirmLeave()));
  }

  const onBeforeUnload = (e: BeforeUnloadEvent) => {
    if (!isDirty.value) return;
    e.preventDefault();
    e.returnValue = ''; // legacy browsers need it set to show the prompt
  };
  onMounted(() => window.addEventListener('beforeunload', onBeforeUnload));
  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', onBeforeUnload);
    settle(false);
  });

  return { confirmVisible, confirmLeave, keepEditing, discard };
}
