import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const ARTICLES_DIR = path.resolve("src/data/articles");
const TOP_LEVEL_KEY = /^([A-Za-z0-9_-]+)\s*:/;

function inspectFrontmatter(filePath, source) {
  const lines = source.split(/\r?\n/);
  const issues = [];

  if (lines[0]?.trim() !== "---") {
    issues.push({ type: "missing-frontmatter-start", line: 1 });
    return issues;
  }

  const endIndex = lines.slice(1).findIndex((line) => line.trim() === "---");
  if (endIndex === -1) {
    issues.push({ type: "missing-frontmatter-end", line: 1 });
    return issues;
  }

  const frontmatter = lines.slice(1, endIndex + 1);
  const seen = new Map();

  for (let i = 0; i < frontmatter.length; i += 1) {
    const line = frontmatter[i];
    if (!line || /^\s/.test(line) || line.trimStart().startsWith("#")) continue;

    const match = line.match(TOP_LEVEL_KEY);
    if (!match) continue;

    const key = match[1];
    const lineNumber = i + 2;

    if (seen.has(key)) {
      issues.push({
        type: "duplicate-top-level-key",
        key,
        firstLine: seen.get(key),
        duplicateLine: lineNumber,
      });
    } else {
      seen.set(key, lineNumber);
    }
  }

  return issues;
}

const entries = (await readdir(ARTICLES_DIR, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
  .sort((a, b) => a.name.localeCompare(b.name));

const failures = [];

for (const entry of entries) {
  const filePath = path.join(ARTICLES_DIR, entry.name);
  const source = await readFile(filePath, "utf8");
  const issues = inspectFrontmatter(filePath, source);
  if (issues.length) failures.push({ file: path.relative(process.cwd(), filePath), issues });
}

console.log(`Frontmatter Integrity Gate V1: scanned ${entries.length} article files.`);

if (failures.length) {
  console.error(`Frontmatter Integrity Gate V1: BLOCKED (${failures.length} file(s)).`);
  for (const failure of failures) {
    console.error(`\n${failure.file}`);
    for (const issue of failure.issues) {
      if (issue.type === "duplicate-top-level-key") {
        console.error(
          `  - duplicate key "${issue.key}" at line ${issue.duplicateLine} (first defined at line ${issue.firstLine})`,
        );
      } else {
        console.error(`  - ${issue.type} near line ${issue.line}`);
      }
    }
  }
  process.exit(1);
}

console.log("Frontmatter Integrity Gate V1: PASS");
