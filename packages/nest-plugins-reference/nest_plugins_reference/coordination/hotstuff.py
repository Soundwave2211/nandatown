# SPDX-License-Identifier: Apache-2.0
"""HotStuff coordination plugin -- ``Coordination`` protocol conformance wrapper.

This class satisfies the ``Coordination`` protocol's ``propose`` /
``participate`` / ``resolve`` / ``commit`` surface for isolated,
single-process testing: it runs one PREPARE -> COMMIT round in-memory with
no networking, no view-change timers, and no Byzantine handling.

The full networked protocol -- multi-round messaging, round-robin leader
rotation, view-change on timeout, the locked-QC safety rule across views,
and the deliberately-malicious leader behavior exercised by the Byzantine
scenario -- lives in ``nest_core.scenarios_builtin.bft_hotstuff``
(``ReplicaAgent`` / ``MaliciousLeaderAgent``), which drives the simulator's
event loop directly. This split mirrors the existing precedent set by
``contract_net`` and ``nest_core.scenarios_builtin.consensus``: every
built-in scenario factory hand-rolls its wire protocol inside
``StateMachineAgent`` subclasses rather than calling into the
``Coordination``-shaped plugin -- that plugin class exists for API
conformance and isolated unit testing only, it is not invoked by the
simulator at runtime.

Example::

    coord = HotStuff(AgentId("r0"), f=1)
    rnd = await coord.propose(Task(id="t1", description="agree on a value"))
"""

from __future__ import annotations

import hashlib
from collections.abc import Sequence
from typing import Any

from nest_core.bft import quorum_for_f, unique_signers
from nest_core.types import AgentId, Outcome, Round, Task, Vote


