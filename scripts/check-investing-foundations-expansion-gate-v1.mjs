import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const state=JSON.parse(fs.readFileSync(path.join(root,'config','investing-foundations-release-state-v1.json'),'utf8'));
if(state.contract!=='JoyLab.InvestingFoundationsReleaseState') throw new Error('invalid release state contract');
if(state.expansionAllowed===true){console.log('Investing Foundations Expansion Gate PASS · expansion allowed');process.exit(0);}
const blocked=[];
const scan=(dir,predicate)=>{
 if(!fs.existsSync(dir)) return;
 for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  const p=path.join(dir,e.name);
  if(e.isDirectory()) scan(p,predicate);
  else if(predicate(p)) blocked.push(path.relative(root,p));
 }
};
scan(path.join(root,'src','data','articles'),p=>/^retirement-/i.test(path.basename(p)) || /live-evidence/i.test(path.basename(p)));
scan(path.join(root,'config'),p=>/live-evidence|retirement-series/i.test(path.basename(p)));
if(blocked.length){
 console.error('Investing Foundations Expansion Gate BLOCKED');
 blocked.forEach(x=>console.error('- '+x));
 console.error('Foundations production GOLD must be recorded before Live Evidence or Retirement expansion.');
 process.exit(1);
}
console.log('Investing Foundations Expansion Gate PASS · FOUNDATIONS_ONLY');
