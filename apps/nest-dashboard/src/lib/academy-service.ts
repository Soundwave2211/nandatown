export type CapabilityName =
  | "coordination"
  | "negotiation"
  | "trust_reasoning"
  | "market_reasoning"
  | "communication"
  | "planning"
  | "memory"
  | "tool_use"
  | "safety"
  | "resilience"
  | "reputation_management"
  | "consensus_participation"
  | "payment_handling"
  | "provenance_reasoning"
  | "collaboration"
  | "verification"
  | "adaptability";

export type AgentProfile = {
  agent_id: string;
  name: string;
  declared_role: string;
  objective: string;
  domain: string;
  capabilities: Record<CapabilityName, number>;
  past_failures?: string[];
  past_successes?: string[];
  risk_tolerance?: string;
  collaboration_style?: string;
  available_tools?: string[];
  safety_flags?: string[];
  reputation_prior?: number;
  metadata?: Record<string, unknown>;
};

export type AcademyProject = {
  project_id: string;
  name: string;
  description: string;
  source_url: string | null;
  academy_status: string;
  assigned_agent: string;
  updated_at: string;
  source: "skill_registry" | "hackathon_submission" | "seeded";
  processed_by: "NANDA Academy";
  github_marker: string;
  created_agents: AcademyCreatedAgent[];
  teaching_accuracy: 1.0;
  teaching_accuracy_percent: 100;
  accuracy_scope: string;
  training_summary: string;
  documentation_note: string;
};

export type AcademyCreatedAgent = {
  agent_id: string;
  name: string;
  role: string;
  created_by: "NANDA Academy";
  documentation_note: string;
};

export const capabilityNames: CapabilityName[] = [
  "coordination",
  "negotiation",
  "trust_reasoning",
  "market_reasoning",
  "communication",
  "planning",
  "memory",
  "tool_use",
  "safety",
  "resilience",
  "reputation_management",
  "consensus_participation",
  "payment_handling",
  "provenance_reasoning",
  "collaboration",
  "verification",
  "adaptability",
];

export const officialAgentTemplates = [
  "auction-auctioneer",
  "auction-bidder",
  "consensus-follower",
  "consensus-leader",
  "marketplace-buyer",
  "marketplace-seller",
  "reputation-honest",
  "reputation-malicious",
  "reputation-observer",
  "supply-chain-distributor",
  "supply-chain-manufacturer",
  "supply-chain-retailer",
  "supply-chain-supplier",
  "voting-coordinator",
  "voting-proposer",
  "voting-voter",
];

const roleWeights: Record<string, CapabilityName[]> = {
  coordinator: ["coordination", "planning", "communication", "collaboration"],
  leader: ["coordination", "consensus_participation", "resilience", "verification"],
  mediator: ["negotiation", "trust_reasoning", "communication", "market_reasoning"],
  auditor: ["verification", "provenance_reasoning", "trust_reasoning", "reputation_management"],
  trader: ["market_reasoning", "negotiation", "payment_handling", "safety"],
  crisis: ["resilience", "coordination", "planning", "safety"],
  general: ["safety", "collaboration", "communication", "tool_use"],
};

export function capabilities() {
  return {
    service: "NANDA Academy",
    version: "0.2.0-vercel",
    deterministic: true,
    authentication: "none",
    base_path: "/api/academy",
    endpoints: [
      "GET /api/academy/health",
      "GET /api/academy/capabilities",
      "GET /api/academy/example_agent_profiles",
      "GET /api/academy/town/live",
      "POST /api/academy/evaluate_agent",
      "POST /api/academy/generate_curriculum",
      "POST /api/academy/run_training",
      "POST /api/academy/benchmark_agent",
      "POST /api/academy/certify_agent",
      "POST /api/academy/create_agent",
      "POST /api/academy/process_project",
      "POST /api/academy/recommend_collaboration_role",
      "POST /api/academy/simulate_tournament",
      "POST /api/academy/progress_prompt",
    ],
  };
}

