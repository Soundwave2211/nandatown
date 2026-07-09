# Q4: Delegatable capability tokens

## Problem

Q4 asks the auth layer to support agent-to-agent delegation without returning
to a central issuer. A parent capability must mint a narrower, time-bounded
child capability, and revoking any ancestor must invalidate all descendants.

## Approach

`DelegatableAuth` keeps the existing `Auth` methods and adds
`delegate(parent_token, audience, scopes_subset, ttl)`. Root tokens are signed
with HMAC-SHA256. Child tokens are signed with a key derived from the exact
parent token hash and carry their ancestor hash chain for transitive checks.

## Invariants

- Child scopes are a strict subset of parent scopes.
- Child expiry is no later than parent expiry.
- The presenting audience must match the token audience when supplied.
- Revoking a token hash invalidates every descendant through the ancestor
  chain.
- Tampered payloads fail signature verification.

## Adversarial cases

The Q4 validator rejects scope escalation, stale parent use after revocation,
and audience confusion. The same validator fails against the default `jwt`
plugin because it has no delegation API.

## How to run

```bash
Nanda.venv/bin/python -m pytest packages/nest-plugins-reference/tests/test_delegatable_auth.py -q
```

## Verification

Focused Q4 tests passed locally: `10 passed`.
