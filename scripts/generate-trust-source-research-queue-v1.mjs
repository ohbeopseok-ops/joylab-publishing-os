import fs from "node:fs";
import path from "node:path";

const root=process.cwd();
const queue=JSON.parse(fs.readFileSync(path.join(root,"config/adsense-trust-execution-queue-v1.json"),"utf8"));
const rules=JSON.parse(fs.readFileSync(path.join(root,"config/trust-source-research-candidates-v1.json"),"utf8"));
const rows=queue.SOURCE_SHORTAGE.map(slug=>{
  const hit=rules.mappings.find(x=>x.match.includes(slug));
  return {
    slug,
    status:"MANUAL_RESEARCH_REQUIRED",
    candidateHosts:hit?.candidates||["dart.fss.or.kr","data.krx.co.kr"],
    instruction:"Verify an exact primary-source page and only then add the real URL. Do not fabricate URLs."
  };
});
const out={version:"1.0",generatedAt:new Date().toISOString(),rows};
fs.mkdirSync(path.join(root,"qa-artifacts","trust-source-research-queue-v1"),{recursive:true});
fs.writeFileSync(path.join(root,"qa-artifacts","trust-source-research-queue-v1","report.json"),JSON.stringify(out,null,2)+"\n");
console.log(JSON.stringify(out,null,2));