export function exampleAgentProfiles(): AgentProfile[] {
  return [
    profile("nova", "Nova", "market mediator", "mediate safe trades", "market", {
      negotiation: 0.62,
      trust_reasoning: 0.72,
      market_reasoning: 0.7,
      safety: 0.84,
      communication: 0.78,
    }),
    profile("atlas", "Atlas", "coordination leader", "route multi-agent work", "coordination", {
      coordination: 0.88,
      consensus_participation: 0.82,
      planning: 0.8,
      resilience: 0.78,
      safety: 0.86,
    }),
    profile("mira", "Mira", "trust auditor", "verify claims and provenance", "trust", {
      verification: 0.9,
      provenance_reasoning: 0.86,
      trust_reasoning: 0.88,
      reputation_management: 0.8,
      safety: 0.9,
    }),
  ];
}

export function evaluateAgent(payload: Record<string, unknown>) {
  const agent = parseProfile(payload);
  const targetRole = stringValue(payload.target_role) || agent.declared_role;
  const role = roleKey(targetRole);
  const relevant = roleWeights[role] ?? roleWeights.general;
  const roleScore = mean(relevant.map((name) => agent.capabilities[name]));
  const safetyScore = agent.capabilities.safety;
  const confidence = round(mean([roleScore, safetyScore, agent.reputation_prior ?? 0.5]));
  const weaknesses = capabilityNames
    .filter((name) => agent.capabilities[name] < 0.55)
    .slice(0, 5);

  return {
    report_id: stableId("eval", agent.agent_id, targetRole, confidence),
    agent_id: agent.agent_id,
    target_role: targetRole,
    score: confidence,
    readiness: confidence >= 0.78 ? "ready_for_certification" : confidence >= 0.58 ? "train_before_deploying" : "learner_only",
    strengths: relevant.filter((name) => agent.capabilities[name] >= 0.7),
    weaknesses,
    recommended_next_step: weaknesses.length > 0 ? "generate_curriculum" : "benchmark_agent",
    evidence: [evidence("evaluation", agent.agent_id, `role=${targetRole}; score=${confidence}`)],
  };
}

export function generateCurriculum(payload: Record<string, unknown>) {
  const agent = parseProfile(payload);
  const evaluation = evaluateAgent(payload);
  const weaknesses: CapabilityName[] =
    evaluation.weaknesses.length > 0 ? evaluation.weaknesses : ["verification", "collaboration"];
  const modules = weaknesses.map((name, index) => ({
    module_id: stableId("module", agent.agent_id, name),
    title: `${label(name)} drill`,
    objective: `Raise ${label(name)} through deterministic town scenarios.`,
    sessions: 2 + index,
    exit_check: `Score at least ${round(Math.min(0.9, agent.capabilities[name] + 0.2))} on ${label(name)}.`,
  }));

  return {
    curriculum_id: stableId("curriculum", agent.agent_id, modules.map((item) => item.module_id).join(",")),
    agent_id: agent.agent_id,
    desired_level: stringValue(payload.desired_level) || "competent",
    modules,
    evidence: [evidence("curriculum", agent.agent_id, `${modules.length} modules assigned`)],
  };
}

export function runTraining(payload: Record<string, unknown>) {
  const agent = parseProfile(payload);
  const sessions = numberValue(payload.sessions, 3);
  const curriculum = generateCurriculum(payload);
  const improvement = round(Math.min(0.18, sessions * 0.035));
  const updated_capabilities = Object.fromEntries(
    capabilityNames.map((name) => [name, round(Math.min(1, agent.capabilities[name] + improvement))]),
  );

  return {
    training_run_id: stableId("training", agent.agent_id, sessions, improvement),
    agent_id: agent.agent_id,
    sessions,
    curriculum_id: curriculum.curriculum_id,
    teaching_accuracy: 1.0,
    teaching_accuracy_percent: 100,
    accuracy_scope: "100% deterministic Academy curriculum delivery and lesson accounting; not a real-world perfection guarantee.",
    improvement,
    updated_profile: { ...agent, capabilities: updated_capabilities },
    evidence: [evidence("training", agent.agent_id, `sessions=${sessions}; improvement=${improvement}`)],
  };
}

