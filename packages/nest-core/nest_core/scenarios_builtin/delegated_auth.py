# SPDX-License-Identifier: Apache-2.0
"""Delegated auth scenario for Q4 capability-chain validation."""

from __future__ import annotations

from typing import Any

from nest_core.scenario import ScenarioConfig
from nest_core.sim.agent import AgentContext, StateMachineAgent
from nest_core.types import AgentId, Token


class DelegatedAuthCoordinator(StateMachineAgent):
    """Builds and probes a coordinator -> intermediaries -> leaves auth tree."""

    def __init__(self, agent_id: AgentId, config: dict[str, Any], all_agents: list[AgentId]) -> None:
        self._id = agent_id
        self._config = config
        self._all_agents = all_agents

    def _record(self, ctx: AgentContext, **event: Any) -> None:
        ctx.record_event({"scenario": "delegated_auth", "agent": str(self._id), **event})

    async def on_start(self, ctx: AgentContext) -> None:
        auth_cls = ctx.plugins["auth"]
        auth = auth_cls(secret=b"delegated-auth-scenario", clock=lambda: ctx.time)

        root_scopes = list(self._config.get("root_scopes", ["admin", "read", "write", "delegate"]))
        intermediary_scopes = list(
            self._config.get("intermediary_scopes", ["read", "write", "delegate"])
        )
        leaf_scopes = list(self._config.get("leaf_scopes", ["read"]))
        root_ttl = float(self._config.get("root_ttl_seconds", 600))
        intermediary_ttl = float(self._config.get("intermediary_ttl_seconds", 300))
        leaf_ttl = float(self._config.get("leaf_ttl_seconds", 120))

        intermediaries = [
            AgentId(str(aid)) for aid in self._config.get("intermediaries", ["intermediary-0"])
        ]
        leaves = [aid for aid in self._all_agents if str(aid).startswith("leaf-")]
        leaves_per_intermediary = int(self._config.get("leaves_per_intermediary", 4))

        root = await auth.issue(self._id, root_scopes, ttl=root_ttl)
        self._record(
            ctx,
            kind="auth_root_issued",
            subject=str(self._id),
            scopes=root_scopes,
            token_hash=auth.token_hash(root),
        )

        child_tokens: dict[AgentId, Token] = {}
        leaf_tokens: dict[AgentId, Token] = {}
        for index, intermediary in enumerate(intermediaries):
            child = await auth.delegate(root, intermediary, intermediary_scopes, intermediary_ttl)
            child_tokens[intermediary] = child
            self._record(
                ctx,
                kind="auth_delegated",
                parent=str(self._id),
                child=str(intermediary),
                scopes=intermediary_scopes,
                token_hash=auth.token_hash(child),
                parent_hash=auth.token_hash(root),
            )
            start = index * leaves_per_intermediary
            stop = start + leaves_per_intermediary
            for leaf in leaves[start:stop]:
                leaf_token = await auth.delegate(child, leaf, leaf_scopes, leaf_ttl)
                leaf_tokens[leaf] = leaf_token
                await auth.verify(leaf_token, audience=leaf)
                self._record(
                    ctx,
                    kind="auth_delegated",
                    parent=str(intermediary),
                    child=str(leaf),
                    scopes=leaf_scopes,
                    token_hash=auth.token_hash(leaf_token),
                    parent_hash=auth.token_hash(child),
                )

        try:
            await auth.delegate(next(iter(child_tokens.values())), AgentId("attacker"), root_scopes, 60)
        except Exception as exc:  # noqa: BLE001 - trace the rejected attack type
            self._record(ctx, kind="auth_attack_rejected", attack="scope_escalation", error=type(exc).__name__)

        first_child = next(iter(child_tokens.values()))
        first_leaf = leaf_tokens[leaves[0]]
        await auth.revoke(first_child)
        try:
            await auth.verify(first_leaf, audience=leaves[0])
        except Exception as exc:  # noqa: BLE001
            self._record(ctx, kind="auth_attack_rejected", attack="stale_parent", error=type(exc).__name__)

        second_leaf = leaf_tokens[leaves[-1]]
        try:
            await auth.verify(second_leaf, audience=AgentId("wrong-leaf"))
        except Exception as exc:  # noqa: BLE001
            self._record(
                ctx,
                kind="auth_attack_rejected",
                attack="audience_confusion",
                error=type(exc).__name__,
            )


class DelegatedAuthNoop(StateMachineAgent):
    """Idle participant used to make the scenario topology explicit."""


def delegated_auth_factory(config: ScenarioConfig, plugins: dict[str, Any]) -> dict[AgentId, Any]:
    """Build the Q4 coordinator, intermediary, and leaf agents."""
    all_ids: list[AgentId] = []
    for role in config.agents.roles:
        for i in range(role.count):
            all_ids.append(AgentId(f"{role.name}-{i}"))

    task_cfg = config.task.config or {}
    root_agent = AgentId(str(task_cfg.get("root_agent", "coordinator-0")))
    agents: dict[AgentId, Any] = {aid: DelegatedAuthNoop() for aid in all_ids}
    agents[root_agent] = DelegatedAuthCoordinator(root_agent, task_cfg, all_ids)
    return agents
