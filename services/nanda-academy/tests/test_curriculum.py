# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

from nanda_academy.curriculum import generate_curriculum


def test_weak_negotiator_receives_negotiation(profile, caps):
    plan = generate_curriculum(profile(capabilities=caps(negotiation=0.2, market_reasoning=0.3)))
    assert any("Negotiation" in module for module in plan["ordered_modules"])


def test_unsafe_agent_receives_safety_first(profile, caps):
    plan = generate_curriculum(profile(capabilities=caps(safety=0.3)))
    assert plan["ordered_modules"][0] == "School of Safety"


def test_target_role_changes_curriculum(profile):
    plan = generate_curriculum(profile(), target_role="trust auditor")
    assert "School of Trust" in plan["ordered_modules"]

def test_curriculum_deterministic(profile):
    assert generate_curriculum(profile()) == generate_curriculum(profile())

