const V="pid-v2",SHELL=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./legal.html"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V&&x!==V+"-img").map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{const r=e.request,u=new URL(r.url);
 if(r.method!=="GET"||u.pathname.startsWith("/api/"))return;
 if(u.origin===location.origin&&u.pathname.indexOf("/img/")>=0){e.respondWith(caches.open(V+"-img").then(ch=>ch.match(r).then(m=>m||fetch(r).then(x=>{if(x.ok)ch.put(r,x.clone());return x}))));return}
 if(u.origin===location.origin){e.respondWith(fetch(r).then(x=>{const c=x.clone();caches.open(V).then(ch=>ch.put(r,c));return x}).catch(()=>caches.match(r).then(m=>m||caches.match("./index.html"))))}
 else if(/\/sprites\//.test(u.pathname)||/\.(png|gif)$/.test(u.pathname)){e.respondWith(caches.open(V+"-img").then(ch=>ch.match(r).then(m=>m||fetch(r).then(x=>{if(x.ok)ch.put(r,x.clone());return x}))))}
});
