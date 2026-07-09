# SPDX-License-Identifier: Apache-2.0
"""Q4 tests for delegatable capability auth."""

from __future__ import annotations

import base64
import json
from collections.abc import Callable
from pathlib import Path

import pytest

from nest_core.plugins import PluginRegistry
from nest_core.runner import ScenarioRunner
from nest_core.scenario import ScenarioConfig
from nest_core.types import AgentId, Token
from nest_plugins_reference.auth.delegatable import (
    AudienceMismatchError,
    DelegatableAuth,
    ExpiredAncestorError,
    ExpiredCapabilityError,
    InvalidCapabilityError,
    RevokedAncestorError,
    RevokedCapabilityError,
    ScopeEscalationError,
)
from nest_plugins_reference.auth.jwt_auth import JwtAuth
from nest_plugins_reference.validators import check_delegated_auth_attacks_blocked


REPO_ROOT = Path(__file__).resolve().parents[3]


def _clock(start: float = 1000.0) -> tuple[list[float], Callable[[], float]]:
    now = [start]
    return now, lambda: now[0]


def _payload(token: Token) -> dict[str, object]:
    body, _ = str(token).rsplit(".", 1)
    padding = "=" * (-len(body) % 4)
    return json.loads(base64.urlsafe_b64decode(body + padding))


def _replace_payload(token: Token, payload: dict[str, object]) -> Token:
    body, sig = str(token).rsplit(".", 1)
    _ = body
    encoded = base64.urlsafe_b64encode(
        json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
    ).decode()
    return Token(f"{encoded.rstrip('=')}.{sig}")


@pytest.mark.asyncio
async def test_registry_resolves_delegatable_auth() -> None:
    cls = PluginRegistry().resolve("auth", "delegatable")
    auth = cls(secret=b"q4", clock=1000.0)
    root = await auth.issue(AgentId("coordinator"), ["admin", "read", "write"])
    child = await auth.delegate(root, AgentId("worker"), ["read"], 60)

    ctx = await auth.verify(child, audience=AgentId("worker"))

    assert ctx.subject == AgentId("worker")
    assert ctx.scopes == ["read"]


@pytest.mark.asyncio
async def test_delegation_chain_is_strictly_narrower_and_audience_bound() -> None:
    now, clock = _clock()
    auth = DelegatableAuth(secret=b"q4", clock=clock)
    root = await auth.issue(AgentId("coordinator"), ["admin", "read", "write"], ttl=300)
    intermediary = await auth.delegate(root, AgentId("intermediary"), ["read", "write"], 120)
    leaf = await auth.delegate(intermediary, AgentId("leaf"), ["read"], 30)

    now[0] += 10
    ctx = await auth.verify(leaf, audience=AgentId("leaf"))

    assert ctx.subject == AgentId("leaf")
    assert ctx.scopes == ["read"]
    leaf_payload = _payload(leaf)
    assert leaf_payload["parent_hash"] == DelegatableAuth.token_hash(intermediary)
    assert leaf_payload["chain"] == [
        DelegatableAuth.token_hash(root),
        DelegatableAuth.token_hash(intermediary),
    ]


@pytest.mark.asyncio
async def test_scope_escalation_is_rejected_at_delegate_and_verify() -> None:
    auth = DelegatableAuth(secret=b"q4", clock=1000.0)
    root = await auth.issue(AgentId("coordinator"), ["admin", "read", "write"])
    child = await auth.delegate(root, AgentId("worker"), ["read"], 60)

    with pytest.raises(ScopeEscalationError):
        await auth.delegate(child, AgentId("leaf"), ["read", "write"], 30)

    payload = _payload(child)
    payload["scopes"] = ["admin", "read"]
    tampered = _replace_payload(child, payload)
    with pytest.raises(InvalidCapabilityError, match="signature"):
        await auth.verify(tampered, audience=AgentId("worker"))


