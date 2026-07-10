# SPDX-License-Identifier: Apache-2.0
"""Small deterministic tournament simulator."""

from __future__ import annotations

from typing import Any

from nanda_academy.benchmark import benchmark_agent
from nanda_academy.certification import certify_agent
from nanda_academy.curriculum import generate_curriculum
from nanda_academy.evidence import evidence_event, stable_id
from nanda_academy.models import AgentProfile, profile_from_any
from nanda_academy.recommender import recommend_collaboration_role


SCENARIO_WEIGHTS = {
    "market_day": {"negotiation": 0.2, "market_reasoning": 0.25, "safety": 0.15},
    "supply_shortage": {"coordination": 0.2, "market_reasoning": 0.18, "resilience": 0.18},
    "network_partition": {"resilience": 0.25, "consensus_participation": 0.2, "verification": 0.18},
    "trust_crisis": {"trust_reasoning": 0.25, "verification": 0.22, "provenance_reasoning": 0.18},
    "emergency_response": {"coordination": 0.22, "resilience": 0.22, "safety": 0.22},
    "research_collaboration": {"communication": 0.2, "provenance_reasoning": 0.2, "collaboration": 0.2},
    "logistics_gridlock": {"planning": 0.24, "coordination": 0.2, "resilience": 0.18},
    "city_operations": {"planning": 0.18, "coordination": 0.18, "safety": 0.2},
}


def simulate_tournament(
    agent_profiles: list[AgentProfile | dict[str, Any]],
    town_scenario: str = "market_day",
    rounds: int = 3,
    seed: int = 0,
) -> dict[str, Any]:
    if town_scenario not in SCENARIO_WEIGHTS:
        raise ValueError(f"unknown town_scenario: {town_scenario}")
    if not 1 <= rounds <= 10:
        raise ValueError("rounds must be between 1 and 10")
    profiles = [profile_from_any(p) for p in agent_profiles]
    weights = SCENARIO_WEIGHTS[town_scenario]
    entries = []
    assignments = {}
    graph = []
    failures = []
    certs = []
    curricula = {}
    evidence = []
    for profile in profiles:
        bench = benchmark_agent(profile, "standard", seed=seed + rounds)
        role = recommend_collaboration_role(profile, {"scenario": town_scenario})
        weighted = sum(profile.capabilities[k] * v for k, v in weights.items())
        score = round(bench["total_score"] * 0.65 + weighted + profile.capabilities["safety"] * 0.08, 4)
        if profile.capabilities["safety"] < 0.5:
            score = round(score * 0.65, 4)
            failures.append({"agent_id": profile.agent_id, "reason": "unsafe agent blocked from high-impact role"})
        entries.append({"agent_id": profile.agent_id, "name": profile.name, "score": score, "role": role["recommended_role"]})
        assignments[profile.agent_id] = role["recommended_role"]
        curricula[profile.agent_id] = generate_curriculum(profile)["curriculum_id"]
        cert = certify_agent(profile, bench, requested_level="competent")
        if cert["certificate"]:
            certs.append(cert["certificate"])
        evidence.append(evidence_event("tournament_round", profile.agent_id, town_scenario, "ranking", "Tournament score computed.", observed=str(score)))
    entries.sort(key=lambda item: (-item["score"], item["agent_id"]))
    for left, right in zip(entries, entries[1:], strict=False):
        graph.append({"from": left["agent_id"], "to": right["agent_id"], "relationship": "mentors_or_verifies"})
    return {
        "tournament_id": stable_id("tournament", [[p.to_dict() for p in profiles], town_scenario, rounds, seed]),
        "scenario": town_scenario,
        "rounds": rounds,
        "leaderboard": entries,
        "role_assignments": assignments,
        "collaboration_graph": graph,
        "failures": failures,
        "certificates_earned": certs,
        "curriculum_updates": curricula,
        "evidence": evidence,
        "summary": f"{len(profiles)} agents completed {rounds} rounds in {town_scenario}; winner={entries[0]['agent_id'] if entries else 'none'}.",
    }

