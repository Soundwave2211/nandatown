# Q9: Hybrid Privacy

## Problem

Q9 asks for a privacy plugin that replaces the `noop` passthrough with real
confidentiality, selective disclosure, and broadcast revocation. The target
threats are eavesdroppers, replayed ciphertexts, tampered disclosure proofs,
and revoked recipients reading future messages.

## Approach

`hybrid_x25519` uses an HPKE-shaped envelope: each message has a fresh content
key encrypted once with ChaCha20-Poly1305, and that key is wrapped per
recipient using X25519 ephemeral-static ECDH plus HKDF-SHA256. Sender, epoch,
message id, and recipient key ids are bound into AEAD associated data.

Selective disclosure uses salted Merkle commitments. An issuer commits to all
credential fields, while a holder reveals only requested fields with salts and
authentication paths. Verification reconstructs the root and also requires the
proof object's embedded `Statement` to match the verifier's statement.

Revocation advances a sender epoch and excludes the revoked member from future
key wraps. This is future-only: a recipient can still decrypt envelopes they
were authorized to receive before revocation.

## Invariants

- Plaintext is never present in hybrid envelopes.
- Only audience members with wrapped content keys can decrypt.
- Replayed envelopes are rejected by recipient replay memory.
- AEAD associated data detects redirection or envelope mutation.
- Selective-disclosure proof roots, reveal sets, values, salts, paths, schemes,
  and statements must all match.
- Revoked members cannot decrypt post-revocation messages.

## Adversarial Cases

The Q9 tests and validators reject non-audience decryption, plaintext leakage
on the wire, ciphertext tampering, replay, field injection, mismatched proof
statements, and stale revocation. The same validators fail against `noop`.

## How To Run

```bash
Nanda.venv/bin/python -m pytest \
  packages/nest-plugins-reference/tests/test_hybrid_x25519.py \
  packages/nest-plugins-reference/tests/test_hybrid_x25519_properties.py \
  packages/nest-plugins-reference/tests/test_hybrid_x25519_scenario.py \
  -q
```

Static compile:

```bash
PYTHONPYCACHEPREFIX=/tmp/nandatown-pycache Nanda.venv/bin/python -m compileall \
  packages/nest-core/nest_core \
  packages/nest-plugins-reference/nest_plugins_reference
```

## Verification

Focused Q9 tests and static checks should be run before submission. If shared
scenario or validator plumbing changes, rerun the Q10 HotStuff guard suite.
