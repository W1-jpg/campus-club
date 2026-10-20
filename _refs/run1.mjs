import {search360,parse360,get,sleep} from './lib.mjs';
const r=await search360('site:cnki.com.cn 校园社团管理系统');
console.log('status',r.status,'len',r.text?.length, r.error||'');
const res=parse360(r.text||'');
console.log('results',res.length);
for(const x of res.slice(0,2)){
  console.log('\nTITLE:',x.title);
  await sleep(3000);
  const rr=await get(x.url,{minLen:0});
  console.log('  final:',(rr.url||'').slice(0,150),'HTTP',rr.status,'len',rr.text?.length);
}
