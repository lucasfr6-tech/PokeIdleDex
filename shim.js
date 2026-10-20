/* PokeIdleDex : couche "classement en ligne" pour hébergement hors claude.ai.
   Si le serveur est injoignable, le jeu fonctionne normalement en solo. */
(function(){
 if(window.claude&&window.claude.use)return;
 var API=(window.PID_API!=null?window.PID_API:"").replace(/\/$/,"");
 function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
 function rnd(n){var a=new Uint8Array(n),s="";(window.crypto||{getRandomValues:function(x){for(var i=0;i<x.length;i++)x[i]=Math.random()*256}}).getRandomValues(a);for(var i=0;i<n;i++)s+=("0"+a[i].toString(16)).slice(-2);return s}
 var uid=ls("pid_uid"),tok=ls("pid_tok");
 if(!uid||!tok){uid="u"+rnd(10);tok=rnd(24);ls("pid_uid",uid);ls("pid_tok",tok)}
 var up=null;
 function ping(){if(up!==null)return Promise.resolve(up);return fetch(API+"/api/health",{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){up=!!(j&&j.ok);return up}).catch(function(){up=false;return false})}
 function jget(u){return fetch(API+u,{cache:"no-store"}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})}
 function mkDoc(id,d){return{id:id,exists:!!d,data:function(){return d?JSON.parse(JSON.stringify(d)):undefined},metadata:{}}}
 function Q(col,f,ob,lim){
  var q={where:function(a,op,v){return Q(col,[a,v],ob,lim)},orderBy:function(a,dir){return Q(col,f,[a,dir||"asc"],lim)},limit:function(n){return Q(col,f,ob,n)},
   get:function(){var u="/api/c/"+col+"?lim="+(lim||200);if(f)u+="&f="+encodeURIComponent(f[0])+"&v="+encodeURIComponent(f[1]);if(ob)u+="&ob="+encodeURIComponent(ob[0])+"&dir="+ob[1];
    return jget(u).then(function(j){var L=j.docs.map(function(x){return mkDoc(x.id,x.d)});return{docs:L,size:L.length,empty:!L.length}})},
   onSnapshot:function(ok,err){var alive=true,t=null,run=function(){if(!alive)return;if(document.hidden){t=setTimeout(run,20000);return}q.get().then(function(s){if(alive)ok(s)}).catch(function(e){if(err&&alive)err(e)}).then(function(){if(alive)t=setTimeout(run,20000)})};run();return function(){alive=false;clearTimeout(t)}}};
  return q}
 var db={collection:function(c){return Q(c,null,null,null)},
  doc:function(p){var a=p.split("/"),c=a[0],id=a[1];return{
   get:function(){return jget("/api/d/"+c+"/"+encodeURIComponent(id)).then(function(j){return mkDoc(id,j.exists?j.d:null)})},
   set:function(d){return fetch(API+"/api/d/"+c+"/"+encodeURIComponent(id),{method:"PUT",headers:{"Content-Type":"application/json","X-Token":tok},body:JSON.stringify(Object.assign({},d,{ep:window.PID_EP||""}))}).then(function(r){if(!r.ok)throw new Error(r.status)})}}}};
 var user={id:function(){return Promise.resolve(uid)}};
 var dl={save:function(o){return new Promise(function(res,rej){try{var a=document.createElement("a");a.href=URL.createObjectURL(new Blob([o.data],{type:"text/plain"}));a.download=o.filename||"sauvegarde.txt";document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},500);res()}catch(e){rej(e)}})}};
 window.claude={use:function(n){
  if(n==="db")return ping().then(function(ok){return ok?db:null});
  if(n==="user")return ping().then(function(ok){return ok?user:null});
  if(n==="downloads")return Promise.resolve(dl);
  return Promise.resolve(null)}};
})();


