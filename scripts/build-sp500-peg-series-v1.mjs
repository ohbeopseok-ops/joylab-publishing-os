import fs from 'node:fs';
import path from 'node:path';

const args=process.argv.slice(2);
const selfTest=args.includes('--self-test');
const getArg=(name, fallback)=>{const i=args.indexOf(name); return i>=0 && args[i+1] ? args[i+1] : fallback;};

function parseCsv(text){
  const lines=text.trim().split(/\r?\n/).filter(Boolean);
  if(!lines.length) return [];
  const headers=lines[0].split(',').map(s=>s.trim());
  return lines.slice(1).map(line=>{
    const values=line.split(',').map(s=>s.trim());
    return Object.fromEntries(headers.map((h,i)=>[h,values[i]??'']));
  });
}
function num(v){ if(v===''||v==null) return null; const n=Number(v); return Number.isFinite(n)?n:null; }
function round2(n){ return Math.round((n+Number.EPSILON)*100)/100; }

export function normalizeRow(row){
  const date=String(row.date||'').trim();
  const sourceProvider=String(row.source_provider||'').trim();
  const sourceTier=String(row.source_tier||'').trim();
  const sourceRef=String(row.source_ref||'').trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('invalid date: '+date);
  if(!sourceProvider) throw new Error(date+': missing source_provider');
  if(!sourceTier) throw new Error(date+': missing source_tier');
  if(!sourceRef) throw new Error(date+': missing source_ref');

  const forwardPe=num(row.forward_pe);
  const ltegPct=num(row.lteg_pct);
  let peg=num(row.peg);
  const derived=(forwardPe!=null && ltegPct!=null && ltegPct>0) ? round2(forwardPe/ltegPct) : null;
  if(peg==null && derived!=null) peg=derived;
  if(peg==null) throw new Error(date+': peg missing and not derivable');
  if(derived!=null && Math.abs(peg-derived)>0.02) throw new Error(date+': peg/component mismatch');

  const evidenceLevel=sourceTier==='licensed_numeric' ? 'GOLD' :
    (sourceTier==='chart_digitized'||sourceTier==='secondary_numeric') ? 'SILVER' : 'PENDING';
  if(evidenceLevel==='GOLD' && sourceTier!=='licensed_numeric') throw new Error(date+': invalid GOLD tier');

  return {
    date,
    peg:round2(peg),
    forward_pe:forwardPe,
    lteg_pct:ltegPct,
    source_provider:sourceProvider,
    source_tier:sourceTier,
    source_ref:sourceRef,
    evidence_level:evidenceLevel,
    derivation: row.peg ? 'reported' : 'forward_pe/lteg_pct'
  };
}
export function build(rows){
  const out=rows.map(normalizeRow).sort((a,b)=>a.date.localeCompare(b.date));
  const seen=new Set();
  for(const r of out){ if(seen.has(r.date)) throw new Error('duplicate date: '+r.date); seen.add(r.date); }
  return out;
}
function toCsv(rows){
  const h=['date','peg','forward_pe','lteg_pct','source_provider','source_tier','source_ref','evidence_level','derivation'];
  const esc=v=>String(v??'').includes(',')?JSON.stringify(String(v??'')):String(v??'');
  return [h.join(','),...rows.map(r=>h.map(k=>esc(r[k])).join(','))].join('\n')+'\n';
}
if(selfTest){
  const rows=build([
    {date:'2026-01-02',peg:'',forward_pe:'19.2',lteg_pct:'27',source_provider:'refinitiv_ibes',source_tier:'licensed_numeric',source_ref:'licensed:test'},
    {date:'2026-01-09',peg:'0.72',forward_pe:'',lteg_pct:'',source_provider:'yardeni_chart',source_tier:'chart_digitized',source_ref:'https://archive.yardeni.com/pub/stockmktperatio.pdf'}
  ]);
  if(rows[0].peg!==0.71 || rows[0].evidence_level!=='GOLD' || rows[1].evidence_level!=='SILVER') process.exit(2);
  let blocked=false; try{normalizeRow({date:'2026-01-10',peg:'0.7',source_provider:'x',source_tier:'chart_digitized',source_ref:''});}catch{blocked=true;}
  if(!blocked) process.exit(3);
  console.log('PASS S&P500 PEG Data Pipeline V1 self-test');
  process.exit(0);
}
const input=getArg('--input','data/valuation/sp500-peg-input.csv');
const outDir=getArg('--out','artifacts/valuation');
if(!fs.existsSync(input)){
  console.error('PENDING_DATA: input file not found: '+input);
  process.exit(4);
}
const rows=build(parseCsv(fs.readFileSync(input,'utf8')));
if(!rows.length){ console.error('PENDING_DATA: no observations'); process.exit(4); }
fs.mkdirSync(outDir,{recursive:true});
fs.writeFileSync(path.join(outDir,'sp500-peg-series.json'),JSON.stringify({contract:'S&P500 PEG Data Contract V1',generatedAt:new Date().toISOString(),rows},null,2)+'\n');
fs.writeFileSync(path.join(outDir,'sp500-peg-series.csv'),toCsv(rows));
const gold=rows.filter(r=>r.evidence_level==='GOLD').length;
const silver=rows.filter(r=>r.evidence_level==='SILVER').length;
console.log(JSON.stringify({observations:rows.length,gold,silver,status:gold===rows.length?'GOLD':'MIXED'},null,2));
