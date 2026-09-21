import fs from 'node:fs/promises';

const read = (p) => fs.readFile(p, 'utf8');
const files = {
  base: await read('src/layouts/BaseLayout.astro'),
  mobile: await read('src/styles/mobile-ui-v1.css'),
  books: await read('src/styles/books.css'),
  contact: await read('src/styles/contact-v2.css'),
  footer: await read('src/components/SiteFooter.astro'),
  reader: await read('public/books/ax-customer-center/interactive.html'),
  v3: await read('docs/JOYLAB_DESIGN_SYSTEM_V3.md')
};

const checks = [];
const add = (id, ok, detail) => checks.push({ id, ok: Boolean(ok), detail });
const has = (text, needle) => text.includes(needle);
const tokenPx = (text, name) => {
  const m = text.match(new RegExp(name + '\\s*:\\s*(\\d+(?:\\.\\d+)?)px'));
  return m ? Number(m[1]) : null;
};

add('DS01_V3_DOC', has(files.v3, '# JOYLAB Design System V3'), 'V3 document must exist');
add('DS02_MOBILE_LAYER_IMPORT', has(files.base, "import '../styles/mobile-ui-v1.css';"), 'BaseLayout must import canonical mobile layer');
add('DS03_MOBILE_BREAKPOINT', has(files.mobile, '@media(max-width:640px)'), 'Canonical mobile breakpoint is 640px');
add('DS04_HEADER_HEIGHT_68', has(files.mobile, 'height:68px!important'), 'Mobile header contract is 68px');
add('DS05_HAMBURGER_44', has(files.mobile, 'width:44px!important') && has(files.mobile, 'height:44px!important'), 'Hamburger must be 44x44');
add('DS06_FULLSCREEN_NAV', has(files.mobile, 'position:fixed!important') && has(files.mobile, 'inset:68px 0 0 0!important'), 'Mobile nav must be fullscreen below header');
add('DS07_SCROLL_LOCK', has(files.base, "document.body.classList.toggle('nav-open'"), 'Menu must lock body scroll');
add('DS08_ACTIVE_ARIA', has(files.base, 'aria-current={') && has(files.mobile, 'a[aria-current="page"]'), 'Current navigation must use aria-current');
add('DS09_TOUCH_TOKEN', (tokenPx(files.mobile, '--m-touch') ?? 0) >= 48, '--m-touch must be >= 48px');
add('DS10_FORM_TOKEN', (tokenPx(files.mobile, '--m-form-control-h') ?? 0) >= 48 && has(files.contact, 'var(--contact-control-h)'), 'Form control token must be >=48px and wired');
add('DS11_FORM_FONT_16', has(files.mobile, 'font-size:16px!important'), 'Mobile form controls must be >=16px');
add('DS12_FOOTER_TOUCH', (tokenPx(files.mobile, '--m-footer-link-h') ?? 0) >= 44 && has(files.footer, 'var(--footer-link-min)'), 'Footer link target must be >=44px and tokenized');
add('DS13_BOOK_COVER_CONTAIN', /books-v2-(?:featured__cover|book__cover) img[\\s\\S]{0,220}object-fit:contain/.test(files.books), 'Book covers must use contain on mobile');
add('DS14_READER_TOUCH', has(files.reader, '--reader-control-hit: 44px') && has(files.reader, 'min-width: var(--reader-control-hit)'), 'Reader controls must preserve 44px hit target');
add('DS15_READER_CANONICAL', has(files.reader, '<meta name="robots" content="noindex,follow">') && has(files.reader, '<link rel="canonical" href="https://aijoylab.kr/books/ax-customer-center/">'), 'Reader SEO contract must remain noindex + canonical');

const failed = checks.filter((x) => !x.ok);
for (const check of checks) console.log((check.ok ? 'PASS ' : 'FAIL ') + check.id + ' — ' + check.detail);
if (failed.length) {
  console.error('Design Drift Gate failed: ' + failed.map((x) => x.id).join(', '));
  process.exit(1);
}
console.log('Design Drift Gate passed: ' + checks.length + '/' + checks.length);