class HotStuff:
    """Single-process HotStuff round: propose, vote, resolve by quorum.

    Example::

        coord = HotStuff(AgentId("r0"), f=1)
        rnd = await coord.propose(Task(id="t1", description="work"))
    """

    def __init__(
        self,
        agent_id: AgentId,
        f: int = 1,
        replica_ids: Sequence[AgentId] | None = None,
    ) -> None:
        self._agent_id = agent_id
        self._f = f
        self._replica_ids = list(replica_ids) if replica_ids is not None else [agent_id]
        self._round_counter = 0
        self.committed_qcs: list[dict[str, Any]] = []
        self._trace: list[dict[str, Any]] = []

    def get_trace(self) -> list[dict[str, Any]]:
        """Return structured proof evidence emitted by this wrapper.

        Example::

            evidence = coord.get_trace()
        """
        return [dict(event) for event in self._trace]

    async def propose(self, task: Task) -> Round:
        """Propose a task as a single-view HotStuff round.

        Example::

            rnd = await coord.propose(task)
        """
        self._round_counter += 1
        seed = f"{self._agent_id}|{task.id}|{self._round_counter}"
        round_id = hashlib.sha256(seed.encode()).hexdigest()
        validators = [str(agent_id) for agent_id in self._replica_ids]
        evidence = [
            {
                "kind": "evidence",
                "type": "protocol_config",
                "agent": str(self._agent_id),
                "n": len(validators),
                "f": self._f,
                "quorum": quorum_for_f(self._f),
                "validators": validators,
                "honest_validators": validators,
                "byzantine_validators": [],
            },
            {
                "kind": "evidence",
                "type": "proposal",
                "agent": str(self._agent_id),
                "round": 0,
                "height": 0,
                "view": 0,
                "leader": str(self._agent_id),
                "expected_leader": str(self._agent_id),
                "leader_valid": True,
                "value": "accept",
                "block_hash": "accept",
                "justify_qc": None,
            },
        ]
        self._trace.extend(evidence)
        return Round(
            id=round_id,
            task=task,
            participants=[],
            metadata={
                "view": 0,
                "height": 0,
                "f": self._f,
                "quorum": quorum_for_f(self._f),
                "validators": validators,
                "votes": [],
                "evidence": evidence,
            },
        )

    async def participate(self, round: Round) -> Vote:
        """Cast a prepare-phase accept vote for the round's task.

        Example::

            vote = await coord.participate(rnd)
        """
        vote = Vote(voter=self._agent_id, round_id=round.id, value="accept")
        votes: list[dict[str, Any]] = round.metadata.setdefault("votes", [])
        if not any(v.get("voter") == str(vote.voter) for v in votes):
            vote_record = {
                "voter": str(vote.voter),
                "signer": str(vote.voter),
                "value": vote.value,
                "round": round.metadata.get("height", 0),
                "view": round.metadata.get("view", 0),
                "phase": "prepare",
                "accepted": True,
            }
            votes.append(vote_record)
            evidence = round.metadata.setdefault("evidence", [])
            evidence.append({"kind": "evidence", "type": "vote", "agent": str(vote.voter), **vote_record})
        if self._agent_id not in round.participants:
            round.participants.append(self._agent_id)
        return vote

    async def resolve(self, round: Round) -> Outcome:
        """Resolve a round once at least 2f+1 prepare votes have accumulated.

        Example::

            outcome = await coord.resolve(rnd)
        """
        votes: list[dict[str, Any]] = round.metadata.get("votes", [])
        values_by_signer: dict[str, set[str]] = {}
        for vote in votes:
            signer = str(vote.get("signer") or vote.get("voter"))
            values_by_signer.setdefault(signer, set()).add(str(vote.get("value")))
        accepted_signers = {
            signer for signer, values in values_by_signer.items() if values == {"accept"}
        }
        accepts = len(accepted_signers)
        quorum = int(round.metadata.get("quorum", quorum_for_f(self._f)))
        winner: AgentId | None = self._agent_id if accepts >= quorum else None
        signers = sorted(accepted_signers)
        evidence = round.metadata.setdefault("evidence", [])
        if accepts >= quorum:
            qc_event = {
                "kind": "evidence",
                "type": "quorum_certificate",
                "agent": str(self._agent_id),
                "phase": "prepare",
                "round": round.metadata.get("height", 0),
                "height": round.metadata.get("height", 0),
                "view": round.metadata.get("view", 0),
                "value": "accept",
                "block_hash": "accept",
                "signers": signers,
                "quorum": quorum,
            }
            evidence.append(qc_event)
            self._trace.extend(event for event in evidence if event not in self._trace)
        else:
            rejected = {
                "kind": "evidence",
                "type": "rejected_qc",
                "agent": str(self._agent_id),
                "round": round.metadata.get("height", 0),
                "height": round.metadata.get("height", 0),
                "view": round.metadata.get("view", 0),
                "value": "accept",
                "signers": signers,
                "reason": "insufficient_quorum",
            }
            evidence.append(rejected)
            self._trace.append(rejected)
        outcome = Outcome(
            round_id=round.id,
            winner=winner,
            task=round.task,
            metadata={
                "accepts": accepts,
                "quorum": quorum,
                "qc": {
                    "phase": "prepare",
                    "round": round.metadata.get("height", 0),
                    "height": round.metadata.get("height", 0),
                    "view": round.metadata.get("view", 0),
                    "value": "accept",
                    "signers": signers,
                    "quorum": quorum,
                }
                if accepts >= quorum
                else None,
            },
        )
        outcome.metadata["evidence"] = evidence
        return outcome

    async def commit(self, outcome: Outcome) -> None:
        """Commit a resolved outcome.

        The wrapper refuses to commit an outcome unless ``resolve`` attached
        a quorum certificate with at least ``2f + 1`` distinct signers. The
        networked protocol's actual decide step lives in ``ReplicaAgent`` in
        ``nest_core.scenarios_builtin.bft_hotstuff``.

        Example::

            await coord.commit(outcome)
        """
        qc = outcome.metadata.get("qc")
        if not isinstance(qc, dict):
            msg = "cannot commit HotStuff outcome without quorum certificate"
            raise ValueError(msg)
        signers_raw = qc.get("signers", [])
        if not isinstance(signers_raw, list):
            msg = "quorum certificate signers must be a list"
            raise ValueError(msg)
        signers = unique_signers([str(signer) for signer in signers_raw])
        quorum = int(qc.get("quorum", quorum_for_f(self._f)))
        if len(signers) < quorum:
            msg = f"quorum certificate has {len(signers)} signers, needs {quorum}"
            raise ValueError(msg)
        if len(signers) != len(signers_raw):
            msg = "quorum certificate contains duplicate signers"
            raise ValueError(msg)
        if qc.get("value") != "accept":
            msg = "quorum certificate value does not match accepted outcome"
            raise ValueError(msg)
        self.committed_qcs.append(dict(qc))
        commit_event = {
            "kind": "evidence",
            "type": "commit",
            "agent": str(self._agent_id),
            "round": qc.get("round", 0),
            "height": qc.get("height", qc.get("round", 0)),
            "view": qc.get("view", 0),
            "committer": str(self._agent_id),
            "honest": True,
            "value": qc.get("value"),
            "block_hash": qc.get("value"),
            "qc": dict(qc),
        }
        self._trace.extend(
            event for event in outcome.metadata.get("evidence", []) if event not in self._trace
        )
        self._trace.append(commit_event)
