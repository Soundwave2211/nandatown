# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

from nanda_academy.app import capabilities, handle_post


def test_capabilities_lists_endpoints():
    assert "POST /progress_prompt" in capabilities()["endpoints"]


def test_evaluate_endpoint(profile):
    status, body = handle_post("/evaluate_agent", {"profile": profile()})
    assert status == 200
    assert body["evidence"]


def test_create_agent_endpoint():
    status, body = handle_post(
        "/create_agent",
        {"target_role": "trust_auditor", "domain": "city", "objective": "audit claims"},
    )
    assert status == 200
    assert body["agent_blueprint"]["metadata"]["blueprint_only"]


def test_progress_prompt_endpoint():
    status, body = handle_post(
        "/progress_prompt",
        {"project": "NANDA Academy", "completed": ["done"], "tests": ["passed"], "risks": [], "next_steps": ["review"]},
    )
    assert status == 200
    assert "ChatGPT" in body["prompt"]
