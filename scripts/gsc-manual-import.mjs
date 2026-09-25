import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const inputPath = path.resolve(root, arg("--input", "data/gsc/inbox"));
const outputPath = path.resolve(root, arg("--output", "data/gsc/latest.json"));
const historyDir = path.resolve(root, arg("--history", "data/gsc/history"));

const aliases = {
  page: ["top pages", "page", "pages", "url", "인기 페이지", "페이지", "상위 페이지", "인기페이지"],
  clicks: ["clicks", "클릭수", "클릭 수", "클릭"],
  impressions: ["impressions", "노출수", "노출 수", "노출"],
  ctr: ["ctr", "평균 ctr", "클릭률"],
  position: ["position", "average position", "avg position", "게재순위", "평균 게재순위", "평균 순위"],
};

function normalizeHeader(value) {
  return String(value ?? "").replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, " ");
}

function detectDelimiter(text) {
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const options = [",", "\t", ";"];
  return options.sort((a, b) => first.split(b).length - first.split(a).length)[0];
}

function parseCsv(text) {
  const delimiter = detectDelimiter(text);
  const rows = [];
  let row = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
      continue;
    }
    if (ch === '"') { quoted = true; continue; }
    if (ch === delimiter) { row.push(cell); cell = ""; continue; }
    if (ch === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = []; cell = "";
      continue;
    }
    cell += ch;
  }
  if (cell.length || row.length) { row.push(cell.replace(/\r$/, "")); rows.push(row); }
  return rows.filter(r => r.some(x => String(x).trim() !== ""));
}

function findColumn(headers, key) {
  const normalized = headers.map(normalizeHeader);
  for (const alias of aliases[key]) {
    const idx = normalized.indexOf(normalizeHeader(alias));
    if (idx >= 0) return idx;
  }
  return -1;
}

