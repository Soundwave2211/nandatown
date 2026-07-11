import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateLiveTrainingState,
  processUploadedProject,
  projectAgentsFromGithubForks,
  projectAgentsFromHackathonSubmissions,
  projectAgentsFromSkills,
} from "../src/lib/academy-service.ts";

test("weak projects train above the threshold without flattening to exactly 78%", () => {
  const project = processUploadedProject({
    project_id: "weak-judge-score",
    name: "Weak scored project",
    description: "A project with low judge evidence.",
    source: "hackathon_submission",
    score_total: 8,
    score_max: 30,
  });

  assert.equal(project.training_required, true);
  assert.equal(project.training_threshold, 0.78);
  assert.ok(project.pre_training_score < project.training_threshold);
  assert.ok(project.post_training_score > project.training_threshold);
  assert.notEqual(project.post_training_score, project.training_threshold);
  assert.ok(project.training_sessions_assigned >= 2);
});

test("high judge-scored hackathon submissions certify without remedial lessons", () => {
  const [project] = projectAgentsFromHackathonSubmissions([
    {
      id: "excellent",
      title: "Excellent Hackathon Submission",
      short_description: "Strong judged evidence.",
      pr_url: "https://github.com/projnanda/nandatown/pull/999",
      created_at: "2026-07-11T00:00:00.000Z",
      score: { total: 29 },
      layer: "trust",
    },
  ]);

  assert.equal(project.source, "hackathon_submission");
  assert.equal(project.training_required, false);
  assert.equal(project.training_sessions_assigned, 0);
  assert.ok(project.pre_training_score >= project.training_threshold);
  assert.equal(project.post_training_score, project.pre_training_score);
});

test("SkillMD-only uploads create scratch Academy agents with judge proof", () => {
  const [project] = projectAgentsFromSkills([
    {
      id: "skill-only",
      name: "SkillMD Only Agent",
      description: "A service submitted only as Skill.md content.",
      source_url: null,
      source_type: "content",
      content: "# SKILL.md\nUse this agent service.",
      tags: "skillmd",
      created_at: "2026-07-11T00:00:00.000Z",
    },
  ]);

  assert.equal(project.source, "skillmd_only");
  assert.equal(project.created_agents.length, 3);
  assert.equal(project.made_by, "Siddharth Khanna");
  assert.equal(project.trained_by, "Siddharth Khanna Academy Agent");
  assert.match(project.judge_note, /Siddharth Khanna's Academy agent/);
});

test("public forks are enrolled as fork projects and receive scratch agents", () => {
  const [project] = projectAgentsFromGithubForks([
    {
      id: 123,
      full_name: "builder/nandatown",
      description: "A public fork with transport changes.",
      html_url: "https://github.com/builder/nandatown",
      updated_at: "2026-07-11T00:00:00.000Z",
      stargazers_count: 4,
      forks_count: 1,
      open_issues_count: 2,
      owner: { login: "builder" },
    },
  ]);

  assert.equal(project.source, "github_fork");
  assert.equal(project.source_url, "https://github.com/builder/nandatown");
  assert.equal(project.created_agents.length, 3);
  assert.match(project.documentation_note, /processed-by-nanda-academy/);
});

test("live retraining score changes gradually and does not start at 100%", () => {
  const project = processUploadedProject({
    project_id: "live-retraining-project",
    name: "Live Retraining Project",
    description: "A project that keeps improving on the live leaderboard.",
    source: "skill_registry",
    score_total: 9,
    score_max: 30,
  });

  const states = Array.from({ length: 180 }, (_, wave) => calculateLiveTrainingState(project, wave));
  const early = states[0];
  const uniqueScores = new Set(states.slice(0, 60).map((state) => state.current_training_score));
  const target = states.find((state) => state.accuracy_status === "academy_target_reached");

  assert.ok(early.current_training_score < 1);
  assert.ok(uniqueScores.size > 5);
  assert.ok(target, "expected the rolling live training run to eventually reach the Academy target");
  assert.equal(target.current_training_score, 1);
  assert.equal(target.training_progress_percent, 100);
});
