# SPDX-License-Identifier: Apache-2.0
"""End-to-end tests for the bft_hotstuff scenario and its validators.

The core claims under test: the partition scenario heals and resumes commit
progress deterministically across the required seeds; the byzantine
scenario's safety/forged-quorum/stuck-view validators pass while the
equivocation validator correctly catches the configured malicious leaders
(proving the malicious logic actually ran, not silently no-op'd); and the
bft_hotstuff validator suite FAILS against a contract_net-coordinated trace
that has no prepare:/qc:/result:committed lines at all.
"""

from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any

from nest_core.runner import ScenarioRunner
from nest_core.scenario import ScenarioConfig
from nest_core.validators import (
    validate_bft_forged_quorum,
    validate_bft_no_conflicting_commits,
    validate_bft_no_equivocation,
    validate_bft_no_partition_quorum_before_heal,
    validate_bft_no_stuck_view,
    validate_events,
    validate_trace,
)


def _run(yaml_path: str, out: Path, seed: int = 42) -> None:
    cfg = ScenarioConfig.from_yaml(yaml_path)
    cfg.seed = seed
    cfg.output.trace = str(out)
    asyncio.run(ScenarioRunner(cfg).run())


def _load_events(path: Path) -> list[dict[str, Any]]:
    return [json.loads(line) for line in path.read_text().splitlines() if line]


class TestBftPartitionScenario:
    def test_runs_and_passes_all_validators(self, tmp_path: Path) -> None:
        out = tmp_path / "partition.jsonl"
        _run("scenarios/bft_consensus_partition.yaml", out)
        events = _load_events(out)
        results = validate_trace(out, "bft_hotstuff")
        assert results, "expected validators to run"
        assert all(r.passed for r in results), [r.detail for r in results if not r.passed]

        types = {ev.get("type") for ev in events}
        assert {
            "protocol_config",
            "partition_active",
            "no_quorum",
            "view_change",
            "new_leader",
            "network_healed",
            "quorum_certificate",
            "commit",
        } <= types
        config = next(ev for ev in events if ev.get("type") == "protocol_config")
        assert config["n"] == 7
        assert config["f"] == 2
        assert config["quorum"] == 5
        partition = next(ev for ev in events if ev.get("type") == "partition_active")
        assert sorted(len(group) for group in partition["components"]) == [3, 4]
        heal_ts = next(float(ev["ts"]) for ev in events if ev.get("type") == "network_healed")
        commits = [ev for ev in events if ev.get("type") == "commit"]
        assert commits
        assert all(float(commit["ts"]) >= heal_ts for commit in commits)
        for commit in commits:
            qc = commit["qc"]
            assert len(set(qc["signers"])) >= 5

    def test_deterministic_across_required_seeds(self, tmp_path: Path) -> None:
        for seed in (42, 7, 1337, 0xDEADBEEF):
            a, b = tmp_path / f"{seed}a.jsonl", tmp_path / f"{seed}b.jsonl"
            _run("scenarios/bft_consensus_partition.yaml", a, seed=seed)
            _run("scenarios/bft_consensus_partition.yaml", b, seed=seed)
            assert a.read_bytes() == b.read_bytes(), f"seed {seed} not deterministic"
            assert all(r.passed for r in validate_trace(a, "bft_hotstuff")), seed


class TestBftByzantineScenario:
    def test_safety_and_recovery_pass_while_attempts_are_visible(self, tmp_path: Path) -> None:
        out = tmp_path / "byzantine.jsonl"
        _run("scenarios/bft_consensus_byzantine.yaml", out)
        events = _load_events(out)
        results = {r.name: r for r in validate_trace(out, "bft_hotstuff")}

        assert results["bft_no_conflicting_commits"].passed is True, results[
            "bft_no_conflicting_commits"
        ].detail
        assert results["bft_no_equivocation"].passed is True, results["bft_no_equivocation"].detail
        assert results["bft_forged_quorum"].passed is True, results["bft_forged_quorum"].detail
        assert results["bft_no_stuck_view"].passed is True, results["bft_no_stuck_view"].detail
        config = next(ev for ev in events if ev.get("type") == "protocol_config")
        assert config["n"] == 7
        assert config["f"] == 2
        assert config["quorum"] == 5
        assert len(config["byzantine_validators"]) == 2
        assert any(ev.get("type") == "byzantine_equivocation_attempt" for ev in events)
        assert any(ev.get("type") in {"view_change", "no_quorum"} for ev in events)
        assert any(ev.get("type") == "commit" for ev in events)


