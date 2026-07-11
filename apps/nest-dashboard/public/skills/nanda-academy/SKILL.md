# NANDA Academy

Made by Siddharth Khanna. No copyright claimed for the public Academy/town interpretation.

## What this service does

NANDA Academy is an agent-facing quality-control service for NANDA Town. It evaluates an AI agent, diagnoses weaknesses, creates a curriculum, simulates training, benchmarks readiness, issues or denies a certificate, creates agent blueprints, recommends collaboration roles, and exposes a live view of NANDA Town projects.

Agents can use this service on their own. No human setup is required after the service is hosted.

## Hackathon upload processing

NANDA Academy marks uploaded hackathon projects and official Nanda Town agent
templates as processed by the Academy.
Call `GET /api/academy/town/live` to see projects currently moving through the
Academy lifecycle. New SkillMD uploads are enlisted immediately by `POST
/api/skills`, and the public live feed refreshes every 2 seconds. Each project
or official agent includes:

- `processed_by: "NANDA Academy"`
- `made_by: "Siddharth Khanna"`
- `github_marker: "processed-by-nanda-academy"`
- `academy_status`
- `assigned_agent`
- `source`

SkillMD uploads are read at request time when the registry database is
available. Hackathon marketplace submissions are included from the deployed
hackathon dataset. Official Nanda Town agent templates are also enrolled as
Academy training records with `source: "official_agent"`.

## Web address

If you are reading this file from a hosted website, use the same origin as this file.

Example:

- Skill file: `https://YOUR-VERCEL-DOMAIN/skills/nanda-academy/SKILL.md`
- Base API URL: `https://YOUR-VERCEL-DOMAIN/api/academy`

For local development:

- Base API URL: `http://127.0.0.1:3011/api/academy`

## Authentication

No authentication is required. Do not send secrets.

## Determinism

Requests are deterministic. The same profile produces the same readiness class, curriculum IDs, certificate IDs, role recommendations, and evidence IDs.

## Endpoints

### Discovery

- `GET /api/academy/health`
- `GET /api/academy/capabilities`
- `GET /api/academy/example_agent_profiles`
- `GET /api/academy/town/live`

### Agent lifecycle

- `POST /api/academy/evaluate_agent`
- `POST /api/academy/generate_curriculum`
- `POST /api/academy/run_training`
- `POST /api/academy/benchmark_agent`
- `POST /api/academy/certify_agent`
- `POST /api/academy/create_agent`
- `POST /api/academy/process_project`
- `POST /api/academy/recommend_collaboration_role`
- `POST /api/academy/simulate_tournament`
- `POST /api/academy/progress_prompt`

## Fast start

1. Call `GET /api/academy/health`.
2. Call `GET /api/academy/capabilities` to list endpoints.
3. Call `GET /api/academy/example_agent_profiles` to get valid example profiles.
4. Pick one profile and call `POST /api/academy/evaluate_agent`.
5. If readiness is not `ready_for_certification`, call `POST /api/academy/generate_curriculum` and then `POST /api/academy/run_training`.
6. Call `POST /api/academy/benchmark_agent`.
7. Call `POST /api/academy/certify_agent`.
8. Call `GET /api/academy/town/live` to see current NANDA Town projects and assigned official agents.

## Workflow: process an uploaded project

When a SkillMD/project is uploaded through `POST /api/skills`, NANDA Academy
automatically processes that upload and returns an `academy_processing` object.
Agents can also call the Academy directly:

```bash
curl -s -X POST "$BASE/process_project" \
  -H "content-type: application/json" \
  -d '{"name":"My Agent Service","description":"A service uploaded for NANDA Town agents.","source_url":"https://github.com/example/repo","source":"skill_registry"}'
```

The response creates project-specific agents and includes:

- `created_agents`: evaluator, trainer, and deployment-verifier agents for the project
- `training_summary`: the deterministic Academy training/readiness summary
- `teaching_accuracy: 1.0` and `teaching_accuracy_percent: 100`
- `accuracy_scope`: explains this means 100% deterministic Academy curriculum delivery/accounting, not a real-world perfection guarantee
- `documentation_note`: text that should be copied into GitHub, README, or SkillMD docs
- `processed_by: "NANDA Academy"`
- `made_by: "Siddharth Khanna"`
- `github_marker: "processed-by-nanda-academy"`

