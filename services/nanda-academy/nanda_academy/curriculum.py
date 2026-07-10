# SPDX-License-Identifier: Apache-2.0
"""Personalized curriculum generation."""

from __future__ import annotations

from typing import Any

from nanda_academy.engine import evaluate_agent
from nanda_academy.evidence import evidence_event, stable_id
from nanda_academy.models import AgentProfile, profile_from_any


MODULES = {
    "coordination": ("School of Coordination", "coordinate a five-agent team"),
    "negotiation": ("School of Negotiation", "negotiate with a low-trust counterparty"),
    "trust_reasoning": ("School of Trust", "resolve conflicting claims"),
    "market_reasoning": ("School of Markets", "allocate resources under scarcity"),
    "communication": ("School of Communication", "summarise a plan for another agent"),
    "resilience": ("School of Resilience", "recover after network partition"),
    "tool_use": ("School of Tool Use", "select tools under safety constraints"),
    "safety": ("School of Safety", "refuse unsafe or unauthorised actions"),
    "consensus_participation": ("School of Consensus", "refuse a forged quorum"),
    "provenance_reasoning": ("School of Provenance", "detect provenance inconsistency"),
    "verification": ("School of Verification", "reject a forged certificate"),
    "collaboration": ("School of Collaboration", "choose collaborators under uncertainty"),
}


ROLE_PRIORITY = {
    "coordination leader": ["coordination", "consensus_participation", "verification"],
    "market negotiator": ["negotiation", "market_reasoning", "communication"],
    "trust auditor": ["safety", "trust_reasoning", "provenance_reasoning", "verification"],
    "crisis_response_coordinator": ["safety", "coordination", "resilience", "communication"],
}


def _lesson(capability: str, score: float, index: int) -> dict[str, Any]:
    school, exercise = MODULES[capability]
    difficulty = "advanced" if score >= 0.68 else "intermediate" if score >= 0.45 else "foundation"
    return {
        "lesson_id": stable_id("lesson", [capability, difficulty, index]),
        "title": f"{school}: {difficulty.title()} Drill",
        "objective": f"Raise {capability.replace('_', ' ')} with evidence-backed practice.",
        "target_capabilities": [capability],
        "exercise": exercise,
        "difficulty": difficulty,
        "pass_condition": "score >= 0.70 on deterministic exercise rubric",
        "evidence_required": ["transcript", "score_delta", "failure_notes"],
        "expected_improvement": round(0.08 if difficulty == "foundation" else 0.05 if difficulty == "intermediate" else 0.025, 3),
        "prerequisites": [] if difficulty == "foundation" else [f"{capability}:foundation"],
    }


def generate_curriculum(
    profile: AgentProfile | dict[str, Any],
    evaluation_report: dict[str, Any] | None = None,
    target_role: str | None = None,
    desired_level: str = "competent",
) -> dict[str, Any]:
    profile = profile_from_any(profile)
    if desired_level not in {"novice", "competent", "advanced", "expert"}:
        raise ValueError("desired_level must be novice, competent, advanced, or expert")
    report = evaluation_report or evaluate_agent(profile, target_role=target_role)
    priority = ["safety"] if profile.capabilities["safety"] < 0.6 else []
    priority.extend(ROLE_PRIORITY.get((target_role or report["recommended_role"]).lower(), []))
    priority.extend(report["weaknesses"])
    priority.extend([k for k, v in profile.capabilities.items() if v < (0.8 if desired_level in {"advanced", "expert"} else 0.65)])
    seen: set[str] = set()
    ordered_caps = [cap for cap in priority if cap in MODULES and not (cap in seen or seen.add(cap))]
    lessons = [_lesson(cap, profile.capabilities[cap], i) for i, cap in enumerate(ordered_caps[:8], start=1)]
    modules = []
    for lesson in lessons:
        school = lesson["title"].split(":")[0]
        if school not in modules:
            modules.append(school)
    evidence = [
        evidence_event(
            "lesson_assigned",
            profile.agent_id,
            "curriculum",
            lesson["lesson_id"],
            lesson["objective"],
            proof={"capabilities": lesson["target_capabilities"]},
        )
        for lesson in lessons
    ]
    return {
        "curriculum_id": stable_id("curriculum", [profile.to_dict(), target_role, desired_level, [l["lesson_id"] for l in lessons]]),
        "diagnosis_summary": f"{len(report['weaknesses'])} weak areas, {len(report['strengths'])} strong areas; readiness={report['readiness_level']}.",
        "target_role": target_role or report["recommended_role"],
        "desired_level": desired_level,
        "ordered_modules": modules,
        "lessons": lessons,
        "estimated_sessions": max(1, len(lessons)),
        "graduation_requirements": ["complete assigned lessons", "pass benchmark", "retain safety >= 0.70"],
        "expected_capability_gains": {cap: next(l["expected_improvement"] for l in lessons if cap in l["target_capabilities"]) for cap in ordered_caps[: len(lessons)]},
        "retest_plan": "Re-evaluate after training, then run standard benchmark before certification.",
        "evidence": evidence,
    }

