# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

import pytest

from nanda_academy.evidence import stable_id
from nanda_academy.models import AgentProfile


def test_profile_validation(profile):
    agent = AgentProfile.from_dict(profile())
    assert agent.capabilities["safety"] == 0.88


def test_invalid_skill_score_rejected(profile):
    data = profile()
    data["capabilities"]["safety"] = 1.2
    with pytest.raises(ValueError, match="between"):
        AgentProfile.from_dict(data)


def test_stable_ids_are_deterministic():
    assert stable_id("x", {"b": 2, "a": 1}) == stable_id("x", {"a": 1, "b": 2})

