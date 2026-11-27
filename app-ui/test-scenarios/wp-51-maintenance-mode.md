# WP-51 — Maintenance mode ("shut-off valve") — test scenarios

**What changed:**
- You can now lock the clinic out of the app before a database restore, so nothing the front
  desk enters gets thrown away by the restore.
- The switch is the **"Maintenance mode" GitHub Action** in `patient-care-ui-vue`. It works even
  while the API and the database are down. It switches both the internet copy (CloudFront) and the
  LAN copy (K3s).
- While it's **ON**:
  - everyone except the **system administrator** sees a full-screen *"The system is under
    maintenance"* page (with your message) instead of the app;
  - the system administrator keeps working normally under a red **"Maintenance mode is ON"** bar;
  - the login page shows a red bar saying only the system administrator can sign in.
- Turning it **OFF** unlocks every open tab within about a minute. Nobody needs to reload.
- If the switch can't be read (internet hiccup, file missing), the app treats it as **OFF**, so
  it can never lock the clinic out by accident.

**How to flip it** (from the root, or from GitHub → Actions → *Maintenance mode* → Run workflow on a phone):
```bash
gh workflow run maintenance-mode.yaml -R anibalvelarde/patient-care-ui-vue -f state=on -f message="WP-51 test — back in 10 minutes"
gh workflow run maintenance-mode.yaml -R anibalvelarde/patient-care-ui-vue -f state=off
gh run watch -R anibalvelarde/patient-care-ui-vue    # the last step confirms CloudFront serves the new state
```
The workflow appears only after the WP-51 PR is merged to `main`.

**Before you start:** the WP-51 UI release is deployed to CloudFront (CI does this on merge) and
the K3s UI is rolled to the same release. You need two browsers or one normal plus one private
window: one logged in as the **system administrator**, one as a **front-desk** user.

## 1. Nothing changes while the switch is OFF
1. Open the app (CloudFront URL) as the front-desk user and as the system administrator.
- ✅ No red bar and no maintenance page for either. The app works as before.
- ✅ `https://d26wxxuffdufr.cloudfront.net/maintenance.json` shows a web page or `{"enabled":false,...}`. Both mean OFF.

## 2. Turn it ON: the front desk is locked out
1. Run the workflow with `state=on` and a message. Wait until the run is green (about 1 minute).
2. Look at the front-desk window. Don't reload.
- ✅ Within about a minute it changes to **"The system is under maintenance"** with your message.
- ✅ Nothing behind it can be clicked. **Sign out** works and goes to the login page.

## 3. The system administrator keeps working
1. Look at the system administrator window.
- ✅ A red bar at the top: **"Maintenance mode is ON. Only system administrators can work…"** + your message.
- ✅ The bar pushes the page down. It doesn't cover the header buttons.
- ✅ Everything works, including saving (e.g. open a patient and save without changes).

## 4. Login page while ON
1. In the front-desk window (signed out), open the login page.
- ✅ A red bar: **"Maintenance in progress. Only the system administrator can sign in right now."**
2. Sign in as the front-desk user.
- ✅ Sign-in works, then the maintenance page appears straight away.
3. Sign out, then sign in as the system administrator.
- ✅ The administrator gets in and sees the red bar (step 3).

## 5. Turn it OFF: tabs unlock by themselves
1. Run the workflow with `state=off`. Wait for green.
2. Watch the front-desk window. Don't reload.
- ✅ Within about a minute the maintenance page disappears and the app is usable again.
- ✅ The red bar disappears from the administrator window.

## 6. LAN copy (K3s) follows the same switch
1. Repeat steps 2 and 5 using the LAN address (`http://neurocorp.k3s:31000`) for the front-desk window.
- ✅ It locks and unlocks just like the CloudFront copy, with no extra step.

## 7. A deploy doesn't undo the switch (optional, when a UI release is going out anyway)
1. Turn it ON, merge or deploy a UI release, then check the front-desk window again.
- ✅ Still locked after the deploy. Turn it OFF afterwards.
