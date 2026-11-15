# WP-65 — "A new version is available" — test scenarios

**What changed:**
- An open tab now notices when a newer version of the app was deployed. It shows a banner,
  **"A new version of the app is available. [Reload] [Later]"**, and never reloads on its own.
- If a page fails to open because the deploy replaced it, the app loads that page fresh
  instead of failing.

**When it checks:** every hour, and when the tab comes back into view after more than an hour
(e.g. a laptop that slept overnight). It never checks on localhost dev servers.

## Local test setup (Claude provides it)
- `http://localhost:8080` is served by real nginx, the same server the K3s image uses.
- It runs a production build, **v901**, whose check runs **every minute** instead of every
  hour, so you don't have to wait. Footer: **UI v901**.
- It talks to the **K3s API**, so log in with your normal account. Only browse; don't change data.
- To "deploy" **v902** over it, run `bash <scratchpad>/wp65-deploy-902.sh` (Claude gives the full
  path), or ask Claude to run it.

## 1. No banner when nothing changed
1. Open `http://localhost:8080`, log in, and open the Dashboard (it's fine to stay on Patients).
   Wait 2 minutes.
- ✅ No banner. The footer says **UI v901**.

## 2. Banner after a deploy
1. Leave the tab open. Run the v902 "deploy".
2. Wait up to 1 minute.
- ✅ A dark banner at the bottom says **"A new version of the app is available."** with **Reload**
  and **Later** buttons.
- ✅ The page did **not** reload by itself, and anything typed is still there.

## 3. Later
1. Click **Later**.
- ✅ The banner goes away.
2. Wait about a minute (the next check).
- ✅ The banner comes back. Live, this happens at the next hourly check.

## 4. Reload
1. Click **Reload**.
- ✅ The page reloads, and the footer now says **UI v902**. The banner doesn't return,
  because you're on the newest version.

## 5. Reload with unsaved work
1. Reset to v901 (ask Claude), reload the tab, and confirm the footer says v901. Run the v902 deploy again.
2. Open Treatment Plans → New plan, type something in Notes, and leave the drawer open.
- ✅ The banner appears at the next check. It sits behind the open drawer, so it doesn't interrupt you.
3. With the unsaved edits still in the drawer, press **F5** (the same as Reload).
- ✅ With unsaved edits, the browser's own "Leave site?" prompt guards the reload (WP-64).

## 6. A page the deploy replaced opens fresh
1. Reset to v901 (ask Claude) and reload the tab. Visit **only** the Dashboard; don't open Admin.
2. Run the v902 deploy. **Before** the banner appears (within a minute), click **Admin** in the sidebar.
- ✅ Admin opens after a brief full-page load, with no error and no dead click. The footer
  now says **UI v902**.
- *(Before WP-65 this click did nothing, and the console showed "Failed to fetch dynamically imported module".)*

## 7. Live (after deploy) — optional
- On AWS or K3s, nothing visible changes until the *next* release after WP-65. Then any tab left open
  shows the banner within an hour.
