# Q10 Verification

## Checks Run In This Workspace

The local shell did not have `uv`, so a project-local Python 3.12 virtual
environment was created with `/opt/homebrew/bin/python3.12 -m venv --clear
.venv`. The Q10-focused dependencies plus the editable workspace packages
needed for test collection were installed into `.venv`.

These checks were run successfully:

```bash
PYTHONPYCACHEPREFIX=/tmp/nandatown-pycache .venv/bin/python -m compileall \
  packages/nest-core/nest_core \
  packages/nest-plugins-reference/nest_plugins_reference \
  packages/nest-core/tests/test_bft_hotstuff_scenario.py \
  packages/nest-core/tests/test_failures.py \
  packages/nest-plugins-reference/tests/test_hotstuff_plugin.py

git diff --check
```

A direct validator smoke test was also run with `PYTHONPATH=packages/nest-core`.
It confirmed that a valid structured trace passes and a 4-of-7 forged quorum
fails.

The focused Q10 suite passed:

```bash
.venv/bin/python -m pytest \
  packages/nest-core/tests/test_bft_hotstuff_scenario.py \
  packages/nest-core/tests/test_failures.py \
  packages/nest-plugins-reference/tests/test_hotstuff_plugin.py \
  packages/nest-plugins-reference/tests/test_hotstuff_properties.py \
  -q
```

Result: `68 passed in 152.87s`.

The full pytest suite also passed after installing the local `nest-cli`
compatibility package into the same virtual environment:

```bash
.venv/bin/pip install -e packages/nest-cli
.venv/bin/python -m pytest -q
```

Result: `822 passed, 1 skipped, 1 deselected, 1 warning in 177.30s`.

## Dependency-Required Checks

`uv`, `ruff`, and `pyright` were not available in this local workspace. Before
opening a PR, also run the repository's full required style/type gate:

```bash
uv sync
uv run ruff check .
uv run ruff format --check .
uv run pyright
```
