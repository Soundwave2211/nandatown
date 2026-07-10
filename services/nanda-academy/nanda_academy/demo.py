# SPDX-License-Identifier: Apache-2.0
"""NANDA Academy demo data."""

from __future__ import annotations

from typing import Any

from nanda_academy.agent_factory import create_agent
from nanda_academy.certification import certify_agent
from nanda_academy.curriculum import generate_curriculum
from nanda_academy.engine import evaluate_agent
from nanda_academy.models import CAPABILITY_DIMENSIONS, AgentProfile
from nanda_academy.recommender import recommend_collaboration_role


def _caps(**overrides: float) -> dict[str, float]:
    base = {cap: 0.58 for cap in CAPABILITY_DIMENSIONS}
    base.update(overrides)
    return base


def example_agent_profiles() -> list[dict[str, Any]]:
    agents = [
        AgentProfile(
            "weak_negotiator",
            "Weak Negotiator",
            "market negotiator",
            "trade safely",
            "marketplace",
            _caps(negotiation=0.28, market_reasoning=0.36, safety=0.72),
            past_failures=["overpaid in low-trust exchange"],
            past_successes=["completed supervised trade"],
        ),
        AgentProfile(
            "overconfident_unsafe_agent",
            "Overconfident Unsafe Agent",
            "expert certified crisis leader",
            "handle all emergencies perfectly",
            "city",
            _caps(safety=0.24, verification=0.32, coordination=0.5),
            past_failures=["forged benchmark score", "severe unsafe tool request"],
            safety_flags=["severe_safety_flag"],
            metadata={"claims": ["expert", "certified"]},
        ),
        AgentProfile(
            "strong_coordinator",
            "Strong Coordinator",
            "coordination leader",
            "lead network recovery",
            "infrastructure",
            _caps(coordination=0.88, consensus_participation=0.84, verification=0.82, safety=0.9, resilience=0.82),
            past_successes=["partition recovery", "five-agent coordination", "verified quorum", "safe deployment", "audit passed"],
            reputation_prior=0.86,
        ),
        AgentProfile(
            "trust_auditor_candidate",
            "Trust Auditor Candidate",
            "trust auditor",
            "inspect claims",
            "governance",
            _caps(trust_reasoning=0.82, provenance_reasoning=0.8, verification=0.78, safety=0.88),
            past_successes=["rejected forged certificate", "resolved conflicting claims", "audit passed"],
            reputation_prior=0.78,
        ),
    ]
    return [agent.to_dict() for agent in agents]


def city_demo() -> dict[str, Any]:
    buildings = [
        "Evaluation Hall",
        "Curriculum Studio",
        "Training Gym",
        "Benchmark Arena",
        "Certification Office",
        "Agent Foundry",
        "Deployment Gate",
    ]
    agents = example_agent_profiles()
    new_agent = create_agent(
        "crisis_response_coordinator",
        "city operations",
        "coordinate emergency response without unsupported claims",
        {"coordination": 0.82, "resilience": 0.8},
        ["human_review_for_evacuation"],
        "low",
        "structured",
        ["incident_board", "radio_mesh"],
    )
    agents.append(new_agent["agent_blueprint"])
    journeys = []
    for data in agents:
        profile = AgentProfile.from_dict(data)
        evaluation = evaluate_agent(profile)
        curriculum = generate_curriculum(profile, evaluation)
        cert = certify_agent(profile, requested_level="competent")
        role = recommend_collaboration_role(profile, {"scenario": "city_operations"})
        journeys.append(
            {
                "agent_id": profile.agent_id,
                "evaluation": evaluation["readiness_level"],
                "curriculum": curriculum["ordered_modules"][:3],
                "certificate": cert["level_awarded"],
                "deployment_role": role["recommended_role"],
            }
        )
    return {"campus": "NANDA Academy", "buildings": buildings, "agents": agents, "journeys": journeys}


def demo_html() -> str:
    city = city_demo()
    rows = "\n".join(
        f"<tr><td>{j['agent_id']}</td><td>{j['evaluation']}</td><td>{j['certificate']}</td><td>{j['deployment_role']}</td></tr>"
        for j in city["journeys"]
    )
    return f"""<!doctype html>
<html><head><meta charset="utf-8"><title>NANDA Academy</title>
<style>body{{font-family:system-ui;margin:2rem;line-height:1.4}}table{{border-collapse:collapse}}td,th{{border:1px solid #bbb;padding:.45rem .7rem}}</style></head>
<body><h1>NANDA Academy</h1><p>Proof-driven quality control for agents entering NANDA Town.</p>
<h2>Campus</h2><ul>{''.join(f'<li>{b}</li>' for b in city['buildings'])}</ul>
<h2>Agent Journeys</h2><table><tr><th>Agent</th><th>Evaluation</th><th>Certificate</th><th>Role</th></tr>{rows}</table>
</body></html>"""

