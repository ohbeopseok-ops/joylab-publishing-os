import fs from "node:fs";

const file="src/data/motion-studio/showcase-v1.json";
const data=JSON.parse(fs.readFileSync(file,"utf8"));
const errors=[];

if(!data.studio?.name) errors.push("studio.name missing");
if(!Array.isArray(data.projects)||data.projects.length===0) errors.push("projects missing");

for(const p of data.projects||[]){
  if(!p.id) errors.push("project id missing");
  if(!p.title) errors.push(p.id+": title missing");
  if(!p.sourceHref) errors.push(p.id+": sourceHref missing");
  if(p.status==="GOLD" && !p.videoSrc) errors.push(p.id+": GOLD requires videoSrc");
  if(p.status!=="GOLD" && p.publishedAt) errors.push(p.id+": non-GOLD cannot have publishedAt");
}

if(data.studio.public===true){
  const gold=(data.projects||[]).filter(p=>p.status==="GOLD");
  if(gold.length===0) errors.push("public showcase requires at least one GOLD project");
}

if(errors.length){
  console.error("MOTION STUDIO SHOWCASE: BLOCKED");
  errors.forEach(e=>console.error("- "+e));
  process.exit(1);
}
console.log("MOTION STUDIO SHOWCASE: PASS");
