# Hackathon Regression Matrix

This file records the red/green checks used to prove that the recent Q7-Q9
hardening tests are real regressions rather than decorative coverage.

## Principle

Not every test in the repository should fail without a given fix. Baseline
conformance, old invariants, and scenario smoke tests often should remain green.
The bar for each new fix is narrower and stronger:

- each new security/API regression check fails against the code immediately
  before that fix;
- the same check passes at the fixed commit;
- adversarial invariant tests that were already true are kept as coverage, but
  are not counted as red/green regression gates.

## Q7: Multi-Attribute Negotiation

Fix commit: `efb1ac8 Harden multi-attribute negotiation for Q7`

Regression gate:

```bash
tmp=/tmp/nandatown-q7-pre-audit
rm -rf "$tmp"
mkdir -p "$tmp"
git archive efb1ac8^ | tar -x -C "$tmp"
git diff efb1ac8^ efb1ac8 -- \
  packages/nest-plugins-reference/tests/test_multi_attribute_market.py |
  (cd "$tmp" && git apply -)
cd "$tmp"
PYTHONPATH="$tmp/packages/nest-core:$tmp/packages/nest-plugins-reference" \
  /Users/siddharthkhanna/nest-test/nandatown/Nanda.venv/bin/python -m pytest \
  packages/nest-plugins-reference/tests/test_multi_attribute_market.py \
  -q -k 'registry_and_package_export'
```

Expected pre-fix result: fail, because
`nest_plugins_reference.negotiation.ParetoNegotiation` was not exported from the
package.

Current fixed result:

```bash
Nanda.venv/bin/python -m pytest \
  packages/nest-plugins-reference/tests/test_pareto_negotiation.py \
  packages/nest-plugins-reference/tests/test_multi_attribute_market.py \
  -q
```

Result: `21 passed`.

Note: `test_pareto_validator_rejects_fake_agreement_without_utility_evidence`
is an invariant guard. It was already true before `efb1ac8`, and it remains in
the suite because validators must continue to reject vacuous fake agreements.

## Q8: Content-Addressed DataFacts

Fix commit: `10d3dd0 Harden content-addressed DataFacts for Q8`

Regression gates:

```bash
tmp=/tmp/nandatown-q8-pre-audit
rm -rf "$tmp"
mkdir -p "$tmp"
git archive 10d3dd0^ | tar -x -C "$tmp"
git diff 10d3dd0^ 10d3dd0 -- \
  packages/nest-plugins-reference/tests/test_cid_facts.py |
  (cd "$tmp" && git apply -)
cd "$tmp"
PYTHONPATH="$tmp/packages/nest-core:$tmp/packages/nest-plugins-reference" \
  /Users/siddharthkhanna/nest-test/nandatown/Nanda.venv/bin/python -m pytest \
  packages/nest-plugins-reference/tests/test_cid_facts.py \
  -q -k 'proof_url_must_match or package_export_resolves'
```

Expected pre-fix result: two failures.

- A freshness proof whose internal `url` did not match the lookup URL was
  accepted.
- `nest_plugins_reference.datafacts.CidFacts` was not exported from the package.

Current fixed result:

```bash
Nanda.venv/bin/python -m pytest \
  packages/nest-plugins-reference/tests/test_cid_facts.py \
  packages/nest-core/tests/test_provenance_supply_chain.py \
  -q
```

Result: `46 passed`.

## Q9: Hybrid Privacy

Fix commit: `af9e6ea Harden hybrid privacy proofs for Q9`

Regression gates:

```bash
tmp=/tmp/nandatown-q9-pre-audit
rm -rf "$tmp"
mkdir -p "$tmp"
git archive af9e6ea^ | tar -x -C "$tmp"
git diff af9e6ea^ af9e6ea -- \
  packages/nest-plugins-reference/tests/test_hybrid_x25519.py |
  (cd "$tmp" && git apply -)
cd "$tmp"
PYTHONPATH="$tmp/packages/nest-core:$tmp/packages/nest-plugins-reference" \
  /Users/siddharthkhanna/nest-test/nandatown/Nanda.venv/bin/python -m pytest \
  packages/nest-plugins-reference/tests/test_hybrid_x25519.py \
  -q -k 'proof_statement_must_match or package_export_resolves'
```

Expected pre-fix result: two failures.

- A selective-disclosure proof could verify against a different `Statement`
  object with compatible root/reveal inputs.
- `nest_plugins_reference.privacy.HybridX25519Privacy` was not exported from
  the package.

Current fixed result:

```bash
Nanda.venv/bin/python -m pytest \
  packages/nest-plugins-reference/tests/test_hybrid_x25519.py \
  packages/nest-plugins-reference/tests/test_hybrid_x25519_properties.py \
  packages/nest-plugins-reference/tests/test_hybrid_x25519_scenario.py \
  -q
```

Result: `35 passed`.

## Whole-Repo Guard

After Q9 and documentation polish, the full test suite passed:

```bash
Nanda.venv/bin/python -m pytest -q
```

Result: `861 passed, 1 skipped, 1 deselected, 1 warning`.

Whitespace passed with `git diff --check`.
