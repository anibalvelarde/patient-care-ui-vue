# WP-49 — Fee Policy: test-drive script

Walkthrough for the three fee rules from the Aug-1 meeting. Run these in a browser against a
deployed stack.

> **Log out and back in first.** Permissions are baked into your session at login, and this
> release adds a new one. If the Late Fees tab or the Waive button is missing, that's almost
> always a stale login rather than a bug — sign out, sign in, and look again.

**Who you need:** a **Manager** login and an **Assistant Manager** login. Several checks are
specifically about the *difference* between them.

---

## 1. A no-show now bills the full session price

*This is the change that affects money immediately, with no action from you.*

1. Book a session for a known amount — say **$85**.
2. Confirm it, then mark it **No Show**.
3. Open the session and read the amount.

**Expect:** the charge is **$85.00** — the whole session price. It used to be $25.50 (30%).

**Why it matters:** the slot was reserved and the therapist was there. Every no-show since
2026-07-31 has been billed at 30% — this is the correction. Note that no-shows *already* billed
at 30% stay as they are; deciding whether to re-bill any of them is a business call, not
something this release does for you.

4. Go to **Admin › Sites** and open a site. The no-show fee reads **100.00%**.

**Expect:** only a System Administrator can change that number. Everyone else sees it read-only.
It is a **percent**, not dollars — 100 means "the full session price", and 0 means "no fee".

---

## 2. Cancelling is still free

1. Book a session, confirm it, then **Cancel** it.

**Expect:** the money zeroes out. Nothing is charged.

This has been the behaviour since WP-42 — it's listed here only so you can confirm the new
no-show rule did **not** leak into cancellations. They are different situations and stay
different.

---

## 3. The late chargeback

*New. Nothing charges automatically — you decide when it runs.*

### Find it

**Billing › Payment Management** now has two tabs: **Payments** and **Late Fees**.

> It lives here, next to money coming in, rather than with Service Payments — those are
> payments going *out* to therapists.

### Preview

1. Open the **Late Fees** tab.
2. Read the banner at the top.

**Expect:** it tells you this applies to sessions unpaid **7+ days** and that it is **separate
from the 35-day past-due rule.** Those really are two different clocks: a session can carry a
late fee for weeks before it ever shows up on your Past Due lists, and this release does not
change those lists at all.

3. Click **Preview Late Fees**.

**Expect:** a table of sessions with the patient, the caretaker who owes it, how many days it
has gone unpaid, the outstanding balance, and the fee that would be charged (30% of the
balance).

> **On today's data expect roughly one row, around $125 owing and a $37.50 fee.** If you see a
> lot more than that, stop and tell me before applying anything — it would mean the receivables
> book changed since we measured it, and that is worth understanding first.

4. **Nothing has been charged yet.** Navigate away and come back — the fees are still not
   applied. Previewing is safe to do as often as you like.

### Apply

5. Preview again. Untick one session if there is more than one.
6. Click **Apply Late Fees**.

**Expect:** a green confirmation naming the total charged and how many sessions it covered.
**Only the ticked rows are charged** — the one you unticked is untouched.

7. Open one of the charged sessions (Dashboard or Patients › Session History).

**Expect:** the amount owed has gone **up by the fee**, and the session notes carry a line like
`[LATE-FEE 2026-08-08: 30% of 125.00 = 37.50; 80 days unpaid]`.

### The important one: it never charges twice

8. Preview again, **same date**.

**Expect:** the sessions you just charged are **gone from the list**.

9. Now force the issue — preview, and if any of the already-charged sessions somehow appear,
   apply again.

**Expect:** they are reported as **skipped**, with the reason "A late fee has already been
applied to this session." The fee never compounds on itself.

### Skipped sessions tell you why

10. Preview, then — before applying — record a payment that settles one of the listed sessions.
11. Come back and apply.

**Expect:** that session appears under **"not charged"** with the reason that it has no unpaid
balance. This is the behaviour to check carefully: if you select 12 sessions and 9 get charged,
the screen must account for the other 3. A silent smaller total would be the bug.

---

## 4. Forgiving a fee is now a manager's decision

### As a Manager

1. Open a session that carries a fee (one you charged above).
2. In the session panel, open the **Fees** section.

**Expect:** the fee is listed with a **Waive Fee** button.

3. Click it.

**Expect:** a dialog asking **which** fee (a session can carry both a no-show fee and a late
fee) and **why**. The reason is required. It also shows the amount owed before and after, so
you can see exactly what you are forgiving before committing.

4. Enter a reason and confirm.

**Expect:** the amount owed drops by the fee. The session notes gain a line naming the amount,
**you**, and your reason.

5. Try to waive the same fee again.

**Expect:** it is no longer offered. A fee is forgiven once.

6. Run the late-fee batch again.

**Expect:** the session you just forgave is **not** re-charged. This is the one to be most
confident about — a forgiven fee coming back next week would be worse than never having the
feature.

7. Look at the session in **Patients › Session History**.

**Expect:** the Late Fee column reads **"waived"** — deliberately different from "—" (never
charged). If a caretaker ever asks, you can tell the two apart.

### As an Assistant Manager — the part that changed

8. Log in as the **Assistant Manager** and open the same session.

**Expect:** the **Waive Fee** button is visible but **greyed out**, with a note that waiving is
a manager action. You should be able to see the situation without being able to change it.

9. Still as AM, open **Billing › Payment Management › Late Fees** and preview.

**Expect:** the preview **works** — an AM can see what is owed. But **Apply Late Fees** is
greyed out with an explanation.

10. Still as AM, open a fee-bearing session and try to edit its **Discount**.

**Expect:** the discount is **read-only**, with a note saying the session carries a fee and to
use Waive Fee instead.

> **This is the point of the whole change.** Without it, an assistant manager could set the
> discount equal to the amount and make the fee disappear — the same money moved, but with no
> reason recorded and no note saying who did it. Forgiving a charge should be a decision
> somebody's name is on.

11. As AM, edit the discount on a session with **no** fee.

**Expect:** that still works normally. Only fee-bearing sessions are restricted.

---

## 5. What the caretaker sees

1. Open **Patients › Session History** for a patient with a fee, and click **Print**.

**Expect:** the printed report shows the money, but **none of the internal markers** —
no `[LATE-FEE …]`, no `[FEE-WAIVED …]`, no `[CANCELLED-ZEROED …]`, and **never the reason you
typed when waiving a fee.** Those are internal audit notes.

> Worth a careful look: markers of this kind *were* reaching printed reports before this
> release. Please check a printout of a session that has a cancellation or no-show note on it.

2. Open **Statements › Caretaker** for the same caretaker.

**Expect:** the late fee appears as **its own line**, not folded silently into a bigger number.
A caretaker should be able to see why the balance is what it is.

---

## 6. Nothing else moved

Quick regression pass — none of these should behave differently:

- **Patients › Past Due** and **Therapists › Past Due** still list the same people. The 35-day
  rule is unchanged.
- A past-due patient's **balance** now includes any late fee and any on-site trip charge. (The
  trip charge was being dropped from that total before — a quiet pre-existing bug this fixes.)
- Booking, discounts on ordinary sessions, SENADIS discounts, and payroll all behave as before.
- Recording a payment against a session that carries a fee lets you pay **the full amount
  including the fee**.

---

## If something looks wrong

Tell me **which step**, what you expected, and what you saw. For anything money-related, the
session id and a screenshot of the session panel is usually enough for me to reconstruct it.

**Do not press Apply Late Fees** if the preview shows far more sessions than the handful we
expect — flag it first.
