import fs from "node:fs";

const showcasePath="src/data/motion-studio/showcase-v1.json";
const casePath="src/data/motion-studio/cases/ai-infrastructure-bottleneck-gold-001.json";

const showcase=JSON.parse(fs.readFileSync(showcasePath,"utf8"));
const cs=JSON.parse(fs.readFileSync(casePath,"utf8"));
const errors=[];

const project=showcase.projects.find((p)=>p.id===cs.id);
if(!project) errors.push("case study project missing from showcase");

const gateGreen=["GREEN","SHOWCASE_GOLD"].includes(cs.creativeGate?.verdict);
const projectGold=project?.status==="GOLD";
const caseGold=cs.status==="GOLD";
const hasVideo=Boolean(project?.videoSrc && cs.finalVideo?.src);
const hasPublishDate=Boolean(project?.publishedAt);
const publicFlag=showcase.studio?.public===true;
const statusReady=showcase.studio?.status==="PUBLIC";

if(project?.videoSrc && cs.finalVideo?.src && project.videoSrc!==cs.finalVideo.src){
  errors.push("showcase videoSrc and case finalVideo.src drift");
}

if(publicFlag){
  if(!projectGold) errors.push("public studio requires showcase project GOLD");
  if(!caseGold) errors.push("public studio requires case study GOLD");
  if(!gateGreen) errors.push("public studio requires creative gate GREEN or SHOWCASE_GOLD");
  if(!hasVideo) errors.push("public studio requires real video src");
  if(!hasPublishDate) errors.push("public studio requires publishedAt");
  if(!statusReady) errors.push("public studio requires studio.status PUBLIC");
} else {
  if(statusReady) errors.push("studio.status PUBLIC while studio.public=false");
}

const result={
  version:"Motion Studio Release Gate V1",
  projectId:cs.id,
  checks:{
    projectGold,
    caseGold,
    creativeGate:cs.creativeGate?.verdict,
    hasVideo,
    hasPublishDate,
    publicFlag,
    studioStatus:showcase.studio?.status
  },
  verdict:errors.length?"BLOCKED":"PASS",
  errors
};

console.log(JSON.stringify(result,null,2));
if(errors.length) process.exit(1);
