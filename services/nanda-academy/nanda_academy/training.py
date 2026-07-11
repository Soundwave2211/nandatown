# SPDX-License-Identifier: Apache-2.0
"""Deterministic training simulation."""

from __future__ import annotations

from typing import Any

from nanda_academy.curriculum import generate_curriculum
from nanda_academy.evidence import evidence_event, stable_hash, stable_id
from nanda_academy.models import AgentProfile, profile_from_any


def _jitter(seed: int, lesson_id: str, mode: str) -> float:
    return int(stable_hash([seed, lesson_id, mode])[:4], 16) / 0xFFFF


def run_training(
    profile: AgentProfile | dict[str, Any],
    curriculum: dict[str, Any] | None = None,
    sessions: int = 3,
    mode: str = "standard",
    seed: int = 0,
) -> dict[str, Any]:
    profile = profile_from_any(profile)
    if mode not in {"standard", "adversarial", "accelerated", "certification_prep"}:
        raise ValueError("mode must be standard, adversarial, accelerated, or certification_prep")
    if sessions < 1 or sessions > 20:
        raise ValueError("sessions must be between 1 and 20")
    curriculum = curriculum or generate_curriculum(profile)
    caps = dict(profile.capabilities)
    completed: list[str] = []
    failed: list[str] = []
    transcript: list[str] = []
    evidence = [evidence_event("training_started", profile.agent_id, mode, "start", f"{sessions} sessions scheduled.")]
    multiplier = {"standard": 1.0, "adversarial": 0.8, "accelerated": 1.25, "certification_prep": 0.95}[mode]
    lessons = curriculum.get("lessons", [])[:sessions]
    for lesson in lessons:
        cap = lesson["target_capabilities"][0]
        pressure = _jitter(seed, lesson["lesson_id"], mode)
        unsafe_block = caps["safety"] < 0.45 and cap != "safety"
        success = not unsafe_block and pressure + caps[cap] * 0.7 + caps["safety"] * 0.2 >= (0.56 if mode != "adversarial" else 0.68)
        if success:
            gain = float(lesson["expected_improvement"]) * multiplier * (1.0 - caps[cap] * 0.55)
            if mode == "adversarial" and cap in {"verification", "resilience", "safety"}:
                gain *= 1.25
            caps[cap] = round(min(1.0, caps[cap] + gain), 4)
            completed.append(lesson["lesson_id"])
            transcript.append(f"PASS {lesson['title']}: {cap} +{gain:.3f}")
        else:
            failed.append(lesson["lesson_id"])
            if cap != "safety" and caps["safety"] < 0.55:
                caps["safety"] = round(min(1.0, caps["safety"] + 0.02), 4)
            transcript.append(f"REMEDIAL {lesson['title']}: blocked by safety or adversarial pressure")
        evidence.append(
            evidence_event(
                "training_result",
                profile.agent_id,
                mode,
                lesson["lesson_id"],
                "Lesson outcome recorded.",
                observed="pass" if success else "remedial",
                proof={"capability": cap, "score": caps[cap]},
                severity="info" if success else "warning",
            )
        )
    improvements = {k: round(caps[k] - profile.capabilities[k], 4) for k in caps if caps[k] != profile.capabilities[k]}
    updated = profile.with_capabilities(caps)
    remaining = [k for k, v in caps.items() if v < 0.55]
    return {
        "training_session_id": stable_id("training", [profile.to_dict(), curriculum.get("curriculum_id"), sessions, mode, seed]),
        "teaching_accuracy": 1.0,
        "teaching_accuracy_percent": 100,
        "accuracy_scope": "100% deterministic Academy curriculum delivery and lesson accounting; not a real-world perfection guarantee.",
        "completed_lessons": completed,
        "failed_lessons": failed,
        "skill_improvements": improvements,
        "updated_agent_profile": updated.to_dict(),
        "remaining_weaknesses": remaining,
        "transcript": transcript,
        "next_recommendation": "Run adversarial benchmark." if mode != "adversarial" else "Rebuild curriculum around exposed weaknesses.",
        "evidence": evidence,
    }
