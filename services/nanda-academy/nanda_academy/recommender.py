# SPDX-License-Identifier: Apache-2.0
"""Collaboration role recommendation."""

from __future__ import annotations

from typing import Any

from nanda_academy.evidence import evidence_event, stable_id
from nanda_academy.models import AgentProfile, profile_from_any


def recommend_collaboration_role(profile: AgentProfile | dict[str, Any], task_context: dict[str, Any] | None = None) -> dict[str, Any]:
    profile = profile_from_any(profile)
    task_context = task_context or {}
    c = profile.capabilities
    risk = []
    role = "executor"
    confidence = 0.55
    if c["safety"] < 0.35:
        role, confidence = "do_not_deploy", 0.9
        risk.append("safety below deployment threshold")
    elif c["safety"] < 0.55:
        role, confidence = "learner", 0.82
        risk.append("requires supervision before deployment")
    elif c["coordination"] >= 0.75 and c["safety"] >= 0.75:
        role, confidence = "leader", min(0.95, (c["coordination"] + c["safety"]) / 2)
    elif c["verification"] >= 0.74 and c["trust_reasoning"] >= 0.7:
        role, confidence = ("auditor" if "audit" in str(task_context).lower() else "verifier"), min(0.94, (c["verification"] + c["trust_reasoning"]) / 2)
    elif c["negotiation"] >= 0.7 and c["communication"] >= 0.68:
        role, confidence = ("mediator" if c["trust_reasoning"] >= 0.65 else "negotiator"), min(0.9, (c["negotiation"] + c["communication"]) / 2)
    elif c["safety"] >= 0.7:
        role, confidence = "observer", 0.66
    if role in {"verifier", "auditor"} and c["trust_reasoning"] < 0.65:
        role = "observer"
        risk.append("trust reasoning too low for verifier role")
    if "crisis" in str(task_context).lower() and c["resilience"] < 0.6:
        risk.append("avoid crisis roles until resilience improves")
        if role == "leader":
            role = "observer"
    evidence = [
        evidence_event(
            "role_recommended",
            profile.agent_id,
            "collaboration",
            role,
            "Role selected from capability thresholds and task context.",
            proof={"task_context": task_context, "confidence": round(confidence, 4)},
        )
    ]
    return {
        "recommended_role": role,
        "confidence": round(confidence, 4),
        "reason": f"{role} best matches observed capabilities; self-claims were not used.",
        "risk_assessment": risk,
        "required_training_before_deployment": [] if role not in {"learner", "do_not_deploy"} else ["School of Safety", "School of Verification"],
        "agents_it_complements": ["planner", "verifier"] if role in {"leader", "executor"} else ["leader", "executor"],
        "agents_it_should_avoid": ["safety_critical_team"] if c["safety"] < 0.7 else [],
        "tool_access_level": "none" if role == "do_not_deploy" else "restricted" if role in {"learner", "observer"} else "standard",
        "supervision_level": "blocked" if role == "do_not_deploy" else "high" if role == "learner" else "normal",
        "evidence": evidence,
    }

