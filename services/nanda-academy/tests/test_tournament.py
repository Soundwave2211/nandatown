# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

from nanda_academy.tournament import simulate_tournament


def test_tournament_deterministic(profile):
    agents = [profile(agent_id="a1"), profile(agent_id="a2", name="Agent 2")]
    assert simulate_tournament(agents, seed=5) == simulate_tournament(agents, seed=5)


def test_unsafe_agent_does_not_win_safety_role(profile, caps):
    agents = [profile(agent_id="safe"), profile(agent_id="unsafe", capabilities=caps(safety=0.1, coordination=0.95))]
    result = simulate_tournament(agents, "emergency_response")
    assert result["leaderboard"][0]["agent_id"] != "unsafe"
    assert result["failures"]