/* PID_BEST_PODIUM_20261020 */
(function(){
  var css=`
  /* Classement Meilleur Pokémon : podium 3 premiers + grandes lignes */
  #rkbl.rkx-l{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:stretch;gap:12px;margin-top:15px}
  #rkbl>.rkb-r{grid-column:1/-1;position:relative;min-height:102px;display:flex;align-items:center;gap:20px;padding:14px 22px;border-radius:18px}
  #rkbl>.rkb-r .rkx-n{flex:none;font-size:17px;font-weight:900}
  #rkbl>.rkb-r .rkb-s{width:92px;height:92px;flex:none;overflow:visible}
  #rkbl>.rkb-r .rkb-s .hv{width:88px!important;height:88px!important}
  #rkbl>.rkb-r .rkb-s .hvi{max-width:88px!important;max-height:88px!important}
  #rkbl>.rkb-r .rkb-t{min-width:0;flex:1}
  #rkbl>.rkb-r .rkb-t>b{display:block;font-size:20px;line-height:1.25;white-space:normal}
  #rkbl>.rkb-r .rkb-t>small{display:block;font-size:13px;margin:3px 0 5px}
  #rkbl>.rkb-r .rkb-vb{display:flex;gap:4px;flex-wrap:wrap}
  #rkbl>.rkb-r .rkb-v{margin-left:auto;flex:none;font-size:19px;font-weight:900;white-space:nowrap}
  #rkbl>.rkb-r .rkb-v small{display:block;font-size:11px;text-align:right}
  #rkbl>.rkb-r:nth-child(-n+3){grid-column:auto;display:flex;flex-direction:column;justify-content:center;gap:8px;min-height:315px;text-align:center;padding:20px 10px;border:2px solid rgba(255,255,255,.25);background:linear-gradient(180deg,rgba(55,71,145,.35),rgba(10,15,42,.95))}
  #rkbl>.rkb-r:nth-child(1){border-color:#f7bd30;background:linear-gradient(180deg,rgba(190,128,20,.35),rgba(10,15,42,.97));box-shadow:0 0 25px #f7bd3020}
  #rkbl>.rkb-r:nth-child(2){border-color:#bfcbe6}
  #rkbl>.rkb-r:nth-child(3){border-color:#cf8855}
  #rkbl>.rkb-r:nth-child(-n+3) .rkx-n{font-size:19px}
  #rkbl>.rkb-r:nth-child(-n+3) .rkb-s{width:140px;height:140px}
  #rkbl>.rkb-r:nth-child(-n+3) .rkb-s .hv{width:136px!important;height:136px!important}
  #rkbl>.rkb-r:nth-child(-n+3) .rkb-s .hvi{max-width:136px!important;max-height:136px!important}
  #rkbl>.rkb-r:nth-child(-n+3) .rkb-t{flex:none;width:100%}
  #rkbl>.rkb-r:nth-child(-n+3) .rkb-t>b{font-size:23px}
  #rkbl>.rkb-r:nth-child(-n+3) .rkb-vb{justify-content:center}
  #rkbl>.rkb-r:nth-child(-n+3) .rkb-v{margin:0;font-size:23px}
  #rkbl>.rkb-r:nth-child(-n+3) .rkb-v small{text-align:center}
  #rkbl>.rkb-r{cursor:pointer}
  #rkbl>.rkb-r:hover{filter:brightness(1.16);border-color:var(--y)}
  @media(max-width:800px){#rkbl.rkx-l{grid-template-columns:1fr}#rkbl>.rkb-r:nth-child(-n+3){grid-column:1;min-height:220px}#rkbl>.rkb-r:nth-child(-n+3) .rkb-s{width:105px;height:105px}#rkbl>.rkb-r:nth-child(-n+3) .rkb-s .hv{width:100px!important;height:100px!important}#rkbl>.rkb-r:nth-child(-n+3) .rkb-s .hvi{max-width:100px!important;max-height:100px!important}}
  @media(max-width:520px){#rkbl>.rkb-r{padding:10px;gap:9px;min-height:88px}#rkbl>.rkb-r .rkb-s{width:70px;height:70px}#rkbl>.rkb-r .rkb-s .hv{width:68px!important;height:68px!important}#rkbl>.rkb-r .rkb-s .hvi{max-width:68px!important;max-height:68px!important}#rkbl>.rkb-r .rkb-t>b{font-size:16px}#rkbl>.rkb-r .rkb-v{font-size:15px}}
  `;
  var s=document.createElement("style");s.id="pid-best-podium-style";s.textContent=css;(document.head||document.documentElement).appendChild(s);
})();
