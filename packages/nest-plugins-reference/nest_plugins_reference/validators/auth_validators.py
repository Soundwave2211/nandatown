# SPDX-License-Identifier: Apache-2.0
"""Adversarial validators for delegatable auth plugins."""

from __future__ import annotations

from typing import Any

from nest_core.types import AgentId
from nest_plugins_reference.auth.delegatable import (
    AudienceMismatchError,
    RevokedAncestorError,
    ScopeEscalationError,
)
from nest_plugins_reference.validators.gossip_validators import ValidatorReport


async def check_delegated_auth_attacks_blocked(auth: Any) -> ValidatorReport:
    """Assert a plugin blocks the three Q4 delegation attacks.

    The check is intentionally public-surface only. It issues a root token,
    delegates to an intermediary, and then probes:

    * scope escalation from parent to child;
    * stale parent use after revocation;
    * audience confusion on child presentation.

    A plugin without ``delegate`` cannot satisfy Q4 and fails immediately.
    """
    if not hasattr(auth, "delegate"):
        return ValidatorReport(
            passed=False,
            detail="auth plugin does not expose delegate(parent_token, audience, scopes_subset, ttl)",
        )

    evidence: dict[str, object] = {}
    root = await auth.issue(AgentId("coordinator"), ["admin", "read", "write"])
    child = await auth.delegate(root, AgentId("intermediary-0"), ["read", "write"], 120)

    try:
        await auth.delegate(child, AgentId("leaf-0"), ["read", "write"], 60)
    except ScopeEscalationError as exc:
        evidence["scope_escalation"] = type(exc).__name__
    except Exception as exc:  # noqa: BLE001 - validators report policy outcome
        return ValidatorReport(
            passed=False,
            detail=f"scope escalation raised wrong exception: {type(exc).__name__}",
            evidence=evidence,
        )
    else:
        return ValidatorReport(
            passed=False,
            detail="scope escalation delegation succeeded",
            evidence=evidence,
        )

    leaf = await auth.delegate(child, AgentId("leaf-1"), ["read"], 60)
    await auth.revoke(child)
    try:
        await auth.verify(leaf, audience=AgentId("leaf-1"))
    except RevokedAncestorError as exc:
        evidence["stale_parent"] = type(exc).__name__
    except Exception as exc:  # noqa: BLE001
        return ValidatorReport(
            passed=False,
            detail=f"stale parent raised wrong exception: {type(exc).__name__}",
            evidence=evidence,
        )
    else:
        return ValidatorReport(
            passed=False,
            detail="child verified after parent revocation",
            evidence=evidence,
        )

    fresh_child = await auth.delegate(root, AgentId("intermediary-1"), ["read", "write"], 120)
    fresh_leaf = await auth.delegate(fresh_child, AgentId("leaf-2"), ["read"], 60)
    try:
        await auth.verify(fresh_leaf, audience=AgentId("leaf-3"))
    except AudienceMismatchError as exc:
        evidence["audience_confusion"] = type(exc).__name__
    except Exception as exc:  # noqa: BLE001
        return ValidatorReport(
            passed=False,
            detail=f"audience confusion raised wrong exception: {type(exc).__name__}",
            evidence=evidence,
        )
    else:
        return ValidatorReport(
            passed=False,
            detail="child verified for the wrong audience",
            evidence=evidence,
        )

    return ValidatorReport(
        passed=True,
        detail="delegation attacks rejected: scope escalation, stale parent, audience confusion",
        evidence=evidence,
    )
