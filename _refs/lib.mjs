export const H={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36','Accept-Language':'zh-CN,zh;q=0.9','Accept':'text/html,application/xhtml+xml'};
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function get(url,{retries=4,minLen=20000,headers={},redirect='follow'}={}){
 for(let i=0;i<retries;i++){
  try{
   const c=new AbortController();const to=setTimeout(()=>c.abort(),20000);
   const r=await fetch(url,{headers:{...H,...headers},redirect,signal:c.signal});clearTimeout(to);
   const t=await r.text();
   if(t.length>=minLen||minLen===0) return {status:r.status,url:r.url,text:t};
   if(i<retries-1){await sleep(2500*(i+1));continue;}
   return {status:r.status,url:r.url,text:t,short:true};
  }catch(e){ if(i<retries-1){await sleep(2500*(i+1));continue;} return {error:e.message}; }
 }
}
export function parse360(t){
 const out=[];const blocks=t.split(/<li class="res-list/).slice(1);
 for(const b of blocks){
  const h=b.match(/<h3[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
  if(!h) continue;
  const strip=s=>s.replace(/<[^>]+>/g,'').replace(/&[a-z#0-9]+;/g,' ').replace(/\s+/g,' ').trim();
  const d=b.match(/class="res-desc"[^>]*>([\s\S]*?)<\/(?:p|div|span)>/);
  out.push({url:h[1].replace(/&amp;/g,'&'),title:strip(h[2]),desc:d?strip(d[1]).slice(0,200):''});
 }
 return out;
}
export function search360(q){return get('https://www.so.com/s?q='+encodeURIComponent(q));}
