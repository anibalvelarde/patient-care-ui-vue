# WP-32C (U4) — Idle Auto-Logoff: owner walkthrough

Client-side idle timer: after N minutes of no activity the app shows a 60-second warning, then
signs the user out and returns to login. N is set per Site in Admin (default 60, `0` = disabled).

> This is UX hygiene, **not** server security — the token is not invalidated server-side. Someone
> holding a stolen token could still use it directly; the app just stops leaving an unattended
> session open on screen.

**Prereqs:** DB **V029** applied, API **WP-32B** deployed (so `/auth/me` returns
`idleLogoffMinutes`), and this UI (WP-32C) deployed. No re-login needed for the *value* to flow —
it's read at each login/refresh.

## Setup for a fast live test (use 1 minute)

Front-desk staff shouldn't wait an hour to test. Temporarily shorten the timeout:

1. Sign in as an admin (a user with **Admin › Sites** access).
2. Go to **Admin → Sites**, edit the site (usually "Main Clinic").
3. Set **Idle auto-logoff (minutes)** to `1`. Save.
4. **Sign out and back in** (the new value is picked up at login). ⚠️ Without re-login your current
   session still uses the old value.

Restore it to `60` (or your chosen value) when you're done — same steps.

## Scenario 1 — the warning appears, "I'm still here" keeps you in

1. With the timeout at 1 minute, sign in and then **stop touching the mouse/keyboard**.
2. **Expected:** at ~0:00 remaining of the first minute (i.e. immediately, since warning lead is
   60s and the timeout is 60s) a **"Still there?"** dialog appears with a live countdown.
   - *(At the real 60-minute setting the dialog appears at the 59-minute mark.)*
3. Click **"I'm still here"** before it reaches 0.
4. **Expected:** the dialog closes and you stay signed in; the clock resets.

## Scenario 2 — idle logout

1. Trigger the warning again (stop interacting).
2. Let the countdown reach **0** without clicking.
3. **Expected:** you're returned to the **login screen** with a toast:
   *"Signed out after 1 minute of inactivity."* (says "minutes" at higher settings).

## Scenario 3 — "Sign out now"

1. Trigger the warning, then click **"Sign out now"**.
2. **Expected:** immediate return to login, **no** inactivity toast (you chose to leave).

## Scenario 4 — activity resets the timer

1. Sign in and keep **lightly moving the mouse / typing** every 20–30 seconds.
2. **Expected:** the warning **never** appears — activity keeps the session alive.

## Scenario 5 — multi-tab

1. Open the app in **two browser tabs**, signed in.
2. In tab A, go idle until the warning shows; in tab B, **move the mouse**.
3. **Expected:** tab A's warning **disappears** — activity in any tab keeps them all alive.
4. Conversely, if you let it log out in one tab, the other tab drops to login on its next action.

## Scenario 6 — disabled (0)

1. Set **Idle auto-logoff** to `0`, save, re-login.
2. **Expected:** no warning and no idle logout, ever (feature off).

## Cleanup

Set the site's **Idle auto-logoff (minutes)** back to your intended production value (default `60`)
and re-login so staff sessions use it.
