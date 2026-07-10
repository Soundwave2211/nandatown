import type { NextRequest } from "next/server";
import {
  benchmarkAgent,
  capabilities,
  certifyAgent,
  createAgent,
  evaluateAgent,
  exampleAgentProfiles,
  generateCurriculum,
  officialAgentTemplates,
  progressPrompt,
  projectAgentsFromSkills,
  recommendCollaborationRole,
  runTraining,
  simulateTournament,
} from "@/lib/academy-service";
import { listSkills } from "@/lib/skills";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ academy?: string[] }> | { academy?: string[] };
};

async function pathFrom(context: RouteContext) {
  const params = await context.params;
  return `/${(params.academy ?? []).join("/")}`;
}

function json(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const path = await pathFrom(context);
  if (path === "/health") {
    return json({ status: "ok", service: "NANDA Academy", hosted: true });
  }
  if (path === "/capabilities") {
    return json(capabilities());
  }
  if (path === "/example_agent_profiles") {
    return json({ agent_profiles: exampleAgentProfiles() });
  }
  if (path === "/town/live") {
    return json(await liveTownSnapshot());
  }
  return json({ error: `unknown endpoint: ${path}` }, { status: 404 });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const path = await pathFrom(context);
  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "Send a JSON object body." }, { status: 400 });
  }

  const routes: Record<string, (body: Record<string, unknown>) => unknown> = {
    "/evaluate_agent": evaluateAgent,
    "/generate_curriculum": generateCurriculum,
    "/run_training": runTraining,
    "/benchmark_agent": benchmarkAgent,
    "/certify_agent": certifyAgent,
    "/create_agent": createAgent,
    "/recommend_collaboration_role": recommendCollaborationRole,
    "/simulate_tournament": simulateTournament,
    "/progress_prompt": progressPrompt,
  };

  const handler = routes[path];
  if (!handler) {
    return json({ error: `unknown endpoint: ${path}` }, { status: 404 });
  }

  try {
    return json(handler(payload));
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "request failed" }, { status: 400 });
  }
}

async function liveTownSnapshot() {
  let projects = projectAgentsFromSkills([]);
  let source = "seeded";
  try {
    const skills = await listSkills();
    projects = projectAgentsFromSkills(skills);
    source = "skills_registry";
    if (projects.length === 0) {
      projects = seededProjects();
      source = "seeded";
    }
  } catch {
    projects = seededProjects();
  }

  return {
    service: "NANDA Academy",
    source,
    generated_at: new Date().toISOString(),
    official_agents: officialAgentTemplates,
    project_count: projects.length,
    projects,
    event: projects.length
      ? `${projects[0].assigned_agent} is ${projects[0].academy_status} ${projects[0].name}`
      : "Academy is waiting for submitted NANDA Town projects.",
  };
}

function seededProjects() {
  return [
    {
      project_id: "academy",
      name: "NANDA Academy",
      description: "Proof-driven evaluation, training, benchmarking, and certification for agents.",
      source_url: "/api/academy/capabilities",
      academy_status: "certified",
      assigned_agent: "consensus-leader",
      updated_at: new Date().toISOString(),
    },
    {
      project_id: "town-map",
      name: "Living Town Map",
      description: "Pseudo-3D town view where Academy agents move through buildings in real time.",
      source_url: "/town",
      academy_status: "training",
      assigned_agent: "reputation-observer",
      updated_at: new Date().toISOString(),
    },
  ];
}
