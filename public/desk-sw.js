const CACHE='madonna-desk-static-v1';
const STATIC=['/desk/offline.html','/desk/icons/icon-192.png','/desk/icons/icon-512.png','/desk/icons/maskable-512.png','/desk/icons/apple-touch-icon.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(STATIC)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('madonna-desk-static-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);if(request.method!=='GET'||url.origin!==self.location.origin)return;
 // Authenticated pages and API responses always use the network. No customer records in caches.
 if(STATIC.includes(url.pathname)){event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));return;}
 if(request.mode==='navigate'&&(url.pathname==='/desk'||url.pathname.startsWith('/desk/'))){event.respondWith(fetch(request).catch(()=>caches.match('/desk/offline.html')));}
});
