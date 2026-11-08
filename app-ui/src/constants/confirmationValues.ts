// WP-56C — session confirmation result/method values. Mirrors the API's `ConfirmationValues`
// (WP-55B). Lockstep-guarded.

export const ConfirmationResult = {
  Confirmed: 'Confirmed',
  NoAnswer: 'NoAnswer',
  LeftMessage: 'LeftMessage',
  Declined: 'Declined',
} as const;

export type ConfirmationResultValue = (typeof ConfirmationResult)[keyof typeof ConfirmationResult];

export const ALL_CONFIRMATION_RESULTS: readonly ConfirmationResultValue[] = Object.values(ConfirmationResult);

export const CONFIRMATION_RESULT_LABEL: Readonly<Record<ConfirmationResultValue, string>> = {
  Confirmed: 'Confirmed',
  NoAnswer: 'No Answer',
  LeftMessage: 'Left Message',
  Declined: 'Declined',
};

export const ConfirmationMethod = {
  Phone: 'Phone',
  Email: 'Email',
  Text: 'Text',
  InPerson: 'InPerson',
} as const;

export type ConfirmationMethodValue = (typeof ConfirmationMethod)[keyof typeof ConfirmationMethod];

export const ALL_CONFIRMATION_METHODS: readonly ConfirmationMethodValue[] = Object.values(ConfirmationMethod);

export const CONFIRMATION_METHOD_LABEL: Readonly<Record<ConfirmationMethodValue, string>> = {
  Phone: 'Phone',
  Email: 'Email',
  Text: 'Text',
  InPerson: 'In Person',
};