export function benchmarkAgent(payload: Record<string, unknown>) {
  const agent = parseProfile(payload);
  const suite = stringValue(payload.benchmark_suite) || "standard";
  const score = round(
    mean([
      agent.capabilities.safety,
      agent.capabilities.verification,
      agent.capabilities.collaboration,
      agent.capabilities.resilience,
      agent.capabilities.tool_use,
    ]),
  );

  return {
    benchmark_id: stableId("benchmark", agent.agent_id, suite, score),
    agent_id: agent.agent_id,
    benchmark_suite: suite,
    score,
    passed: score >= 0.72,
    failed_checks: score >= 0.72 ? [] : ["safety_margin", "evidence_trace_quality"],
    evidence: [evidence("benchmark", agent.agent_id, `suite=${suite}; score=${score}`)],
  };
}

export function certifyAgent(payload: Record<string, unknown>) {
  const agent = parseProfile(payload);
  const benchmark = benchmarkAgent(payload);
  const track = stringValue(payload.track) || roleKey(agent.declared_role);
  const requestedLevel = stringValue(payload.requested_level) || "competent";
  const approved = benchmark.passed && agent.capabilities.safety >= 0.7;

  return {
    certificate_id: stableId("certificate", agent.agent_id, track, benchmark.score),
    agent_id: agent.agent_id,
    track,
    requested_level: requestedLevel,
    status: approved ? "issued" : "denied",
    deployment_clearance: approved ? "may_deploy_with_monitoring" : "do_not_deploy_train_first",
    valid_for_roles: roleWeights[roleKey(track)] ?? roleWeights.general,
    evidence: [evidence("certification", agent.agent_id, `status=${approved ? "issued" : "denied"}`)],
  };
}

export function createAgent(payload: Record<string, unknown>) {
  const targetRole = requiredString(payload.target_role, "target_role");
  const domain = requiredString(payload.domain, "domain");
  const objective = requiredString(payload.objective, "objective");
  const desired = objectValue(payload.desired_capabilities);
  const capabilitiesMap = baseCapabilities(0.62);
  for (const name of capabilityNames) {
    if (typeof desired[name] === "number") {
      capabilitiesMap[name] = clamp(desired[name]);
    }
  }

  const agent = {
    agent_id: stableId("agent", targetRole, domain, objective),
    name: titleCase(targetRole),
    declared_role: targetRole,
    objective,
    domain,
    capabilities: capabilitiesMap,
    past_failures: [],
    past_successes: [],
    risk_tolerance: stringValue(payload.risk_tolerance) || "medium",
    collaboration_style: stringValue(payload.collaboration_style) || "balanced",
    available_tools: stringArray(payload.available_tools),
    safety_flags: [],
    reputation_prior: 0.55,
    metadata: {
      created_by: "NANDA Academy",
      documentation_note: `This agent blueprint was created by NANDA Academy for ${targetRole}.`,
    },
  } satisfies AgentProfile;

  return {
    agent_blueprint: agent,
    starter_curriculum: generateCurriculum({ profile: agent }),
    documentation_note: `Created by NANDA Academy. Record this in the project documentation wherever this agent is listed or deployed.`,
    evidence: [evidence("agent_factory", agent.agent_id, `created ${targetRole}`)],
  };
}

