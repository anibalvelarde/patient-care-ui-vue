// WP-17C — generated permissions integrity.
//
// These guard the "generate, don't transcribe" property: the committed permissions.ts must stay a
// faithful, drift-free projection of the access-control manifest. Combined with vue-tsc (every gate
// references a Permissions constant, so a typo'd/removed claim fails compilation), this is the UI
// half of the WP-17 drift defense; 17D wires `generate-ui-permissions.sh --check` into CI too.

import { describe, it, expect } from 'vitest';
import manifest from '../generated/access-control-matrix.json';
import { Permissions, ACCESS_CONTROL_MANIFEST_HASH } from '../generated/permissions';

const manifestClaims = (manifest.claims as Array<{ claim: string }>).map((c) => c.claim);

describe('generated permissions ↔ manifest', () => {
  it('anchors the manifest semantic hash', () => {
    expect(ACCESS_CONTROL_MANIFEST_HASH).toBe(manifest._meta.semanticHash);
  });

  it('exposes exactly the manifest claim set (no missing, no orphan)', () => {
    const generated = Object.values(Permissions).sort();
    const expected = [...manifestClaims].sort();
    expect(generated).toEqual(expected);
  });

  it('names each constant as the claim with dots removed (codegen contract)', () => {
    for (const [name, value] of Object.entries(Permissions)) {
      expect(name).toBe(value.replace(/\./g, ''));
    }
  });

  it('every constant value is a non-empty Permission string', () => {
    for (const value of Object.values(Permissions)) {
      expect(value).toMatch(/^[A-Za-z]+(\.[A-Za-z]+)*$/);
    }
  });
});
