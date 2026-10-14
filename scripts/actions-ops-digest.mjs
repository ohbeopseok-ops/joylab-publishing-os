#!/usr/bin/env node
/**
 * JoyLab Actions Operations Digest V0.1
 * Run locally (no scheduled GitHub runner): GH_TOKEN=<read-only-token> node scripts/actions-ops-digest.mjs
 * Optional: --billing=/path/to/billing.json; --repos=owner/a,owner/b; --days=7; --max-pages=10
 * Important: observed runtime != GitHub's billable usage. Billing must come from an explicit verified snapshot.
 */
import fs from "node:fs";
import path from "node:path";

const defaults = ["ohbeopseok-ops/joylab-publishing-os", "ohbeopseok-ops/leaderdesk-people-os", "ohbeopseok-ops/joylab-agent-os", "ohbeopseok-ops/joylab-product-hub", "ohbeopseok-ops/joylab-core8-engine"];
const args = Object.fromEntries(process.argv.slice(2).filter(x => x.startsWith("--")).map(x => {
  const i = x.indexOf("="); return i < 0 ? [x.slice(2), "true"] : [x.slice(2, i), x.slice(i + 1)];
}));
const num = (value, fallback, min, max) => Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max ? Number(value) : fallback;
const days = num(args.days, 30, 1, 30);
const maxPages = num(args["max-pages"], 10, 1, 30);
const repos = args.repos ? args.repos.split(",").map(x => x.trim()).filter(Boolean) : defaults;
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const clock = new Date();
const earliest = new Date(clock.getTime() - days * 86400e3);
const countsFor = runs => {
  const states = {success: 0, failure: 0, cancelled: 0, timed_out: 0, action_required: 0, skipped: 0, neutral: 0, pending: 0, other: 0};
  let seconds = 0;
  for (const run of runs) {
    const state = run.status === "completed" ? (run.conclusion || "other") : "pending";
    states[state in states ? state : "other"]++;
    if (run.run_started_at && run.updated_at) {
      seconds += Math.max(0, (Date.parse(run.updated_at) - Date.parse(run.run_started_at)) / 1000 || 0);
    }
  }
  const denominator = states.success + states.failure + states.timed_out + states.action_required + states.cancelled;
  return {counts: states, observed_run_hours_approx: +(seconds / 3600).toFixed(2), success_rate_pct: denominator ? +(100 * states.success / denominator).toFixed(1) : null, failure_rate_pct: denominator ? +(100 * (states.failure + states.timed_out) / denominator).toFixed(1) : null, completed_denominator: denominator};
};
const test = () => {
  const t = countsFor([{status:"completed",conclusion:"success"}, {status:"completed",conclusion:"failure"}, {status:"completed",conclusion:"cancelled"}, {status:"queued"}]);
  if (t.completed_denominator !== 3 || t.success_rate_pct !== 33.3 || t.counts.pending !== 1) throw Error("summary test failed");
  console.log("PASS: deterministic summary self-test");
};
if (args["self-test"]) { test(); process.exit(0); }
if (args.help) {
  console.log("GH_TOKEN=... node scripts/actions-ops-digest.mjs [--repos=owner/repo,...] [--days=30] [--max-pages=10] [--billing=JSON] [--output=PATH]");
  process.exit(0);
}
if (!token) { console.error("Set GH_TOKEN with read-only repository/Actions metadata permission. No token will be printed."); process.exit(2); }
if (!repos.length || repos.some(x => !/^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/.test(x))) { console.error("Invalid repository list"); process.exit(2); }
const get = async url => {
  const r = await fetch(url, {headers: {Accept:"application/vnd.github+json", Authorization:"Bearer " + token, "X-GitHub-Api-Version":"2022-11-28", "User-Agent":"JoyLab-Actions-Ops-Digest"}});
  if (!r.ok) throw Error("GitHub API HTTP " + r.status + " at " + new URL(url).pathname);
  return r.json();
};
const collect = async repo => {
  const prefix = "https://api.github.com/repos/" + repo;
  const runRows = [], artifacts = [];
  let runsTruncated = false, artifactsTruncated = false;
  for (let page = 1; page <= maxPages; page++) {
    const q = new URLSearchParams({per_page:"100",page:String(page),created:earliest.toISOString().slice(0,10) + ".." + clock.toISOString().slice(0,10)});
    const v = await get(prefix + "/actions/runs?" + q);
    runRows.push(...(v.workflow_runs || []).map(x => ({id:x.id,name:x.name,status:x.status,conclusion:x.conclusion,created_at:x.created_at,run_started_at:x.run_started_at,updated_at:x.updated_at,html_url:x.html_url})));
    if (runRows.length >= (v.total_count || 0)) break;
    if (page === maxPages) runsTruncated = true;
  }
  for (let page = 1; page <= maxPages; page++) {
    const v = await get(prefix + "/actions/artifacts?per_page=100&page=" + page);
    artifacts.push(...(v.artifacts || []).map(x => ({id:x.id,size_in_bytes:x.size_in_bytes || 0,expired:!!x.expired,expires_at:x.expires_at,name:x.name})));
    if (artifacts.length >= (v.total_count || 0)) break;
    if (page === maxPages) artifactsTruncated = true;
  }
  const activeArtifacts = artifacts.filter(x => !x.expired);
  const byWorkflow = Object.values(runRows.reduce((acc, x) => {
    const key = x.name || "unnamed";
    if (!acc[key]) acc[key] = {workflow:key,total:0,failed:0,cancelled:0};
    acc[key].total++;
    if (x.conclusion === "failure" || x.conclusion === "timed_out") acc[key].failed++;
    if (x.conclusion === "cancelled") acc[key].cancelled++;
    return acc;
  }, {})).sort((a,b)=>b.total-a.total).slice(0,12);
  return {repo,days,run_count_observed:runRows.length,run_history_truncated:runsTruncated,
    ...countsFor(runRows),artifacts_count_observed:activeArtifacts.length,
    artifacts_bytes_estimate:activeArtifacts.reduce((n,x)=>n+x.size_in_bytes,0),
    artifact_listing_truncated:artifactsTruncated,top_workflows:byWorkflow};
};
const results = [];
for (const repo of repos) {
  try { results.push(await collect(repo)); }
  catch(e) { results.push({repo,error:String(e.message || e)}); }
}
let billing = null;
if (args.billing) {
  const raw = JSON.parse(fs.readFileSync(args.billing,"utf8"));
  for (const k of ["included_minutes","used_minutes","included_storage_gb","used_storage_gb"]) {
    if (typeof raw[k] !== "number" || !Number.isFinite(raw[k]) || raw[k] < 0) throw Error("Invalid billing snapshot field: " + k);
  }
  if (!raw.snapshot_at_utc || !raw.source) throw Error("Billing requires timestamp and source");
  billing = {...raw, minutes_pct: +(100*raw.used_minutes/raw.included_minutes).toFixed(1),
    storage_pct: +(100*raw.used_storage_gb/raw.included_storage_gb).toFixed(1)};
}
const report = {version:"0.1",snapshot_at_utc:clock.toISOString(),source:"GitHub Actions REST metadata",warning:"Run elapsed time is NOT billable runner minutes; artifact sum is NOT authoritative billable storage. Missing billing is UNKNOWN.",repos:results,billing};
const output = path.resolve(args.output || "local-reports/actions-ops-digest.json");
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(report,null,2) + "\n",{mode:0o600});
const md = ["# JoyLab Actions Ops Digest", "", "Snapshot: " + report.snapshot_at_utc,"", report.warning,"", "| Repository | Runs observed | Success % | Fail % | Cancelled | Artifact estimate MiB | Complete coverage |", "|---|---:|---:|---:|---:|---:|---|"];
for (const r of results) {
  md.push("| " + r.repo + " | " + (r.error?"ERROR":r.run_count_observed) + " | " + (r.success_rate_pct ?? "—") + " | " + (r.failure_rate_pct ?? "—") + " | " + (r.counts?.cancelled ?? "—") + " | " + (r.artifacts_bytes_estimate == null?"—":(r.artifacts_bytes_estimate/1048576).toFixed(1)) + " | " + (r.error?"error":(r.run_history_truncated || r.artifact_listing_truncated)?"truncated":"yes") + " |");
}
md.push("", "Billing included minutes: " + (billing ? billing.used_minutes + "/" + billing.included_minutes + " (" + billing.minutes_pct + "%)" : "UNKNOWN"),"");
fs.writeFileSync(output.replace(/\.json$/,".md"),md.join("\n"),{mode:0o600});
console.log("Created " + output + " and .md. Repos: " + results.length + ". API errors: " + results.filter(x=>x.error).length);
