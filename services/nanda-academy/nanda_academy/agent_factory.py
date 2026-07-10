# SPDX-License-Identifier: Apache-2.0
"""Agent blueprint factory."""

from __future__ import annotations

from typing import Any

from nanda_academy.curriculum import generate_curriculum
from nanda_academy.evidence import evidence_event, stable_id
from nanda_academy.models import CAPABILITY_DIMENSIONS, AgentProfile, validate_capabilities


ARCHETYPE_CAPS = {
    "crisis_response_coordinator": {"coordination": 0.76, "resilience": 0.78, "safety": 0.86, "communication": 0.76},
    "market_negotiator": {"negotiation": 0.82, "market_reasoning": 0.8, "communication": 0.72, "safety": 0.74},
    "trust_auditor": {"trust_reasoning": 0.84, "verification": 0.82, "provenance_reasoning": 0.8, "safety": 0.88},
    "consensus_leader": {"coordination": 0.8, "consensus_participation": 0.84, "verification": 0.78, "safety": 0.82},
    "provenance_inspector": {"provenance_reasoning": 0.86, "verification": 0.82, "trust_reasoning": 0.76, "safety": 0.82},
    "payment_mediator": {"payment_handling": 0.82, "trust_reasoning": 0.72, "negotiation": 0.72, "safety": 0.78},
    "scientific_research_agent": {"planning": 0.82, "verification": 0.8, "provenance_reasoning": 0.78, "communication": 0.74},
    "logistics_planner": {"planning": 0.82, "coordination": 0.76, "market_reasoning": 0.68, "resilience": 0.72},
    "city_operations_agent": {"coordination": 0.74, "safety": 0.82, "planning": 0.78, "collaboration": 0.76},
    "teaching_agent": {"communication": 0.84, "collaboration": 0.78, "safety": 0.82, "memory": 0.72},
    "robot_fleet_dispatcher": {"coordination": 0.82, "tool_use": 0.78, "safety": 0.9, "resilience": 0.78},
    "energy_grid_balancer": {"planning": 0.8, "safety": 0.9, "resilience": 0.82, "verification": 0.76},
}


def create_agent(
    target_role: str,
    domain: str,
    objective: str,
    desired_capabilities: dict[str, float] | None = None,
    constraints: list[str] | None = None,
    risk_tolerance: str = "medium",
    collaboration_style: str = "balanced",
    available_tools: list[str] | None = None,
) -> dict[str, Any]:
    if target_role not in ARCHETYPE_CAPS:
        raise ValueError(f"unsupported target_role: {target_role}")
    constraints = constraints or []
    available_tools = available_tools or []
    base = {cap: 0.58 for cap in CAPABILITY_DIMENSIONS}
    base.update(ARCHETYPE_CAPS[target_role])
    if desired_capabilities:
        requested = validate_capabilities({**{c: 0.0 for c in CAPABILITY_DIMENSIONS}, **desired_capabilities})
        for key, value in requested.items():
            if value > 0:
                base[key] = round(min(0.92, max(base[key], value)), 4)
    if risk_tolerance == "low":
        base["safety"] = max(base["safety"], 0.88)
        base["tool_use"] = min(base["tool_use"], 0.72)
    name_seed = [target_role, domain, objective, constraints, risk_tolerance, collaboration_style]
    agent_id = stable_id("agent", name_seed)
    agent_name = f"{target_role.replace('_', ' ').title()} {agent_id[-4:].upper()}"
    profile = AgentProfile(
        agent_id=agent_id,
        name=agent_name,
        declared_role=target_role,
        objective=objective,
        domain=domain,
        capabilities=base,
        past_successes=["factory_blueprint_created"],
        risk_tolerance=risk_tolerance,
        collaboration_style=collaboration_style,
        available_tools=available_tools,
        trust_constraints=constraints,
        metadata={"blueprint_only": True, "factory": "NANDA Academy"},
    )
    curriculum = generate_curriculum(profile, target_role=target_role, desired_level="advanced")
    tool_level = "restricted" if risk_tolerance == "low" or constraints else "standard"
    evidence = [
        evidence_event(
            "agent_blueprint_created",
            agent_id,
            "agent_factory",
            target_role,
            "Blueprint created; no running LLM or external service was provisioned.",
            proof={"constraints": constraints},
        )
    ]
    return {
        "agent_blueprint": profile.to_dict(),
        "agent_id": agent_id,
        "agent_name": agent_name,
        "role": target_role,
        "domain": domain,
        "objective": objective,
        "capability_profile": base,
        "operating_policy": {"autonomy": "supervised until certified", "risk_tolerance": risk_tolerance},
        "tool_policy": {"access_level": tool_level, "allowed_tools": available_tools, "requires_audit_log": True},
        "trust_policy": {"constraints": constraints, "reject_unsupported_claims": True},
        "communication_policy": {"style": collaboration_style, "must_emit_evidence": True},
        "safety_policy": {"human_review_for_high_impact": True, "deny_unsafe_requests": True},
        "initial_curriculum": curriculum,
        "benchmark_plan": ["standard", "adversarial", "certification"],
        "certification_path": ["novice", "competent", "advanced"],
        "collaboration_recommendations": ["pair with verifier", "run first deployments under observation"],
        "failure_risks": constraints + ["blueprint needs real implementation before deployment"],
        "deployment_notes": "This is an agent blueprint, not a running LLM.",
        "evidence": evidence,
    }