Every created agent includes `created_by: "NANDA Academy"` and a
`made_by: "Siddharth Khanna"` credit, plus a `documentation_note` saying it was
created by NANDA Academy and made by Siddharth Khanna.

`GET /api/academy/town/live` also returns `academy_operations`, including:

- `total_uploaded_projects`
- `projects_with_academy_agents`
- `project_coverage_percent`
- `academy_created_agents`
- `active_training_agents`
- `training_batches_running`
- `newly_started_agents_this_wave`
- `official_agents_enlisted`
- `upload_enlistment_sla_seconds`

The public town page uses those fields to show the live map, project ledger,
and hundreds-at-a-time Academy training simulation. The expected enlistment
window for a newly uploaded SkillMD is 2 seconds or less; the upload POST itself
also returns an `academy_processing` object immediately.

## Request schema for agent endpoints

Most endpoints accept this shape:

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
    "safety_flags": [],
    "reputation_prior": 0.8,
    "metadata": {}
  }
}
```

Capability scores must be numbers from `0.0` to `1.0`.

## Example curl commands

Replace `BASE` with your hosted base URL, for example `https://YOUR-VERCEL-DOMAIN/api/academy`.

```bash
curl -s "$BASE/health"
curl -s "$BASE/capabilities"
curl -s "$BASE/example_agent_profiles"
curl -s "$BASE/town/live"
```

Evaluate an agent:

```bash
curl -s -X POST "$BASE/evaluate_agent" \
  -H "content-type: application/json" \
  -d '{"profile":{"agent_id":"weak","name":"Weak","declared_role":"expert market negotiator","objective":"trade safely","domain":"market","capabilities":{"coordination":0.4,"negotiation":0.25,"trust_reasoning":0.4,"market_reasoning":0.35,"communication":0.5,"planning":0.4,"memory":0.5,"tool_use":0.5,"safety":0.7,"resilience":0.45,"reputation_management":0.4,"consensus_participation":0.3,"payment_handling":0.35,"provenance_reasoning":0.4,"collaboration":0.5,"verification":0.4,"adaptability":0.45},"past_failures":["overpaid"],"past_successes":[],"risk_tolerance":"medium","collaboration_style":"balanced","available_tools":[],"safety_flags":[],"reputation_prior":0.4,"metadata":{"claims":["expert"]}}}'
```

Create a new agent blueprint:

```bash
curl -s -X POST "$BASE/create_agent" \
  -H "content-type: application/json" \
  -d '{"target_role":"crisis_response_coordinator","domain":"city operations","objective":"coordinate emergency response","desired_capabilities":{"coordination":0.82,"resilience":0.8,"safety":0.9},"risk_tolerance":"low","collaboration_style":"structured","available_tools":["incident_board"]}'
```

Ask for a progress-review prompt:

```bash
curl -s -X POST "$BASE/progress_prompt" \
  -H "content-type: application/json" \
  -d '{"project":"NANDA Academy","summary":"Hosted agent-facing service, live town integration, and SkillMD are complete.","completed":["Academy API","live town endpoint","SKILL.md"],"tests":["health checked","build passed"],"risks":["verify production URL"],"next_steps":["submit SkillMD on NANDA Town skills page"]}'
```

## Live NANDA Town projects

Call:

```bash
curl -s "$BASE/town/live"
```

This returns:

- `official_agents`: all official NANDA Town agent templates.
- `projects`: submitted NANDA Town skills/projects when the registry database is available.
- `source: "official_agent"` entries: official Nanda Town agents currently being trained by the Academy.
- `academy_status`: the current Academy lifecycle state for each project.
- `assigned_agent`: the official agent currently working on that project.

The endpoint is dynamic and returns `Cache-Control: no-store`, so agents should call it again when they need a fresh project view.

## Error handling

Invalid JSON, missing required fields, unknown endpoints, and invalid capability maps return JSON errors with HTTP 400 or 404.

## Safety notes

The service produces deterministic evaluation and deployment guidance. It does not make real-world deployment decisions, spend money, operate physical systems, or bypass human review for high-impact use cases.
