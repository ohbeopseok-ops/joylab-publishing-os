import assert from "node:assert/strict";
import { upsertFrontmatter, scanTopLevelKeys } from "./lib/frontmatter-upsert-v1.mjs";

const base=`---
title: "A"
updatedAt: 2026-10-01
author: "JoyLab"
---
## Body
`;
const updated=upsertFrontmatter(base,{updatedAt:"2026-10-06",authorBio:"Research",riskFactors:["A","B"]});
assert.equal((updated.match(/^updatedAt:/gm)||[]).length,1);
assert.match(updated,/updatedAt: "2026-10-06"/);
assert.match(updated,/authorBio: "Research"/);
assert.match(updated,/riskFactors: \["A","B"\]/);
assert.equal(scanTopLevelKeys(updated).duplicates.length,0);

assert.throws(()=>upsertFrontmatter(`---
title: A
updatedAt: 2026-10-01
updatedAt: 2026-10-02
---
x`,{updatedAt:"2026-10-06"}),/duplicate frontmatter keys/);

console.log("Metadata UPSERT Contract V1 PASS");
