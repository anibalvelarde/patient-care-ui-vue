// interfaces/CrossAdd.ts
//
// WP-27 (F8/F9) — cross-add chain shapes. When a form modal is opened as the create-new step of
// a cross-add chain (linkTo prop set), its `created` emit carries the caretaker↔patient link
// fields captured in the form alongside the created record; outside a chain `link` is null.

export interface CrossAddLink {
  relationship: string | null;
  isPrimary: boolean;
}

export interface CreatedForChain<TRecord> {
  record: TRecord;
  link: CrossAddLink | null;
}
