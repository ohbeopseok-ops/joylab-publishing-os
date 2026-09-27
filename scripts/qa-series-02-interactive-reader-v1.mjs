import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const out=process.env.QA_OUTPUT_DIR || 'qa-artifacts/series-02-interactive-reader-v1';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const failures=[];
const report=[];

for(const viewport of [
  {name:'mobile-390',width:390,height:844},
  {name:'desktop-1440',width:1440,height:900}
]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',msg=>{if(msg.type()==='error' && !msg.text().includes('[Report Only]')) errors.push(msg.text());});

  const res=await page.goto(baseURL+'/studio/demo/',{waitUntil:'networkidle'});
  if((res?.status()??0)!==200) failures.push(viewport.name+': /studio/demo/ status '+(res?.status()??0));

  const chapters=page.locator('.studio-chapter');
  const count=await chapters.count();
  if(count!==15) failures.push(viewport.name+': expected 15 chapters, got '+count);

  for(let i=1;i<=15;i++){
    const id='#chapter-'+String(i).padStart(2,'0');
    if(await page.locator(id).count()!==1) failures.push(viewport.name+': missing '+id);
  }

  const last=page.locator('#chapter-15');
  const fields=last.locator('textarea');
  const fieldCount=await fields.count();
  for(let i=0;i<fieldCount;i++) await fields.nth(i).fill('Series 02 GOLD QA '+viewport.name+' field '+(i+1));
  await last.locator('button[type="submit"]').click();
  await page.waitForTimeout(150);

  const resultText=await last.locator('[data-result]').innerText();
  if(!resultText.includes('저장 완료')) failures.push(viewport.name+': chapter 15 save result missing');

  const storage=await page.evaluate(()=>JSON.parse(localStorage.getItem('joylab-series-02-memory-debt-workbook-v1')||'{}'));
  if(!storage?.blocks?.['same-data-different-ui']?.completed) failures.push(viewport.name+': chapter 15 localStorage persistence missing');

  const progress=await page.locator('#studio-progress-label').innerText();
  if(!/^1 \/ 15 완료$/.test(progress)) failures.push(viewport.name+': progress mismatch '+progress);

  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
  if(overflow>1) failures.push(viewport.name+': horizontal overflow '+overflow+'px');
  if(errors.length) failures.push(viewport.name+': runtime errors '+errors.join(' | '));

  await page.screenshot({path:path.join(out,viewport.name+'.png'),fullPage:true});
  report.push({viewport:viewport.name,status:res?.status()??0,chapters:count,chapter15Persisted:!!storage?.blocks?.['same-data-different-ui']?.completed,progress,overflow,errors});
  await context.close();
}
await browser.close();
await fs.writeFile(path.join(out,'report.json'),JSON.stringify({failures,report},null,2)+'\n');
if(failures.length){console.error('Series 02 Interactive Reader 15/15 GOLD QA: FAIL');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('Series 02 Interactive Reader 15/15 GOLD QA: PASS');
