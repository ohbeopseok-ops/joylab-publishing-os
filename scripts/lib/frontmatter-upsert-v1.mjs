const TOP=/^([A-Za-z0-9_-]+)\s*:/;

export function splitFrontmatter(source){
  const lines=source.split(/\r?\n/);
  if(lines[0]?.trim()!=="---") throw new Error("frontmatter start missing");
  const end=lines.slice(1).findIndex(l=>l.trim()==="---");
  if(end<0) throw new Error("frontmatter end missing");
  return {before:lines.slice(0,end+2), body:lines.slice(end+2), endIndex:end+1};
}

export function scanTopLevelKeys(source){
  const {before}=splitFrontmatter(source);
  const seen=new Map(), duplicates=[];
  for(let i=1;i<before.length-1;i++){
    const line=before[i];
    if(!line || /^\s/.test(line) || line.trimStart().startsWith("#")) continue;
    const m=line.match(TOP); if(!m) continue;
    const key=m[1];
    if(seen.has(key)) duplicates.push({key,firstLine:seen.get(key),duplicateLine:i+1});
    else seen.set(key,i+1);
  }
  return {seen,duplicates};
}

function encode(value){
  if(value===undefined) throw new Error("undefined metadata value");
  if(value instanceof Date) return JSON.stringify(value.toISOString().slice(0,10));
  return JSON.stringify(value);
}

export function upsertFrontmatter(source, patch){
  const {duplicates}=scanTopLevelKeys(source);
  if(duplicates.length) throw new Error("duplicate frontmatter keys: "+duplicates.map(d=>d.key).join(", "));
  const lines=source.split(/\r?\n/);
  const end=lines.slice(1).findIndex(l=>l.trim()==="---")+1;
  const starts=[];
  for(let i=1;i<end;i++){
    if(/^\s/.test(lines[i])) continue;
    const m=lines[i].match(TOP); if(m) starts.push({key:m[1],i});
  }
  starts.push({key:"__END__",i:end});
  for(const [key,value] of Object.entries(patch)){
    const pos=starts.findIndex(x=>x.key===key);
    const rendered=key+": "+encode(value);
    if(pos>=0){
      const start=starts[pos].i;
      const stop=starts[pos+1].i;
      lines.splice(start,stop-start,rendered);
      return upsertFrontmatter(lines.join("\n"),Object.fromEntries(Object.entries(patch).filter(([k])=>k!==key)));
    }
    lines.splice(end,0,rendered);
    return upsertFrontmatter(lines.join("\n"),Object.fromEntries(Object.entries(patch).filter(([k])=>k!==key)));
  }
  return lines.join("\n");
}
