import fs from "node:fs";
import { upsertFrontmatter } from "./lib/frontmatter-upsert-v1.mjs";

const [file,jsonArg,...rest]=process.argv.slice(2);
if(!file||!jsonArg){
  console.error("Usage: node scripts/upsert-article-metadata-v1.mjs <file> '<json>' [--check]");
  process.exit(2);
}
const patch=JSON.parse(jsonArg);
const source=fs.readFileSync(file,"utf8");
const next=upsertFrontmatter(source,patch);
if(rest.includes("--check")){
  if(next!==source){ console.error("Metadata UPSERT Contract V1 BLOCKED: file is not normalized."); process.exit(1); }
  console.log("Metadata UPSERT Contract V1 PASS");
}else{
  fs.writeFileSync(file,next);
  console.log("Metadata UPSERT Contract V1: updated "+file);
}
