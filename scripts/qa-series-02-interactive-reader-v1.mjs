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

  let row={viewport:viewport.name,status:0,chapters:0,chapter15Persisted:false,progress:'',overflow:0,errors};
  try {
    const res=await page.goto(baseURL+'/studio/demo/',{waitUntil:'domcontentloaded',timeout:15000});
    row.status=res?.status()??0;
    if(row.status!==200) failures.push(viewport.name+': /studio/demo/ status '+row.status);

    const snapshot=await page.evaluate((viewportName)=>{
      const chapters=Array.from(document.querySelectorAll('.studio-chapter'));
      const chapterIds=chapters.map((node)=>node.id);
      const section=document.querySelector('[data-block-id="same-data-different-ui"]');
      const form=section?.querySelector('form');
      const textareas=section ? Array.from(section.querySelectorAll('textarea')) : [];

      textareas.forEach((field,index)=>{
        field.value='Series 02 GOLD QA '+viewportName+' field '+(index+1);
        field.dispatchEvent(new Event('input',{bubbles:true}));
        field.dispatchEvent(new Event('change',{bubbles:true}));
      });

      let submitted=false;
      if(form instanceof HTMLFormElement){
        form.requestSubmit();
        submitted=true;
      }

      return {
        chapterCount:chapters.length,
        chapterIds,
        sectionFound:!!section,
        formFound:form instanceof HTMLFormElement,
        fieldCount:textareas.length,
        submitted
      };
    },viewport.name);

    row.chapters=snapshot.chapterCount;
    if(snapshot.chapterCount!==15) failures.push(viewport.name+': expected 15 chapters, got '+snapshot.chapterCount);
    for(let i=1;i<=15;i++){
      const id='chapter-'+String(i).padStart(2,'0');
      if(!snapshot.chapterIds.includes(id)) failures.push(viewport.name+': missing #'+id);
    }
    if(!snapshot.sectionFound) failures.push(viewport.name+': chapter 15 block missing');
    if(!snapshot.formFound) failures.push(viewport.name+': chapter 15 form missing');
    if(snapshot.fieldCount<3) failures.push(viewport.name+': chapter 15 fields missing');
    if(!snapshot.submitted) failures.push(viewport.name+': chapter 15 submit did not run');

    await page.waitForTimeout(150);

    const state=await page.evaluate(()=>{
      let storage={};
      try { storage=JSON.parse(localStorage.getItem('joylab-series-02-memory-debt-workbook-v1')||'{}'); } catch {}
      const result=document.querySelector('[data-block-id="same-data-different-ui"] [data-result]');
      const progress=document.getElementById('studio-progress-label');
      return {
        persisted:!!storage?.blocks?.['same-data-different-ui']?.completed,
        resultText:result?.textContent||'',
        resultHidden:result instanceof HTMLElement ? result.hidden : true,
        progress:progress?.textContent||'',
        overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth
      };
    });

    row.chapter15Persisted=state.persisted;
    row.progress=state.progress;
    row.overflow=state.overflow;
    if(!state.persisted) failures.push(viewport.name+': chapter 15 localStorage persistence missing');
    if(state.resultHidden || !state.resultText.includes('저장 완료')) failures.push(viewport.name+': chapter 15 save result missing');
    if(!/^1 \/ 15 완료$/.test(state.progress.trim())) failures.push(viewport.name+': progress mismatch '+state.progress);
    if(state.overflow>1) failures.push(viewport.name+': horizontal overflow '+state.overflow+'px');
    if(errors.length) failures.push(viewport.name+': runtime errors '+errors.join(' | '));

    await page.screenshot({path:path.join(out,viewport.name+'.png'),fullPage:false});
  } catch(error) {
    failures.push(viewport.name+': '+String(error?.message||error));
    row.exception=String(error?.message||error);
  } finally {
    report.push(row);
    await context.close();
  }
}

await browser.close();
await fs.writeFile(path.join(out,'report.json'),JSON.stringify({failures,report},null,2)+'\n');
if(failures.length){console.error('Series 02 Interactive Reader 15/15 GOLD QA: FAIL');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('Series 02 Interactive Reader 15/15 GOLD QA: PASS');
