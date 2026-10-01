import fs from 'node:fs';

const failures = [];
const checks = [];

function assert(name, ok, detail) {
  checks.push({ name, ok, detail });
  if (!ok) failures.push(name + ': ' + detail);
}

const readerCssPath = 'src/styles/book-reader.css';
const designPath = 'docs/JOYLAB_DESIGN_SYSTEM_V3.md';
const skillPath = '.agents/skills/joylab-ui/SKILL.md';

for (const p of [readerCssPath, designPath, skillPath]) {
  assert('required file ' + p, fs.existsSync(p), p + ' must exist');
}

if (fs.existsSync(readerCssPath)) {
  const css = fs.readFileSync(readerCssPath, 'utf8');
  assert('reader focus-visible', css.includes(':focus-visible'), 'Reader must define visible keyboard focus');
  assert('reader reduced motion', css.includes('prefers-reduced-motion'), 'Reader must respect reduced motion');
  assert('reader mobile breakpoint', css.includes('@media(max-width:640px)'), '390px mobile path must be explicitly supported');
  assert('reader 44px controls', /min-width:44px;height:44px/.test(css), 'Toolbar controls must not fall below 44x44');
  assert('reader footer hit area', /book-reader-footer button[^}]*min-height:44px/.test(css), 'Footer controls need at least 44px height');
}

if (fs.existsSync(designPath)) {
  const design = fs.readFileSync(designPath, 'utf8');
  assert('design system touch contract', design.includes('44×44') || design.includes('44px'), 'Design system must retain minimum touch-target guidance');
  assert('design system reader contract', design.includes('Books Reader'), 'Design system must define Reader rules');
}

console.log(JSON.stringify({ checks, failures }, null, 2));
if (failures.length) process.exit(1);
