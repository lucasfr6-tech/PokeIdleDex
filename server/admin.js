// Outil d'administration PokeIdleDex. A lancer SUR LE SERVEUR : ADMIN_KEY=... node admin.js <#ID|uid> <commande> [args]
// Commandes : coin N | gem N | item NOM N | mon ID [shiny] | rmmon ID | set CHAMP VALEUR | reset | msg TEXTE | title ID | starter N
const http=require('http');
const KEY=process.env.ADMIN_KEY||'',PORT=process.env.PORT||3000;
if(KEY.length<12){console.log('ADMIN_KEY manquante (12 caracteres min).');process.exit(1)}
const pidOf=u=>{let h=2166136261;for(const c of String(u)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return '#'+(1000000+h%9000000)};
const rq=(m,p,b,h)=>new Promise((ok,ko)=>{const d=b?JSON.stringify(b):null;const r=http.request({host:'127.0.0.1',port:PORT,path:p,method:m,headers:Object.assign({'Content-Type':'application/json'},h||{})},s=>{let x='';s.on('data',c=>x+=c);s.on('end',()=>{try{ok(JSON.parse(x))}catch(e){ok({raw:x})}})});r.on('error',ko);if(d)r.write(d);r.end()});
(async()=>{
 const [,,who,op,...a]=process.argv;
 if(!who||!op){console.log('Usage: ADMIN_KEY=... node admin.js "#1234567" coin 100000');return}
 let uid=who;
 if(who[0]=='#'){const L=(await rq('GET','/api/c/lb?lim=500')).docs||[];const f=L.filter(x=>pidOf(x.id)==who);
  if(!f.length){console.log('Aucun joueur pour',who);return}
  if(f.length>1){console.log('Plusieurs joueurs pour',who,':',f.map(x=>x.id+' ('+(x.d&&x.d.n)+')').join(', '));return}
  uid=f[0].id;console.log('Joueur :',f[0].d&&f[0].d.n,'(uid',uid+')')}
 let c={op};
 if(op=='coin'||op=='gem')c.n=+a[0];
 else if(op=='item'){c.k=a[0];c.n=+a[1]||1}
 else if(op=='mon'){c.id=+a[0];c.sh=a.includes('shiny')?1:0}
 else if(op=='rmmon')c.id=+a[0];
 else if(op=='starter')c.n=+a[0]||1;
 else if(op=='set'){c.k=a[0];c.v=isNaN(+a[1])?a.slice(1).join(' '):+a[1]}
 else if(op=='msg')c.x=a.join(' ');
 else if(op=='title')c.id=a[0];
 else if(op!='reset'){console.log('Commande inconnue');return}
 c.i=Date.now().toString(36)+Math.random().toString(36).slice(2,5);c.t=Date.now();
 const cur=await rq('GET','/api/d/adm/'+uid);const L=((cur.d&&cur.d.c)||[]).slice(-40);L.push(c);
 const r=await rq('PUT','/api/d/adm/'+uid,{c:L},{'X-Token':KEY,'X-Admin':KEY});
 console.log(r.ok?'Ordre enregistre : sera applique a la prochaine connexion du joueur (ou sous 1 minute).':'Erreur '+JSON.stringify(r));
})();
