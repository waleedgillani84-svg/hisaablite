/* ============================================================
   Hisaab Pro Lite - Service Worker
   Version: 1.0
   ============================================================ */

const CACHE = 'hisaab-lite-v1.0';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(
    caches.open(CACHE).then(cache=>
      Promise.all(PRECACHE.map(u=>cache.add(u).catch(()=>null)))
    ).then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e=>{
  const req = e.request;
  const url = new URL(req.url);
  if(req.method!=='GET') return;
  if(!url.protocol.startsWith('http')) return;

  // Navigation → network first, fallback cached index.html
  if(req.mode==='navigate'){
    e.respondWith(
      fetch(req).then(r=>{
        const copy = r.clone();
        caches.open(CACHE).then(c=>c.put(req, copy));
        return r;
      }).catch(()=>
        caches.match('./index.html').then(c=>
          c || new Response('<h1>Offline</h1><p>Hisaab Lite offline hai. Dobara try karein.</p>',
            {status:503, headers:{'Content-Type':'text/html; charset=utf-8'}})
        )
      )
    );
    return;
  }

  // Static → cache first, background refresh
  e.respondWith(
    caches.match(req).then(hit=>{
      const fetchP = fetch(req).then(r=>{
        if(r && (r.ok || r.type==='opaque')){
          const copy = r.clone();
          caches.open(CACHE).then(c=>c.put(req, copy));
        }
        return r;
      }).catch(()=>null);
      return hit || fetchP.then(r=>r || new Response('', {status:503}));
    })
  );
});

self.addEventListener('message', e=>{
  if(e.data && e.data.type==='SKIP_WAITING') self.skipWaiting();
});