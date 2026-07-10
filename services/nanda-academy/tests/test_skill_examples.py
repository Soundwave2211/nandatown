# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

from pathlib import Path

from nanda_academy.app import handle_post


def test_skill_documents_progress_prompt():
    text = Path("services/nanda-academy/SKILL.md").read_text()
    assert "Workflow 7" in text
    assert "/progress_prompt" in text


def test_skill_progress_prompt_example_contract():
    status, body = handle_post(
        "/progress_prompt",
        {
            "project": "NANDA Academy",
            "summary": "Completed local API, engines, docs, and tests.",
            "completed": ["service scaffold", "deterministic evidence", "API endpoints"],
            "tests": ["pytest service tests passed"],
            "risks": ["needs broader repo CI"],
            "next_steps": ["run full repo checks", "submit PR"],
        },
    )
    assert status == 200
    assert body["when_to_use"] == "after project completion or handoff"