class TestValidatorsFailAgainstNonBftTrace:
    def test_fails_against_synthetic_contract_net_style_trace(self) -> None:
        events = [
            {"kind": "start", "agent": "r0"},
            {"kind": "send", "agent": "r0", "msg": "bids:[]"},
            {"kind": "stop", "agent": "r0"},
        ]
        results = validate_events(events, "bft_hotstuff")
        assert any(not r.passed for r in results), "expected at least one validator to fail"

    def test_fails_against_real_consensus_trace(self, tmp_path: Path) -> None:
        out = tmp_path / "consensus.jsonl"
        _run("scenarios/consensus.yaml", out)
        results = validate_trace(out, "bft_hotstuff")
        assert any(not r.passed for r in results), "expected at least one validator to fail"


def _protocol_config() -> dict[str, Any]:
    validators = [f"replica-{i}" for i in range(7)]
    return {
        "kind": "evidence",
        "type": "protocol_config",
        "ts": 0,
        "agent": "replica-0",
        "n": 7,
        "f": 2,
        "quorum": 5,
        "validators": validators,
        "honest_validators": validators,
        "byzantine_validators": [],
    }


def _vote(
    signer: str,
    value: str = "block-a",
    accepted: bool = True,
    ts: int = 1,
) -> dict[str, Any]:
    typ = "vote" if accepted else "rejected_vote"
    return {
        "kind": "evidence",
        "type": typ,
        "ts": ts,
        "agent": signer,
        "accepted": accepted,
        "phase": "prepare",
        "round": 1,
        "height": 1,
        "view": 1,
        "voter": signer,
        "signer": signer,
        "value": value,
        "block_hash": value,
    }


def _commit(
    value: str = "block-a",
    signers: list[str] | None = None,
    committer: str = "replica-0",
    ts: int = 2,
    qc_value: str | None = None,
) -> dict[str, Any]:
    qc_signers = signers or [f"replica-{i}" for i in range(5)]
    proof_value = qc_value or value
    return {
        "kind": "evidence",
        "type": "commit",
        "ts": ts,
        "agent": committer,
        "round": 1,
        "height": 1,
        "view": 1,
        "committer": committer,
        "honest": True,
        "value": value,
        "block_hash": value,
        "qc": {
            "phase": "prepare",
            "round": 1,
            "height": 1,
            "view": 1,
            "value": proof_value,
            "block_hash": proof_value,
            "signers": qc_signers,
            "quorum": 5,
        },
    }


def _qc(value: str = "block-a", ts: int = 2) -> dict[str, Any]:
    return {
        "kind": "evidence",
        "type": "quorum_certificate",
        "ts": ts,
        "agent": "replica-0",
        "phase": "prepare",
        "round": 1,
        "height": 1,
        "view": 1,
        "value": value,
        "block_hash": value,
        "signers": [f"replica-{i}" for i in range(5)],
        "quorum": 5,
    }


def _valid_structured_trace() -> list[dict[str, Any]]:
    signers = [f"replica-{i}" for i in range(5)]
    return [_protocol_config(), *[_vote(signer) for signer in signers], _commit(signers=signers)]


def _valid_healed_trace() -> list[dict[str, Any]]:
    return [
        _protocol_config(),
        {"kind": "partition_healed", "type": "network_healed", "ts": 10, "agent": "_simulator"},
        {
            "kind": "evidence",
            "type": "new_leader",
            "ts": 11,
            "agent": "replica-1",
            "round": 1,
            "view": 1,
        },
        {
            "kind": "evidence",
            "type": "proposal",
            "ts": 12,
            "agent": "replica-1",
            "round": 1,
            "height": 1,
            "view": 1,
            "value": "block-a",
            "block_hash": "block-a",
        },
        *[_vote(f"replica-{i}", ts=13) for i in range(5)],
        _qc(ts=14),
        _commit(ts=15),
    ]


