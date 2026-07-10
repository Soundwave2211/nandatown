# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

from nanda_academy.agent_factory import create_agent


def test_creates_crisis_response_coordinator():
    result = create_agent("crisis_response_coordinator", "city", "respond", {}, [], "low", "structured", [])
    assert result["role"] == "crisis_response_coordinator"
    assert result["deployment_notes"].startswith("This is an agent blueprint")


def test_constraints_affect_policy():
    result = create_agent("trust_auditor", "governance", "audit", {}, ["no_external_tools"], "low", "structured", [])
    assert result["tool_policy"]["access_level"] == "restricted"


def test_factory_deterministic():
    a = create_agent("consensus_leader", "city", "lead", {}, [], "medium", "balanced", [])
    b = create_agent("consensus_leader", "city", "lead", {}, [], "medium", "balanced", [])
    assert a["agent_id"] == b["agent_id"]

