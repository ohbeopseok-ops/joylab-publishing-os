import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const articlesDir = path.join(root, 'src/data/articles');
const specsDir = path.join(root, 'config/company-compact-specs');
const targets = JSON.parse(await fs.readFile(path.join(root, 'config/company-compact-targets-v1.json'), 'utf8'));

const targetArticles = new Set((targets.targets || []).map((item) => item.articleId));
const specArticles = new Set();

try {
  for (const file of await fs.readdir(specsDir)) {
    if (!file.endsWith('.json')) continue;
    const spec = JSON.parse(await fs.readFile(path.join(specsDir, file), 'utf8'));
    if (spec.articleId) specArticles.add(spec.articleId);
  }
} catch {
  // no spec directory yet
}

const errors = [];
const files = (await fs.readdir(articlesDir)).filter((name) => name.endsWith('.md'));

for (const file of files) {
  const articleId = file.replace(/\.md$/, '');
  const source = await fs.readFile(path.join(articlesDir, file), 'utf8');
  const frontmatter = source.startsWith('---')
    ? source.slice(3, source.indexOf('\n---', 3) > 0 ? source.indexOf('\n---', 3) : source.length)
    : '';

  const isCompanyResearch = /^investmentResearchType:\s*["']?company["']?\s*$/m.test(frontmatter);
  if (!isCompanyResearch) continue;

  if (!targetArticles.has(articleId) && !specArticles.has(articleId)) {
    errors.push(
      articleId + ': company research must be enrolled through config/company-compact-specs/<article>.json'
    );
  }

  if (!/^investmentCompanies:\s*$/m.test(frontmatter)) {
    errors.push(articleId + ': company research must declare investmentCompanies');
  }

  if (!/^investmentIndustries:\s*$/m.test(frontmatter)) {
    errors.push(articleId + ': company research must declare investmentIndustries');
  }
}

if (errors.length) {
  console.error('Company Research Auto Enrollment FAIL');
  for (const error of errors) console.error('-', error);
  process.exit(1);
}

console.log(
  `Company Research Auto Enrollment PASS · registered=${targetArticles.size} specs=${specArticles.size}`
);