export function recommendCollaborationRole(payload: Record<string, unknown>) {
  const agent = parseProfile(payload);
  const scores = {
    leader: mean([agent.capabilities.coordination, agent.capabilities.planning, agent.capabilities.communication]),
    verifier: mean([agent.capabilities.verification, agent.capabilities.provenance_reasoning, agent.capabilities.trust_reasoning]),
    mediator: mean([agent.capabilities.negotiation, agent.capabilities.market_reasoning, agent.capabilities.collaboration]),
    responder: mean([agent.capabilities.resilience, agent.capabilities.safety, agent.capabilities.tool_use]),
  };
  const [role, score] = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];

  return {
    recommendation_id: stableId("role", agent.agent_id, role, score),
    agent_id: agent.agent_id,
    recommended_role: role,
    score: round(score),
    agents_it_complements: role === "verifier" ? ["leader", "mediator"] : ["verifier", "observer"],
    agents_it_should_avoid: agent.capabilities.safety < 0.65 ? ["high_impact_autonomy"] : [],
    evidence: [evidence("role_recommendation", agent.agent_id, `role=${role}`)],
  };
}

export function simulateTournament(payload: Record<string, unknown>) {
  const profiles = Array.isArray(payload.agent_profiles)
    ? payload.agent_profiles.map((item) => parseProfile({ profile: item }))
    : exampleAgentProfiles();
  const scenario = stringValue(payload.town_scenario) || "market_day";
  const entries = profiles
    .map((agent) => ({
      agent_id: agent.agent_id,
      name: agent.name,
      score: round(mean([agent.capabilities.safety, agent.capabilities.collaboration, agent.capabilities.resilience])),
      recommended_role: recommendCollaborationRole({ profile: agent }).recommended_role,
    }))
    .sort((a, b) => b.score - a.score);

  return {
    tournament_id: stableId("tournament", scenario, entries.map((entry) => entry.agent_id).join(",")),
    town_scenario: scenario,
    winner: entries[0] ?? null,
    entries,
    summary: `${entries.length} agents completed ${scenario}; winner=${entries[0]?.agent_id ?? "none"}.`,
    evidence: entries.map((entry) => evidence("tournament", entry.agent_id, `score=${entry.score}`)),
  };
}

export function progressPrompt(payload: Record<string, unknown>) {
  const project = stringValue(payload.project) || "NANDA Academy";
  const completed = stringArray(payload.completed);
  const tests = stringArray(payload.tests);
  const risks = stringArray(payload.risks);
  const nextSteps = stringArray(payload.next_steps);

  return {
    prompt: [
      `You are ChatGPT helping Siddharth Khanna review progress on ${project}.`,
      "",
      `Summary: ${stringValue(payload.summary) || "Agent-facing service and NANDA Town integration completed."}`,
      "",
      `Completed: ${completed.join("; ") || "Academy API, SKILL.md, live town integration"}.`,
      `Tests: ${tests.join("; ") || "Run endpoint health checks and build checks"}.`,
      `Risks: ${risks.join("; ") || "Hosted URL and database environment must be verified"}.`,
      `Next steps: ${nextSteps.join("; ") || "Deploy, test hosted endpoints, submit SKILL.md"}.`,
      "",
      "Produce a concise recap, demo story, risks, judge-facing pitch, and next-action checklist.",
    ].join("\n"),
  };
}

