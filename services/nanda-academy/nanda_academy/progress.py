# SPDX-License-Identifier: Apache-2.0
"""Progress handoff prompt generator."""

from __future__ import annotations

from typing import Any

from nanda_academy.evidence import stable_id


def progress_prompt(payload: dict[str, Any]) -> dict[str, Any]:
    project = str(payload.get("project", "NANDA Academy"))
    summary = str(payload.get("summary", "Project completed; please review progress and next steps."))
    completed = payload.get("completed", [])
    tests = payload.get("tests", [])
    risks = payload.get("risks", [])
    next_steps = payload.get("next_steps", [])
    for name, value in {"completed": completed, "tests": tests, "risks": risks, "next_steps": next_steps}.items():
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            raise ValueError(f"{name} must be a list of strings")
    prompt = "\n".join(
        [
            f"You are ChatGPT helping review progress on {project}.",
            "Use the structured project summary below to assess what is done, what remains risky, and what the next useful action should be.",
            "",
            f"Summary: {summary}",
            "",
            "Completed:",
            *(f"- {item}" for item in completed),
            "",
            "Verification:",
            *(f"- {item}" for item in tests),
            "",
            "Remaining risks:",
            *(f"- {item}" for item in risks),
            "",
            "Suggested next steps:",
            *(f"- {item}" for item in next_steps),
            "",
            "Please respond with: 1. progress assessment, 2. highest-risk gap, 3. next three actions, 4. concise stakeholder update.",
        ]
    )
    return {
        "prompt_id": stable_id("progress_prompt", [project, summary, completed, tests, risks, next_steps]),
        "target": "ChatGPT",
        "when_to_use": "after project completion or handoff",
        "prompt": prompt,
    }

