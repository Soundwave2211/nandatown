# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

from nanda_academy.curriculum import generate_curriculum
from nanda_academy.training import run_training


def test_training_improves_weak_capabilities(profile, caps):
    data = profile(capabilities=caps(negotiation=0.25, safety=0.8))
    plan = generate_curriculum(data)
    result = run_training(data, plan, sessions=3, seed=2)
    assert result["skill_improvements"]


def test_unsafe_agent_not_made_expert_after_one_run(profile, caps):
    data = profile(capabilities=caps(safety=0.25, negotiation=0.25))
    result = run_training(data, sessions=1)
    assert result["updated_agent_profile"]["capabilities"]["safety"] < 0.5


def test_training_seed_deterministic(profile):
    assert run_training(profile(), seed=3) == run_training(profile(), seed=3)


def test_adversarial_mode_differs(profile):
    assert run_training(profile(), mode="standard")["transcript"] != run_training(profile(), mode="adversarial")["transcript"]

