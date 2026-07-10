# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

from nanda_academy.engine import evaluate_agent


def test_strong_agent_gets_high_score(profile):
    report = evaluate_agent(profile())
    assert report["overall_score"] >= 0.7
    assert report["readiness_level"] in {"advanced", "expert_candidate"}


def test_weak_agent_gets_specific_weaknesses(profile, caps):
    report = evaluate_agent(profile(capabilities=caps(negotiation=0.2, market_reasoning=0.25, safety=0.72)))
    assert "negotiation" in report["weaknesses"]
    assert report["recommended_curriculum"]


def test_overconfident_self_claim_flagged(profile, caps):
    report = evaluate_agent(profile(declared_role="expert certified leader", capabilities=caps(safety=0.8), past_successes=[], metadata={"claims": ["perfect"]}))
    assert report["overconfidence_flags"]


def test_low_safety_caps_readiness(profile, caps):
    report = evaluate_agent(profile(capabilities=caps(safety=0.2)))
    assert report["readiness_level"] in {"not_ready", "trainee"}


def test_evaluation_deterministic(profile):
    assert evaluate_agent(profile()) == evaluate_agent(profile())

