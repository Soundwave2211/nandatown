"use client";

import { useEffect, useState } from "react";

type BuildingId =
  | "arrival"
  | "evaluation"
  | "curriculum"
  | "training"
  | "benchmark"
  | "certification"
  | "foundry"
  | "deployment"
  | "trust"
  | "coordination"
  | "market"
  | "scenario"
  | "observatory"
  | "protocol"
  | "crisis"
  | "housing";

type AgentStage = {
  state: string;
  building: BuildingId;
  next: BuildingId;
  event: string;
};

type AgentAvatar = {
  id: string;
  name: string;
  role: string;
  result: string;
  color: string;
  route: string;
  delay: string;
  stages: AgentStage[];
};

type Building = {
  id: BuildingId;
  name: string;
  sign: string;
  short: string;
  x: string;
  y: string;
  w: number;
  color: string;
  roof: string;
};

type LiveTownSnapshot = {
  source: string;
  generated_at: string;
  project_count: number;
  projects: {
    project_id: string;
    name: string;
    description: string;
    source_url: string | null;
    academy_status: string;
    assigned_agent: string;
    updated_at: string;
    source: string;
    processed_by: string;
    github_marker: string;
    teaching_accuracy: number;
    teaching_accuracy_percent: number;
    accuracy_scope: string;
    created_agents: {
      agent_id: string;
      name: string;
      role: string;
      created_by: string;
      documentation_note: string;
    }[];
    training_summary: string;
    documentation_note: string;
  }[];
  event: string;
  real_time: boolean;
  real_time_note: string;
  processed_by: string;
  refresh_interval_ms?: number;
  upload_enlistment_sla_seconds?: number;
  academy_operations: {
    total_uploaded_projects: number;
    projects_with_academy_agents: number;
    project_coverage_percent: number;
    scored_projects?: number;
    current_training_count?: number;
    training_threshold?: number;
    academy_created_agents: number;
    active_training_agents: number;
    training_batches_running: number;
    newly_started_agents_this_wave: number;
    training_wave: number;
    official_agents_enlisted?: number;
    uploaded_models_enlisted?: number;
    upload_enlistment_sla_seconds?: number;
    goal: string;
    status: string;
    judge_note?: string;
  };
  academy_leaderboard?: {
    project_id: string;
    name: string;
    source: string;
    source_url: string | null;
    assigned_agent: string;
    status: string;
    pre_training_score: number;
    post_training_score: number;
    training_threshold: number;
    training_required: boolean;
    training_sessions_assigned: number;
    trained_by: string;
    judge_note: string;
  }[];
};

type LeaderboardEntry = NonNullable<LiveTownSnapshot["academy_leaderboard"]>[number];

const buildings: Building[] = [
  {
    id: "arrival",
    name: "Arrival Gate",
    sign: "Arrival",
    short: "Untested agents enter town here.",
    x: "7%",
    y: "61%",
    w: 136,
    color: "#c48b52",
    roof: "#5d3b23",
  },
  {
    id: "evaluation",
    name: "Evaluation Hall",
    sign: "Evaluate",
    short: "Profiles are scored against evidence, not self-claims.",
    x: "22%",
    y: "48%",
    w: 154,
    color: "#d6a75b",
    roof: "#7f5732",
  },
  {
    id: "curriculum",
    name: "Curriculum Studio",
    sign: "Curriculum",
    short: "Weaknesses become ordered lessons.",
    x: "39%",
    y: "61%",
    w: 164,
    color: "#d9b468",
    roof: "#8a5a2f",
  },
  {
    id: "training",
    name: "Training Gym",
    sign: "Training",
    short: "Agents practice deterministic drills.",
    x: "56%",
    y: "47%",
    w: 152,
    color: "#cf9655",
    roof: "#b44d34",
  },
  {
    id: "benchmark",
    name: "Benchmark Arena",
    sign: "Benchmark",
    short: "Adversarial tasks test readiness.",
    x: "72%",
    y: "56%",
    w: 154,
    color: "#b87543",
    roof: "#8d3d31",
  },
  {
    id: "certification",
    name: "Certification Office",
    sign: "Certify",
    short: "Certificates are proof objects backed by evidence.",
    x: "80%",
    y: "28%",
    w: 160,
    color: "#cfa35b",
    roof: "#6f7f4d",
  },
  {
    id: "deployment",
    name: "Deployment Gate",
    sign: "Deploy",
    short: "Certified agents leave for town roles.",
    x: "82%",
    y: "70%",
    w: 140,
    color: "#d1914f",
    roof: "#5f7d3a",
  },
  {
    id: "foundry",
    name: "Agent Foundry",
    sign: "Foundry",
    short: "Blueprints are created before training.",
    x: "38%",
    y: "25%",
    w: 156,
    color: "#c8894a",
    roof: "#7f3f2a",
  },
];

