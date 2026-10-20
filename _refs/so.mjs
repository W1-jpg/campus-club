export const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
let jar={};
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export function ck(){return Object.entries(jar).map(([k,v])=>`${k}=${v}`).join('; ');}
function store(r){const sc=r.headers.getSetCookie?r.headers.getSetCookie():[];for(const c of sc){const [kv]=c.split(';');const i=kv.indexOf('=');if(i>0)jar[kv.slice(0,i).trim()]=kv.slice(i+1).trim();}}
export async function req(url,{referer='https://www.so.com/'}={}){
  const c=new AbortController();const to=setTimeout(()=>c.abort(),25000);
  const r=await fetch(url,{headers:{'User-Agent':UA,'Accept-Language':'zh-CN,zh;q=0.9','Accept':'text/html,application/xhtml+xml','Cookie':ck(),'Referer':referer},redirect:'follow',signal:c.signal});
  clearTimeout(to);store(r);return {status:r.status,url:r.url,text:await r.text()};
}
export function parse(t){
  const out=[];const blocks=t.split(/<li class="res-list/).slice(1);
  for(const b of blocks){
    const h=b.match(/<h3[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if(!h) continue;
    const strip=s=>s.replace(/<[^>]+>/g,'').replace(/&[a-z#0-9]+;/gi,' ').replace(/&nbsp;/g,' ').replace(/\s+/g,' ').trim();
    const d=b.match(/class="res-desc"[^>]*>([\s\S]*?)<\/(?:p|div|span)>/);
    out.push({url:h[1].replace(/&amp;/g,'&'),title:strip(h[2]),desc:d?strip(d[1]).slice(0,220):''});
  }
  return out;
}
export async function search(q){
  const r=await req('https://www.so.com/s?q='+encodeURIComponent(q));
  if(r.text.length<20000) return {blocked:true,status:r.status,len:r.text.length,results:[]};
  return {status:r.status,len:r.text.length,results:parse(r.text)};
}
