# Nanda Town documentation

This folder is the long-form companion to the top-level
[README](../README.md). The README is the elevator pitch; these pages
go deeper.

## Start here

- **[quickstart.md](quickstart.md)** — Install, run a scenario,
  validate the trace. Five minutes, no clone required.
- **[concepts.md](concepts.md)** — The 12 layers, fidelity tiers,
  scenarios, plugins, traces, determinism.

## Build something

- **[writing-a-plugin.md](writing-a-plugin.md)** — End-to-end
  walkthrough: implement a `Payments` plugin, register it, swap it
  into a scenario, compare against the baseline.
- **[writing-a-scenario.md](writing-a-scenario.md)** — Full YAML
  schema with every field annotated, plus failure-injection knobs
  and a worked stress-test example.

## Layer reference

Each page lists the `Protocol` signature, the built-in default, and
where to look for inspiration.

| Layer | Page | Default plugin |
|---|---|---|
| Transport | [transport.md](layers/transport.md) | `in_memory` |
| Communication | [communication.md](layers/communication.md) | `nest_native` |
| Identity | [identity.md](layers/identity.md) | `did_key` |
| Registry | [registry.md](layers/registry.md) | `in_memory` |
| Auth | [auth.md](layers/auth.md) | `jwt` |
| Trust | [trust.md](layers/trust.md) | `score_average` |
| Payments | [payments.md](layers/payments.md) | `prepaid_credits` |
| Coordination | [coordination.md](layers/coordination.md) | `contract_net` |
| Negotiation | [negotiation.md](layers/negotiation.md) | `alternating_offers` |
| Memory | [memory.md](layers/memory.md) | `blackboard` |
| Privacy | [privacy.md](layers/privacy.md) | `noop` |
| Data Facts | [datafacts.md](layers/datafacts.md) | `datafacts_v1` |

## Going further

- **[CONTRIBUTING.md](../CONTRIBUTING.md)** — Development setup
  (`uv sync`), code style, how to add a *built-in* scenario, CI
  checks.
- **[examples/](../examples/)** — Stub starting points for common
  plugin shapes.

## Hackathon implementation notes

- **[hackathon_regression_matrix.md](hackathon_regression_matrix.md)** — Red/green proof that recent regression tests fail before their fixes and pass after.
- **[q2_memory_crdt_lww.md](q2_memory_crdt_lww.md)** — LWW-register CRDT memory.
- **[q4_auth_capability_delegation.md](q4_auth_capability_delegation.md)** — Delegatable capability-chain auth.
- **[q5_identity_rotation.md](q5_identity_rotation.md)** — Ed25519 identity rotation.
- **[q6_registry_gossip.md](q6_registry_gossip.md)** — Gossip registry eventual consistency.
- **[q7_multi_attribute_negotiation.md](q7_multi_attribute_negotiation.md)** — Pareto-aware multi-attribute negotiation.
- **[q8_content_addressed_datafacts.md](q8_content_addressed_datafacts.md)** — Content-addressed DataFacts provenance.
- **[q9_hybrid_privacy.md](q9_hybrid_privacy.md)** — Hybrid encryption and selective disclosure.
- **[q10_bft_hotstuff_proof.md](q10_bft_hotstuff_proof.md)** and **[q10_verification.md](q10_verification.md)** — Proof-carrying HotStuff BFT.
