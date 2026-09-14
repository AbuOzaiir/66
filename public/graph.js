export function normalize(path) {
  const parts=[]; for(const bit of path.split('/')) { if(bit==='..') parts.pop(); else if(bit && bit!=='.') parts.push(bit); } return parts.join('/');
}
export function targets(text, sourcePath) {
  // Ignore fenced code and inline code; references in prose remain visible as references.
  const clean=text.replace(/^\s*(```|~~~)[\s\S]*?^\s*\1[^\n]*$/gm,'');
  const links=[];
  for(const m of clean.matchAll(/(?<!!)\[[^\]\n]*\]\(\s*(<[^>]+>|[^\s)]+)(?:\s+"[^"]*")?\s*\)/g)) links.push(m[1].replace(/^<|>$/g,''));
  const definitions=new Map([...clean.matchAll(/^\s*\[([^\]]+)\]:\s*<?([^\s>]+)>?/gm)].map(m=>[m[1].toLowerCase(),m[2]]));
  for(const m of clean.matchAll(/(?<!!)\[([^\]]+)\]\[([^\]]*)\]/g)) { const t=definitions.get((m[2]||m[1]).toLowerCase()); if(t) links.push(t); }
  const result=[];
  for(let link of links) {
    if(/^[a-z][a-z\d+.-]*:|^\/\/|^#/i.test(link)) continue;
    try { link=decodeURIComponent(link.split('#')[0].split('?')[0]); } catch {continue;}
    if(!/\.md$/i.test(link)) continue;
    result.push(normalize(link.startsWith('/')?link:sourcePath.split('/').slice(0,-1).concat(link).join('/')));
  }
  return [...new Set(result)];
}
export function relative(from,to) {
  const a=from.split('/').slice(0,-1),b=to.split('/'); while(a.length&&b.length&&a[0]===b[0]){a.shift();b.shift();} return [...a.map(()=>'..'),...b].map(encodeURIComponent).join('/');
}
export function appendLink(content,from,to) {
  if(targets(content,from).includes(to)) return content;
  return content.trimEnd()+ '\n\n['+to.split('/').pop().replace(/[\[\]]/g,'')+']('+relative(from,to)+')\n';
}
export function relationships(files) {
  const paths=new Map(files.map(f=>[f.path,f])); const edges=[],missing=[];
  for(const f of files) for(const path of targets(f.content||'',f.path)){const to=paths.get(path);if(to)edges.push({source:f.id,target:to.id});else missing.push({source:f.id,path});}return {edges,missing};
}
export function changes(current, older) {
 const a=current.split('\n'), b=older.split('\n');
 if(a.length*b.length>2000000){let s=0,e=0;while(s<a.length&&s<b.length&&a[s]===b[s])s++;while(e<a.length-s&&e<b.length-s&&a[a.length-1-e]===b[b.length-1-e])e++;return s===a.length&&s===b.length?[]:[{start:s,remove:a.slice(s,a.length-e),insert:b.slice(s,b.length-e)}];}
 const dp=Array.from({length:a.length+1},()=>new Uint32Array(b.length+1));
 for(let i=a.length-1;i>=0;i--)for(let j=b.length-1;j>=0;j--)dp[i][j]=a[i]===b[j]?1+dp[i+1][j+1]:Math.max(dp[i+1][j],dp[i][j+1]);
 let i=0,j=0,h=null;const out=[];while(i<a.length||j<b.length){if(i<a.length&&j<b.length&&a[i]===b[j]){if(h){out.push(h);h=null;}i++;j++;}else{h??={start:i,remove:[],insert:[]};if(j<b.length&&(i===a.length||dp[i][j+1]>dp[i+1][j]))h.insert.push(b[j++]);else h.remove.push(a[i++]);}}if(h)out.push(h);return out;
}