@pytest.mark.asyncio
async def test_child_ttl_cannot_exceed_parent_remaining_ttl() -> None:
    now, clock = _clock()
    auth = DelegatableAuth(secret=b"q4", clock=clock)
    root = await auth.issue(AgentId("coordinator"), ["admin", "read", "write"], ttl=100)

    now[0] += 50
    with pytest.raises(ExpiredAncestorError):
        await auth.delegate(root, AgentId("worker"), ["read"], 51)

    child = await auth.delegate(root, AgentId("worker"), ["read"], 50)
    assert (await auth.verify(child, audience=AgentId("worker"))).subject == AgentId("worker")


@pytest.mark.asyncio
async def test_revoking_parent_cascades_to_descendants() -> None:
    auth = DelegatableAuth(secret=b"q4", clock=1000.0)
    root = await auth.issue(AgentId("coordinator"), ["admin", "read", "write"])
    child = await auth.delegate(root, AgentId("intermediary"), ["read", "write"], 120)
    leaf = await auth.delegate(child, AgentId("leaf"), ["read"], 60)

    await auth.revoke(child)

    with pytest.raises(RevokedCapabilityError):
        await auth.verify(child, audience=AgentId("intermediary"))
    with pytest.raises(RevokedAncestorError):
        await auth.verify(leaf, audience=AgentId("leaf"))


@pytest.mark.asyncio
async def test_revoking_root_cascades_across_multiple_generations() -> None:
    auth = DelegatableAuth(secret=b"q4", clock=1000.0)
    root = await auth.issue(AgentId("coordinator"), ["admin", "read", "write"])
    child = await auth.delegate(root, AgentId("intermediary"), ["read", "write"], 120)
    leaf = await auth.delegate(child, AgentId("leaf"), ["read"], 60)

    await auth.revoke(root)

    with pytest.raises(RevokedAncestorError):
        await auth.verify(leaf, audience=AgentId("leaf"))


@pytest.mark.asyncio
async def test_parent_expiry_invalidates_child_even_before_child_expiry() -> None:
    now, clock = _clock()
    auth = DelegatableAuth(secret=b"q4", clock=clock)
    root = await auth.issue(AgentId("coordinator"), ["admin", "read", "write"], ttl=100)
    child = await auth.delegate(root, AgentId("worker"), ["read"], 100)

    now[0] = 1101.0

    with pytest.raises(ExpiredCapabilityError):
        await auth.verify(child, audience=AgentId("worker"))


@pytest.mark.asyncio
async def test_expired_ancestor_is_distinct_from_expired_child() -> None:
    now, clock = _clock()
    auth = DelegatableAuth(secret=b"q4", clock=clock)
    root = await auth.issue(AgentId("coordinator"), ["admin", "read", "write"], ttl=100)
    child = await auth.delegate(root, AgentId("worker"), ["read", "write"], 100)
    leaf = await auth.delegate(child, AgentId("leaf"), ["read"], 40)

    now[0] = 1090.0
    with pytest.raises(ExpiredCapabilityError):
        await auth.verify(leaf, audience=AgentId("leaf"))


@pytest.mark.asyncio
async def test_audience_confusion_is_rejected() -> None:
    auth = DelegatableAuth(secret=b"q4", clock=1000.0)
    root = await auth.issue(AgentId("coordinator"), ["admin", "read", "write"])
    child = await auth.delegate(root, AgentId("worker"), ["read"], 60)

    with pytest.raises(AudienceMismatchError):
        await auth.verify(child, audience=AgentId("other-worker"))


