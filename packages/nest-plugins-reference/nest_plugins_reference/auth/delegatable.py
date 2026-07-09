# SPDX-License-Identifier: Apache-2.0
"""Delegatable capability auth with chained HMAC proofs.

The base :class:`nest_core.layers.auth.Auth` protocol can issue, verify, and
revoke tokens. This plugin keeps that surface and adds
``delegate(parent_token, audience, scopes_subset, ttl)`` so an agent holding a
parent capability can mint a narrower, time-bounded child without returning to
the root issuer.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import time
from collections.abc import Callable
from typing import Any

from nest_core.types import AgentId, AuthContext, Token


class DelegatableAuthError(ValueError):
    """Base class for delegatable auth failures."""


class InvalidCapabilityError(DelegatableAuthError):
    """Raised when a token is malformed, unknown, or has a bad signature."""


class ScopeEscalationError(DelegatableAuthError):
    """Raised when a child asks for scopes not strictly below its parent."""


class AudienceMismatchError(DelegatableAuthError):
    """Raised when a token is presented by an agent other than its audience."""


class RevokedCapabilityError(DelegatableAuthError):
    """Raised when the presented token itself is revoked."""


class RevokedAncestorError(DelegatableAuthError):
    """Raised when any ancestor of the presented token is revoked."""


class ExpiredCapabilityError(DelegatableAuthError):
    """Raised when the presented token itself is expired."""


class ExpiredAncestorError(DelegatableAuthError):
    """Raised when any ancestor of the presented token is expired."""


class DelegatableAuth:
    """HMAC-chained, revocation-propagating capability auth.

    Root tokens are signed by ``secret``. Child tokens are signed by a key
    derived from ``secret`` and the exact parent token hash, binding every child
    to a single parent. Revoking a token hash invalidates every descendant
    because each child carries the ancestor hash chain and ``verify`` checks it
    transitively.

    Example::

        auth = DelegatableAuth(secret=b"demo", clock=lambda: 1000.0)
        root = await auth.issue(AgentId("coordinator"), ["read", "write", "admin"])
        child = await auth.delegate(root, AgentId("worker"), ["read"], ttl=60)
        ctx = await auth.verify(child, audience=AgentId("worker"))
    """

    def __init__(
        self,
        secret: bytes = b"nest-delegatable-secret",
        *,
        clock: float | Callable[[], float] | None = None,
        default_ttl: float = 3600.0,
    ) -> None:
        if default_ttl <= 0:
            msg = "default_ttl must be positive"
            raise ValueError(msg)
        self._secret = secret
        self._clock = clock
        self._default_ttl = float(default_ttl)
        self._revoked_hashes: set[str] = set()
        self._issued: dict[str, dict[str, Any]] = {}
        self._counter = 0

    def _now(self) -> float:
        if callable(self._clock):
            return float(self._clock())
        if self._clock is not None:
            return float(self._clock)
        return time.time()

    @staticmethod
    def token_hash(token: Token) -> str:
        """Return the stable revocation/provenance hash for ``token``."""
        return hashlib.sha256(str(token).encode()).hexdigest()

    @staticmethod
    def _b64(data: bytes) -> str:
        return base64.urlsafe_b64encode(data).decode().rstrip("=")

    @staticmethod
    def _unb64(data: str) -> bytes:
        padding = "=" * (-len(data) % 4)
        return base64.urlsafe_b64decode(data + padding)

    @staticmethod
    def _canonical(payload: dict[str, Any]) -> str:
        return json.dumps(payload, separators=(",", ":"), sort_keys=True)

    @staticmethod
    def _normalise_scopes(scopes: list[str]) -> list[str]:
        unique = sorted({str(scope) for scope in scopes})
        if len(unique) != len(scopes):
            msg = "scopes must be unique"
            raise ValueError(msg)
        if not unique:
            msg = "scopes must not be empty"
            raise ValueError(msg)
        return unique

    def _signing_key(self, parent_hash: str | None) -> bytes:
        if parent_hash is None:
            return self._secret
        return hmac.new(self._secret, f"delegate:{parent_hash}".encode(), hashlib.sha256).digest()

    def _sign(self, payload: dict[str, Any]) -> str:
        parent_hash = payload.get("parent_hash")
        key = self._signing_key(parent_hash if isinstance(parent_hash, str) else None)
        return hmac.new(key, self._canonical(payload).encode(), hashlib.sha256).hexdigest()

    def _encode(self, payload: dict[str, Any]) -> Token:
        body = self._b64(self._canonical(payload).encode())
        sig = self._sign(payload)
        token = Token(f"{body}.{sig}")
        self._issued[self.token_hash(token)] = payload
        return token

    def _decode(self, token: Token) -> tuple[dict[str, Any], str]:
        raw = str(token)
        parts = raw.rsplit(".", 1)
        if len(parts) != 2:
            msg = "invalid delegatable token format"
            raise InvalidCapabilityError(msg)
        body, sig = parts
        try:
            payload = json.loads(self._unb64(body))
        except (ValueError, json.JSONDecodeError) as exc:
            msg = "invalid delegatable token payload"
            raise InvalidCapabilityError(msg) from exc
        if not isinstance(payload, dict):
            msg = "invalid delegatable token payload"
            raise InvalidCapabilityError(msg)
        expected = self._sign(payload)
        if not hmac.compare_digest(sig, expected):
            msg = "invalid delegatable token signature"
            raise InvalidCapabilityError(msg)
        return payload, self.token_hash(token)

    async def issue(self, subject: AgentId, scopes: list[str], *, ttl: float | None = None) -> Token:
        """Issue a root capability token."""
        lifetime = self._default_ttl if ttl is None else float(ttl)
        if lifetime <= 0:
            msg = "ttl must be positive"
            raise ValueError(msg)
        now = self._now()
        self._counter += 1
        payload: dict[str, Any] = {
            "aud": str(subject),
            "chain": [],
            "depth": 0,
            "exp": now + lifetime,
            "iat": now,
            "kind": "delegatable-capability",
            "nonce": self._counter,
            "parent_hash": None,
            "scopes": self._normalise_scopes(scopes),
            "sub": str(subject),
            "version": 1,
        }
        return self._encode(payload)

    async def delegate(
        self,
        parent_token: Token,
        audience: AgentId,
        scopes_subset: list[str],
        ttl: float,
    ) -> Token:
        """Mint a child token for ``audience`` from a valid parent capability."""
        if ttl <= 0:
            msg = "ttl must be positive"
            raise ValueError(msg)
        parent_payload, parent_hash = await self._verified_payload(parent_token)
        parent_scopes = set(parent_payload["scopes"])
        child_scopes = set(self._normalise_scopes(scopes_subset))
        if not child_scopes < parent_scopes:
            msg = "delegated scopes must be a strict subset of parent scopes"
            raise ScopeEscalationError(msg)

        now = self._now()
        parent_exp = float(parent_payload["exp"])
        if now + ttl > parent_exp:
            msg = "child ttl must not exceed parent remaining ttl"
            raise ExpiredAncestorError(msg)

        self._counter += 1
        parent_chain = list(parent_payload.get("chain", []))
        payload: dict[str, Any] = {
            "aud": str(audience),
            "chain": [*parent_chain, parent_hash],
            "depth": int(parent_payload.get("depth", 0)) + 1,
            "exp": now + float(ttl),
            "iat": now,
            "kind": "delegatable-capability",
            "nonce": self._counter,
            "parent_hash": parent_hash,
            "scopes": sorted(child_scopes),
            "sub": str(audience),
            "version": 1,
        }
        return self._encode(payload)

    async def _verified_payload(
        self, token: Token, *, audience: AgentId | None = None
    ) -> tuple[dict[str, Any], str]:
        payload, token_hash = self._decode(token)
        if payload.get("kind") != "delegatable-capability":
            msg = "unexpected delegatable token kind"
            raise InvalidCapabilityError(msg)
        if token_hash in self._revoked_hashes:
            msg = "capability has been revoked"
            raise RevokedCapabilityError(msg)
        if audience is not None and payload.get("aud") != str(audience):
            msg = f"capability audience {payload.get('aud')!r} does not match {audience!s}"
            raise AudienceMismatchError(msg)

        now = self._now()
        if float(payload["exp"]) < now:
            msg = "capability has expired"
            raise ExpiredCapabilityError(msg)

        chain = payload.get("chain")
        if not isinstance(chain, list):
            msg = "capability chain must be a list"
            raise InvalidCapabilityError(msg)
        if int(payload.get("depth", -1)) != len(chain):
            msg = "capability depth does not match ancestor chain"
            raise InvalidCapabilityError(msg)
        if payload.get("sub") != payload.get("aud"):
            msg = "capability subject must match audience"
            raise InvalidCapabilityError(msg)
        scopes = payload.get("scopes")
        try:
            scopes_valid = isinstance(scopes, list) and self._normalise_scopes(scopes) == scopes
        except ValueError:
            scopes_valid = False
        if not scopes_valid:
            msg = "capability scopes must be a sorted, unique, non-empty list"
            raise InvalidCapabilityError(msg)
        for ancestor_hash in chain:
            if not isinstance(ancestor_hash, str):
                msg = "capability chain contains a non-hash entry"
                raise InvalidCapabilityError(msg)
            if ancestor_hash in self._revoked_hashes:
                msg = f"ancestor capability {ancestor_hash} has been revoked"
                raise RevokedAncestorError(msg)
            ancestor_payload = self._issued.get(ancestor_hash)
            if ancestor_payload is None:
                msg = f"unknown ancestor capability {ancestor_hash}"
                raise InvalidCapabilityError(msg)
            if float(ancestor_payload["exp"]) < now:
                msg = f"ancestor capability {ancestor_hash} has expired"
                raise ExpiredAncestorError(msg)

        parent_hash = payload.get("parent_hash")
        if parent_hash is not None:
            if not isinstance(parent_hash, str) or parent_hash not in self._issued:
                msg = "unknown parent capability"
                raise InvalidCapabilityError(msg)
            parent_payload = self._issued[parent_hash]
            parent_chain = list(parent_payload.get("chain", []))
            if chain != [*parent_chain, parent_hash]:
                msg = "capability ancestor chain does not match parent chain"
                raise InvalidCapabilityError(msg)
            if not set(payload["scopes"]) < set(parent_payload["scopes"]):
                msg = "child scopes are not a strict subset of parent scopes"
                raise ScopeEscalationError(msg)
            if float(payload["exp"]) > float(parent_payload["exp"]):
                msg = "child expiry exceeds parent expiry"
                raise ExpiredAncestorError(msg)
        elif chain:
            msg = "root capability must not carry ancestors"
            raise InvalidCapabilityError(msg)

        self._issued.setdefault(token_hash, payload)
        return payload, token_hash

    async def verify(self, token: Token, *, audience: AgentId | None = None) -> AuthContext:
        """Verify a capability and optionally bind it to the presenting agent."""
        payload, _ = await self._verified_payload(token, audience=audience)
        return AuthContext(
            subject=AgentId(payload["sub"]),
            scopes=list(payload["scopes"]),
            issued_at=float(payload["iat"]),
            expires_at=float(payload["exp"]),
        )

    async def revoke(self, token: Token) -> None:
        """Revoke ``token`` and all descendants through ancestor-chain checks."""
        _, token_hash = self._decode(token)
        self._revoked_hashes.add(token_hash)

    def inspect(self, token: Token) -> dict[str, Any]:
        """Return a verified payload copy for validators and tests."""
        payload, _ = self._decode(token)
        return dict(payload)
