# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

from nanda_academy.recommender import recommend_collaboration_role


def test_high_coordination_agent_can_lead(profile):
    assert recommend_collaboration_role(profile())["recommended_role"] == "leader"


def test_low_trust_agent_not_verifier(profile, caps):
    result = recommend_collaboration_role(profile(capabilities=caps(verification=0.9, trust_reasoning=0.2)))
    assert result["recommended_role"] != "verifier"


def test_unsafe_agent_not_leader(profile, caps):
    result = recommend_collaboration_role(profile(capabilities=caps(coordination=0.9, safety=0.2)))
    assert result["recommended_role"] in {"learner", "do_not_deploy"}

