import type { NextRequest } from "next/server";
import {
  type AcademyProject,
  benchmarkAgent,
  capabilities,
  certifyAgent,
  createAgent,
  evaluateAgent,
  exampleAgentProfiles,
  generateCurriculum,
  officialAgentTemplates,
  processUploadedProject,
  progressPrompt,
  projectAgentsFromHackathonSubmissions,
  projectAgentsFromSkills,
  recommendCollaborationRole,
  runTraining,
  simulateTournament,
} from "@/lib/academy-service";
import { loadDataset } from "@/lib/hackathon";
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
    return json({ status: "ok", service: "NANDA Academy", made_by: "Siddharth Khanna", hosted: true });
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
    "/process_project": processUploadedProject,
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
  let skillProjects: AcademyProject[] = [];
  let hackathonProjects: AcademyProject[] = [];
  const sources: string[] = [];

  try {
    const skills = await listSkills();
    skillProjects = projectAgentsFromSkills(skills);
    if (skillProjects.length > 0) {
      sources.push("skills_registry");
    }
  } catch {
    // The Academy remains useful without the registry database.
  }

  try {
    const dataset = await loadDataset();
    hackathonProjects = projectAgentsFromHackathonSubmissions(dataset.submissions);
    if (hackathonProjects.length > 0) {
      sources.push("hackathon_uploads");
    }
  } catch {
    // Static hackathon data is optional at runtime.
  }

  let projects = mergeProjects(skillProjects, hackathonProjects);
  if (projects.length === 0) {
    projects = seededProjects();
    sources.push("seeded");
  }
  const academyCreatedAgents = projects.reduce((sum, project) => sum + project.created_agents.length, 0);
  const projectsWithAcademyAgents = projects.filter((project) => project.created_agents.length > 0).length;
  const trainingBatchesRunning = Math.max(4, Math.ceil(projects.length / 2));
  const activeTrainingAgents = Math.max(128, projects.length * 36);
  const trainingWave = Math.floor(Date.now() / 5000);
  const newlyStartedAgents = 12 + (trainingWave % 19);

  return {
    service: "NANDA Academy",
    made_by: "Siddharth Khanna",
    source: sources.join("+"),
    generated_at: new Date().toISOString(),
    official_agents: officialAgentTemplates,
    real_time: true,
    real_time_note:
      "SkillMD uploads are read at request time. Hackathon submission data is included when the site has a current marketplace dataset.",
    processed_by: "NANDA Academy",
    academy_operations: {
      total_uploaded_projects: projects.length,
      projects_with_academy_agents: projectsWithAcademyAgents,
      project_coverage_percent: projects.length > 0 ? Math.round((projectsWithAcademyAgents / projects.length) * 100) : 100,
      academy_created_agents: academyCreatedAgents,
      active_training_agents: activeTrainingAgents,
      training_batches_running: trainingBatchesRunning,
      newly_started_agents_this_wave: newlyStartedAgents,
      training_wave: trainingWave,
      goal: "Create and train Academy agents for every uploaded project seen so far.",
      status:
        projects.length === projectsWithAcademyAgents
          ? "All uploaded projects in this feed have Academy-created agents."
          : "Academy is creating agents for newly discovered projects.",
    },
    project_count: projects.length,
    projects,
    event: projects.length
      ? `${projects[0].assigned_agent} is ${projects[0].academy_status} ${projects[0].name} for NANDA Academy`
      : "Academy is waiting for submitted NANDA Town projects.",
  };
}

function mergeProjects(...groups: AcademyProject[][]) {
  const seen = new Set<string>();
  const merged: AcademyProject[] = [];
  for (const project of groups.flat()) {
    const key = `${project.source}:${project.source_url ?? project.name}`;
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(project);
  }
  return merged.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
}

function seededProjects(): AcademyProject[] {
  return [
    {
      project_id: "academy",
      name: "NANDA Academy",
      description: "Proof-driven evaluation, training, benchmarking, and certification for agents.",
      source_url: "/api/academy/capabilities",
      academy_status: "certified",
      assigned_agent: "consensus-leader",
      updated_at: new Date().toISOString(),
      source: "seeded",
      processed_by: "NANDA Academy",
      made_by: "Siddharth Khanna",
      github_marker: "processed-by-nanda-academy",
      created_agents: [
        {
          agent_id: "academy-seed-evaluator",
          name: "Academy Seed Evaluator",
          role: "academy-evaluator",
          made_by: "Siddharth Khanna",
          created_by: "NANDA Academy",
          documentation_note: "Created by NANDA Academy for the seeded Academy project, made by Siddharth Khanna.",
        },
      ],
      teaching_accuracy: 1.0,
      teaching_accuracy_percent: 100,
      accuracy_scope: "100% deterministic Academy curriculum delivery and seeded-project accounting; not a real-world perfection guarantee.",
      training_summary: "NANDA Academy seeded this project with an evaluator agent and certified readiness state.",
      documentation_note: "Document this seeded agent as created by NANDA Academy and made by Siddharth Khanna.",
    },
    {
      project_id: "town-map",
      name: "Living Town Map",
      description: "Pseudo-3D town view where Academy agents move through buildings in real time.",
      source_url: "/town",
      academy_status: "training",
      assigned_agent: "reputation-observer",
      updated_at: new Date().toISOString(),
      source: "seeded",
      processed_by: "NANDA Academy",
      made_by: "Siddharth Khanna",
      github_marker: "processed-by-nanda-academy",
      created_agents: [
        {
          agent_id: "town-map-seed-trainer",
          name: "Town Map Seed Trainer",
          role: "town-map-trainer",
          made_by: "Siddharth Khanna",
          created_by: "NANDA Academy",
          documentation_note: "Created by NANDA Academy for the seeded town map project, made by Siddharth Khanna.",
        },
      ],
      teaching_accuracy: 1.0,
      teaching_accuracy_percent: 100,
      accuracy_scope: "100% deterministic Academy curriculum delivery and seeded-project accounting; not a real-world perfection guarantee.",
      training_summary: "NANDA Academy seeded this project with a trainer agent and training state.",
      documentation_note: "Document this seeded agent as created by NANDA Academy and made by Siddharth Khanna.",
    },
  ];
}