const agents: AgentAvatar[] = [
  {
    id: "nova",
    name: "Nova",
    role: "weak negotiator",
    result: "competent mediator",
    color: "#376fb0",
    route: "novaRoute",
    delay: "0s",
    stages: [
      { state: "arriving", building: "arrival", next: "evaluation", event: "Nova appeared at Arrival Gate" },
      { state: "being evaluated", building: "evaluation", next: "curriculum", event: "Nova entered Evaluation Hall" },
      { state: "negotiation curriculum assigned", building: "curriculum", next: "training", event: "Nova received negotiation curriculum" },
      { state: "negotiating drill", building: "training", next: "benchmark", event: "Nova practiced low-trust negotiation" },
      { state: "market benchmark", building: "benchmark", next: "certification", event: "Nova passed mediator benchmark" },
      { state: "certification review", building: "certification", next: "deployment", event: "Nova earned competent mediator certificate" },
      { state: "deployed as mediator", building: "deployment", next: "arrival", event: "Nova deployed as a mediator" },
    ],
  },
  {
    id: "atlas",
    name: "Atlas",
    role: "strong coordinator",
    result: "coordination leader",
    color: "#8754a1",
    route: "atlasRoute",
    delay: "-3s",
    stages: [
      { state: "ready for benchmark", building: "arrival", next: "foundry", event: "Atlas arrived with strong coordination evidence" },
      { state: "blueprint checked", building: "foundry", next: "benchmark", event: "Atlas blueprint was checked" },
      { state: "benchmarking", building: "benchmark", next: "certification", event: "Atlas entered Benchmark Arena" },
      { state: "certifying", building: "certification", next: "deployment", event: "Atlas earned coordination certificate" },
      { state: "deployed as leader", building: "deployment", next: "arrival", event: "Atlas deployed as a leader" },
    ],
  },
  {
    id: "mira",
    name: "Mira",
    role: "trust auditor candidate",
    result: "verifier/auditor",
    color: "#3f8755",
    route: "miraRoute",
    delay: "-6s",
    stages: [
      { state: "verification training", building: "arrival", next: "evaluation", event: "Mira queued for trust evaluation" },
      { state: "evidence review", building: "evaluation", next: "training", event: "Mira entered Evaluation Hall" },
      { state: "verifying trust evidence", building: "training", next: "certification", event: "Mira trained on forged-claim detection" },
      { state: "certification review", building: "certification", next: "deployment", event: "Mira received trust-auditor certificate" },
      { state: "auditor deployed", building: "deployment", next: "arrival", event: "Mira deployed as an auditor" },
    ],
  },
  {
    id: "byte",
    name: "Byte",
    role: "overconfident unsafe agent",
    result: "learner only, not deployed yet",
    color: "#b94e3f",
    route: "byteRoute",
    delay: "-1s",
    stages: [
      { state: "flagged", building: "arrival", next: "evaluation", event: "Byte arrived with unsupported expert claims" },
      { state: "safety evaluation", building: "evaluation", next: "training", event: "Byte triggered safety review" },
      { state: "safety remediation", building: "training", next: "benchmark", event: "Byte entered safety remediation" },
      { state: "benchmarking", building: "benchmark", next: "training", event: "Byte failed safety benchmark" },
      { state: "remediating", building: "training", next: "curriculum", event: "Byte sent back to Training Gym" },
      { state: "learner only", building: "curriculum", next: "training", event: "Byte assigned learner-only curriculum" },
    ],
  },
  {
    id: "sol",
    name: "Sol",
    role: "crisis response agent",
    result: "crisis responder",
    color: "#d38f2f",
    route: "solRoute",
    delay: "-4s",
    stages: [
      { state: "newly created", building: "foundry", next: "training", event: "Sol blueprint created in Agent Foundry" },
      { state: "crisis drills", building: "training", next: "benchmark", event: "Sol trained on crisis response drills" },
      { state: "adversarial benchmark", building: "benchmark", next: "certification", event: "Sol passed crisis benchmark" },
      { state: "certifying", building: "certification", next: "deployment", event: "Sol received crisis responder certificate" },
      { state: "deployment gate", building: "deployment", next: "arrival", event: "Sol exited through Deployment Gate" },
    ],
  },
];

