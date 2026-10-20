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

/* PID_RANKINGS_UNIFIED_20261020 */
(function(){
 var css=`
 .rkx,.lbx,.pvfr{--pid-row:linear-gradient(110deg,#253b73,#131c3c)}
 .rkx-box,.lbx,.pvfr{overflow:visible!important}
 .rkx-l,.rkb-list-regular,#rkml,.lbl,.pvlist.full{display:flex!important;flex-direction:column!important;gap:10px!important}
 .pid-rank-podium,.rkb-podium{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;width:100%!important;align-items:stretch!important;margin:12px 0 22px!important}
 .pid-rank-podium{order:-1}
 .pid-rank-podium>.rkx-r,.pid-rank-podium>.rkm-w,.pid-rank-podium>.rkm-w>.rkx-r{min-width:0!important}
 .pid-rank-podium>.rkm-w,.pid-rank-podium>.rkx-r,.rkb-podium-card{height:auto!important;min-height:230px!important;max-height:none!important;border-radius:19px!important}
 .pid-rank-podium>.rkm-w>.rkx-r,.pid-rank-podium>.rkx-r{min-height:230px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:center!important;text-align:center!important;gap:9px!important;padding:20px 14px!important}
 .pid-rank-podium>.rkm-w>.rkx-r b,.pid-rank-podium>.rkx-r>b{font-size:21px!important;overflow:visible!important;white-space:normal!important;flex:none!important}
 .pid-rank-podium .rkx-n{width:40px!important;height:40px!important;font-size:18px!important}
 .pid-rank-podium .rkx-v{margin:0!important;align-items:center!important;font-size:23px!important}
 .pid-rank-podium .lav,.pid-rank-podium .rkm-r .lav{width:92px!important;height:92px!important}
 .pid-rank-podium .rkm-p{display:none}
 .pid-rank-podium .rkx-m{font-size:14px!important}
 .rkb-podium-card{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:flex-start!important;text-align:center!important;padding:18px 12px!important;gap:8px!important;min-width:0!important;position:relative}
 .rkb-podium>.rkb-place-1{grid-column:2;grid-row:1;border-color:#f9c84b!important;box-shadow:0 0 20px #f9c84b25}
 .rkb-podium>.rkb-place-2{grid-column:1;grid-row:1;border-color:#cbd5e1!important}
 .rkb-podium>.rkb-place-3{grid-column:3;grid-row:1;border-color:#cc925c!important}
 .rkb-podium-card .rkb-podium-sprite{height:112px!important;min-height:112px!important;display:grid!important;place-items:center!important}
 .rkb-podium-card .rkb-podium-sprite .hv{width:128px!important;height:128px!important}
 .rkb-podium-card .rkb-podium-sprite .hvi{max-width:128px!important;max-height:128px!important}
 .rkb-podium-card .rkb-podium-head{width:100%!important;display:flex!important;justify-content:space-between!important;gap:6px!important}
 .rkb-podium-card .rkb-podium-name{font-size:22px!important;line-height:1.15!important}
 .rkb-podium-card .rkb-podium-owner{font-size:13px!important}
 .rkb-podium-card .rkb-podium-tags{display:flex;justify-content:center;flex-wrap:wrap;gap:3px}
 .rkb-podium-card .rkb-podium-dps strong{font-size:25px!important}
 .rkx-r,.rkm-r,.pvrw2,.lbl>div,.rkb-large{position:relative!important;min-height:93px!important;padding:12px 17px!important;gap:15px!important;border-radius:16px!important;overflow:hidden;isolation:isolate}
 .rkx-r>b,.rkx-r .rkb-t>b,.rkm-r b,.pvrw2 .pvnm>b,.lbl b{font-size:18px!important;line-height:1.3!important}
 .rkx-r .rkx-v,.rkm-r .rkx-v,.pvrw2>strong{font-size:21px!important}
 .rkx-r .lav,.rkm-r .lav,.lbl .lav{width:74px!important;height:74px!important}
 .rkx-r .rkx-n{width:37px!important;height:37px!important;font-size:16px!important}
 .rkb-large .rkb-s{width:104px!important;height:104px!important}
 .rkb-large .rkb-s .hv{width:102px!important;height:102px!important}
 .rkb-large .rkb-s .hvi{max-width:102px!important;max-height:102px!important}
 .pid-bannered{color:#fff!important;text-shadow:0 1px 3px #020617b8;position:relative!important;isolation:isolate!important}.pid-bannered:before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(90deg,rgba(5,8,24,.40),rgba(5,8,24,.24) 60%,rgba(5,8,24,.48));border-radius:inherit}
 .pid-bannered:hover{filter:brightness(1.12)!important}
 .pid-bannered .rkx-v,.pid-bannered .rkb-podium-dps,.pid-bannered .pvnm,.pid-bannered .rkb-t{position:relative;z-index:1}
 .pid-rank-podium>:nth-child(1){border:2px solid #cbd5e1!important}
 .pid-rank-podium>:nth-child(2){border:2px solid #fbbf24!important}
 .pid-rank-podium>:nth-child(3){border:2px solid #cc925c!important}
 @media(max-width:700px){
 .pid-rank-podium,.rkb-podium{grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:6px!important}
 .pid-rank-podium>.rkm-w,.pid-rank-podium>.rkx-r,.rkb-podium-card{min-height:180px!important;padding:9px 4px!important}
 .pid-rank-podium>.rkm-w>.rkx-r,.pid-rank-podium>.rkx-r{min-height:180px!important;padding:9px 4px!important}
 .pid-rank-podium .lav{width:56px!important;height:56px!important}
 .pid-rank-podium .rkx-v{font-size:15px!important}
 .pid-rank-podium .rkx-r>b,.pid-rank-podium .rkm-r b{font-size:13px!important}
 .rkb-podium-card .rkb-podium-sprite{height:76px!important;min-height:76px!important}
 .rkb-podium-card .rkb-podium-sprite .hv{width:72px!important;height:72px!important}
 .rkb-podium-card .rkb-podium-sprite .hvi{max-width:72px!important;max-height:72px!important}
 .rkb-podium-card .rkb-podium-name{font-size:14px!important}
 .rkb-podium-card .rkb-podium-owner{font-size:10px!important}
 .rkb-podium-card .rkb-podium-dps strong{font-size:16px!important}
 .rkb-podium-card .rkb-open{display:none!important}
 .rkx-r,.rkm-r,.pvrw2,.rkb-large{padding:8px!important;gap:8px!important;min-height:74px!important}
 .rkx-r .lav{width:53px!important;height:53px!important}
 .rkx-r>b,.rkx-r .rkb-t>b,.rkm-r b,.pvrw2 .pvnm>b{font-size:14px!important}
 .rkx-r .rkx-v,.pvrw2>strong{font-size:15px!important}
 .rkb-large .rkb-s{width:60px!important;height:60px!important}
 .rkb-large .rkb-s .hv{width:58px!important;height:58px!important}
 .rkb-large .rkb-s .hvi{max-width:58px!important;max-height:58px!important}
 }
 `;
 function boot(){
  if(document.getElementById("pid-unified-rank-css"))return;
  var st=document.createElement("style");st.id="pid-unified-rank-css";st.textContent=css;document.head.appendChild(st);
  function banner(n){try{if(!Number.isInteger(+n)||+n<0||!BAN[+n])return null;return BAN[+n].css||null}catch(e){return null}}
  function apply(el,n){if(!el)return;var b=banner(n);if(!b)return;if(el.dataset.pidBanner===String(n))return;el.dataset.pidBanner=String(n);el.style.setProperty("background",b,"important");el.classList.add("pid-bannered")}
  function owners(){
   var m=new Map();
   try{lbRows().forEach(r=>m.set(String(r.id),r))}catch(e){}
   try{RKM.rows.forEach(r=>m.set(String(r.id),r))}catch(e){}
   try{RKB.rows.forEach(r=>m.set(String(r.id),r))}catch(e){}
   try{var me=lbDoc();m.set(String(LB.uid||"me"),Object.assign({id:LB.uid||"me"},me))}catch(e){}
   return m;
  }
  function rank(){
   var root=document.querySelector(".rkx"),main=document.getElementById("rkbl");
   if(!root&&!main&&!document.querySelector(".lbx"))return;
   var m=owners();
   function decorate(el,r){if(r&&r.ban!==undefined&&r.ban!==null)apply(el,r.ban)}
   document.querySelectorAll(".rkx-r[data-t],.pod[data-t],.pvpd[data-t],.pvrw2[data-t]").forEach(el=>decorate(el,m.get(String(el.dataset.t))));
   document.querySelectorAll(".rkm-w[data-rkw]").forEach(el=>decorate(el.querySelector(".rkm-r"),m.get(String(el.dataset.rkw))));
   document.querySelectorAll("#rkbl>.rkb-r").forEach((el,i)=>{var r=null;try{r=rkbRows()[i]}catch(e){}decorate(el,r)});
   document.querySelectorAll(".rkb-podium-card,.rkb-large").forEach(el=>{var idx=+(el.dataset.bpr||0);var r=null;try{r=rkbRows()[idx]}catch(e){}decorate(el,r)});
   document.querySelectorAll(".pid-rank-podium>.rkb-r").forEach(el=>decorate(el,m.get(String(el.dataset.t))));
   document.querySelectorAll(".rkx-l").forEach(list=>{
    if(list.id==="rkbl"||list.querySelector(":scope > .pid-rank-podium"))return;
    var rows=Array.from(list.children).filter(el=>el.classList.contains("rkx-r")||el.classList.contains("rkm-w"));
    if(rows.length<3)return;
    var pod=document.createElement("div");pod.className="pid-rank-podium";
    pod.append(rows[1],rows[0],rows[2]);list.insertBefore(pod,list.firstChild);
   });
  }
  var pending=false;function queue(){if(pending)return;pending=true;setTimeout(function(){pending=false;try{rank()}catch(e){}},120)}
  new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
  queue();
 }
 if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();
