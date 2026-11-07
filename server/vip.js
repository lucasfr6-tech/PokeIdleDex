// Donne (ou retire avec --retirer) le titre Discord Boost + bonus +10 % a des joueurs, par pseudo.
// Par defaut : simulation (liste seulement). Ajouter --go pour envoyer les ordres (appliques a leur prochaine connexion, ou sous 1 minute).
// Usage : sudo ADMIN_KEY=... node vip.js Pseudo1 Pseudo2 ... [--go] [--retirer]
const fs=require('fs'),http=require('http');
const KEY=process.env.ADMIN_KEY||'',PORT=process.env.PORT||3000,DATA=process.env.DATA_FILE||'/opt/pid/data.json';
const go=process.argv.includes('--go'),off=process.argv.includes('--retirer'),names=process.argv.slice(2).filter(x=>!x.startsWith('--')).map(x=>x.toLowerCase());
if(!names.length){console.log('Usage : sudo ADMIN_KEY=... node vip.js Pseudo1 Pseudo2 ... [--go] [--retirer]');process.exit(1)}
if(go&&KEY.length<12){console.log('ADMIN_KEY manquante (12 caracteres min).');process.exit(1)}
const rq=(m,p,b,h)=>new Promise((ok,ko)=>{const d=b?JSON.stringify(b):null;const r=http.request({host:'127.0.0.1',port:PORT,path:p,method:m,headers:Object.assign({'Content-Type':'application/json'},h||{})},s=>{let x='';s.on('data',c=>x+=c);s.on('end',()=>{try{ok(JSON.parse(x))}catch(e){ok({})}})});r.on('error',ko);if(d)r.write(d);r.end()});
(async()=>{
 const db=JSON.parse(fs.readFileSync(DATA,'utf8')),L=[];
 for(const q of names){const a=db.acc&&db.acc[q];if(a)L.push({n:a.n,uid:a.uid});else console.log('Introuvable :',q)}
 console.log(L.length+' compte(s) trouve(s) :');L.forEach(x=>console.log(' -',x.n,x.uid));
 if(!go){console.log('\nSimulation : rien envoye. Relance avec --go pour '+(off?'retirer':'donner')+' le Discord Boost.');return}
 let ok=0;
 for(const x of L){
  const c={op:'vip',n:off?0:1,i:Date.now().toString(36)+Math.random().toString(36).slice(2,5),t:Date.now()};
  const cur=await rq('GET','/api/d/adm/'+x.uid,null,{'X-Admin':KEY}),Q=((cur.d&&cur.d.c)||[]).slice(-40);Q.push(c);
  const r=await rq('PUT','/api/d/adm/'+x.uid,{c:Q},{'X-Token':KEY,'X-Admin':KEY});
  if(r.ok)ok++;else console.log('Erreur',x.n,JSON.stringify(r))}
 console.log(ok+'/'+L.length+' ordres enregistres.');
})();
