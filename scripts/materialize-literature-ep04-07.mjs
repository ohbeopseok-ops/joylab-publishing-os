import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const specs = [
  { dir:'assets/literature-ep04-07/ep04-metamorphosis', out:'public/images/leadership/literature/ep04-metamorphosis.webp', chunks:5, bytes:22606, sha256:'85f52e48e1d972db49569831691b0ecd1a3e1a48a91651242ce298713088a2c9' },
  { dir:'assets/literature-ep04-07/ep05-animal-farm', out:'public/images/leadership/literature/ep05-animal-farm.webp', chunks:5, bytes:22404, sha256:'a04c8fe8945c0d70c76caaeaeb9657250bba0649979cf2e988f4876cf790430f' },
  { dir:'assets/literature-ep04-07/ep06-1984', out:'public/images/leadership/literature/ep06-1984.webp', chunks:4, bytes:20054, sha256:'a59aca36345b3009793f00bb0747f73a12c49e78af424495cfe1d1a03db0e9b4' },
  { dir:'assets/literature-ep04-07/ep07-the-stranger', out:'public/images/leadership/literature/ep07-the-stranger.webp', chunks:4, bytes:20678, sha256:'0a8cf2eccfd358530675766bb6d7a73a5e88d7f8aec5ba42d3a6e666d5307499' },
];

for (const spec of specs) {
  const parts=[];
  for (let i=0;i<spec.chunks;i++) {
    const name=String(i).padStart(2,'0')+'.b64';
    parts.push((await fs.readFile(path.join(root,spec.dir,name),'utf8')).trim());
  }
  const buf=Buffer.from(parts.join(''),'base64');
  const digest=crypto.createHash('sha256').update(buf).digest('hex');
  if (buf.length!==spec.bytes) throw new Error(`${spec.out}: byte length mismatch ${buf.length} != ${spec.bytes}`);
  if (digest!==spec.sha256) throw new Error(`${spec.out}: sha256 mismatch ${digest}`);
  const target=path.join(root,spec.out);
  await fs.mkdir(path.dirname(target),{recursive:true});
  await fs.writeFile(target,buf);
  console.log(`Materialized literature hero: ${spec.out} (${buf.length} bytes, sha256 ${digest})`);
}
