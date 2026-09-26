import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dir = path.join(root, 'data/build-log/projects');
const stages = new Set(['discover','define','build','validate','ship','bookify','publish','distribute','measure','learn']);
const statuses = new Set(['idea','active','paused','shipped','published','archived']);
const required = ['projectId','title','problemStatement','persona0','stage','status','startedAt','decisions','evidence','releases','book','content','metrics'];
const errors = [];

if (!fs.existsSync(dir)) {
  errors.push('missing data/build-log/projects');
} else {
  const files = fs.readdirSync(dir).filter((name) => name.endsWith('.json')).sort();
  if (!files.length) errors.push('no build log project files found');

  for (const name of files) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
    } catch (error) {
      errors.push(`${name}: invalid JSON (${error.message})`);
      continue;
    }

    for (const key of required) {
      if (!(key in data)) errors.push(`${name}: missing ${key}`);
    }
    if (data.stage && !stages.has(data.stage)) errors.push(`${name}: invalid stage ${data.stage}`);
    if (data.status && !statuses.has(data.status)) errors.push(`${name}: invalid status ${data.status}`);
    if (data.projectId && !/^[a-z0-9-]+$/.test(data.projectId)) errors.push(`${name}: invalid projectId`);

    if (Array.isArray(data.decisions)) {
      data.decisions.forEach((item, index) => {
        if (!item?.date || !item?.decision || !item?.reason) {
          errors.push(`${name}: decisions[${index}] requires date/decision/reason`);
        }
      });
    }
  }
}

if (errors.length) {
  console.error('[build-log-v1] FAIL');
  errors.forEach((error) => console.error('- ' + error));
  process.exit(1);
}

console.log('[build-log-v1] PASS');
