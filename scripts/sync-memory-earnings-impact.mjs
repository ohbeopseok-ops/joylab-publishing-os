import fs from 'node:fs';
import assert from 'node:assert/strict';

const CONFIG='src/data/memory-earnings-source-config.json';
const OUTPUT='src/data/memory-earnings-snapshot.json';
const PUBLIC='public/data/memory-earnings-snapshot.json';
const SELF_TEST=process.argv.includes('--self-test');
const DRY_RUN=process.argv.includes('--dry-run');

const read=(p)=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,v)=>{fs.mkdirSync(p.split('/').slice(0,-1).join('/'),{recursive:true});fs.writeFileSync(p,JSON.stringify(v,null,2)+'\n','utf8');};

const clean=(html)=>String(html)
  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi,' ')
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi,' ')
  .replace(/<[^>]+>/g,' ')
  .replace(/&nbsp;/g,' ')
  .replace(/&amp;/g,'&')
  .replace(/\s+/g,' ')
  .trim();

export function parseSamsung(text){
  const ds=text.match(/DS Division posted KRW\s*([\d.]+)\s*trillion[^.]{0,120}?KRW\s*([\d.]+)\s*trillion in operating profit/i);
  const total=text.match(/Quarterly revenue of KRW\s*([\d.]+)\s*trillion, operating profit at KRW\s*([\d.]+)\s*trillion/i);
  return {
    quarter:'2026Q2',
    consolidatedRevenueT:Number(total?.[1]||0)||null,
    consolidatedOperatingProfitT:Number(total?.[2]||0)||null,
    dsRevenueT:Number(ds?.[1]||0)||null,
    dsOperatingProfitT:Number(ds?.[2]||0)||null,
    hbm4SalesScaled:/scaled up HBM4 sales/i.test(text),
    hbm4eSamplesShipped:/HBM4E samples to major customers/i.test(text),
    priceTailwind:/upward trend of prices also contributed/i.test(text)
  };
}

export function parseSkHynix(text){
  const current=text.match(/recorded\s*([\d.]+)\s*trillion won in revenues,\s*([\d.]+)\s*trillion won in operating profit\s*\(with an operating margin of\s*(\d+)%\)/i);
  const q1=text.match(/Q1 2026:\s*Revenue of\s*([\d.]+)\s*trillion won,\s*Operating Profit of\s*([\d.]+)\s*trillion won/i);
  return {
    quarter:'2026Q2',
    revenueT:Number(current?.[1]||0)||null,
    operatingProfitT:Number(current?.[2]||0)||null,
    operatingMarginPct:Number(current?.[3]||0)||null,
    q1RevenueT:Number(q1?.[1]||0)||null,
    q1OperatingProfitT:Number(q1?.[2]||0)||null,
    hbm4MassShipments:/began mass shipments of HBM4/i.test(text),
    dramNandPriceIncrease:/Both DRAM and NAND flash memory prices experienced significant quarter-over-quarter increases/i.test(text),
    aiHighValueMix:/high-value-added products, including HBM, DRAM for AI servers, and eSSD/i.test(text)
  };
}

async function fetchText(url){
  const res=await fetch(url,{headers:{'user-agent':'JoyLabResearchBot/1.0 (+https://aijoylab.kr/)'}});
  if(!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return clean(await res.text());
}

function derive(snapshot){
  const s=snapshot.companies.samsung;
  const h=snapshot.companies.skHynix;
  return {
    samsung:{
      memoryEarningsCondition:s.priceTailwind && s.dsOperatingProfitT ? 'STRONG_WITH_PRICE_TAILWIND':'WATCH',
      hbmExecution:s.hbm4SalesScaled && s.hbm4eSamplesShipped ? 'ADVANCING':'WATCH',
      nextNumbers:['DS operating profit','Memory revenue mix','HBM4/HBM4E shipment progress','DRAM/NAND ASP']
    },
    skHynix:{
      memoryEarningsCondition:h.dramNandPriceIncrease && h.operatingMarginPct>=50 ? 'STRONG_WITH_PRICE_TAILWIND':'WATCH',
      hbmExecution:h.hbm4MassShipments ? 'MASS_SHIPMENT':'WATCH',
      nextNumbers:['Operating margin','HBM revenue mix','HBM4 shipment ramp','DRAM/NAND ASP','Enterprise SSD mix']
    }
  };
}

function selfTest(){
  const s=parseSamsung('Quarterly revenue of KRW 171.5 trillion, operating profit at KRW 89.5 trillion. The DS Division posted KRW 127.5 trillion in consolidated revenue and KRW 89.2 trillion in operating profit for the second quarter. upward trend of prices also contributed. scaled up HBM4 sales and shipping HBM4E samples to major customers.');
  assert.equal(s.dsRevenueT,127.5); assert.equal(s.dsOperatingProfitT,89.2); assert.equal(s.hbm4SalesScaled,true);
  const h=parseSkHynix('recorded 79.3187 trillion won in revenues, 60.5426 trillion won in operating profit (with an operating margin of 76%). Q1 2026: Revenue of 52.5763 trillion won, Operating Profit of 37.6103 trillion won. Both DRAM and NAND flash memory prices experienced significant quarter-over-quarter increases. began mass shipments of HBM4. high-value-added products, including HBM, DRAM for AI servers, and eSSD');
  assert.equal(h.revenueT,79.3187); assert.equal(h.operatingMarginPct,76); assert.equal(h.hbm4MassShipments,true);
  console.log('Memory earnings adapter self-test PASS');
}
if(SELF_TEST){selfTest();process.exit(0);}

const config=read(CONFIG);
const samsungText=await fetchText(config.sources.samsung.url);
const skText=await fetchText(config.sources.skHynix.url);
const snapshot={
  version:'1.0',
  generatedAt:new Date().toISOString(),
  quarter:config.quarter,
  companies:{
    samsung:{...parseSamsung(samsungText),source:config.sources.samsung.url,sourceType:'OFFICIAL'},
    skHynix:{...parseSkHynix(skText),source:config.sources.skHynix.url,sourceType:'OFFICIAL'}
  }
};
snapshot.derived=derive(snapshot);
if(DRY_RUN){console.log(JSON.stringify(snapshot,null,2));process.exit(0);}
write(OUTPUT,snapshot);write(PUBLIC,snapshot);
console.log(`Memory earnings snapshot updated: ${snapshot.quarter}`);
