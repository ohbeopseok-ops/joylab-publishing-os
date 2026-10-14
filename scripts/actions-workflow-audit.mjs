#!/usr/bin/env node
// Read-only local YAML inventory. Does not execute Actions or change workflows.
// This is a static heuristic audit, NOT a full YAML parser or approval to consolidate checks.
import fs from "node:fs";
import path from "node:path";
const root=path.resolve(".github/workflows");
if (!fs.existsSync(root)) { console.error("Run from repository root"); process.exit(2); }
const files=fs.readdirSync(root).filter(x=>/\.ya?ml$/i.test(x)).sort();
const inventory=[];
for (const filename of files) {
  const text=fs.readFileSync(path.join(root,filename),"utf8");
  const block=text.match(/^on:\s*\n((?:[ \t]+.*\n|\s*\n)*)/m)?.[1] || "";
  const events=Array.from(block.matchAll(/^  ([a-z_]+):/gm),x=>x[1]);
  const cron=Array.from(text.matchAll(/^\s+- cron:\s*(.+)$/gm),x=>x[1].trim());
  const uploads=(text.match(/uses:\s*actions\/upload-artifact@/g)||[]).length;
  const build=(text.match(/(?:npm run build|npm run build:[^\s]+|npx astro build)/g)||[]).length;
  const installs=(text.match(/(?:npm ci|npm install|npx playwright install)/g)||[]).length;
  const retention=Array.from(text.matchAll(/retention-days:\s*(\d+)/g),x=>Number(x[1]));
  const concurrency=/^concurrency:\s*$/m.test(text);
  const timeout=/^\s+timeout-minutes:\s*\d+/m.test(text);
  const triggers=block.split("\n"); let current="";
  const duplicateEventKeys=[];
  for (const line of triggers) {
    const event=line.match(/^  ([\w-]+):/);
    if(event){current=event[1]; continue;}
    // Detect repeated config keys within same event map (e.g. pull_request.types).
  }
  for(const e of events){
    const start=triggers.findIndex(x=>x.match(new RegExp("^  "+e+":")));
    if(start<0)continue;
    const keys=new Set();
    for(let i=start+1;i<triggers.length && !/^  [\w-]+:/.test(triggers[i]);i++){
      const m=triggers[i].match(/^    ([\w-]+):/);
      if(!m)continue;
      if(keys.has(m[1]))duplicateEventKeys.push(e+"."+m[1]);
      keys.add(m[1]);
    }
  }
  const risk=(build*4)+(installs*2)+(uploads>0?2:0)+(cron.length?2:0)+(!concurrency?1:0);
  inventory.push({filename,events,cron,build_commands:build,install_commands:installs,uploads,retention_days:retention,concurrency,timeout,duplicate_event_keys:duplicateEventKeys,review_priority:risk});
}
inventory.sort((a,b)=>b.review_priority-a.review_priority||a.filename.localeCompare(b.filename));
const summary={version:"0.1",generated_at:new Date().toISOString(),source:".github/workflows/*.yml",warning:"heuristic static analysis; validate YAML, required checks, permissions, and actual runner minutes before changes.",totals:{workflows:inventory.length,schedule_workflows:inventory.filter(x=>x.cron.length).length,build_repetitions:inventory.reduce((n,x)=>n+x.build_commands,0),upload_actions:inventory.reduce((n,x)=>n+x.uploads,0),missing_concurrency:inventory.filter(x=>!x.concurrency).length,possible_duplicate_keys:inventory.filter(x=>x.duplicate_event_keys.length).length},inventory};
const output=path.resolve("local-reports/actions-workflow-inventory.json");
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(summary,null,2)+"\n");
console.log("Audited "+summary.totals.workflows+" workflows. Saved "+output);
for(const row of inventory.slice(0,15))console.log(row.filename+" priority="+row.review_priority+" triggers="+row.events.join(",")+" uploads="+row.uploads+" build="+row.build_commands);
if(summary.totals.possible_duplicate_keys)console.log("WARNING duplicate event YAML keys in "+summary.totals.possible_duplicate_keys+" workflow(s)");
