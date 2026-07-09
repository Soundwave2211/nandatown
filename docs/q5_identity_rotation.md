# Q5: Ed25519 identity rotation

## Problem

Q5 asks for a real identity plugin that signs with Ed25519, rotates keys, and
still verifies old signatures when the verifier anchors them inside the old
key's validity window. It must reject post-rotation stale-key forgeries and
new-key signatures backdated into an old window.

## Approach

`Ed25519RotatingIdentity` derives deterministic Ed25519 seeds for reproducible
Tier 1 traces, tracks `KeyRecord` windows as `[issued_at, rotated_out)`, and
adds `rotate_key(new_seed)` plus `verify(..., as_of=tick)`. Rotation records
carry continuity evidence: the old key signs the new key's public record.

## Invariants

- Every rotating signature carries `key_id` and `signed_at` metadata.
- Verification binds to `ed25519-rotating/1`, the signature's `key_id`, and
  the verifier-supplied `as_of` tick.
- Old-key signatures fail at or after that key's `rotated_out` tick.
- New-key signatures fail before that key's `issued_at` tick.
- Rotation records must use raw 32-byte Ed25519 public keys and matching
  key IDs.
- Replayed rotation records are idempotent, not duplicate history entries.

## Adversarial cases

The validator rejects accepted post-rotation forgeries, accepted backdating
attempts, traces without both attack kinds, missing rotations, keyless
`did_key` traces, malformed windows, wrong algorithms, inconsistent rotation
records, and private-key registration attempts.

## How to run

```bash
Nanda.venv/bin/python -m pytest \
  packages/nest-plugins-reference/tests/test_ed25519_rotating.py \
  packages/nest-plugins-reference/tests/test_ed25519_rotating_properties.py \
  packages/nest-core/tests/test_identity_rotation.py \
  -q
```

## Verification

Focused Q5 tests passed locally: `52 passed`.
