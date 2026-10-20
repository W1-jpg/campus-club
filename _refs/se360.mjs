import {sleep} from './lib.mjs';
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
let jar={};
function ck(){return Object.entries(jar).map(([k,v])=>`${k}=${v}`).join('; ');}
function store(r){const sc=r.headers.getSetCookie?r.headers.getSetCookie():[];for(const c of sc){const [kv]=c.split(';');const i=kv.indexOf('=');if(i>0)jar[kv.slice(0,i).trim()]=kv.slice(i+1).trim();}}
async function req(url){const r=await fetch(url,{headers:{'User-Agent':UA,'Accept-Language':'zh-CN,zh;q=0.9','Accept':'text/html','Cookie':ck(),'Referer':'https://www.so.com/'},redirect:'follow'});store(r);return {status:r.status,url:r.url,text:await r.text()};}
console.log('warming up...');
const h=await req('https://www.so.com/');
console.log('home',h.status,h.text.length,'cookies:',Object.keys(jar).join(','));
await sleep(8000);
const r=await req('https://www.so.com/s?q='+encodeURIComponent('site:cnki.com.cn 校园社团管理系统'));
console.log('search',r.status,r.text.length);
if(r.text.length<20000){console.log('BLOCKED TEXT:',r.text.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,200));}
else{
 const blocks=r.text.split(/<li class="res-list/).slice(1);
 console.log('blocks',blocks.length);
 for(const b of blocks.slice(0,7)){const m=b.match(/<h3[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);if(m)console.log(' *',m[2].replace(/<[^>]+>/g,'').trim().slice(0,90));}
}
