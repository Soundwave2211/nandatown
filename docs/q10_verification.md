# Q10 Verification

## Checks Run In This Workspace

Recent verification in this checkout used the existing project virtual
environment at `Nanda.venv`.

These checks were run successfully:

```bash
PYTHONPYCACHEPREFIX=/tmp/nandatown-pycache Nanda.venv/bin/python -m compileall \
  packages/nest-core/nest_core \
  packages/nest-plugins-reference/nest_plugins_reference

git diff --check
```

The focused Q10 suite passed:

```bash
Nanda.venv/bin/python -m pytest \
  packages/nest-core/tests/test_bft_hotstuff_scenario.py \
  packages/nest-core/tests/test_failures.py \
  packages/nest-plugins-reference/tests/test_hotstuff_plugin.py \
  packages/nest-plugins-reference/tests/test_hotstuff_properties.py \
  -q
```

Recent result: `68 passed`.

The full pytest suite also passed:

```bash
Nanda.venv/bin/python -m pytest -q
```

Recent result: `861 passed, 1 skipped, 1 deselected, 1 warning`.

## Dependency-Required Checks

`ruff`, `pyright`, and `mypy` were not installed in `Nanda.venv` during this
local pass. Before opening a PR, also run the repository's full required
style/type gate in an environment with the dev dependencies installed:

```bash
uv sync
uv run ruff check .
uv run ruff format --check .
uv run pyright
uv run mypy .
```