@pytest.mark.asyncio
async def test_signed_child_with_reordered_or_extra_chain_is_rejected() -> None:
    auth = DelegatableAuth(secret=b"q4", clock=1000.0)
    root = await auth.issue(AgentId("coordinator"), ["admin", "read", "write"])
    child = await auth.delegate(root, AgentId("intermediary"), ["read", "write"], 120)
    leaf = await auth.delegate(child, AgentId("leaf"), ["read"], 60)
    payload = _payload(leaf)

    payload["chain"] = [DelegatableAuth.token_hash(child), DelegatableAuth.token_hash(root)]
    forged_reordered = auth._encode(payload)  # noqa: SLF001 - adversarial signed fixture
    with pytest.raises(InvalidCapabilityError, match="ancestor chain"):
        await auth.verify(forged_reordered, audience=AgentId("leaf"))

    payload = _payload(leaf)
    payload["chain"] = [
        DelegatableAuth.token_hash(root),
        DelegatableAuth.token_hash(root),
        DelegatableAuth.token_hash(child),
    ]
    payload["depth"] = 3
    forged_extra = auth._encode(payload)  # noqa: SLF001 - adversarial signed fixture
    with pytest.raises(InvalidCapabilityError, match="ancestor chain"):
        await auth.verify(forged_extra, audience=AgentId("leaf"))


@pytest.mark.asyncio
async def test_signed_child_with_bad_depth_subject_or_scopes_is_rejected() -> None:
    auth = DelegatableAuth(secret=b"q4", clock=1000.0)
    root = await auth.issue(AgentId("coordinator"), ["admin", "read", "write"])
    child = await auth.delegate(root, AgentId("worker"), ["read"], 60)

    payload = _payload(child)
    payload["depth"] = 99
    bad_depth = auth._encode(payload)  # noqa: SLF001 - adversarial signed fixture
    with pytest.raises(InvalidCapabilityError, match="depth"):
        await auth.verify(bad_depth, audience=AgentId("worker"))

    payload = _payload(child)
    payload["sub"] = "other-worker"
    bad_subject = auth._encode(payload)  # noqa: SLF001 - adversarial signed fixture
    with pytest.raises(InvalidCapabilityError, match="subject"):
        await auth.verify(bad_subject, audience=AgentId("worker"))

    payload = _payload(child)
    payload["scopes"] = ["read", "read"]
    bad_scopes = auth._encode(payload)  # noqa: SLF001 - adversarial signed fixture
    with pytest.raises(InvalidCapabilityError, match="scopes"):
        await auth.verify(bad_scopes, audience=AgentId("worker"))


@pytest.mark.asyncio
async def test_root_with_signed_fake_ancestor_is_rejected() -> None:
    auth = DelegatableAuth(secret=b"q4", clock=1000.0)
    root = await auth.issue(AgentId("coordinator"), ["admin", "read", "write"])
    payload = _payload(root)
    payload["chain"] = ["0" * 64]
    payload["depth"] = 1
    forged_root = auth._encode(payload)  # noqa: SLF001 - adversarial signed fixture

    with pytest.raises(InvalidCapabilityError, match="unknown ancestor"):
        await auth.verify(forged_root, audience=AgentId("coordinator"))


@pytest.mark.asyncio
async def test_validator_passes_delegatable_and_fails_jwt() -> None:
    hardened = await check_delegated_auth_attacks_blocked(
        DelegatableAuth(secret=b"q4", clock=1000.0)
    )
    default = await check_delegated_auth_attacks_blocked(JwtAuth(secret=b"q4", clock=1000.0))

    assert hardened.passed, hardened.detail
    assert not default.passed
    assert "delegate" in default.detail


@pytest.mark.asyncio
async def test_delegated_auth_scenario_emits_evidence(tmp_path: Path) -> None:
    config = ScenarioConfig.from_yaml(REPO_ROOT / "scenarios" / "delegated_auth.yaml")
    config.output.trace = str(tmp_path / "delegated_auth.jsonl")
    runner = ScenarioRunner(config)

    trace_path = await runner.run()
    events = [json.loads(line) for line in trace_path.read_text().splitlines() if line.strip()]
    auth_events = [event for event in events if event.get("scenario") == "delegated_auth"]
    attacks = {event.get("attack") for event in auth_events if event.get("kind") == "auth_attack_rejected"}
    delegations = [event for event in auth_events if event.get("kind") == "auth_delegated"]

    assert runner.resolved_plugins["auth"].__name__ == "DelegatableAuth"
    assert len(delegations) == 15
    assert attacks == {"scope_escalation", "stale_parent", "audience_confusion"}