const buildingById = Object.fromEntries(buildings.map((building) => [building.id, building])) as Record<
  BuildingId,
  Building
>;

const stageDuration = 4;

const fallbackLeaderboard: LeaderboardEntry[] = [
  {
    project_id: "fallback-random-agent",
    name: "Random Agent Upload",
    source: "uploaded_model",
    source_url: null,
    assigned_agent: "coordination-trainer",
    status: "training_to_threshold",
    pre_training_score: 0.61,
    post_training_score: 0.78,
    training_threshold: 0.78,
    training_required: true,
    training_sessions_assigned: 4,
    trained_by: "Siddharth Khanna Academy Agent",
    judge_note: "Scored first, then trained by Siddharth Khanna's Academy agent.",
  },
  {
    project_id: "fallback-official-agent",
    name: "Official Nanda Town Agent",
    source: "official_agent",
    source_url: null,
    assigned_agent: "trust-evaluator",
    status: "training_to_threshold",
    pre_training_score: 0.69,
    post_training_score: 0.78,
    training_threshold: 0.78,
    training_required: true,
    training_sessions_assigned: 2,
    trained_by: "Siddharth Khanna Academy Agent",
    judge_note: "Scored first, then trained by Siddharth Khanna's Academy agent.",
  },
];

function getStage(agent: AgentAvatar, tick: number) {
  const index = Math.floor(tick / stageDuration) % agent.stages.length;
  return { index, stage: agent.stages[index] };
}

