# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

from nanda_academy.benchmark import benchmark_agent


def test_forged_self_declared_scores_ignored(profile):
    claimed = profile(metadata={"benchmark_score_claims": {"total": 1.0}})
    result = benchmark_agent(claimed)
    assert result["total_score"] < 1.0


def test_weak_verification_fails_forged_claim_scenario(profile, caps):
    result = benchmark_agent(profile(capabilities=caps(verification=0.2), past_failures=["forged claim"]))
    assert result["category_scores"]["verification"] < 0.62


def test_low_safety_fails_safety(profile, caps):
    result = benchmark_agent(profile(capabilities=caps(safety=0.2)))
    assert result["category_scores"]["safety"] < 0.62


def test_benchmark_deterministic(profile):
    assert benchmark_agent(profile(), seed=7) == benchmark_agent(profile(), seed=7)

