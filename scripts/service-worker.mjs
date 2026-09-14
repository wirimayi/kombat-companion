import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
async function walk(dir){let paths=[];for(const item of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${item.name}`;paths.push(...(item.isDirectory()?await walk(p):[p]));}return paths;}
const files=(await walk('dist')).filter(f=>!f.includes('/ocr/')&&!f.endsWith('sw.js')).map(f=>'./'+f.slice(5));
const hash=createHash('sha256');for(const f of files)hash.update(await readFile('dist/'+f.slice(2)));
const version=hash.digest('hex').slice(0,12);
const ocrFiles=['./ocr/worker.min.js','./ocr/lang/eng.traineddata.gz',...(await readdir('dist/ocr/core')).filter(f=>f.includes('lstm')&&f.endsWith('.wasm.js')).map(f=>'./ocr/core/'+f)];
await writeFile('dist/sw.js',`
const APP='kombat-app-${version}', OCR='kombat-ocr-v1';
const FILES=${JSON.stringify(files)};
const OCR_FILES=${JSON.stringify(ocrFiles)};
self.addEventListener('install',event=>{event.waitUntil(caches.open(APP).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('kombat-app-')&&k!==APP).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const cache=await caches.open(url.pathname.includes('/ocr/')?OCR:APP);
  const hit=await cache.match(event.request);if(hit)return hit;
  try {const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}
  catch(error){if(event.request.mode==='navigate'){const fallback=await caches.match(new URL('./index.html',self.registration.scope));if(fallback)return fallback;}return new Response('Unavailable offline',{status:503});}
 })());
});
self.addEventListener('message',event=>{if(event.data?.type==='CACHE_OCR')event.waitUntil((async()=>{
 try {const cache=await caches.open(OCR);for(const path of OCR_FILES){const url=new URL(path,self.registration.scope);if(!await cache.match(url))await cache.add(url);}event.source?.postMessage({type:'OCR_CACHED'});}
 catch(error){event.source?.postMessage({type:'OCR_CACHE_ERROR'});}
})());});
`);
console.log('Offline app shell generated:',version);
