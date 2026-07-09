# Q6: Gossip Registry

## Problem

Q6 asks for a registry that behaves like distributed service discovery instead
of a single shared dictionary. The default `in_memory` registry leaks discovery
across simulator network partitions because every agent reads the same map.

## Approach

`registry:gossip` gives every agent its own `GossipRegistry` instance. Agents
write to their local view, then exchange version digests and missing cards over
the existing transport layer. Simulator partitions therefore block gossip using
the same drop logic as normal messages. `scenarios/gossip_registry.yaml` runs 20
partitioned peers plus one bridge that mediates convergence.

## Invariants

- `lookup()` returns only the caller's local view.
- Cross-partition agents cannot exchange gossip directly.
- A bridge outside the partition groups can mediate eventual convergence.
- Card updates are ordered by `(version, publisher_id)`.
- Tombstones propagate and stale writes cannot resurrect old cards.
- Gossip payloads must be well-formed and publisher-authentic: one publisher
  cannot overwrite another agent's card.

## Adversarial Cases

Tests and validators reject:

- `in_memory` views that leak cards across a partition.
- divergent views after bounded gossip rounds.
- malformed gossip payloads.
- forged pushes where `publisher != card.agent_id`.
- negative-version pushes.
- bridge-less partitions that appear to converge through hidden shared state.

## How To Run

```bash
Nanda.venv/bin/python -m pytest \
  packages/nest-plugins-reference/tests/test_gossip_registry.py \
  packages/nest-plugins-reference/tests/test_gossip_validators_and_scenario.py \
  -q
```

## Verification

Verified locally in `Nanda.venv`:

```bash
Nanda.venv/bin/python -m pytest \
  packages/nest-plugins-reference/tests/test_gossip_registry.py \
  packages/nest-plugins-reference/tests/test_gossip_validators_and_scenario.py \
  -q
# 38 passed in 3.64s

PYTHONPYCACHEPREFIX=/tmp/nandatown-pycache Nanda.venv/bin/python -m compileall \
  packages/nest-core/nest_core \
  packages/nest-plugins-reference/nest_plugins_reference \
  packages/nest-plugins-reference/tests/test_gossip_registry.py \
  packages/nest-plugins-reference/tests/test_gossip_validators_and_scenario.py

git diff --check

Nanda.venv/bin/python -m pytest -q
# 835 passed, 1 skipped, 1 deselected, 1 warning in 197.97s
```

`ruff`, `pyright`, and `mypy` were not installed in this virtual environment,
so those optional style/type checks were not run.
