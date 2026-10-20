import {get} from './lib.mjs';
const r=await get('https://www.so.com/s?q='+encodeURIComponent('site:cnki.com.cn 校园社团管理系统'),{minLen:0,retries:1});
console.log('len',r.text.length);
console.log(r.text.replace(/<script[\s\S]*?<\/script>/g,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,600));
