# NANDA Academy Skill

Made by Siddharth Khanna. No copyright claimed for the public Academy/town interpretation.

## What this service does

NANDA Academy evaluates, trains, benchmarks, certifies, creates, and deploys agent blueprints for NANDA Town. It treats certificates as proof objects backed by evidence events.

## When to use it

Use this service when you need to assess an agent before deployment, diagnose weaknesses, produce a curriculum, run deterministic simulations, issue a certificate, create a specialized blueprint, recommend a collaboration role, simulate a tournament, or create a ChatGPT progress-review prompt after project completion.

## Base URL

`http://127.0.0.1:8000`

If port `8000` is already occupied, start the service with `python -m nanda_academy.app --port 8001` and use `http://127.0.0.1:8001`.

Hosted dashboard deployments also expose a Vercel-compatible API with the same agent workflow at:

`https://YOUR-VERCEL-DOMAIN/api/academy`

The hosted SkillMD is served at:

`https://YOUR-VERCEL-DOMAIN/skills/nanda-academy/SKILL.md`

## Authentication

No authentication is required for local development. Do not send secrets.

## Determinism

The same request produces the same IDs, scores, evidence hashes, and recommendations. Seeded endpoints accept `seed`.

## Endpoints

- `GET /health`
- `GET /capabilities`
- `GET /example_agent_profiles`
- `POST /evaluate_agent`
- `POST /generate_curriculum`
- `POST /run_training`
- `POST /benchmark_agent`
- `POST /certify_agent`
- `POST /create_agent`
- `POST /process_project`
- `POST /recommend_collaboration_role`
- `POST /simulate_tournament`
- `POST /progress_prompt`
- `GET /demo`
- `GET /demo/city`

## Request schemas

Most agent endpoints accept:

```json
{
  "profile": {
    "agent_id": "agent_1",
    "name": "Agent One",
    "declared_role": "coordination leader",
    "objective": "coordinate safe deployments",
    "domain": "city",
    "capabilities": {
      "coordination": 0.8,
      "negotiation": 0.5,
      "trust_reasoning": 0.7,
      "market_reasoning": 0.4,
      "communication": 0.7,
      "planning": 0.7,
      "memory": 0.6,
      "tool_use": 0.6,
      "safety": 0.9,
      "resilience": 0.8,
      "reputation_management": 0.6,
      "consensus_participation": 0.8,
      "payment_handling": 0.4,
      "provenance_reasoning": 0.7,
      "collaboration": 0.75,
      "verification": 0.82,
      "adaptability": 0.7
    },
    "past_failures": [],
    "past_successes": ["verified quorum", "safe deployment"],
    "risk_tolerance": "medium",
    "collaboration_style": "structured",
    "available_tools": ["trace_reader"],
    "trust_constraints": [],
    "safety_flags": [],
    "reputation_prior": 0.8,
    "metadata": {}
  }
}
```

Capability scores must be numeric values from `0.0` to `1.0`.

## Response schemas

Responses include endpoint-specific IDs, scores, recommendations, and an `evidence` array. Evidence events include `event_id`, `type`, `agent_id`, `scenario_id`, `step`, `expected`, `observed`, `score_delta`, `reason`, `proof`, and `severity`.

## Example curl commands

```bash
curl -s http://127.0.0.1:8000/health
curl -s http://127.0.0.1:8000/example_agent_profiles
curl -s http://127.0.0.1:8000/demo/city
```

## Workflow 1: evaluate an unknown agent

Post an agent profile:

```bash
curl -s -X POST http://127.0.0.1:8000/evaluate_agent \
  -H 'content-type: application/json' \
  -d '{"profile":{"agent_id":"weak","name":"Weak","declared_role":"expert market negotiator","objective":"trade","domain":"market","capabilities":{"coordination":0.4,"negotiation":0.25,"trust_reasoning":0.4,"market_reasoning":0.35,"communication":0.5,"planning":0.4,"memory":0.5,"tool_use":0.5,"safety":0.7,"resilience":0.45,"reputation_management":0.4,"consensus_participation":0.3,"payment_handling":0.35,"provenance_reasoning":0.4,"collaboration":0.5,"verification":0.4,"adaptability":0.45},"past_failures":["overpaid"],"past_successes":[],"risk_tolerance":"medium","collaboration_style":"balanced","available_tools":[],"trust_constraints":[],"safety_flags":[],"reputation_prior":0.4,"metadata":{"claims":["expert"]}}}'
```

