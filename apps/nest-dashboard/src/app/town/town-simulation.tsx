"use client";

import { useEffect, useMemo, useState } from "react";
import { officialAgentTemplates } from "@/lib/academy-service";

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
  }[];
  event: string;
};

const buildings: Building[] = [
  {
    id: "arrival",
    name: "Arrival Gate",
    short: "Untested agents enter town here.",
    x: "4%",
    y: "72%",
    w: 126,
    color: "#c48b52",
    roof: "#5d3b23",
  },
  {
    id: "protocol",
    name: "Protocol Lab",
    short: "The 12 layer stack: transport through data facts.",
    x: "7%",
    y: "8%",
    w: 142,
    color: "#9f5f39",
    roof: "#7f3f2a",
  },
  {
    id: "evaluation",
    name: "Evaluation Hall",
    short: "Profiles are scored against evidence, not self-claims.",
    x: "23%",
    y: "63%",
    w: 142,
    color: "#d6a75b",
    roof: "#7f5732",
  },
  {
    id: "curriculum",
    name: "Curriculum Studio",
    short: "Weaknesses become ordered lessons.",
    x: "38%",
    y: "70%",
    w: 150,
    color: "#d9b468",
    roof: "#8a5a2f",
  },
  {
    id: "training",
    name: "Training Gym",
    short: "Agents practice deterministic drills.",
    x: "55%",
    y: "64%",
    w: 132,
    color: "#cf9655",
    roof: "#b44d34",
  },
  {
    id: "benchmark",
    name: "Benchmark Arena",
    short: "Adversarial tasks test readiness.",
    x: "69%",
    y: "58%",
    w: 142,
    color: "#b87543",
    roof: "#8d3d31",
  },
  {
    id: "certification",
    name: "Certification Office",
    short: "Certificates are proof objects backed by evidence.",
    x: "81%",
    y: "39%",
    w: 150,
    color: "#cfa35b",
    roof: "#6f7f4d",
  },
  {
    id: "deployment",
    name: "Deployment Gate",
    short: "Certified agents leave for town roles.",
    x: "83%",
    y: "72%",
    w: 128,
    color: "#d1914f",
    roof: "#5f7d3a",
  },
  {
    id: "foundry",
    name: "Agent Foundry",
    short: "Blueprints are created before training.",
    x: "36%",
    y: "43%",
    w: 138,
    color: "#c8894a",
    roof: "#7f3f2a",
  },
  {
    id: "market",
    name: "Market Square",
    short: "Negotiators and mediators trade safely.",
    x: "11%",
    y: "43%",
    w: 132,
    color: "#d1914f",
    roof: "#b44d34",
  },
  {
    id: "trust",
    name: "Trust Registry",
    short: "Auditors verify claims and provenance.",
    x: "64%",
    y: "12%",
    w: 136,
    color: "#c48b52",
    roof: "#5b6f7d",
  },
  {
    id: "coordination",
    name: "Coordination Hall",
    short: "Leaders coordinate teams under uncertainty.",
    x: "44%",
    y: "25%",
    w: 148,
    color: "#cfa35b",
    roof: "#6f7f4d",
  },
  {
    id: "scenario",
    name: "Scenario District",
    short: "Marketplace, voting, consensus, supply chain, reputation.",
    x: "71%",
    y: "33%",
    w: 136,
    color: "#b87543",
    roof: "#8d3d31",
  },
  {
    id: "observatory",
    name: "Trace Observatory",
    short: "Traces, validators, metrics, reports, and Academy evidence.",
    x: "18%",
    y: "20%",
    w: 146,
    color: "#c48b52",
    roof: "#5b6f7d",
  },
  {
    id: "crisis",
    name: "Crisis Response Centre",
    short: "Certified crisis agents deploy here.",
    x: "68%",
    y: "76%",
    w: 154,
    color: "#bc7551",
    roof: "#704b7b",
  },
  {
    id: "housing",
    name: "Agent Housing",
    short: "Idle certified agents wait for assignments.",
    x: "4%",
    y: "25%",
    w: 132,
    color: "#d6a75b",
    roof: "#8a5a2f",
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
      { state: "deployed as mediator", building: "deployment", next: "market", event: "Nova deployed to Market Square" },
      { state: "mediating trade", building: "market", next: "evaluation", event: "Nova mediated a safe trade" },
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
      { state: "ready for benchmark", building: "arrival", next: "benchmark", event: "Atlas arrived with strong coordination evidence" },
      { state: "benchmarking", building: "benchmark", next: "certification", event: "Atlas entered Benchmark Arena" },
      { state: "certifying", building: "certification", next: "coordination", event: "Atlas earned coordination certificate" },
      { state: "deployed as leader", building: "coordination", next: "scenario", event: "Atlas joined Coordination Hall" },
      { state: "routing team tasks", building: "scenario", next: "observatory", event: "Atlas coordinated a scenario run" },
      { state: "reviewing traces", building: "observatory", next: "benchmark", event: "Atlas reviewed trace evidence" },
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
      { state: "certification review", building: "certification", next: "trust", event: "Mira received trust-auditor certificate" },
      { state: "auditing claims", building: "trust", next: "observatory", event: "Mira assigned Trust Registry role" },
      { state: "reading trace proofs", building: "observatory", next: "trust", event: "Mira checked provenance evidence" },
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
      { state: "deployment gate", building: "deployment", next: "crisis", event: "Sol exited through Deployment Gate" },
      { state: "crisis deployment", building: "crisis", next: "observatory", event: "Sol deployed to Crisis Response Centre" },
    ],
  },
];