class TestBftStructuredEvidenceValidators:
    def test_valid_structured_trace_passes_core_validators(self) -> None:
        events = _valid_structured_trace()
        assert validate_bft_no_conflicting_commits(events)[0].passed is True
        assert validate_bft_no_equivocation(events)[0].passed is True
        assert validate_bft_forged_quorum(events)[0].passed is True

    def test_duplicate_identical_protocol_config_passes(self) -> None:
        events = [_protocol_config(), *_valid_structured_trace()]
        results = validate_events(events, "bft_hotstuff")
        assert all(result.passed for result in results), [r.detail for r in results if not r.passed]

    def test_inconsistent_protocol_config_fails(self) -> None:
        bad_config = dict(_protocol_config())
        bad_config["quorum"] = 4
        events = [_protocol_config(), bad_config, *_valid_structured_trace()[1:]]
        results = validate_events(events, "bft_hotstuff")
        assert any(
            result.name == "bft_protocol_config_consistent" and not result.passed
            for result in results
        )

    def test_known_byzantine_signer_can_count_with_valid_vote(self) -> None:
        validators = [f"replica-{i}" for i in range(7)]
        config = _protocol_config()
        config["honest_validators"] = validators[:5]
        config["byzantine_validators"] = validators[5:]
        signers = ["replica-0", "replica-1", "replica-2", "replica-3", "replica-5"]
        events = [config, *[_vote(signer) for signer in signers], _commit(signers=signers)]
        results = validate_bft_forged_quorum(events)
        assert results[0].passed is True

    def test_conflicting_honest_commits_fail(self) -> None:
        events = [
            *_valid_structured_trace(),
            _commit(value="block-b", committer="replica-1", qc_value="block-b"),
        ]
        results = validate_bft_no_conflicting_commits(events)
        assert results[0].passed is False
        assert "round 1" in results[0].detail

    def test_effective_equivocation_fails(self) -> None:
        events = [*_valid_structured_trace(), _vote("replica-0", value="block-b")]
        results = validate_bft_no_equivocation(events)
        assert results[0].passed is False
        assert "replica-0" in results[0].detail

    def test_forged_quorum_with_four_signers_fails(self) -> None:
        events = [_protocol_config(), *[_vote(f"replica-{i}") for i in range(4)]]
        events.append(_commit(signers=[f"replica-{i}" for i in range(4)]))
        results = validate_bft_forged_quorum(events)
        assert results[0].passed is False
        assert "expected 5, got 4" in results[0].detail

    def test_duplicate_signer_qc_fails(self) -> None:
        signers = ["replica-0", "replica-0", "replica-1", "replica-2", "replica-3"]
        events = [_protocol_config(), *[_vote(f"replica-{i}") for i in range(4)]]
        events.append(_commit(signers=signers))
        results = validate_bft_forged_quorum(events)
        assert results[0].passed is False
        assert "duplicate signer" in results[0].detail

    def test_unknown_signer_qc_fails(self) -> None:
        events = _valid_structured_trace()
        events[-1] = _commit(signers=["replica-0", "replica-1", "replica-2", "replica-3", "ghost"])
        results = validate_bft_forged_quorum(events)
        assert results[0].passed is False
        assert "unknown signer" in results[0].detail

    def test_qc_value_mismatch_fails(self) -> None:
        events = _valid_structured_trace()
        events[-1] = _commit(value="block-a", qc_value="block-b")
        results = validate_bft_forged_quorum(events)
        assert results[0].passed is False
        assert "qc value != commit value" in results[0].detail

    def test_missing_vote_behind_qc_fails(self) -> None:
        events = [_protocol_config(), *[_vote(f"replica-{i}") for i in range(4)]]
        events.append(_commit(signers=[f"replica-{i}" for i in range(5)]))
        results = validate_bft_forged_quorum(events)
        assert results[0].passed is False
        assert "replica-4 has no matching accepted vote" in results[0].detail

    def test_rejected_vote_does_not_count_as_proof(self) -> None:
        events = [_protocol_config(), *[_vote(f"replica-{i}") for i in range(4)]]
        events.extend([_vote("replica-4", accepted=False), _commit()])
        results = validate_bft_forged_quorum(events)
        assert results[0].passed is False
        assert "replica-4 has no matching accepted vote" in results[0].detail

    def test_self_certifying_success_claims_without_votes_fail(self) -> None:
        events = [
            _protocol_config(),
            {
                "kind": "evidence",
                "type": "safety_check",
                "ts": 1,
                "agent": "replica-0",
                "passed": True,
            },
            {
                "kind": "evidence",
                "type": "liveness_check",
                "ts": 1,
                "agent": "replica-0",
                "passed": True,
            },
            {
                "kind": "evidence",
                "type": "quorum_certificate",
                "ts": 1,
                "agent": "replica-0",
                "phase": "prepare",
                "round": 1,
                "view": 1,
                "value": "block-a",
                "block_hash": "block-a",
                "signers": [f"replica-{i}" for i in range(5)],
                "quorum": 5,
            },
            _commit(),
        ]

        results = validate_bft_forged_quorum(events)
        assert results[0].passed is False
        assert "has no matching accepted vote" in results[0].detail

    def test_stuck_after_heal_fails(self) -> None:
        events = [
            _protocol_config(),
            {
                "kind": "partition_healed",
                "type": "network_healed",
                "ts": 10,
                "agent": "_simulator",
            },
        ]
        results = validate_bft_no_stuck_view(events)
        assert results[0].passed is False
        assert "no commits observed" in results[0].detail

    def test_heal_then_bare_commit_without_causal_chain_fails_liveness(self) -> None:
        events = [
            _protocol_config(),
            {
                "kind": "partition_healed",
                "type": "network_healed",
                "ts": 10,
                "agent": "_simulator",
            },
            *[_vote(f"replica-{i}") for i in range(5)],
            _commit(ts=11),
        ]

        results = validate_bft_no_stuck_view(events)
        assert results[0].passed is False
        assert "no post-heal new_leader" in results[0].detail

    def test_pre_heal_cross_partition_commit_fails(self) -> None:
        events = [
            _protocol_config(),
            {
                "kind": "evidence",
                "type": "partition_active",
                "ts": 0,
                "agent": "replica-0",
                "components": [
                    ["replica-0", "replica-1", "replica-2", "replica-3"],
                    ["replica-4", "replica-5", "replica-6"],
                ],
            },
            *[_vote(f"replica-{i}") for i in range(5)],
            _commit(ts=5),
            {
                "kind": "partition_healed",
                "type": "network_healed",
                "ts": 10,
                "agent": "_simulator",
            },
        ]
        results = validate_bft_no_partition_quorum_before_heal(events)
        assert results[0].passed is False
        assert "cross-partition" in results[0].detail

    def test_valid_healed_trace_passes_registered_validators(self) -> None:
        results = validate_events(_valid_healed_trace(), "bft_hotstuff")
        assert all(result.passed for result in results), [r.detail for r in results if not r.passed]

    def test_old_style_wire_trace_passes_core_validators(self) -> None:
        vote_msgs = [
            {
                "kind": "send",
                "agent": f"replica-{idx}",
                "msg": "vote:prepare:1:block-a|sig:00",
                "ts": 1,
            }
            for idx in range(5)
        ]
        events = [
            _protocol_config(),
            {"kind": "send", "agent": "replica-1", "msg": "prepare:1:block-a:value:none", "ts": 0},
            *vote_msgs,
            {
                "kind": "send",
                "agent": "replica-1",
                "msg": "qc:prepare:1:block-a:2:"
                "replica-0=00,replica-1=00,replica-2=00,replica-3=00,replica-4=00",
                "ts": 2,
            },
            {
                "kind": "send",
                "agent": "replica-0",
                "msg": "result:1:committed:5/7:block-a:value",
                "ts": 3,
            },
        ]

        assert validate_bft_no_conflicting_commits(events)[0].passed is True
        assert validate_bft_no_equivocation(events)[0].passed is True
        assert validate_bft_forged_quorum(events)[0].passed is True

    def test_mixed_trace_shape_passes_core_validators(self) -> None:
        events = _valid_structured_trace()
        events.insert(
            1,
            {
                "kind": "evidence",
                "event": {
                    "type": "proposal",
                    "round": 1,
                    "view": 1,
                    "value": "block-a",
                    "block_hash": "block-a",
                },
            },
        )

        assert validate_bft_forged_quorum(events)[0].passed is True

    def test_metamorphic_mutations_break_bft_invariants(self) -> None:
        def remove_qc_signer(events: list[dict[str, Any]]) -> None:
            events[-1]["qc"]["signers"].pop()

        def duplicate_qc_signer(events: list[dict[str, Any]]) -> None:
            events[-1]["qc"]["signers"][4] = events[-1]["qc"]["signers"][0]

        def change_qc_value(events: list[dict[str, Any]]) -> None:
            events[-1]["qc"]["value"] = "block-b"
            events[-1]["qc"]["block_hash"] = "block-b"

        def change_qc_round(events: list[dict[str, Any]]) -> None:
            events[-1]["qc"]["round"] = 2
            events[-1]["qc"]["height"] = 2

        def change_qc_view(events: list[dict[str, Any]]) -> None:
            events[-1]["qc"]["view"] = 2

        def change_commit_value(events: list[dict[str, Any]]) -> None:
            events[-1]["value"] = "block-b"
            events[-1]["block_hash"] = "block-b"

        def delete_vote(events: list[dict[str, Any]]) -> None:
            del events[5]

        def reject_vote(events: list[dict[str, Any]]) -> None:
            events[5]["type"] = "rejected_vote"
            events[5]["accepted"] = False

        def change_vote_value(events: list[dict[str, Any]]) -> None:
            events[5]["value"] = "block-b"
            events[5]["block_hash"] = "block-b"

        def add_equivocation(events: list[dict[str, Any]]) -> None:
            events.insert(9, _vote("replica-0", value="block-b", ts=13))

        def remove_new_leader(events: list[dict[str, Any]]) -> None:
            del events[2]

        mutations = [
            remove_qc_signer,
            duplicate_qc_signer,
            change_qc_value,
            change_qc_round,
            change_qc_view,
            change_commit_value,
            delete_vote,
            reject_vote,
            change_vote_value,
            add_equivocation,
            remove_new_leader,
        ]

        for mutate in mutations:
            events = _valid_healed_trace()
            mutate(events)
            results = validate_events(events, "bft_hotstuff")
            assert any(not result.passed for result in results), mutate.__name__
