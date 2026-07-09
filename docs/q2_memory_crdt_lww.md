# Q2: Conflict-Free Shared Memory

## Problem

Q2 asks for a memory plugin that remains correct under concurrent writers.
The default `blackboard` plugin is order-dependent: two replicas that receive
the same writes in different orders can finish with different values.

## Approach

`lww_register` implements a state-based LWW-Register CvRDT. Each local write is
tagged with `(lamport, node, payload)` and serialized as grep-able JSON. Replicas
exchange state with `export` / `merge` or `export_all` / `merge_all`; merge picks
the maximum tag, making it commutative, associative, and idempotent.

The plugin is registered as `("memory", "lww_register")` and still satisfies the
base `Memory` protocol: `read`, `write`, `cas`, and `subscribe`.

## Invariants

- Merge is deterministic and order-independent.
- Duplicate delivery is idempotent.
- Every accepted state is a valid `lww_register` record.
- Lamport clocks are non-negative and advance after observing remote state.
- Scenario validators reconstruct convergence from final CRDT records, not from
  a claimed success flag.

## Adversarial Cases

Tests reject:

- `blackboard` under interleaved delivery orders.
- fake `final:{"success": true}` trace records.
- malformed JSON and wrong CRDT kind.
- invalid base64 payloads.
- negative Lamport timestamps.
- empty or non-string node identifiers.

## How To Run

```bash
python -m pytest packages/nest-plugins-reference/tests/test_lww_register.py -q
```

To rerun the Q10 guard suite after shared-validator changes:

```bash
python -m pytest \
  packages/nest-core/tests/test_bft_hotstuff_scenario.py \
  packages/nest-core/tests/test_failures.py \
  packages/nest-plugins-reference/tests/test_hotstuff_plugin.py \
  packages/nest-plugins-reference/tests/test_hotstuff_properties.py \
  -q
```

## Verification

Verified locally in `Nanda.venv`:

```bash
Nanda.venv/bin/python -m pytest packages/nest-plugins-reference/tests/test_lww_register.py -q
# 39 passed in 2.84s

PYTHONPYCACHEPREFIX=/tmp/nandatown-pycache Nanda.venv/bin/python -m compileall \
  packages/nest-core/nest_core \
  packages/nest-plugins-reference/nest_plugins_reference \
  packages/nest-plugins-reference/tests/test_lww_register.py

git diff --check

Nanda.venv/bin/python -m pytest \
  packages/nest-core/tests/test_bft_hotstuff_scenario.py \
  packages/nest-core/tests/test_failures.py \
  packages/nest-plugins-reference/tests/test_hotstuff_plugin.py \
  packages/nest-plugins-reference/tests/test_hotstuff_properties.py \
  -q
# 68 passed in 136.27s

Nanda.venv/bin/python -m pytest -q
# 828 passed, 1 skipped, 1 deselected, 1 warning in 183.32s
```

`ruff`, `pyright`, and `mypy` were not installed in this virtual environment,
so those optional style/type checks were not run.
