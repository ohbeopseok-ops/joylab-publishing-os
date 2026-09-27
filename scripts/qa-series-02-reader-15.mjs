import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.QA_BASE_URL||'http://127.0.0.1:4321';
const outputDir=process.env.QA_OUTPUT_DIR||'qa-artifacts/series-02-reader-15';
await fs.mkdir(outputDir,{recursive:true});
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
  page.on('pageerror',(e)=>errors.push(String(e)));
  page.on('console',(msg)=>{if(msg.type()==='error'&&!msg.text().includes('[Report Only]'))errors.push(msg.text())});
  const response=await page.goto(baseURL+'/studio/demo',{waitUntil:'networkidle'});
  const sections=page.locator('.studio-chapter');
  const count=await sections.count();
  if(count!==15) failures.push(viewport.name+': chapter count '+count);

  for(let i=0;i<count;i++){
    const section=sections.nth(i);
    const type=await section.locator('form').getAttribute('data-form-type');
    if(type==='assessment'){
      await section.locator('.studio-choice').first().click();
      const textInputs=section.locator('input[type="text"]');
      for(let j=0;j<await textInputs.count();j++) await textInputs.nth(j).fill('Series 02 QA 기록 '+(i+1)+'-'+(j+1));
    } else if(type==='risk'){
      const selects=section.locator('select');
      for(let j=0;j<await selects.count();j++) await selects.nth(j).selectOption('1');
    } else {
      const textareas=section.locator('textarea');
      for(let j=0;j<await textareas.count();j++) await textareas.nth(j).fill('Series 02 QA Chapter '+String(i+1).padStart(2,'0')+' field '+(j+1));
    }
    await section.locator('button[type="submit"]').click();
  }

  await page.waitForTimeout(250);
  const before=await page.evaluate(()=>{
    const raw=localStorage.getItem('joylab-series-02-memory-debt-workbook-v1');
    const state=raw?JSON.parse(raw):{blocks:{}};
    return {
      saved:Object.keys(state.blocks||{}).length,
      completed:Object.values(state.blocks||{}).filter((v)=>v?.completed).length,
      progress:document.getElementById('studio-progress-label')?.textContent?.trim(),
      overflow:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-window.innerWidth
    };
  });

  await page.reload({waitUntil:'networkidle'});
  const after=await page.evaluate(()=>{
    const raw=localStorage.getItem('joylab-series-02-memory-debt-workbook-v1');
    const state=raw?JSON.parse(raw):{blocks:{}};
    return {
      saved:Object.keys(state.blocks||{}).length,
      completed:Object.values(state.blocks||{}).filter((v)=>v?.completed).length,
      progress:document.getElementById('studio-progress-label')?.textContent?.trim(),
      robots:document.querySelector('meta[name="robots"]')?.getAttribute('content'),
      overflow:Math.max(document.body.scrollWidth,document.documentElement.scrollWidth)-window.innerWidth
    };
  });

  const checks={
    httpOk:(response?.status()||0)<400,
    chapters15:count===15,
    saved15:before.saved===15&&after.saved===15,
    completed15:before.completed===15&&after.completed===15,
    progress15:after.progress==='15 / 15 완료',
    noOverflow:before.overflow<=1&&after.overflow<=1,
    noErrors:errors.length===0
  };
  const passed=Object.values(checks).every(Boolean);
  if(!passed) failures.push(viewport.name);
  report.push({viewport,checks,before,after,errors});
  await page.screenshot({path:path.join(outputDir,viewport.name+'.png'),fullPage:true});
  await context.close();
}
await browser.close();
await fs.writeFile(path.join(outputDir,'report.json'),JSON.stringify({baseURL,generatedAt:new Date().toISOString(),report},null,2));
if(failures.length){console.error('Series 02 Reader 15/15 GOLD QA failed: '+failures.join(', '));process.exit(1);}
console.log('Series 02 Reader 15/15 GOLD QA PASS');
