# Q8: Content-Addressed DataFacts

## Problem

Q8 asks for a DataFacts plugin that prevents name-addressed dataset
substitution, stale freshness claims, and provenance washing. The default
`datafacts_v1` returns `df://<name>` URLs and uses wall-clock freshness, so an
attacker can overwrite a name, claim freshness by touching the record, or drop
upstream lineage.

## Approach

`cid_facts` returns `df://sha256-<hex>` URLs derived from canonical dataset
content. The hash excludes display names and timestamps but includes owner,
schema, checksum, access tier, tags, size, description, and metadata. Derived
datasets declare parent URLs in `DatasetMetadata.metadata["parents"]`; publish
rejects any parent hash that has not been seen.

Every successful publish issues a `FreshnessProof` over the content URL and a
logical tick. The proof is signed by the publishing identity layer. Freshness
verification checks the proof URL, owner signer, signature, and logical window,
never wall-clock time.

`provenance_supply_chain.yaml` exercises a diamond DAG:
source -> two refiners -> aggregate -> verifier. The verifier walks the full
parent graph and then runs substitution, forged-freshness, and phantom-parent
attacks.

## Invariants

- Different content cannot resolve to the same URL unless SHA-256 collides.
- Identical content republishes idempotently to the same URL.
- Parent order is normalized for multi-parent joins.
- Unknown provenance parents are rejected at publish time.
- Freshness proofs must name the verified URL and be signed by the dataset
  owner.
- Private datasets grant read access only to their owner.

## Adversarial Cases

Tests and validators reject substituted content under an old name, forged
freshness signed by an outsider, stale proofs, proof URL mismatch, missing
provenance parents, broken chain walks, and `datafacts_v1` in the adversarial
scenario.

## How To Run

```bash
Nanda.venv/bin/python -m pytest \
  packages/nest-plugins-reference/tests/test_cid_facts.py \
  packages/nest-core/tests/test_provenance_supply_chain.py \
  -q
```

Static compile:

```bash
PYTHONPYCACHEPREFIX=/tmp/nandatown-pycache Nanda.venv/bin/python -m compileall \
  packages/nest-core/nest_core \
  packages/nest-plugins-reference/nest_plugins_reference
```

## Verification

Focused Q8 tests passed locally: `46 passed`.

The two Q8 regression checks added in this pass were also run against the
pre-edit code and failed as expected: proof URL mismatch was accepted and the
package export was missing.

Static compile passed:

```bash
PYTHONPYCACHEPREFIX=/tmp/nandatown-pycache Nanda.venv/bin/python -m compileall \
  packages/nest-core/nest_core \
  packages/nest-plugins-reference/nest_plugins_reference
```

Whitespace passed with `git diff --check`.

The full suite passed after Q8: `859 passed, 1 skipped, 1 deselected, 1 warning`.

Optional `ruff`, `pyright`, and `mypy` were not installed in `Nanda.venv`.