function numberValue(value) {
  const s = String(value ?? "").trim().replace(/,/g, "").replace(/%$/, "");
  if (!s) return 0;
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function normalizeUrl(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    let pathname = u.pathname.replace(/\/{2,}/g, "/");
    if (pathname.length > 1) pathname = pathname.replace(/\/$/, "");
    return `https://${host}${pathname}`;
  } catch {
    return raw.replace(/[?#].*$/, "").replace(/\/$/, "");
  }
}

function listCsvFiles(input) {
  if (!fs.existsSync(input)) throw new Error(`GSC input not found: ${input}`);
  const stat = fs.statSync(input);
  if (stat.isFile()) return input.toLowerCase().endsWith(".csv") ? [input] : [];
  return fs.readdirSync(input)
    .filter(name => name.toLowerCase().endsWith(".csv"))
    .map(name => path.join(input, name))
    .sort();
}

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function percentile(values, value) {
  const sorted = values.filter(Number.isFinite).sort((a,b)=>a-b);
  if (!sorted.length) return 0;
  if (sorted.length === 1) return value > 0 ? 1 : 0;
  let belowOrEqual = 0;
  for (const x of sorted) if (x <= value) belowOrEqual++;
  return (belowOrEqual - 1) / (sorted.length - 1);
}

const files = listCsvFiles(inputPath);
if (!files.length) throw new Error("No CSV files found. Export the Search Console Pages table as CSV.");

const aggregate = new Map();
const acceptedFiles = [];
const rejectedFiles = [];
const sourceChunks = [];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  sourceChunks.push(path.basename(file) + "\n" + text);
  const rows = parseCsv(text);
  if (rows.length < 2) { rejectedFiles.push({file:path.basename(file), reason:"empty"}); continue; }

  const headers = rows[0];
  const pageCol = findColumn(headers, "page");
  const clicksCol = findColumn(headers, "clicks");
  const impressionsCol = findColumn(headers, "impressions");
  const ctrCol = findColumn(headers, "ctr");
  const positionCol = findColumn(headers, "position");

  if (pageCol < 0 || clicksCol < 0 || impressionsCol < 0) {
    rejectedFiles.push({
      file:path.basename(file),
      reason:"not_page_performance_csv",
      headers
    });
    continue;
  }

  acceptedFiles.push(path.basename(file));
  for (const row of rows.slice(1)) {
    const url = normalizeUrl(row[pageCol]);
    if (!url) continue;
    const clicks = numberValue(row[clicksCol]);
    const impressions = numberValue(row[impressionsCol]);
    const ctrRaw = ctrCol >= 0 ? numberValue(row[ctrCol]) : 0;
    const position = positionCol >= 0 ? numberValue(row[positionCol]) : 0;

    const current = aggregate.get(url) ?? {
      url, clicks:0, impressions:0, positionWeighted:0, positionWeight:0, ctrReported:0, rows:0
    };
    current.clicks += clicks;
    current.impressions += impressions;
    const w = impressions > 0 ? impressions : (clicks > 0 ? clicks : 1);
    current.positionWeighted += position * w;
    current.positionWeight += w;
    current.ctrReported += ctrRaw;
    current.rows += 1;
    aggregate.set(url, current);
  }
}

if (!acceptedFiles.length) {
  throw new Error("No page-level GSC CSV recognized. Required columns: Page/Top pages + Clicks + Impressions.");
}

const scoringVersion = "traffic-v2";
const sourceHash = sha256(sourceChunks.join("\n---FILE---\n") + "\nSCORING=" + scoringVersion);
let manifest = {};
const manifestPath = fs.statSync(inputPath).isDirectory() ? path.join(inputPath, "import.json") : "";
if (manifestPath && fs.existsSync(manifestPath)) {
  try { manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8")); }
  catch { throw new Error("Invalid data/gsc/inbox/import.json"); }
}

const rawPages = [...aggregate.values()].map(x => ({
  url: x.url,
  clicks: x.clicks,
  impressions: x.impressions,
  ctr: x.impressions > 0 ? x.clicks / x.impressions : 0,
  position: x.positionWeight > 0 ? x.positionWeighted / x.positionWeight : 0,
}));

const positiveClickValues = rawPages.map(x=>x.clicks).filter(x=>x>0);
const impressionValues = rawPages.map(x=>x.impressions);

const pages = rawPages.map(x => {
  const clickPct = x.clicks > 0 ? percentile(positiveClickValues, x.clicks) : 0;
  const impressionPct = x.impressions > 0 ? percentile(impressionValues, x.impressions) : 0;
  const trafficScore = Math.round((clickPct * 6 + impressionPct * 4) * 10) / 10;
  return {...x, trafficScore};
}).sort((a,b)=>b.trafficScore-a.trafficScore || b.clicks-a.clicks || b.impressions-a.impressions);

const snapshot = {
  contract: "JoyLab GSC Manual Import V1",
  importedAt: new Date().toISOString(),
  sourceHash,
  sourceFiles: acceptedFiles,
  rejectedFiles,
  range: {
    startDate: manifest.startDate ?? null,
    endDate: manifest.endDate ?? null,
    status: manifest.startDate && manifest.endDate ? "DECLARED" : "UNKNOWN"
  },
  scoring: {
    version: "traffic-v2",
    formula: "positive-click percentile × 6 + impression percentile × 4; zero clicks = zero click points",
    maxScore: 10
  },
  totals: {
    pages: pages.length,
    clicks: pages.reduce((a,x)=>a+x.clicks,0),
    impressions: pages.reduce((a,x)=>a+x.impressions,0)
  },
  pages
};

fs.mkdirSync(path.dirname(outputPath), {recursive:true});
fs.mkdirSync(historyDir, {recursive:true});

let changed = true;
if (fs.existsSync(outputPath)) {
  try {
    const previous = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    if (previous.sourceHash === sourceHash) changed = false;
  } catch {}
}

if (changed) {
  fs.writeFileSync(outputPath, JSON.stringify(snapshot,null,2)+"\n");
  const stamp = snapshot.importedAt.replace(/[:.]/g,"-");
  fs.writeFileSync(path.join(historyDir, `${stamp}-${sourceHash.slice(0,10)}.json`), JSON.stringify(snapshot,null,2)+"\n");
}

console.log(JSON.stringify({
  changed,
  output: path.relative(root,outputPath),
  acceptedFiles,
  rejectedFiles: rejectedFiles.map(x=>x.file),
  range: snapshot.range,
  totals: snapshot.totals,
  topPages: pages.slice(0,10)
}, null, 2));