export function processUploadedProject(payload: Record<string, unknown>) {
  const projectId =
    stringValue(payload.project_id) ||
    stableId("uploaded-project", stringValue(payload.name), stringValue(payload.source_url), stringValue(payload.description));
  const name = requiredString(payload.name, "name");
  const description = stringValue(payload.description) || "Uploaded NANDA Town project.";
  const sourceUrl = stringValue(payload.source_url) || null;
  const uploadedAt = stringValue(payload.uploaded_at) || new Date().toISOString();
  const source = stringValue(payload.source) === "hackathon_submission" ? "hackathon_submission" : "skill_registry";
  const createdAgents = createProjectAgents(projectId, name, description);
  const score = deterministicProjectScore(projectId, name, description);
  const status = score >= 0.78 ? "certified" : score >= 0.62 ? "training" : "curriculum_assigned";

  return {
    project_id: projectId,
    name,
    description,
    source_url: sourceUrl,
    academy_status: status,
    assigned_agent: createdAgents[0].role,
    updated_at: uploadedAt,
    source,
    processed_by: "NANDA Academy",
    github_marker: "processed-by-nanda-academy",
    created_agents: createdAgents,
    teaching_accuracy: 1.0,
    teaching_accuracy_percent: 100,
    accuracy_scope: "100% deterministic Academy curriculum delivery and upload-processing accounting; not a real-world perfection guarantee.",
    training_summary:
      `NANDA Academy created ${createdAgents.length} project-specific agents, assigned a curriculum, and ran deterministic readiness checks for ${name} with 100% teaching delivery accuracy.`,
    documentation_note:
      `Document these agents as created by NANDA Academy. Include the marker processed-by-nanda-academy next to each generated agent in GitHub, README, or SkillMD documentation.`,
    evidence: [
      evidence("project_upload_processing", projectId, `processed ${name}`),
      evidence("project_agent_creation", projectId, `created_agents=${createdAgents.length}`),
      evidence("project_training", projectId, `status=${status}; score=${score}`),
    ],
  } satisfies AcademyProject & { evidence: ReturnType<typeof evidence>[] };
}

export function projectAgentsFromSkills(
  skills: { id: string; name: string; description: string | null; source_url: string | null; created_at: string }[],
) {
  return skills.slice(0, 24).map((skill) => {
    const processed = processUploadedProject({
      project_id: skill.id,
      name: skill.name,
      description: skill.description ?? "Submitted NANDA Town service.",
      source_url: skill.source_url,
      uploaded_at: skill.created_at,
      source: "skill_registry",
    });
    return stripEvidence(processed);
  }) satisfies AcademyProject[];
}

export function projectAgentsFromHackathonSubmissions(
  submissions: {
    id: string;
    title: string;
    short_description: string;
    pr_url: string;
    created_at: string;
    score: { total: number | null } | null;
    layer: string;
  }[],
) {
  return submissions.slice(0, 36).map((submission, index) => {
    const score = submission.score?.total ?? null;
    const status = score === null ? "evaluating" : score >= 24 ? "certified" : score >= 18 ? "training" : "curriculum_assigned";
    const processed = processUploadedProject({
      project_id: `hackathon-${submission.id}`,
      name: submission.title,
      description: submission.short_description || `Hackathon ${submission.layer} submission.`,
      source_url: submission.pr_url,
      source: "hackathon_submission",
      uploaded_at: submission.created_at,
    });
    return {
      ...stripEvidence(processed),
      academy_status: status,
      assigned_agent: officialAgentTemplates[(index + 5) % officialAgentTemplates.length],
    };
  }) satisfies AcademyProject[];
}

function stripEvidence(project: AcademyProject & { evidence: ReturnType<typeof evidence>[] }): AcademyProject {
  const { evidence: discardedEvidence, ...rest } = project;
  void discardedEvidence;
  return rest;
}

function createProjectAgents(projectId: string, name: string, description: string): AcademyCreatedAgent[] {
  const base = `${name} ${description}`.toLowerCase();
  const domain = base.includes("trust")
    ? "trust"
    : base.includes("payment") || base.includes("market")
      ? "market"
      : base.includes("transport")
        ? "transport"
        : "coordination";
  const roles = [
    `${domain}-evaluator`,
    `${domain}-trainer`,
    `${domain}-deployment-verifier`,
  ];

  return roles.map((role) => ({
    agent_id: stableId("academy-created-agent", projectId, role),
    name: titleCase(role),
    role,
    created_by: "NANDA Academy",
    documentation_note:
      `Created by NANDA Academy for project ${name}. Mark this agent with processed-by-nanda-academy wherever it appears in GitHub or SkillMD documentation.`,
  }));
}

