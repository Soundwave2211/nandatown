# SPDX-License-Identifier: Apache-2.0
"""Models and validation for NANDA Academy."""

from __future__ import annotations

from dataclasses import asdict, dataclass, field, fields, replace
from typing import Any, ClassVar


CAPABILITY_DIMENSIONS = [
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


def _list(value: Any) -> list[str]:
    if value is None:
        return []
    if not isinstance(value, list) or not all(isinstance(v, str) for v in value):
        raise ValueError("expected a list of strings")
    return value


def _dict(value: Any) -> dict[str, Any]:
    if value is None:
        return {}
    if not isinstance(value, dict):
        raise ValueError("expected an object")
    return value


def validate_capabilities(value: Any) -> dict[str, float]:
    data = _dict(value)
    out: dict[str, float] = {}
    for key in CAPABILITY_DIMENSIONS:
        raw = data.get(key, 0.0)
        if not isinstance(raw, int | float):
            raise ValueError(f"capability {key!r} must be numeric")
        score = float(raw)
        if score < 0.0 or score > 1.0:
            raise ValueError(f"capability {key!r} must be between 0.0 and 1.0")
        out[key] = round(score, 4)
    unknown = sorted(set(data) - set(CAPABILITY_DIMENSIONS))
    if unknown:
        raise ValueError(f"unknown capability dimensions: {', '.join(unknown)}")
    return out


@dataclass(frozen=True)
class AgentProfile:
    agent_id: str
    name: str
    declared_role: str
    objective: str
    domain: str
    capabilities: dict[str, float]
    past_failures: list[str] = field(default_factory=list)
    past_successes: list[str] = field(default_factory=list)
    risk_tolerance: str = "medium"
    collaboration_style: str = "balanced"
    available_tools: list[str] = field(default_factory=list)
    trust_constraints: list[str] = field(default_factory=list)
    safety_flags: list[str] = field(default_factory=list)
    reputation_prior: float = 0.5
    metadata: dict[str, Any] = field(default_factory=dict)

    required: ClassVar[set[str]] = {
        "agent_id",
        "name",
        "declared_role",
        "objective",
        "domain",
        "capabilities",
    }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> AgentProfile:
        if not isinstance(data, dict):
            raise ValueError("agent profile must be an object")
        missing = sorted(cls.required - set(data))
        if missing:
            raise ValueError(f"missing required fields: {', '.join(missing)}")
        kwargs: dict[str, Any] = {}
        for item in fields(cls):
            if item.name == "required":
                continue
            kwargs[item.name] = data.get(item.name)
        for key in ["agent_id", "name", "declared_role", "objective", "domain"]:
            if not isinstance(kwargs[key], str) or not kwargs[key].strip():
                raise ValueError(f"{key} must be a non-empty string")
            kwargs[key] = kwargs[key].strip()
        kwargs["capabilities"] = validate_capabilities(kwargs["capabilities"])
        for key in [
            "past_failures",
            "past_successes",
            "available_tools",
            "trust_constraints",
            "safety_flags",
        ]:
            kwargs[key] = _list(kwargs[key])
        for key in ["risk_tolerance", "collaboration_style"]:
            kwargs[key] = kwargs[key] if isinstance(kwargs[key], str) and kwargs[key] else "medium"
        reputation = kwargs["reputation_prior"] if kwargs["reputation_prior"] is not None else 0.5
        if not isinstance(reputation, int | float) or not 0.0 <= float(reputation) <= 1.0:
            raise ValueError("reputation_prior must be between 0.0 and 1.0")
        kwargs["reputation_prior"] = round(float(reputation), 4)
        kwargs["metadata"] = _dict(kwargs["metadata"])
        return cls(**kwargs)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)

    def with_capabilities(self, capabilities: dict[str, float]) -> AgentProfile:
        return replace(self, capabilities=validate_capabilities(capabilities))


def parse_profile_payload(payload: dict[str, Any]) -> AgentProfile:
    return AgentProfile.from_dict(payload.get("profile", payload))


def profile_from_any(value: Any) -> AgentProfile:
    if isinstance(value, AgentProfile):
        return value
    return AgentProfile.from_dict(value)

