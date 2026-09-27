import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseURL=process.env.QA_BASE_URL || 'http://127.0.0.1:4321';
const out=process.env.QA_OUTPUT_DIR || 'qa-artifacts/series-02-books-flow-v1';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true});
const failures=[];
const report=[];

const routes=[
  {path:'/books/work-to-system',markers:['업무를 시스템으로 바꾸는 법','웹 미리보기','Interactive Workbook','EPUB · PDF Release']},
  {path:'/studio/projects/series-02/preview/',markers:['Series 02','PREVIEW']},
  {path:'/studio/demo/',markers:['INTERACTIVE PUBLISHING STUDIO','15 완료']},
  {path:'/studio/releases/series-02/v1-0-0/',markers:['PUBLISHED RELEASE','15 / 15','EPUB3','Print PDF']}
];

for(const viewport of [
  {name:'mobile-390',width:390,height:844},
  {name:'desktop-1440',width:1440,height:900}
]){
  const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height}});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',msg=>{if(msg.type()==='error' && !msg.text().includes('[Report Only]')) errors.push(msg.text());});

  for(const route of routes){
    const res=await page.goto(baseURL+route.path,{waitUntil:'networkidle'});
    const status=res?.status()??0;
    if(status!==200) failures.push(viewport.name+': '+route.path+' status '+status);
    const body=await page.locator('body').innerText();
    for(const marker of route.markers){
      if(!body.includes(marker)) failures.push(viewport.name+': '+route.path+' missing marker '+marker);
    }
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    if(overflow>1) failures.push(viewport.name+': '+route.path+' horizontal overflow '+overflow+'px');
    report.push({viewport:viewport.name,path:route.path,status,overflow});
  }

  await page.goto(baseURL+'/books/work-to-system',{waitUntil:'networkidle'});
  const hrefs=await page.locator('.book-v2-actions a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')));
  for(const expected of ['/studio/projects/series-02/preview/','/studio/demo/','/studio/releases/series-02/v1-0-0/']){
    if(!hrefs.includes(expected)) failures.push(viewport.name+': landing CTA missing '+expected);
  }
  if(errors.length) failures.push(viewport.name+': runtime errors '+errors.join(' | '));
  await page.screenshot({path:path.join(out,viewport.name+'.png'),fullPage:true});
  await context.close();
}

await browser.close();
await fs.writeFile(path.join(out,'report.json'),JSON.stringify({failures,report},null,2)+'\n');
if(failures.length){console.error('Series 02 JoyLab Books Flow GOLD QA: FAIL');failures.forEach(x=>console.error('- '+x));process.exit(1);}
console.log('Series 02 JoyLab Books Flow GOLD QA: PASS');
