# Runbook — Maintenance mode ("shut-off valve", WP-51)

**Purpose:** stop the front desk entering data while the database is being restored. Anything
entered after the last backup is discarded by a restore, so lock the clinic out *before* the
restore starts. The DB restore protocol
(`patient-care-db/docs/runbooks/db-restore-protocol.md`) says exactly when to flip it.

## How it works
- The flag is `maintenance.json` in S3 bucket `neurocorp`, served never-cached via CloudFront
  (`https://d26wxxuffdufr.cloudfront.net/maintenance.json`).
- The K3s UI's nginx **proxies that same file** (`MAINTENANCE_FLAG_URL`, helm value
  `maintenanceFlagUrl`), so one switch covers both hosts.
- The SPA checks it on load, every 60 s, and when a tab becomes visible. It never goes through
  the API or the DB, so it works with the API at `--replicas=0`.
- **Fails open:** a missing file, a network error or non-JSON all mean OFF.
- ON: non-SYSADMIN users get a full-screen lockout, and their writes are refused client-side.
  SYSADMIN works normally under a red banner. The login page stays usable.
- Limit: this is a client-side valve for staff. It does not stop someone calling the API directly.

## Flip it
```bash
# ON (message is optional, plain text, max 300 chars)
gh workflow run maintenance-mode.yaml -R anibalvelarde/patient-care-ui-vue -f state=on -f message="Restoring data — back by 14:30"
# OFF
gh workflow run maintenance-mode.yaml -R anibalvelarde/patient-care-ui-vue -f state=off
# Follow the run; its last step reads the file back through CloudFront and fails if it doesn't match
gh run watch -R anibalvelarde/patient-care-ui-vue
```
From a phone: GitHub → `patient-care-ui-vue` → Actions → **Maintenance mode** → Run workflow.

**After ON, wait 2 minutes** before touching the database: one 60 s poll plus the CloudFront
invalidation. Confirm with a non-SYSADMIN login if you can.

## Check the current state
```bash
curl -s "https://d26wxxuffdufr.cloudfront.net/maintenance.json?t=$(date +%s)"   # CloudFront
curl -s "http://neurocorp.k3s:31000/maintenance.json"                            # K3s (proxied)
```
`{"enabled":true,...}` = ON. Anything else (including an HTML page) = OFF.

## Gotchas
- **Deploys don't reset it.** `main.yaml` excludes `maintenance.json` from the `s3 sync --delete`
  and fails the build if a `dist/maintenance.json` ever appears. Keep both guards.
- **Before go-live:** do one ON/OFF flip as part of the quarterly restore rehearsal, so the
  switch is known-good when you need it.
- K3s can only see the flag if the cluster can reach CloudFront. If the internet is down, K3s
  reads it as OFF, as everywhere else.
- To disable the valve on a K3s host: `--set maintenanceFlagUrl=""` (it then always answers OFF).
