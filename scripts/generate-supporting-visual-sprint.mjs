import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const specsPath = path.join(root, 'src/data/supporting-visual-sprint.json');
const manifestPath = path.join(root, 'src/data/research-image-manifest.json');
const placementPath = path.join(root, 'src/data/research-visual-placement.json');
const outDir = path.join(root, 'public/images/research/supporting');
const specs = JSON.parse(fs.readFileSync(specsPath, 'utf8'));
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const placement = JSON.parse(fs.readFileSync(placementPath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });

const esc = (value = '') => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const palette = (id) => {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return [198 + hash % 24, 215 + hash % 18];
};

function flowSvg(id, spec) {
  const [hue, accent] = palette(id);
  const cards = spec.concepts.map((item, index) => {
    const x = 105 + index * 370;
    return `<g transform="translate(${x} 365)"><rect width="310" height="190" rx="30" fill="hsl(${hue} 58% ${13 + index * 2}%)" stroke="hsl(${accent} 92% 62%)" stroke-width="2"/><text x="34" y="60" fill="hsl(${accent} 95% 72%)" font-size="22" font-weight="700">STEP ${String(index + 1).padStart(2, '0')}</text><text x="155" y="125" text-anchor="middle" fill="#fff" font-size="35" font-weight="800">${esc(item)}</text></g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#06142d"/><stop offset="1" stop-color="hsl(${hue} 60% 16%)"/></linearGradient></defs><rect width="1600" height="900" fill="url(#bg)"/><g font-family="Arial,'Noto Sans KR',sans-serif"><text x="105" y="115" fill="hsl(${accent} 90% 70%)" font-size="26" font-weight="700" letter-spacing="4">JOYLAB · ${esc(spec.category)}</text><text x="105" y="205" fill="#fff" font-size="58" font-weight="800">${esc(spec.title)}</text><text x="105" y="270" fill="#9fb4d7" font-size="27">핵심 구조를 순서와 연결 관계로 읽습니다.</text>${cards}<path d="M415 460H475M785 460H845M1155 460H1215" stroke="#5aa2ff" stroke-width="9" stroke-linecap="round"/><text x="105" y="750" fill="#fff" font-size="30" font-weight="700">한 단계의 변화가 다음 단계에 전달되는 조건을 확인하세요.</text><text x="105" y="815" fill="#7389af" font-size="22">JOYLAB RESEARCH · STRUCTURE MAP</text></g></svg>`;
}

function checklistSvg(id, spec) {
  const [hue, accent] = palette(`${id}-check`);
  const rows = spec.checks.map((item, index) => `<g transform="translate(170 ${350 + index * 135})"><circle cx="35" cy="35" r="35" fill="hsl(${accent} 85% 55%)"/><text x="35" y="45" text-anchor="middle" fill="#fff" font-size="26" font-weight="800">${index + 1}</text><rect x="100" width="1160" height="72" rx="20" fill="hsl(${hue} 52% 16%)" stroke="hsl(${accent} 65% 50%)"/><text x="140" y="47" fill="#fff" font-size="31" font-weight="700">${esc(item)}</text></g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#07152f"/><g font-family="Arial,'Noto Sans KR',sans-serif"><text x="105" y="115" fill="hsl(${accent} 90% 70%)" font-size="26" font-weight="700" letter-spacing="4">JOYLAB · DECISION CHECK</text><text x="105" y="205" fill="#fff" font-size="58" font-weight="800">${esc(spec.title)} · 판단 기준</text><text x="105" y="270" fill="#9fb4d7" font-size="27">데이터를 결론으로 바꾸기 전에 세 가지를 점검합니다.</text>${rows}<text x="105" y="815" fill="#7389af" font-size="22">JOYLAB RESEARCH · ACTIONABLE CHECKLIST</text></g></svg>`;
}

function heroSvg(id, spec) {
  const [hue, accent] = palette(`${id}-hero`);
  const nodes = spec.concepts.map((item, index) => `<g transform="translate(${930 + (index % 2) * 290} ${250 + Math.floor(index / 2) * 250})"><rect width="245" height="165" rx="32" fill="hsl(${hue} 55% ${15 + index * 2}%)" stroke="hsl(${accent} 85% 58%)" stroke-width="3"/><text x="122" y="96" text-anchor="middle" fill="#fff" font-size="31" font-weight="800">${esc(item)}</text></g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#051127"/><stop offset="1" stop-color="hsl(${hue} 64% 18%)"/></linearGradient></defs><rect width="1600" height="900" fill="url(#bg)"/><g font-family="Arial,'Noto Sans KR',sans-serif"><text x="105" y="125" fill="hsl(${accent} 92% 70%)" font-size="27" font-weight="700" letter-spacing="4">${esc(spec.category)} · JOYLAB</text><text x="105" y="240" fill="#fff" font-size="64" font-weight="800">${esc(spec.title)}</text><text x="105" y="330" fill="#abc0e2" font-size="29">구조를 보고, 판단 기준을 세우고, 다음 행동으로 연결합니다.</text><rect x="105" y="450" width="620" height="170" rx="34" fill="#0d2857" stroke="#2d80ff"/><text x="155" y="515" fill="#8fb7ff" font-size="23" font-weight="700">DECISION LENS</text><text x="155" y="575" fill="#fff" font-size="32" font-weight="800">${esc(spec.checks[0])}</text>${nodes}<path d="M770 475C850 475 820 330 930 330M770 530C850 530 820 580 930 580" fill="none" stroke="#5aa2ff" stroke-width="7"/><text x="105" y="810" fill="#7289b1" font-size="22">JOYLAB RESEARCH · 생각을 분석하고, 분석을 실행으로.</text></g></svg>`;
}

for (const [id, spec] of Object.entries(specs)) {
  const flowName = `${id}-structure.svg`;
  const checkName = `${id}-decision-check.svg`;
  fs.writeFileSync(path.join(outDir, flowName), flowSvg(id, spec));
  fs.writeFileSync(path.join(outDir, checkName), checklistSvg(id, spec));
  const supporting = [
    { src: `/images/research/supporting/${flowName}`, alt: `${spec.title}의 핵심 구조도`, caption: `${spec.concepts.join(' → ')}의 연결 관계를 봅니다.` },
    { src: `/images/research/supporting/${checkName}`, alt: `${spec.title} 판단 체크리스트`, caption: `결론 전에 ${spec.checks.join(' · ')}를 확인합니다.` }
  ];
  manifest[id] = { ...(manifest[id] || {}), supporting };
  if (spec.hero) {
    const heroName = `${id}-hero.svg`;
    fs.writeFileSync(path.join(outDir, heroName), heroSvg(id, spec));
    manifest[id].hero = { src: `/images/research/supporting/${heroName}`, alt: `${spec.title}를 표현한 JoyLab 전용 Hero`, caption: `${spec.title}의 핵심 구조와 판단 기준을 한 화면에 정리합니다.` };
  }
  placement[id] = { supporting: spec.anchors.map((afterHeading, index) => ({ index, afterHeading })) };
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
fs.writeFileSync(placementPath, `${JSON.stringify(placement, null, 2)}\n`);
console.log(`Generated ${Object.keys(specs).length * 2 + Object.values(specs).filter((spec) => spec.hero).length} sprint visuals for ${Object.keys(specs).length} articles.`);
