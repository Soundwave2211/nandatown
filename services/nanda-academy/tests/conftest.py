# SPDX-License-Identifier: Apache-2.0
from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


CAPS = [
    "coordination",
    "negotiation",
    "trust_reasoning",
    "market_reasoning",
    "communication",
    "planning",
    "memory",
    "tool_use",
    "safety",
    "resilience",
    "reputation_management",
    "consensus_participation",
    "payment_handling",
    "provenance_reasoning",
    "collaboration",
    "verification",
    "adaptability",
]


@pytest.fixture
def caps() -> Any:
    def _caps(**overrides: float) -> dict[str, float]:
        data = {cap: 0.62 for cap in CAPS}
        data.update(overrides)
        return data

    return _caps


@pytest.fixture
def profile(caps) -> Any:
    def _profile(**overrides: Any) -> dict[str, Any]:
        strong_caps = caps(
            coordination=0.84,
            negotiation=0.72,
            trust_reasoning=0.74,
            market_reasoning=0.7,
            communication=0.76,
            planning=0.76,
            memory=0.7,
            tool_use=0.72,
            safety=0.88,
            resilience=0.78,
            reputation_management=0.72,
            consensus_participation=0.82,
            payment_handling=0.68,
            provenance_reasoning=0.74,
            collaboration=0.78,
            verification=0.8,
            adaptability=0.74,
        )
        data: dict[str, Any] = {
            "agent_id": "agent_test",
            "name": "Test Agent",
            "declared_role": "coordination leader",
            "objective": "coordinate safely",
            "domain": "city",
            "capabilities": strong_caps,
            "past_failures": [],
            "past_successes": [
                "safe deployment",
                "verified quorum",
                "partition recovery",
                "audit passed",
                "team coordination",
            ],
            "risk_tolerance": "medium",
            "collaboration_style": "structured",
            "available_tools": ["trace_reader"],
            "trust_constraints": [],
            "safety_flags": [],
            "reputation_prior": 0.82,
            "metadata": {},
        }
        data.update(overrides)
        return data

    return _profile