const buildingById = Object.fromEntries(buildings.map((building) => [building.id, building])) as Record<
  BuildingId,
  Building
>;

const stageDuration = 4;

const townMap = String.raw`
                         N A N D A   T O W N
                  by Siddharth Khanna, no copyright claimed

  Arrival Gate -> Evaluation Hall -> Curriculum Studio -> Training Gym
       -> Benchmark Arena -> Certification Office -> Deployment Gate

  Agents then branch into Market Square, Trust Registry, Coordination Hall,
  Scenario District, Trace Observatory, Crisis Response Centre, or Housing.
`;

const flows = [
  "NANDA Town is shown here as a living simulation. Each walking avatar is an AI agent.",
  "Buildings represent services and protocol institutions, not human offices.",
  "Agents enter NANDA Academy to be evaluated, trained, benchmarked, certified, and deployed into town roles.",
  "This is a visual simulation layer, not a claim that these avatars are human users.",
];

const recapPrompt = `You are ChatGPT helping Siddharth Khanna recap a Nanda Town / NandaHack build session.

Summarize everything completed so far:
- Built a Phase 2 service named NANDA Academy under services/nanda-academy.
- Implemented deterministic agent evaluation, curriculum generation, training, benchmarking, certification, agent blueprint creation, collaboration-role recommendation, tournament simulation, demo/city endpoints, and a progress_prompt endpoint.
- Added evidence-ledger helpers with canonical JSON and stable IDs.
- Added SKILL.md and README.md for agents to use the service.
- Added 40 tests for the Academy service and verified they pass.
- Added a dashboard /town route showing Nanda Town as a pseudo-3D pixel village with protocol buildings, scenario districts, working animated agents, trace/observatory infrastructure, and NANDA Academy.
- Improved /town into a visible lifecycle simulation: agents arrive, evaluate, receive curricula, train, benchmark, certify, remediate if needed, and deploy.
- Changed /town attribution to Siddharth Khanna and no copyright claimed.
- Added Town links to the dashboard nav/footer.

Also mention:
- The service runs with .venv/bin/python -m nanda_academy.app --port 8001.
- The dashboard town map runs at http://localhost:3011/town.
- npm build passed, targeted lint for changed dashboard files passed, and git diff --check passed.
- Full dashboard lint should be re-run after the Visualizer removal and Skills form cleanup.

Please produce:
1. A concise project-progress recap.
2. The most impressive demo story.
3. Remaining risks.
4. A short judge-facing pitch.
5. A clean next-action checklist.`;

