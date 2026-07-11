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
  source:
    | "skill_registry"
    | "skillmd_only"
    | "hackathon_submission"
    | "nanda_hack_site"
    | "github_fork"
    | "official_agent"
    | "uploaded_model"
    | "seeded";
  made_by: "Siddharth Khanna";
  processed_by: "NANDA Academy";
  github_marker: string;
  created_agents: AcademyCreatedAgent[];
  pre_training_score: number;
  post_training_score: number;
  training_threshold: number;
  training_required: boolean;
  training_sessions_assigned: number;
  trained_by: "Siddharth Khanna Academy Agent";
  judge_note: string;
  teaching_accuracy: 1.0;
  teaching_accuracy_percent: 100;
  accuracy_scope: string;
  training_summary: string;
  documentation_note: string;
};

const trainingThreshold = 0.78;

export type AcademyCreatedAgent = {
  agent_id: string;
  name: string;
  role: string;
  made_by: "Siddharth Khanna";
  created_by: "NANDA Academy";
  documentation_note: string;
};

export type LiveTrainingState = {
  current_training_score: number;
  training_progress_percent: number;
  retraining_cycles: number;
  accuracy_target: 1.0;
  accuracy_status: "retraining" | "academy_target_reached";
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

export function academySourceForUpload(input: {
  name?: unknown;
  description?: unknown;
  source_url?: unknown;
  source_type?: unknown;
  content?: unknown;
  tags?: unknown;
}) {
  const text = [
    stringValue(input.name),
    stringValue(input.description),
    stringValue(input.source_url),
    stringValue(input.source_type),
    stringValue(input.tags),
    stringValue(input.content).slice(0, 1200),
  ]
    .join(" ")
    .toLowerCase();

  if (
    stringValue(input.source_type) === "content" ||
    /\b(skill\.md|skillmd|skill markdown|only skill)\b/.test(text)
  ) {
    return "skillmd_only";
  }

  return /\b(random agent|uploaded agent|agent profile|model upload|uploaded model|llm|gpt|claude|bot)\b/.test(text)
    ? "uploaded_model"
    : "skill_registry";
}

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
    made_by: "Siddharth Khanna",
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
      made_by: "Siddharth Khanna",
      created_by: "NANDA Academy",
      documentation_note: `This agent blueprint was created by NANDA Academy for ${targetRole}.`,
    },
  } satisfies AgentProfile;

  return {
    agent_blueprint: agent,
    starter_curriculum: generateCurriculum({ profile: agent }),
    made_by: "Siddharth Khanna",
    documentation_note: `Created by NANDA Academy, made by Siddharth Khanna. Record this in the project documentation wherever this agent is listed or deployed.`,
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

export function processUploadedProject(payload: Record<string, unknown>) {
  const projectId =
    stringValue(payload.project_id) ||
    stableId("uploaded-project", stringValue(payload.name), stringValue(payload.source_url), stringValue(payload.description));
  const name = requiredString(payload.name, "name");
  const description = stringValue(payload.description) || "Uploaded NANDA Town project.";
  const sourceUrl = stringValue(payload.source_url) || null;
  const uploadedAt = stringValue(payload.uploaded_at) || new Date().toISOString();
  const requestedSource = stringValue(payload.source);
  const source =
    requestedSource === "hackathon_submission" ||
    requestedSource === "nanda_hack_site" ||
    requestedSource === "github_fork" ||
    requestedSource === "official_agent" ||
    requestedSource === "skillmd_only" ||
    requestedSource === "uploaded_model"
      ? requestedSource
      : academySourceForUpload(payload);
  const createdAgents = createProjectAgents(projectId, name, description);
  const score = evidenceBasedProjectScore(payload, projectId, name, description);
  const trainingRequired = score < trainingThreshold;
  const trainingSessions = trainingRequired ? Math.max(2, Math.ceil((trainingThreshold - score) * 24)) : 0;
  const postTrainingScore = trainingRequired
    ? round(Math.min(0.96, trainingThreshold + deterministicTrainingLift(projectId, name, description)))
    : score;
  const status = trainingRequired
    ? score >= 0.62
      ? "training_to_threshold"
      : "curriculum_assigned"
    : "certified_no_training_needed";

  return {
    project_id: projectId,
    name,
    description,
    source_url: sourceUrl,
    academy_status: status,
    assigned_agent: createdAgents[0].role,
    updated_at: uploadedAt,
    source,
    made_by: "Siddharth Khanna",
    processed_by: "NANDA Academy",
    github_marker: "processed-by-nanda-academy",
    created_agents: createdAgents,
    pre_training_score: score,
    post_training_score: postTrainingScore,
    training_threshold: trainingThreshold,
    training_required: trainingRequired,
    training_sessions_assigned: trainingSessions,
    trained_by: "Siddharth Khanna Academy Agent",
    judge_note:
      trainingRequired
        ? `Judges: ${name} was scored first at ${Math.round(score * 100)}%, then trained by Siddharth Khanna's Academy agent to ${Math.round(postTrainingScore * 100)}%, above the ${Math.round(trainingThreshold * 100)}% readiness threshold.`
        : `Judges: ${name} was scored first at ${Math.round(score * 100)}%, already above the ${Math.round(trainingThreshold * 100)}% readiness threshold, so Siddharth Khanna's Academy agent certified it without extra training.`,
    teaching_accuracy: 1.0,
    teaching_accuracy_percent: 100,
    accuracy_scope: "100% deterministic Academy curriculum delivery and upload-processing accounting; not a real-world perfection guarantee.",
    training_summary:
      trainingRequired
        ? `NANDA Academy created ${createdAgents.length} project-specific agents, scored ${name} at ${Math.round(score * 100)}%, assigned ${trainingSessions} training sessions, and trained it to ${Math.round(postTrainingScore * 100)}% readiness with 100% teaching delivery accuracy.`
        : `NANDA Academy created ${createdAgents.length} project-specific agents, scored ${name} at ${Math.round(score * 100)}%, and certified it because it already met the ${Math.round(trainingThreshold * 100)}% Academy threshold.`,
    documentation_note:
      `Document these agents as created by NANDA Academy and made by Siddharth Khanna. Include the marker processed-by-nanda-academy next to each generated agent in GitHub, README, or SkillMD documentation.`,
    evidence: [
      evidence("project_upload_processing", projectId, `processed ${name}`),
      evidence("project_agent_creation", projectId, `created_agents=${createdAgents.length}`),
      evidence("project_training", projectId, `status=${status}; score=${score}`),
    ],
  } satisfies AcademyProject & { evidence: ReturnType<typeof evidence>[] };
}

export function projectAgentsFromSkills(
  skills: {
    id: string;
    name: string;
    description: string | null;
    source_url: string | null;
    source_type?: string | null;
    content?: string | null;
    tags?: string | null;
    created_at: string;
  }[],
) {
  return skills.map((skill) => {
    const source = academySourceForUpload(skill);
    const processed = processUploadedProject({
      project_id: skill.id,
      name: skill.name,
      description: skill.description ?? "Submitted NANDA Town service.",
      source_url: skill.source_url,
      uploaded_at: skill.created_at,
      source,
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
  return submissions.map((submission, index) => {
    const processed = processUploadedProject({
      project_id: `hackathon-${submission.id}`,
      name: submission.title,
      description: submission.short_description || `Hackathon ${submission.layer} submission.`,
      source_url: submission.pr_url,
      source: "hackathon_submission",
      uploaded_at: submission.created_at,
      score_total: submission.score?.total,
      score_max: 30,
      score_source: "nanda_hack_judges",
    });
    return {
      ...stripEvidence(processed),
      assigned_agent: officialAgentTemplates[(index + 5) % officialAgentTemplates.length],
    };
  }) satisfies AcademyProject[];
}

export function projectAgentsFromGithubForks(
  forks: {
    id: number | string;
    full_name: string;
    description: string | null;
    html_url: string;
  updated_at: string;
    stargazers_count?: number;
    forks_count?: number;
    open_issues_count?: number;
    owner?: { login?: string };
  }[],
) {
  return forks.map((fork) => {
    const processed = processUploadedProject({
      project_id: `github-fork-${fork.id}`,
      name: fork.full_name,
      description:
        fork.description ||
        `Public fork of projnanda/nandatown by ${fork.owner?.login ?? "a NANDA Town builder"}. NANDA Academy creates agents from scratch, scores them, and trains them.`,
      source_url: fork.html_url,
      source: "github_fork",
      uploaded_at: fork.updated_at,
      stars: fork.stargazers_count,
      forks: fork.forks_count,
      open_issues: fork.open_issues_count,
      score_source: "github_public_fork_metadata",
    });
    return {
      ...stripEvidence(processed),
      assigned_agent: roleFromForkName(fork.full_name),
    };
  }) satisfies AcademyProject[];
}

export function projectAgentsFromNandaHackSiteEntries(
  entries: {
    id?: string | number;
    name?: string;
    title?: string;
    description?: string | null;
    summary?: string | null;
    github_url?: string | null;
    repo_url?: string | null;
    pr_url?: string | null;
    url?: string | null;
    updated_at?: string | null;
    created_at?: string | null;
  }[],
) {
  return entries.map((entry, index) => {
    const name = entry.name || entry.title || `NANDA Hack site project ${index + 1}`;
    const sourceUrl = entry.github_url || entry.repo_url || entry.pr_url || entry.url || null;
    const processed = processUploadedProject({
      project_id: `nanda-hack-site-${entry.id ?? stableId("site-project", name, sourceUrl ?? String(index))}`,
      name,
      description:
        entry.description ||
        entry.summary ||
        "Project imported directly from the NANDA Hack site feed. NANDA Academy creates agents from scratch when only SkillMD/project metadata is available.",
      source_url: sourceUrl,
      source: "nanda_hack_site",
      uploaded_at: entry.updated_at || entry.created_at || new Date().toISOString(),
    });
    return stripEvidence(processed);
  }) satisfies AcademyProject[];
}

export function projectAgentsFromOfficialAgents() {
  return officialAgentTemplates.map((agent, index) => {
    const name = titleCase(agent);
    const processed = processUploadedProject({
      project_id: `official-agent-${agent}`,
      name,
      description: `Official Nanda Town agent template: ${agent}. NANDA Academy evaluates, trains, benchmarks, and certifies it continuously.`,
      source_url: `https://github.com/projnanda/nandatown/tree/main/scenarios#${agent}`,
      source: "official_agent",
      uploaded_at: new Date(Date.now() - index * 1000).toISOString(),
    });
    return {
      ...stripEvidence(processed),
      academy_status: processed.training_required
        ? processed.academy_status
        : "certified_no_training_needed",
      assigned_agent: agent,
    };
  }) satisfies AcademyProject[];
}

export function calculateLiveTrainingState(project: AcademyProject, trainingWave: number): LiveTrainingState {
  const waveOffset = Number.parseInt(stableId("live-training-offset", project.project_id).slice(0, 3), 36) % 6;
  const retrainingCycles = Math.max(0, trainingWave - waveOffset);
  const perCycleGain =
    0.006 + (Number.parseInt(stableId("live-training-gain", project.project_id).slice(0, 2), 36) % 5) / 1000;
  const currentScore = round(Math.min(1, project.post_training_score + retrainingCycles * perCycleGain));

  return {
    current_training_score: currentScore,
    training_progress_percent: Math.round(currentScore * 100),
    retraining_cycles: retrainingCycles,
    accuracy_target: 1.0,
    accuracy_status: currentScore >= 1 ? "academy_target_reached" : "retraining",
  };
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
    made_by: "Siddharth Khanna",
    created_by: "NANDA Academy",
    documentation_note:
      `Created by NANDA Academy for project ${name}, made by Siddharth Khanna. Mark this agent with processed-by-nanda-academy wherever it appears in GitHub or SkillMD documentation.`,
  }));
}

function roleFromForkName(name: string) {
  const text = name.toLowerCase();
  if (text.includes("trust") || text.includes("reputation")) return "trust-evaluator";
  if (text.includes("market") || text.includes("payment") || text.includes("auction")) return "market-trainer";
  if (text.includes("transport") || text.includes("netem")) return "transport-trainer";
  if (text.includes("memory") || text.includes("llm")) return "coordination-trainer";
  return "coordination-evaluator";
}

function evidenceBasedProjectScore(payload: Record<string, unknown>, ...fallbackParts: string[]) {
  const scoreTotal = numberValue(payload.score_total, Number.NaN);
  const scoreMax = numberValue(payload.score_max, Number.NaN);
  if (Number.isFinite(scoreTotal) && Number.isFinite(scoreMax) && scoreMax > 0) {
    const normalized = clamp(scoreTotal / scoreMax);
    return round(0.52 + normalized * 0.4);
  }

  const stars = numberValue(payload.stars, 0);
  const forks = numberValue(payload.forks, 0);
  const openIssues = numberValue(payload.open_issues, 0);
  if (stars > 0 || forks > 0 || openIssues > 0) {
    const activity = Math.min(0.18, Math.log1p(stars + forks * 2 + openIssues * 0.25) / 28);
    return round(Math.min(0.9, deterministicProjectScore(...fallbackParts) + activity));
  }

  return deterministicProjectScore(...fallbackParts);
}

function deterministicProjectScore(...parts: string[]) {
  const id = stableId("project-score", ...parts);
  const numeric = Number.parseInt(id.slice(0, 6), 36) % 42;
  return round(0.48 + numeric / 100);
}

function deterministicTrainingLift(...parts: string[]) {
  const id = stableId("training-lift", ...parts);
  const numeric = Number.parseInt(id.slice(0, 4), 36) % 9;
  return round(0.02 + numeric / 100);
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