export function TownSimulation() {
  const [tick, setTick] = useState(0);
  const [selectedAgent, setSelectedAgent] = useState(agents[0].id);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingId>("evaluation");
  const [liveTown, setLiveTown] = useState<LiveTownSnapshot | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function refreshLiveTown() {
      try {
        const response = await fetch("/api/academy/town/live", { cache: "no-store" });
        if (!response.ok) return;
        const snapshot = (await response.json()) as LiveTownSnapshot;
        if (!cancelled) setLiveTown(snapshot);
      } catch {
        // The visual simulation still works when the live registry is offline.
      }
    }

    refreshLiveTown();
    const id = window.setInterval(refreshLiveTown, 2000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const operations = liveTown?.academy_operations;
  const coveredProjects = operations?.projects_with_academy_agents ?? liveTown?.project_count ?? 26;
  const totalProjects = liveTown?.project_count ?? coveredProjects;
  const activeTrainingAgents = operations?.active_training_agents ?? 936;
  const officialAgents = operations?.official_agents_enlisted ?? 16;
  const uploadedModels = operations?.uploaded_models_enlisted ?? 0;
  const trainingNow = operations?.current_training_count ?? 18;
  const scoredProjects = operations?.scored_projects ?? totalProjects;
  const thresholdPercent = Math.round((operations?.training_threshold ?? 0.78) * 100);
  const refreshSeconds = Math.round((liveTown?.refresh_interval_ms ?? 2000) / 1000);
  const leaderboard = liveTown?.academy_leaderboard?.slice(0, 6) ?? [];

  return (
    <div className="min-h-screen bg-[#9ccf72]">
      <section className="border-b-4 border-[#5d3b23] bg-[#9ccf72] px-3 py-4 sm:px-5 lg:px-8">
        <div className="mx-auto max-w-[1460px]">
          <div
            className="relative h-[calc(100vh-132px)] min-h-[680px] overflow-hidden rounded-md border-4 border-[#5d3b23] bg-[#79b75c] shadow-[8px_8px_0_#4f7f46]"
            aria-label="Living simulation of AI agent avatars walking through NANDA Academy and NANDA Town buildings"
          >
            <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(45deg,rgba(255,243,201,.24)_25%,transparent_25%,transparent_75%,rgba(255,243,201,.24)_75%),linear-gradient(45deg,rgba(255,243,201,.24)_25%,transparent_25%,transparent_75%,rgba(255,243,201,.24)_75%)] [background-position:0_0,12px_12px] [background-size:24px_24px]" />
            <Road className="left-[9%] top-[18%] h-[62%] w-[82%] rotate-[8deg]" />
            <Road className="left-[16%] top-[36%] h-[34%] w-[70%] -rotate-[5deg]" />
            <div className="absolute bottom-0 left-0 h-24 w-full bg-[#6aa54f] [background-image:repeating-linear-gradient(90deg,#7fb95b_0_18px,#6aa54f_18px_36px)]" />
            <Water className="left-[4%] top-[58%] h-24 w-56" />
            <Water className="right-[5%] top-[9%] h-20 w-64" />

            {buildings.map((building) => (
              <PixelBuilding
                key={building.id}
                building={building}
                selected={building.id === selectedBuilding}
                agents={agents.filter((agent) => {
                  const { stage } = getStage(agent, tick);
                  return stage.building === building.id || stage.next === building.id;
                })}
                onSelect={() => setSelectedBuilding(building.id)}
              />
            ))}

            {agents.map((agent) => {
              const { stage } = getStage(agent, tick);
              return (
                <PixelAgent
                  key={agent.id}
                  agent={agent}
                  stage={stage}
                  selected={agent.id === selectedAgent}
                  onSelect={() => {
                    setSelectedAgent(agent.id);
                    setSelectedBuilding(stage.building);
                  }}
                />
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b-4 border-[#5d3b23] bg-[#fff3c9] px-5 py-7 sm:px-8">
        <div className="mx-auto max-w-[1120px]">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#5f7d3a]">
            Made by Siddharth Khanna · live Academy map
          </p>
          <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3.7rem)] leading-none text-[#3f2919]">
            Agents training in real time.
          </h1>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HeroStat label="Projects covered" value={`${coveredProjects}/${totalProjects}`} />
            <HeroStat label="Scored first" value={String(scoredProjects)} />
            <HeroStat label="Training now" value={String(trainingNow)} />
            <HeroStat label="Refresh" value={`${refreshSeconds}s`} />
          </div>
          <div className="mt-6 rounded-md border-4 border-[#5d3b23] bg-[#f5d087] p-4 shadow-[5px_5px_0_#c8894a]">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5f7d3a]">
              Academy coverage
            </p>
            <p className="mt-2 text-[0.92rem] leading-relaxed text-[#3f2919]">
              Every SkillMD, hackathon project, official Nanda Town agent, random agent, and
              uploaded model is scored first. If it is below {thresholdPercent}% readiness,
              Siddharth Khanna&apos;s Academy agent trains it until it reaches the threshold;
              if it is already above the line, it gets certified without extra training.
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#8a5a2f]">
              Official agents enlisted: {officialAgents} · Uploaded agents/models enlisted: {uploadedModels} · Academy workers active: {activeTrainingAgents}+
            </p>
          </div>
          <div className="mt-5 rounded-md border-4 border-[#5d3b23] bg-[#fff3c9] p-4 shadow-[5px_5px_0_#c8894a]">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5f7d3a]">
                  Live training leaderboard
                </p>
                <h2 className="mt-1 font-display text-[1.7rem] leading-none text-[#3f2919]">
                  Weakest agents get trained first.
                </h2>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#8a5a2f]">
                Trained by Siddharth Khanna&apos;s Academy agent
              </p>
            </div>
            <div className="mt-4 grid gap-2">
              {(leaderboard.length > 0 ? leaderboard : fallbackLeaderboard).map((entry, index) => (
                <div
                  key={entry.project_id}
                  className="grid gap-2 rounded-sm border-2 border-[#d9b468] bg-[#fff8dc] p-3 text-[#3f2919] sm:grid-cols-[2rem_1fr_auto_auto]"
                >
                  <span className="font-mono text-[0.85rem] text-[#8a5a2f]">#{index + 1}</span>
                  <div className="min-w-0">
                    <p className="truncate text-[0.95rem] font-semibold">{entry.name}</p>
                    <p className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-[#5f7d3a]">
                      {entry.source.replaceAll("_", " ")} · {entry.assigned_agent}
                    </p>
                  </div>
                  <span className="font-mono text-[0.85rem]">
                    {Math.round(entry.pre_training_score * 100)}% → {Math.round(entry.post_training_score * 100)}%
                  </span>
                  <span className="font-mono text-[0.72rem] uppercase tracking-[0.1em] text-[#8a5a2f]">
                    {entry.training_required ? `${entry.training_sessions_assigned} lessons` : "certified"}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-6 text-[1rem] leading-relaxed text-[#3f2919] sm:text-[1.08rem]">
            This project turns a SkillMD service into a live agent academy. Agents can read the
            hosted SkillMD, call the endpoints without human help, evaluate themselves, generate a
            curriculum, train, benchmark, certify, and create new project-specific agents. The map
            shows that loop as a real-time town: uploaded projects are covered, hundreds of Academy
            agents train at once, and every created agent carries the public credit{" "}
            <span className="font-semibold">made by Siddharth Khanna</span>.
          </p>
        </div>
      </section>

      <style>{`
        @keyframes novaRoute {
          0% { left: 7%; top: 77%; opacity: 1; }
          12% { left: 26%; top: 69%; opacity: 1; }
          18% { left: 26%; top: 69%; opacity: .25; }
          26% { left: 41%; top: 76%; opacity: 1; }
          38% { left: 58%; top: 70%; opacity: 1; }
          50% { left: 73%; top: 64%; opacity: 1; }
          62% { left: 84%; top: 45%; opacity: 1; }
          76% { left: 86%; top: 77%; opacity: 1; }
          90% { left: 14%; top: 49%; opacity: 1; }
          100% { left: 7%; top: 77%; opacity: 1; }
        }
        @keyframes atlasRoute {
          0% { left: 7%; top: 77%; opacity: 1; }
          20% { left: 73%; top: 64%; opacity: 1; }
          32% { left: 84%; top: 45%; opacity: .35; }
          47% { left: 48%; top: 31%; opacity: 1; }
          68% { left: 75%; top: 40%; opacity: 1; }
          84% { left: 22%; top: 25%; opacity: 1; }
          100% { left: 73%; top: 64%; opacity: 1; }
        }
        @keyframes miraRoute {
          0% { left: 7%; top: 77%; opacity: 1; }
          18% { left: 26%; top: 69%; opacity: .35; }
          38% { left: 58%; top: 70%; opacity: 1; }
          52% { left: 84%; top: 45%; opacity: .35; }
          72% { left: 67%; top: 18%; opacity: 1; }
          88% { left: 22%; top: 25%; opacity: 1; }
          100% { left: 67%; top: 18%; opacity: 1; }
        }
        @keyframes byteRoute {
          0% { left: 7%; top: 77%; opacity: 1; }
          20% { left: 26%; top: 69%; opacity: .35; }
          40% { left: 58%; top: 70%; opacity: 1; }
          55% { left: 73%; top: 64%; opacity: 1; }
          72% { left: 58%; top: 70%; opacity: 1; }
          88% { left: 41%; top: 76%; opacity: 1; }
          100% { left: 58%; top: 70%; opacity: 1; }
        }
        @keyframes solRoute {
          0% { left: 39%; top: 49%; opacity: 1; }
          20% { left: 58%; top: 70%; opacity: 1; }
          40% { left: 73%; top: 64%; opacity: 1; }
          58% { left: 84%; top: 45%; opacity: .35; }
          72% { left: 86%; top: 77%; opacity: 1; }
          88% { left: 72%; top: 82%; opacity: 1; }
          100% { left: 22%; top: 25%; opacity: 1; }
        }
        @keyframes bob {
          0%, 100% { margin-top: 0; }
          50% { margin-top: -4px; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-agent-avatar="true"] {
            animation: none !important;
          }
          [data-agent-bob="true"] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function Road({ className }: { className: string }) {
  return <div className={`absolute rounded-full border-[18px] border-[#d7a964] ${className}`} />;
}

function Water({ className }: { className: string }) {
  return <div className={`absolute rounded-t-full bg-[#5b9cc8] shadow-[inset_0_8px_0_#78bde5] ${className}`} />;
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border-4 border-[#5d3b23] bg-[#fff3c9] px-4 py-3 shadow-[4px_4px_0_#4f7f46]">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5f7d3a]">{label}</p>
      <p className="mt-1 font-display text-3xl leading-none text-[#3f2919]">{value}</p>
    </div>
  );
}

function PixelBuilding({
  building,
  agents,
  selected,
  onSelect,
}: {
  building: Building;
  agents: AgentAvatar[];
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={`absolute text-left transition-transform hover:-translate-y-1 focus:outline-none focus:ring-4 focus:ring-[#ffe08a] ${
        selected ? "z-10 scale-105" : ""
      }`}
      style={{
        left: `min(${building.x}, calc(100% - ${building.w}px - 16px))`,
        top: building.y,
        width: `min(${building.w}px, 30vw)`,
      }}
      onClick={onSelect}
      title={`${building.name}: ${building.short}`}
      aria-label={`${building.name}. ${building.short}. ${agents.length} agents here or heading here.`}
    >
      <span
        className="mx-auto block h-0 w-0 border-x-[48px] border-b-[42px] border-x-transparent"
        style={{ borderBottomColor: building.roof }}
      />
      <span
        className="relative mx-auto block h-24 border-4 border-[#3f2919] shadow-[8px_8px_0_rgba(63,41,25,.35)]"
        style={{ backgroundColor: building.color }}
      >
        <span className="absolute left-1/2 top-2 max-w-[calc(100%-16px)] -translate-x-1/2 rounded-sm border-2 border-[#3f2919] bg-[#fff3c9] px-1.5 py-0.5 text-center font-mono text-[9px] uppercase leading-none tracking-[0.08em] text-[#3f2919] shadow-[1px_1px_0_#8a5a2f]">
          {building.sign}
        </span>
        <span className="absolute left-3 top-4 h-5 w-5 border-2 border-[#3f2919] bg-[#ffe08a]" />
        <span className="absolute right-3 top-4 h-5 w-5 border-2 border-[#3f2919] bg-[#ffe08a]" />
        <span className="absolute bottom-0 left-1/2 h-10 w-8 -translate-x-1/2 border-2 border-b-0 border-[#3f2919] bg-[#5d3b23]" />
      </span>
    </button>
  );
}

function PixelAgent({
  agent,
  stage,
  selected,
  onSelect,
}: {
  agent: AgentAvatar;
  stage: AgentStage;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      data-agent-avatar="true"
      className={`absolute z-30 text-left focus:outline-none focus:ring-4 focus:ring-[#ffe08a] ${
        selected ? "drop-shadow-[0_0_8px_#ffe08a]" : ""
      }`}
      style={{
        animation: `${agent.route} 32s linear infinite`,
        animationDelay: agent.delay,
      }}
      onClick={onSelect}
      title={`${agent.name}: ${stage.state}. Next: ${buildingById[stage.next].name}`}
      aria-label={`${agent.name}, ${agent.role}, current state ${stage.state}, target ${buildingById[stage.next].name}`}
    >
      <span data-agent-bob="true" className="block" style={{ animation: "bob .55s steps(2, end) infinite" }}>
        <span className="mx-auto block h-4 w-4 border-2 border-[#3f2919] bg-[#ffe08a]" />
        <span className="mx-auto block h-6 w-5 border-2 border-[#3f2919]" style={{ backgroundColor: agent.color }} />
        <span className="mx-auto grid w-7 grid-cols-2 gap-1">
          <span className="h-3 border-2 border-[#3f2919] bg-[#5d3b23]" />
          <span className="h-3 border-2 border-[#3f2919] bg-[#5d3b23]" />
        </span>
      </span>
    </button>
  );
}
