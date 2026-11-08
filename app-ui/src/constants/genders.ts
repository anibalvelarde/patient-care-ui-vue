// WP-56C — patient gender values. Mirrors the API's `Genders` (WP-55B). Lockstep-guarded.

export const Gender = {
  Male: 'Male',
  Female: 'Female',
  Other: 'Other',
} as const;

export type GenderValue = (typeof Gender)[keyof typeof Gender];

export const ALL_GENDERS: readonly GenderValue[] = Object.values(Gender);
