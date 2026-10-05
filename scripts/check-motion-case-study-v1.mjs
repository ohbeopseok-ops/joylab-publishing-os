import fs from "node:fs";

const file=process.argv[2] || "src/data/motion-studio/cases/ai-infrastructure-bottleneck-gold-001.json";
const doc=JSON.parse(fs.readFileSync(file,"utf8"));
const errors=[];

if(doc.schemaVersion!=="1.0") errors.push("schemaVersion must be 1.0");
for(const key of ["id","slug","title","status","source","thesis","storyboard","styleframes","finalVideo","creativeGate"]){
  if(doc[key]===undefined || doc[key]===null) errors.push(key+" missing");
}
if(!/^[a-z0-9-]+$/.test(doc.slug||"")) errors.push("slug invalid");
if(!Array.isArray(doc.source?.evidenceIds)||doc.source.evidenceIds.length<1) errors.push("evidenceIds missing");
if(!(doc.thesis?.confidence>=0 && doc.thesis?.confidence<=1)) errors.push("confidence invalid");
if(!Array.isArray(doc.storyboard)||doc.storyboard.length<1) errors.push("storyboard missing");
if(!Array.isArray(doc.styleframes)||doc.styleframes.length<5) errors.push("at least five styleframes required");
if(!["DRAFT","GOLD_CANDIDATE","GOLD"].includes(doc.status)) errors.push("status invalid");
if(!["PENDING","BLOCKED","GREEN","SHOWCASE_GOLD"].includes(doc.creativeGate?.verdict)) errors.push("creative gate verdict invalid");

if(doc.status==="GOLD"){
  if(!doc.finalVideo?.src) errors.push("GOLD requires finalVideo.src");
  if(!["GREEN","SHOWCASE_GOLD"].includes(doc.creativeGate?.verdict)) errors.push("GOLD requires green creative gate");
  const missingFrames=(doc.styleframes||[]).filter(f=>!f.image);
  if(missingFrames.length) errors.push("GOLD requires all styleframe images");
}

console.log(JSON.stringify({
  version:"Motion Case Study Contract Check V1",
  file,
  verdict:errors.length?"BLOCKED":"PASS",
  errors
},null,2));
if(errors.length) process.exit(1);
