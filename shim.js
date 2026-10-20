/* PokeIdleDex : couche "classement en ligne" pour hébergement hors claude.ai. */
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