function getStage(agent: AgentAvatar, tick: number) {
  const index = Math.floor(tick / stageDuration) % agent.stages.length;
  return { index, stage: agent.stages[index] };
}

function visibleEvents(tick: number) {
  const eventCursor = Math.floor(tick / 2);
  const all = agents.flatMap((agent) => agent.stages.map((stage) => `${agent.name}: ${stage.event}`));
  return Array.from({ length: 8 }, (_, i) => all[(eventCursor + all.length - i) % all.length]);
}

export function TownSimulation() {
  const [tick, setTick] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<"calm" | "busy">("calm");
  const [selectedAgent, setSelectedAgent] = useState(agents[0].id);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingId>("evaluation");
  const [liveTown, setLiveTown] = useState<LiveTownSnapshot | null>(null);

  useEffect(() => {
    if (paused) return;
    const intervalMs = speed === "calm" ? 1400 : 700;
    const id = window.setInterval(() => {
      setTick((value) => value + 1);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [paused, speed]);

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
    const id = window.setInterval(refreshLiveTown, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  const selectedAgentData = agents.find((agent) => agent.id === selectedAgent) ?? agents[0];
  const { stage: selectedStage } = getStage(selectedAgentData, tick);
  const selectedBuildingData = buildingById[selectedBuilding];
  const events = useMemo(() => visibleEvents(tick), [tick]);
  const agentsForBuilding = agents.filter((agent) => {
    const { stage } = getStage(agent, tick);
    return stage.building === selectedBuilding || stage.next === selectedBuilding;
  });

  return (
    <div className="bg-[#d7e7b2]">
      <section className="border-b-4 border-[#5d3b23] bg-[#6fa35b] text-[#fff3c9] shadow-[inset_0_-10px_0_#4f7f46]">
        <div className="mx-auto max-w-[1380px] px-4 py-8 sm:px-6 lg:px-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[#ffe08a]">
                Online agent village · by Siddharth Khanna · no copyright claimed
              </p>
              <h1 className="mt-3 font-display text-[clamp(2rem,4.4vw,4.3rem)] leading-none tracking-tight">
                AI agents walk through Academy life, then deploy into town.
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPaused((value) => !value)}
                className="rounded-md border-4 border-[#5d3b23] bg-[#c8894a] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#fff3c9] shadow-[4px_4px_0_#3f2919]"
              >
                {paused ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                onClick={() => setSpeed((value) => (value === "calm" ? "busy" : "calm"))}
                className="rounded-md border-4 border-[#5d3b23] bg-[#fff3c9] px-4 py-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#3f2919] shadow-[4px_4px_0_#3f2919]"
              >
                {speed === "calm" ? "Calm" : "Busy"}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-md border-4 border-[#5d3b23] bg-[#f5d087] shadow-[8px_8px_0_#4f7f46]">
            <pre className="min-w-[980px] p-5 font-mono text-[12px] leading-[1.35] text-[#3f2919] sm:p-7">
              {townMap}
            </pre>
          </div>
        </div>
      </section>

      <section className="border-b-4 border-[#5d3b23] bg-[#9ccf72] px-4 py-10 sm:px-6 lg:px-10">
        <div className="mx-auto grid max-w-[1380px] gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div
            className="relative h-[820px] overflow-hidden rounded-md border-4 border-[#5d3b23] bg-[#79b75c] shadow-[8px_8px_0_#4f7f46]"
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

            <div className="absolute left-6 top-6 max-w-sm rounded-md border-4 border-[#5d3b23] bg-[#fff3c9] px-4 py-3 shadow-[4px_4px_0_#8a5a2f]">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5f7d3a]">
                Living agent simulation
              </p>
              <p className="mt-1 text-[0.9rem] leading-relaxed text-[#3f2919]">
                Each walking avatar is an autonomous AI agent moving through evaluation,
                curriculum, training, benchmarking, certification, remediation, and deployment.
              </p>
            </div>
          </div>

          <aside className="grid gap-5">
            <InfoPanel title="Selected agent">
              <p className="font-display text-3xl text-[#3f2919]">{selectedAgentData.name}</p>
              <dl className="mt-4 space-y-3 text-[0.92rem] text-[#3f2919]">
                <InfoRow label="Role" value={selectedAgentData.role} />
                <InfoRow label="State" value={selectedStage.state} />
                <InfoRow label="Current" value={buildingById[selectedStage.building].name} />
                <InfoRow label="Next" value={buildingById[selectedStage.next].name} />
                <InfoRow label="Certificate" value={selectedAgentData.result} />
              </dl>
            </InfoPanel>

            <InfoPanel title="Selected building">
              <p className="font-display text-3xl text-[#3f2919]">{selectedBuildingData.name}</p>
              <p className="mt-3 text-[0.92rem] leading-relaxed text-[#4d3a24]">
                {selectedBuildingData.short}
              </p>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.18em] text-[#5f7d3a]">
                Agents here or heading here
              </p>
              <ul className="mt-2 space-y-1 text-[0.9rem] text-[#3f2919]">
                {agentsForBuilding.length > 0 ? (
                  agentsForBuilding.map((agent) => <li key={agent.id}>{agent.name}</li>)
                ) : (
                  <li>No current traffic</li>
                )}
              </ul>
            </InfoPanel>

            <InfoPanel title="Simulation event log">
              <ul className="space-y-2 font-mono text-[11px] leading-relaxed text-[#3f2919]" aria-live="polite">
                {events.map((event) => (
                  <li key={event} className="border-b-2 border-[#d0a45f] pb-2 last:border-b-0">
                    {event}
                  </li>
                ))}
              </ul>
            </InfoPanel>

            <LiveTownPanel snapshot={liveTown} />
          </aside>
        </div>
      </section>

      <section className="border-b-4 border-[#8a5a2f] bg-[#fff3c9]">
        <div className="mx-auto grid max-w-[1240px] gap-8 px-6 py-14 sm:px-10 lg:grid-cols-[1fr_1fr]">
          <div>
            <p className="eyebrow text-[#5f7d3a]">What this shows</p>
            <h2 className="mt-4 font-display text-[clamp(1.9rem,3.2vw,3rem)] leading-tight text-ink-900">
              The project becomes a living village plan.
            </h2>
          </div>
          <div className="space-y-4 rounded-md border-4 border-[#8a5a2f] bg-[#f5d087] p-5 text-[1rem] leading-relaxed text-[#3f2919] shadow-[5px_5px_0_#c8894a]">
            {flows.map((flow) => (
              <p key={flow}>{flow}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1240px] px-6 py-16 sm:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <RosterPanel />
          <PromptPanel />
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
      style={{ left: building.x, top: building.y, width: building.w }}
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
        <span className="absolute left-3 top-4 h-5 w-5 border-2 border-[#3f2919] bg-[#ffe08a]" />
        <span className="absolute right-3 top-4 h-5 w-5 border-2 border-[#3f2919] bg-[#ffe08a]" />
        <span className="absolute bottom-0 left-1/2 h-10 w-8 -translate-x-1/2 border-2 border-b-0 border-[#3f2919] bg-[#5d3b23]" />
        {agents.length > 0 && (
          <span className="absolute -right-3 -top-3 rounded-sm border-2 border-[#3f2919] bg-[#ffe08a] px-1 font-mono text-[10px] text-[#3f2919]">
            {agents.length}
          </span>
        )}
      </span>
      <span className="mx-auto mt-2 block w-max rounded-sm border-2 border-[#3f2919] bg-[#fff3c9] px-2 py-1 text-center font-mono text-[10px] leading-tight text-[#3f2919] shadow-[2px_2px_0_#8a5a2f]">
        <span className="block">{building.name}</span>
        <span className="block text-[#5f7d3a]">{building.short}</span>
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
      <span className="mt-1 block w-max rounded-sm border-2 border-[#3f2919] bg-[#fff3c9] px-2 py-1 font-mono text-[10px] leading-tight text-[#3f2919] shadow-[2px_2px_0_#8a5a2f]">
        <span className="block">{agent.name}</span>
        <span className="block text-[#5f7d3a]">{stage.state}</span>
      </span>
    </button>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-md border-4 border-[#5d3b23] bg-[#fff3c9] p-5 shadow-[5px_5px_0_#8a5a2f]">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#5f7d3a]">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3 border-b-2 border-[#d0a45f] pb-2 last:border-b-0">
      <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#5f7d3a]">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function RosterPanel() {
  return (
    <div className="rounded-md border-4 border-[#5d3b23] bg-[#fff3c9] p-6 shadow-[6px_6px_0_#8a5a2f]">
      <p className="eyebrow text-[#5f7d3a]">Official agent roster</p>
      <h2 className="mt-4 font-display text-[clamp(1.9rem,3.2vw,3rem)] leading-tight text-[#3f2919]">
        Every shipped template has a place in town.
      </h2>
      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        {officialAgentTemplates.map((agent) => (
          <div key={agent} className="rounded-sm border-2 border-[#d0a45f] bg-[#f5d087] px-3 py-2 font-mono text-[12px] text-[#3f2919]">
            {agent}
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveTownPanel({ snapshot }: { snapshot: LiveTownSnapshot | null }) {
  return (
    <InfoPanel title="Live Academy projects">
      <p className="font-display text-3xl text-[#3f2919]">
        {snapshot ? `${snapshot.project_count} projects` : "Syncing"}
      </p>
      <p className="mt-2 text-[0.9rem] leading-relaxed text-[#4d3a24]">
        {snapshot
          ? snapshot.event
          : "Checking the hosted Academy endpoint for NANDA Town projects and assigned agents."}
      </p>
      <div className="mt-4 space-y-2">
        {(snapshot?.projects ?? []).slice(0, 4).map((project) => (
          <div key={project.project_id} className="rounded-sm border-2 border-[#d0a45f] bg-[#f5d087] p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#3f2919]">
                {project.name}
              </p>
              <span className="rounded-sm border-2 border-[#3f2919] bg-[#fff3c9] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#5f7d3a]">
                {project.academy_status}
              </span>
            </div>
            <p className="mt-2 text-[0.82rem] leading-snug text-[#4d3a24]">{project.description}</p>
            <p className="mt-2 font-mono text-[10px] text-[#5f7d3a]">
              Agent: {project.assigned_agent}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#5f7d3a]">
        Source: {snapshot?.source ?? "waiting"}
      </p>
    </InfoPanel>
  );
}

function PromptPanel() {
  return (
    <div className="rounded-md border-4 border-[#5d3b23] bg-[#f5d087] p-6 shadow-[6px_6px_0_#8a5a2f]">
      <p className="eyebrow text-[#5f7d3a]">Prompt for ChatGPT</p>
      <h2 className="mt-4 font-display text-[clamp(1.9rem,3.2vw,3rem)] leading-tight text-[#3f2919]">
        Recap everything done.
      </h2>
      <pre className="mt-6 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-sm border-2 border-[#5d3b23] bg-[#fff3c9] p-4 font-mono text-[12px] leading-relaxed text-[#3f2919]">
        {recapPrompt}
      </pre>
    </div>
  );
}
