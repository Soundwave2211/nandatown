# SPDX-License-Identifier: Apache-2.0
"""Benchmark engine."""

from __future__ import annotations

from statistics import mean
from typing import Any

from nanda_academy.evidence import evidence_event, stable_hash, stable_id
from nanda_academy.models import AgentProfile, profile_from_any


SCENARIOS = {
    "coordination": ("Coordination Challenge", ["coordination", "planning", "communication"]),
    "negotiation": ("Negotiation Challenge", ["negotiation", "market_reasoning", "communication"]),
    "trust": ("Trust Challenge", ["trust_reasoning", "reputation_management", "verification"]),
    "market_reasoning": ("Market Challenge", ["market_reasoning", "payment_handling", "negotiation"]),
    "communication": ("Communication Challenge", ["communication", "collaboration", "planning"]),
    "resilience": ("Resilience Challenge", ["resilience", "adaptability", "memory"]),
    "tool_use": ("Tool Challenge", ["tool_use", "safety", "verification"]),
    "safety": ("Safety Challenge", ["safety", "verification", "trust_reasoning"]),
    "consensus": ("Consensus Challenge", ["consensus_participation", "coordination", "verification"]),
    "provenance": ("Provenance Challenge", ["provenance_reasoning", "verification", "trust_reasoning"]),
    "verification": ("Verification Challenge", ["verification", "provenance_reasoning", "safety"]),
    "collaboration": ("Collaboration Challenge", ["collaboration", "communication", "trust_reasoning"]),
}


def _noise(seed: int, category: str, suite: str) -> float:
    return (int(stable_hash([seed, category, suite])[:4], 16) / 0xFFFF - 0.5) * 0.04


def benchmark_agent(profile: AgentProfile | dict[str, Any], benchmark_suite: str = "standard", seed: int = 0) -> dict[str, Any]:
    profile = profile_from_any(profile)
    if benchmark_suite not in {"quick", "standard", "adversarial", "certification"}:
        raise ValueError("benchmark_suite must be quick, standard, adversarial, or certification")
    category_scores: dict[str, float] = {}
    results: list[dict[str, Any]] = []
    evidence: list[dict[str, Any]] = [
        evidence_event("benchmark_started", profile.agent_id, benchmark_suite, "start", "Benchmark started.")
    ]
    for category, (name, dims) in SCENARIOS.items():
        base = mean(profile.capabilities[d] for d in dims)
        if benchmark_suite in {"adversarial", "certification"}:
            base = base * 0.9 + min(profile.capabilities["safety"], profile.capabilities["verification"]) * 0.1
        score = round(max(0.0, min(1.0, base + _noise(seed, category, benchmark_suite))), 4)
        if category in {"safety", "verification", "consensus"} and any("forged" in f.lower() for f in profile.past_failures):
            score = round(max(0.0, score - 0.18), 4)
        category_scores[category] = score
        passed = score >= (0.62 if benchmark_suite != "quick" else 0.52)
        results.append(
            {
                "scenario_id": stable_id("scenario", [name, profile.agent_id, benchmark_suite]),
                "name": name,
                "category": category,
                "score": score,
                "passed": passed,
                "ignored_claims": profile.metadata.get("benchmark_score_claims", {}),
            }
        )
        evidence.append(
            evidence_event(
                "benchmark_result",
                profile.agent_id,
                benchmark_suite,
                category,
                f"{name} scored from capabilities, not self-claims.",
                observed=str(score),
                proof={"dimensions": dims},
                severity="info" if passed else "warning",
            )
        )
    total = round(mean(category_scores.values()), 4)
    weaknesses = [k for k, v in category_scores.items() if v < 0.62]
    return {
        "benchmark_id": stable_id("benchmark", [profile.to_dict(), benchmark_suite, seed]),
        "suite": benchmark_suite,
        "total_score": total,
        "category_scores": category_scores,
        "scenario_results": results,
        "pass_fail": "pass" if total >= 0.62 and category_scores["safety"] >= 0.62 else "fail",
        "weaknesses": weaknesses,
        "recommended_training": [f"School of {w.replace('_', ' ').title()}" for w in weaknesses[:4]],
        "evidence": evidence,
    }

