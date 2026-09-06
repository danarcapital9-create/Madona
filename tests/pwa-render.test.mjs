import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import vm from 'node:vm';
import {build} from 'esbuild';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('PWA scope excludes customer pages and has real maskable assets',()=>{const m=JSON.parse(read('public/desk/manifest.webmanifest'));assert.equal(m.scope,'/desk');assert.equal(m.start_url,'/desk');assert.equal(m.display,'standalone');for(const icon of m.icons)assert.ok(existsSync(new URL('../public'+icon.src,import.meta.url)));assert.ok(m.icons.some(i=>i.purpose==='maskable'));});
test('service worker never caches authenticated navigation or intercepts booking APIs',async()=>{
 const listeners={},cached=[];let networkFails=false;
 const cache={addAll:async urls=>cached.push(...urls)};
 vm.runInNewContext(read('public/desk-sw.js'),{self:{location:{origin:'https://test.local'},addEventListener:(name,fn)=>listeners[name]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},URL,caches:{open:async()=>cache,match:async url=>({offline:url}),keys:async()=>[],delete:async()=>{}},fetch:async()=>{if(networkFails)throw Error('offline');return {network:true};}});
 let task;listeners.install({waitUntil:p=>task=p});await task;assert.ok(cached.every(url=>url.startsWith('/desk/icons/')||url==='/desk/offline.html'));
 let intercepted=false;listeners.fetch({request:{url:'https://test.local/api/workspace',method:'GET'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
 listeners.fetch({request:{url:'https://test.local/api/booking',method:'POST'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
 const navigate=()=>{listeners.fetch({request:{url:'https://test.local/desk',method:'GET',mode:'navigate'},respondWith:p=>task=p});return task;};assert.equal((await navigate()).network,true);networkFails=true;assert.equal((await navigate()).offline,'/desk/offline.html');
});
const bundled=await build({entryPoints:['app/book/render-quality.ts'],bundle:true,write:false,format:'esm',platform:'node'});const {RenderQuality}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
test('render quality responds to sustained frame pressure, with hysteresis and bounded DPR',()=>{const q=new RenderQuality(1.75,1.5);for(let i=0;i<29;i++)q.sample(34);assert.equal(q.ratio,1.5);q.sample(34);assert.equal(q.ratio,1.25);for(let i=0;i<150;i++)q.sample(16.7);assert.equal(q.ratio,1.5);for(let i=0;i<300;i++)q.sample(16.7);assert.equal(q.ratio,1.75);const pressured=new RenderQuality(1.75,1.5);for(let i=0;i<30;i++)pressured.sample(140);assert.equal(pressured.ratio,1.25);const low=new RenderQuality(1,1.5);for(let i=0;i<100;i++)low.sample(40);assert.equal(low.ratio,1);});
test('analytic satin normals preserve the original displacement field',()=>{
 const field=(x,y,t,p,px)=>{const a=x*.83+y*.24+Math.sin(y*.32)*.9+t*.047+p*.65+px*.13;return Math.sin(a)*.69+Math.sin(a*2+.8)*.16+Math.sin(x*.31-y*.54+t*.026)*.17;};
 for(let x=-18;x<=18;x+=1.3)for(let y=-13;y<=13;y+=1.7){const t=14,p=.6,px=.1,a=x*.83+y*.24+Math.sin(y*.32)*.9+t*.047+p*.65+px*.13,b=x*.31-y*.54+t*.026,slope=Math.cos(a)*.69+Math.cos(a*2+.8)*.32,dx=slope*.83+Math.cos(b)*.0527,dy=slope*(.24+Math.cos(y*.32)*.288)-Math.cos(b)*.0918,h=.0001;assert.ok(Math.abs(dx-(field(x+h,y,t,p,px)-field(x-h,y,t,p,px))/(2*h))<1e-6);assert.ok(Math.abs(dy-(field(x,y+h,t,p,px)-field(x,y-h,t,p,px))/(2*h))<1e-6);}
});

const clientBundle=await build({entryPoints:['lib/client.ts'],bundle:true,write:false,format:'esm',platform:'node'});const {request:deskRequest}=await import('data:text/javascript;base64,'+Buffer.from(clientBundle.outputFiles[0].text).toString('base64'));
test('admin session denial invalidates displayed data even for an HTML access response',async()=>{const originalFetch=globalThis.fetch,originalWindow=globalThis.window;let event,redirect;globalThis.window={dispatchEvent:e=>{event=e.type;},location:{replace:path=>{redirect=path;}}};globalThis.fetch=async()=>new Response('<html>Forbidden</html>',{status:403});try{await assert.rejects(()=>deskRequest(),/سجّلي الدخول/);assert.equal(event,'madonna-auth-expired');assert.equal(redirect,'/desk');}finally{globalThis.fetch=originalFetch;globalThis.window=originalWindow;}});

test('quality protects high-refresh interaction after detecting a faster screen',()=>{const q=new RenderQuality(2.25,1.75,true);for(let i=0;i<20;i++)q.sample(8.34);for(let i=0;i<30;i++)q.sample(16.7);assert.equal(q.ratio,1.5);});