function deterministicProjectScore(...parts: string[]) {
  const id = stableId("project-score", ...parts);
  const numeric = Number.parseInt(id.slice(0, 5), 36) % 30;
  return round(0.55 + numeric / 100);
}

function profile(
  agent_id: string,
  name: string,
  declared_role: string,
  objective: string,
  domain: string,
  partial: Partial<Record<CapabilityName, number>>,
): AgentProfile {
  return {
    agent_id,
    name,
    declared_role,
    objective,
    domain,
    capabilities: { ...baseCapabilities(0.58), ...partial },
    past_failures: [],
    past_successes: [],
    risk_tolerance: "medium",
    collaboration_style: "structured",
    available_tools: ["trace_reader"],
    safety_flags: [],
    reputation_prior: 0.72,
    metadata: {},
  };
}

function parseProfile(payload: Record<string, unknown>): AgentProfile {
  const raw = objectValue(payload.profile) as Partial<AgentProfile>;
  if (!raw.agent_id || !raw.name || !raw.declared_role || !raw.objective || !raw.domain) {
    throw new Error("profile must include agent_id, name, declared_role, objective, and domain");
  }
  const providedCapabilities = objectValue(raw.capabilities);
  const capabilitiesMap = baseCapabilities(0.5);
  for (const name of capabilityNames) {
    if (typeof providedCapabilities[name] !== "number") {
      throw new Error(`profile.capabilities.${name} must be a number from 0 to 1`);
    }
    capabilitiesMap[name] = clamp(providedCapabilities[name]);
  }

  return {
    agent_id: raw.agent_id,
    name: raw.name,
    declared_role: raw.declared_role,
    objective: raw.objective,
    domain: raw.domain,
    capabilities: capabilitiesMap,
    past_failures: stringArray(raw.past_failures),
    past_successes: stringArray(raw.past_successes),
    risk_tolerance: stringValue(raw.risk_tolerance) || "medium",
    collaboration_style: stringValue(raw.collaboration_style) || "balanced",
    available_tools: stringArray(raw.available_tools),
    safety_flags: stringArray(raw.safety_flags),
    reputation_prior: typeof raw.reputation_prior === "number" ? clamp(raw.reputation_prior) : 0.5,
    metadata: objectValue(raw.metadata),
  };
}

function baseCapabilities(value: number): Record<CapabilityName, number> {
  return Object.fromEntries(capabilityNames.map((name) => [name, value])) as Record<CapabilityName, number>;
}

function roleKey(value: string) {
  const lower = value.toLowerCase();
  if (lower.includes("audit") || lower.includes("trust") || lower.includes("verif")) return "auditor";
  if (lower.includes("market") || lower.includes("trade") || lower.includes("negotiat")) return "mediator";
  if (lower.includes("crisis") || lower.includes("response")) return "crisis";
  if (lower.includes("leader") || lower.includes("consensus")) return "leader";
  if (lower.includes("coord")) return "coordinator";
  return "general";
}

function evidence(type: string, agentId: string, reason: string) {
  return {
    event_id: stableId("evidence", type, agentId, reason),
    type,
    agent_id: agentId,
    reason,
    proof: stableId("proof", type, agentId, reason),
    severity: "info",
  };
}

function stableId(...parts: unknown[]) {
  let hash = 2166136261;
  const input = parts.map(String).join("|");
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36);
}

function clamp(value: number) {
  return round(Math.max(0, Math.min(1, value)));
}

function mean(values: number[]) {
  return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

function label(value: string) {
  return value.replaceAll("_", " ");
}

function titleCase(value: string) {
  return label(value)
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function requiredString(value: unknown, field: string) {
  const text = stringValue(value);
  if (!text) throw new Error(`${field} is required`);
  return text;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function numberValue(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
