import {search,sleep} from './so.mjs';
const queries=process.argv.slice(2);
const all=[];
for(const q of queries){
  const r=await search(q);
  console.log(`\n### [${r.status} len=${r.len||r.text?.length}] ${q} -> ${r.results.length} results ${r.blocked?'BLOCKED':''}`);
  for(const x of r.results){ console.log('  -',x.title); all.push({q,...x}); }
  await sleep(12000);
}
import fs from 'fs'; fs.writeFileSync('candidates.json',JSON.stringify(all,null,1));
console.log('\nTOTAL',all.length);
