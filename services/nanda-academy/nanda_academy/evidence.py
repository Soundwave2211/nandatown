# SPDX-License-Identifier: Apache-2.0
"""Deterministic evidence helpers."""

from __future__ import annotations

import hashlib
import json
from dataclasses import asdict, is_dataclass
from typing import Any


def _plain(obj: Any) -> Any:
    if is_dataclass(obj):
        return _plain(asdict(obj))
    if isinstance(obj, dict):
        return {str(k): _plain(v) for k, v in sorted(obj.items(), key=lambda item: str(item[0]))}
    if isinstance(obj, (list, tuple)):
        return [_plain(v) for v in obj]
    return obj


def canonical_json(obj: Any) -> str:
    return json.dumps(_plain(obj), sort_keys=True, separators=(",", ":"), ensure_ascii=True)


def stable_hash(obj: Any) -> str:
    return hashlib.sha256(canonical_json(obj).encode("utf-8")).hexdigest()


def stable_id(prefix: str, obj: Any) -> str:
    return f"{prefix}_{stable_hash(obj)[:16]}"


def evidence_event(
    event_type: str,
    agent_id: str,
    scenario_id: str,
    step: str,
    reason: str,
    *,
    expected: str = "",
    observed: str = "",
    score_delta: float = 0.0,
    proof: Any | None = None,
    severity: str = "info",
) -> dict[str, Any]:
    payload = {
        "type": event_type,
        "agent_id": agent_id,
        "scenario_id": scenario_id,
        "step": step,
        "expected": expected,
        "observed": observed,
        "score_delta": round(score_delta, 4),
        "reason": reason,
        "proof": proof or {},
        "severity": severity,
    }
    return {
        "event_id": stable_id("ev", payload),
        "input_summary": f"{agent_id}:{scenario_id}:{step}",
        **payload,
    }