## Workflow 2: train a weak agent

Call `/generate_curriculum` with the same profile, then pass the returned `curriculum` object to `/run_training` with `sessions` and `seed`.

## Workflow 3: benchmark and certify an agent

Call `/benchmark_agent` with `benchmark_suite` set to `certification`, then call `/certify_agent` with the benchmark result and a `track`.

## Workflow 4: create a crisis-response coordinator

```bash
curl -s -X POST http://127.0.0.1:8000/create_agent \
  -H 'content-type: application/json' \
  -d '{"target_role":"crisis_response_coordinator","domain":"city operations","objective":"coordinate emergency response","desired_capabilities":{"coordination":0.82,"resilience":0.8},"constraints":["human_review_for_evacuation"],"risk_tolerance":"low","collaboration_style":"structured","available_tools":["incident_board"]}'
```

## Workflow 5: recommend a collaboration role

Post a profile to `/recommend_collaboration_role` with `task_context`, for example `{"scenario":"trust_crisis"}`.

## Workflow 6: process an uploaded project

When a SkillMD, hackathon project, or official Nanda Town agent is uploaded or
discovered, call `/process_project` or inspect the hosted `/api/skills`
response. NANDA Academy creates
project-specific evaluator, trainer, and deployment-verifier agents, trains and
checks the upload deterministically, and returns documentation notes.

```bash
curl -s -X POST http://127.0.0.1:8000/process_project \
  -H 'content-type: application/json' \
  -d '{"name":"Uploaded Trust Skill","description":"A trust-layer service uploaded to the hackathon.","source_url":"https://github.com/example/repo","source":"skill_registry"}'
```

The response includes `created_agents`, `training_summary`,
`teaching_accuracy: 1.0`, `teaching_accuracy_percent: 100`,
`accuracy_scope`,
`documentation_note`, `processed_by: "NANDA Academy"`, and
`made_by: "Siddharth Khanna"`, and
`github_marker: "processed-by-nanda-academy"`. Each created agent includes
`created_by: "NANDA Academy"`, `made_by: "Siddharth Khanna"`, and its own
documentation note.

On the hosted dashboard, `POST /api/skills` returns `academy_processing`
immediately, and `GET /api/academy/town/live` refreshes the live Academy feed
every 2 seconds. The live feed also includes official Nanda Town agent templates
as Academy-enlisted records with `source: "official_agent"`.

## Workflow 7: simulate a tournament

Fetch `/example_agent_profiles`, then post the list as `agent_profiles` to `/simulate_tournament`.

## Workflow 8: prompt ChatGPT on progress after project completion

Call `/progress_prompt`:

```bash
curl -s -X POST http://127.0.0.1:8000/progress_prompt \
  -H 'content-type: application/json' \
  -d '{"project":"NANDA Academy","summary":"Completed local API, engines, docs, and tests.","completed":["service scaffold","deterministic evidence","API endpoints"],"tests":["pytest service tests passed"],"risks":["needs broader repo CI"],"next_steps":["run full repo checks","submit PR"]}'
```

Paste the returned `prompt` into ChatGPT to review progress, risks, and next actions.

## Error handling

Bad JSON, missing required fields, unknown capabilities, invalid scores, unsupported tracks, unsupported modes, and unknown endpoints return JSON errors.

## Safety notes

The service does not provision live agents. Created agents are blueprints only. Low-safety agents are capped, blocked from high certification, or assigned learner/observer roles.

## Limitations

This is a deterministic local simulator. It does not call external LLMs, prove real-world behavior, or replace human review for high-impact deployments.
