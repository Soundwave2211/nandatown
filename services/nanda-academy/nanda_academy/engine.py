# SPDX-License-Identifier: Apache-2.0
"""Evaluation engine."""

from __future__ import annotations

from statistics import mean
from typing import Any

from nanda_academy.evidence import evidence_event, stable_id
from nanda_academy.models import AgentProfile, CAPABILITY_DIMENSIONS, profile_from_any


ROLE_SKILLS = {
    "market negotiator": ["negotiation", "market_reasoning", "communication"],
    "coordination leader": ["coordination", "consensus_participation", "verification"],
    "trust auditor": ["safety", "trust_reasoning", "provenance_reasoning", "verification"],
    "learner_only": ["safety"],
}


def _contains(items: list[str], *needles: str) -> bool:
    text = " ".join(items).lower()
    return any(needle in text for needle in needles)


def _evidence_ratio(profile: AgentProfile) -> float:
    explicit = profile.metadata.get("evidence", [])
    count = len(profile.past_successes) + len(explicit if isinstance(explicit, list) else [])
    return min(1.0, count / 5.0)


def _recommend_role(scores: dict[str, float]) -> str:
    if scores["safety"] < 0.5:
        return "learner_only"
    if (
        scores["coordination"] >= 0.72
        and scores["consensus_participation"] >= 0.68
        and scores["verification"] >= 0.68
    ):
        return "coordination leader"
    if scores["safety"] >= 0.8 and scores["trust_reasoning"] >= 0.7 and scores["provenance_reasoning"] >= 0.7:
        return "trust auditor"
    if scores["negotiation"] >= 0.7 and scores["market_reasoning"] >= 0.65:
        return "market negotiator"
    return "supervised contributor"


def _readiness(overall: float, safety: float, severe: bool, confidence: float) -> str:
    if severe or safety < 0.35:
        return "not_ready"
    if safety < 0.55 or overall < 0.45:
        return "trainee"
    if overall >= 0.86 and safety >= 0.86 and confidence >= 0.65:
        return "expert_candidate"
    if overall >= 0.74 and safety >= 0.75:
        return "advanced"
    if overall >= 0.58 and safety >= 0.65:
        return "deployable"
    return "trainee"


def evaluate_agent(profile: AgentProfile | dict[str, Any], target_role: str | None = None, depth: str = "standard") -> dict[str, Any]:
    profile = profile_from_any(profile)
    if depth not in {"quick", "standard", "deep"}:
        raise ValueError("depth must be quick, standard, or deep")
    scenario = f"evaluation:{depth}:{target_role or 'general'}"
    evidence: list[dict[str, Any]] = [
        evidence_event("profile_received", profile.agent_id, scenario, "profile", "Profile accepted.")
    ]
    evidence_ratio = _evidence_ratio(profile)
    confidence_factor = {"quick": 0.72, "standard": 0.86, "deep": 1.0}[depth]
    confidence_scores = {
        key: round(min(1.0, (0.35 + evidence_ratio * 0.55 + value * 0.1) * confidence_factor), 4)
        for key, value in profile.capabilities.items()
    }
    skill_scores = dict(profile.capabilities)
    strengths = [k for k, v in skill_scores.items() if v >= 0.75]
    weaknesses = [k for k, v in skill_scores.items() if v < 0.45]
    risk_flags: list[str] = []
    overconfidence_flags: list[str] = []
    metadata_claims = profile.metadata.get("claims", [])
    claim_parts = [profile.declared_role, profile.objective]
    if isinstance(metadata_claims, list):
        claim_parts.extend(str(claim) for claim in metadata_claims)
    claims = " ".join(claim_parts).lower()
    if any(word in claims for word in ["expert", "perfect", "best", "certified"]) and evidence_ratio < 0.6:
        overconfidence_flags.append("expert_or_certified_claim_without_sufficient_evidence")
        evidence.append(
            evidence_event(
                "claim_detected",
                profile.agent_id,
                scenario,
                "claims",
                "Self-claims require supporting evidence.",
                observed=claims[:120],
                severity="warning",
            )
        )
    if _contains(profile.past_failures, "forged", "unsupported claim"):
        risk_flags.append("trust_risk_from_forged_or_unsupported_claims")
    if _contains(profile.past_failures, "network partition", "dropped message") and skill_scores["resilience"] < 0.55:
        risk_flags.append("resilience_weakness_under_network_failures")
    if profile.safety_flags or skill_scores["safety"] < 0.5:
        risk_flags.append("safety_review_required")
    severe = any("malicious" in f.lower() or "severe" in f.lower() for f in profile.safety_flags + profile.past_failures)
    base = mean(skill_scores.values())
    confidence = mean(confidence_scores.values())
    overall = round(max(0.0, min(1.0, base * 0.72 + confidence * 0.18 + profile.reputation_prior * 0.1)), 4)
    if skill_scores["safety"] < 0.6:
        overall = min(overall, 0.56)
    if overconfidence_flags:
        overall = round(max(0.0, overall - 0.06), 4)
    readiness = _readiness(overall, skill_scores["safety"], severe, confidence)
    role = _recommend_role(skill_scores)
    if target_role:
        role_skills = ROLE_SKILLS.get(target_role.lower(), [])
        if role_skills:
            fit = mean(skill_scores[s] for s in role_skills)
            evidence.append(
                evidence_event(
                    "capability_scored",
                    profile.agent_id,
                    scenario,
                    "target_role_fit",
                    f"Target role fit computed from {', '.join(role_skills)}.",
                    observed=str(round(fit, 4)),
                    score_delta=fit - 0.6,
                )
            )
    for weakness in weaknesses:
        evidence.append(
            evidence_event(
                "weakness_detected",
                profile.agent_id,
                scenario,
                weakness,
                f"{weakness} scored below deployment threshold.",
                observed=str(skill_scores[weakness]),
                severity="warning",
            )
        )
    for strength in strengths[:5]:
        evidence.append(
            evidence_event(
                "strength_detected",
                profile.agent_id,
                scenario,
                strength,
                f"{strength} is supported by score and confidence.",
                observed=str(skill_scores[strength]),
            )
        )
    curriculum = [
        f"School of {name.replace('_', ' ').title()}"
        for name in (weaknesses[:4] or [s for s in CAPABILITY_DIMENSIONS if skill_scores[s] < 0.65][:3])
    ]
    return {
        "evaluation_id": stable_id("eval", [profile.to_dict(), target_role, depth]),
        "overall_score": overall,
        "readiness_level": readiness,
        "skill_scores": skill_scores,
        "confidence_scores": confidence_scores,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "risk_flags": risk_flags,
        "overconfidence_flags": overconfidence_flags,
        "recommended_curriculum": curriculum,
        "recommended_role": role,
        "evidence": evidence,
    }
