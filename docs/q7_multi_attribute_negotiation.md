# Q7: Multi-Attribute Negotiation

## Problem

Q7 asks for a negotiation plugin that reasons over multiple `Terms`
attributes instead of accepting or rejecting on price alone. The target scenario
is a bilateral market where each buyer-seller pair negotiates over price and
delivery deadline, and an offline validator must reject agreements that are
Pareto-dominated by another bundle exchanged in the same session.

## Approach

The `pareto` plugin implements additive multi-attribute utility over price and
deadline. Private utility weights, feasible ranges, side, patience, reservation
utility, and round horizon are constructor parameters, preserving the existing
`Negotiation` protocol methods.

`scenarios/multi_attribute_market.yaml` runs 10 deterministic buyer-seller
pairs. The scenario writes trace evidence for utility parameters, every offered
bundle, agreements, and breakdowns. The validator reconstructs both parties'
utilities from this evidence instead of trusting success flags.

## Invariants

- Every scored agreement must be non-dominated by any other exchanged bundle in
  that session.
- Every scored agreement must meet both parties' reservation utility.
- Sessions with no agreement may break down without failing Pareto optimality.
- A trace with an agreement but no reconstructable utility evidence fails
  rather than passing vacuously.
- The plugin is registered as `("negotiation", "pareto")` and as the
  `nest.plugins.negotiation` entry point `pareto`.

## Adversarial Cases

The tests reject dominated agreements, sub-reservation agreements, fake
agreements missing utility evidence, and the deadline-blind
`alternating_offers` baseline when used in the multi-attribute scenario.

## How To Run

```bash
Nanda.venv/bin/python -m pytest \
  packages/nest-plugins-reference/tests/test_pareto_negotiation.py \
  packages/nest-plugins-reference/tests/test_multi_attribute_market.py \
  -q
```

Static compile:

```bash
PYTHONPYCACHEPREFIX=/tmp/nandatown-pycache Nanda.venv/bin/python -m compileall \
  packages/nest-core/nest_core \
  packages/nest-plugins-reference/nest_plugins_reference
```

## Verification

Focused Q7 tests and static checks should be run before submission. If shared
validator or runner code changes, rerun the Q10 HotStuff guard suite as well.
