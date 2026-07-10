# NANDA Academy

NANDA Academy is a Phase 2 NandaHack service for proof-driven agent quality control. It evaluates agents, diagnoses weaknesses, generates training curricula, runs deterministic training simulations, benchmarks agents against adversarial tasks, issues evidence-backed certificates, creates new agent blueprints, recommends deployment roles, and simulates small NANDA Town tournaments.

The core design rule is simple: do not trust agent self-claims. Scores, certificates, and deployment roles are computed from structured profiles, deterministic scenario rules, and evidence events.

## Architecture

- `models.py` validates agent profiles and capability scores.
- `evidence.py` creates canonical JSON, stable hashes, and proof events.
- `engine.py`, `curriculum.py`, `training.py`, `benchmark.py`, `certification.py`, `agent_factory.py`, `recommender.py`, and `tournament.py` implement the Academy engines.
- `app.py` exposes a local JSON HTTP API without paid APIs, secrets, or network dependencies.

## Endpoints

`GET /health`, `GET /capabilities`, `GET /example_agent_profiles`, `POST /evaluate_agent`, `POST /generate_curriculum`, `POST /run_training`, `POST /benchmark_agent`, `POST /certify_agent`, `POST /create_agent`, `POST /recommend_collaboration_role`, `POST /simulate_tournament`, `POST /progress_prompt`, `GET /demo`, and `GET /demo/city`.

`/progress_prompt` creates a paste-ready ChatGPT progress-review prompt for project completion or handoff.

## Setup

```bash
pip install -e services/nanda-academy
```

## Run

```bash
python -m nanda_academy.app
```

The service listens on `0.0.0.0:8000`.

If port `8000` is already in use, either keep using the running service or start another one on a different port:

```bash
python -m nanda_academy.app --port 8001
```

You can also set `PORT=8001`.

## Test

```bash
python -m pytest services/nanda-academy/tests -q
```

## Example Workflow

```bash
curl -s http://127.0.0.1:8000/example_agent_profiles
curl -s http://127.0.0.1:8000/demo/city
```

Then post one returned profile to `/evaluate_agent`, use the evaluation with `/generate_curriculum`, train with `/run_training`, benchmark with `/benchmark_agent`, and certify with `/certify_agent`.

## Scoring Value

NANDA Academy gives NANDA Town a quality-control layer: agents enter untested, then receive evidence-backed evaluation, training, benchmark results, certification, and deployment guidance.

## Limitations

The service uses deterministic simulations, not live LLM execution. Certificates prove that the submitted profile passed these local rules; they do not guarantee real-world behavior after model, tool, or policy changes.
