# Auth layer

**What it does.** Issue, verify, and revoke capability tokens (scopes
granted to a subject).

## Interface

```python
class Auth(Protocol):
    async def issue(self, subject: AgentId, scopes: list[str]) -> Token: ...
    async def verify(self, token: Token) -> AuthContext: ...
    async def revoke(self, token: Token) -> None: ...
```

Full definition: [`nest_core/layers/auth.py`](../../packages/nest-core/nest_core/layers/auth.py).

## Default plugin

`jwt` — HMAC-SHA256-signed token. **Not an RFC 7519 JWT.** Convenient
shape (header.payload.sig), no claim validation beyond the signature.

Source: [`nest_plugins_reference/auth/jwt_auth.py`](../../packages/nest-plugins-reference/nest_plugins_reference/auth/jwt_auth.py).

## Delegatable capabilities

`delegatable` — HMAC-chained capability tokens with
`delegate(parent_token, audience, scopes_subset, ttl)`. Child tokens are bound
to the parent token hash, must carry a strict subset of parent scopes, cannot
outlive the parent, and fail verification when any ancestor is revoked.

Source: [`nest_plugins_reference/auth/delegatable.py`](../../packages/nest-plugins-reference/nest_plugins_reference/auth/delegatable.py).

## Writing your own

See [`writing-a-plugin.md`](../writing-a-plugin.md). Register under
entry point group `nest.plugins.auth`.

Good fits to test here: real JWT/PASETO/biscuit/macaroons, OAuth-style
flows, capability delegation, revocation propagation.
