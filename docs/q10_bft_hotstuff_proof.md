# Q10 BFT HotStuff Proof Notes

## Threat Model

Q10 exercises the fixed-membership Byzantine setting:

- `n = 3f + 1`
- Q10 scenario: `n = 7`, `f = 2`
- quorum size: `2f + 1 = 5`

The adversary may corrupt payloads, equivocate as leader, withhold votes,
attempt stale-view votes, or present forged quorum evidence. A 4/3 network
partition is not a quorum on either side, so no valid commit can be formed
before the network heals.

## Safety Invariant

No two honest replicas may commit conflicting values for the same consensus
round. The validators check both the strong grouping by `round` and the
minimum Q10 grouping by `(round, view)`.

A commit is accepted only when its quorum certificate can be reconstructed
from accepted vote evidence:

- at least 5 unique signers for the 7-replica scenario;
- every signer is a known validator;
- every signer has exactly one accepted vote for the commit round, view,
  phase, and value;
- rejected votes do not count;
- duplicate signers do not inflate quorum;
- accepted equivocation invalidates the proof;
- the QC round, view, and value must match the commit.

## Liveness Invariant

After `network_healed` / `partition_healed`, the trace must show bounded
recovery. The bound is `max(2 * n + 3, 20)` ticks or event-time units.

The liveness validator requires a causal post-heal chain:

1. `new_leader`
2. matching `proposal`
3. at least quorum accepted votes
4. matching `quorum_certificate`
5. matching `commit`

Self-certifying `safety_check` or `liveness_check` records are not trusted by
the validators; they are explanatory evidence only.

## Trace Schema

The BFT scenario emits structured evidence records:

- `protocol_config`
- `partition_active`
- `proposal`
- `vote`
- `rejected_vote`
- `no_quorum`
- `quorum_certificate`
- `rejected_qc`
- `view_change`
- `new_leader`
- `network_healed`
- `byzantine_equivocation_attempt`
- `commit`
- `safety_check`
- `liveness_check`

Each commit embeds its QC so a reviewer can answer: which leader proposed the
value, which validators accepted it, whether the QC matches the commit, and
whether the commit occurred after a reachable quorum was possible.

## Validator Strategy

The BFT validators replay evidence instead of trusting success flags. They
normalize structured `kind: "evidence"` records and older wire-message traces
where possible, then rebuild the proof state:

- validators and Byzantine/honest membership;
- proposals and view changes;
- accepted and rejected votes;
- quorum certificates;
- commits;
- partition and heal markers.

The validator suite rejects:

- conflicting honest commits;
- effective accepted-vote equivocation;
- forged quorum certificates;
- stuck view after heal;
- pre-heal commits that cross a 4/3 partition.

## Adversarial Tests

The test suite includes structured fake traces for:

- 4-of-7 quorum attempts;
- duplicate signers;
- unknown signers;
- QC value mismatch;
- missing accepted votes;
- rejected votes counted as proof;
- self-certified success without votes;
- post-heal commits without causal leader/proposal/QC evidence;
- cross-partition pre-heal commits.

The registered `coordination/hotstuff` plugin path is also tested directly:
4 votes out of 7 do not resolve, 5 unique votes form QC metadata, duplicate
votes do not inflate quorum, and commit refuses outcomes without a valid QC.
