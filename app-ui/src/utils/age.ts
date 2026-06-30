// Derived patient age ("Y yrs M mos") from a date of birth.
//
// Display-only — WP-18 keeps Age out of the DB/API entirely; the UI computes it from the patient's
// `dateOfBirth` at render time. Returns '' for empty/invalid/future DoB so callers can render nothing
// rather than a nonsensical value.
//
// We parse the leading yyyy-MM-dd as plain calendar numbers (covering both 'yyyy-MM-dd' from the form
// and 'yyyy-MM-ddT00:00:00' from the API) and compare against the local "today". This sidesteps the
// `new Date('yyyy-MM-dd')`-parses-as-UTC gotcha (the same hazard localDate.ts documents): mixing a
// UTC-parsed DoB with a local now would shift the age by a day across timezones.
export function formatAge(dob: string | null | undefined): string {
  if (!dob) return '';

  let by: number, bm: number, bd: number; // birth year / month(0-based) / day
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(dob);
  if (iso) {
    by = Number(iso[1]);
    bm = Number(iso[2]) - 1;
    bd = Number(iso[3]);
  } else {
    const d = new Date(dob);
    if (isNaN(d.getTime())) return '';
    by = d.getFullYear();
    bm = d.getMonth();
    bd = d.getDate();
  }

  const now = new Date();
  const ny = now.getFullYear();
  const nm = now.getMonth();
  const nd = now.getDate();

  // Future date of birth → no meaningful age.
  if (by > ny || (by === ny && (bm > nm || (bm === nm && bd > nd)))) return '';

  let years = ny - by;
  let months = nm - bm;
  // Borrow a month if the day-of-month hasn't been reached yet this month.
  if (nd < bd) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return `${years} yrs ${months} mos`;
}
