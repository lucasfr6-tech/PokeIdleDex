// Retire un Pokemon (par defaut 90016 = Ronflex des Neiges) a TOUS les joueurs qui l'ont, en une fois.
// Par defaut : simulation (liste seulement). Ajouter --go pour envoyer les ordres.
// Usage : sudo ADMIN_KEY=... node rmmon-all.js [ID] [--go]
const fs=require('fs'),http=require('http');
const KEY=process.env.ADMIN_KEY||'',PORT=process.env.PORT||3000,DATA=process.env.DATA_FILE||'/opt/pid/data.json';
const go=process.argv.includes('--go'),id=+(process.argv.slice(2).find(x=>/^\d+$/.test(x))||90016);
if(go&&KEY.length<12){console.log('ADMIN_KEY manquante (12 caracteres min).');process.exit(1)}
const rq=(m,p,b,h)=>new Promise((ok,ko)=>{const d=b?JSON.stringify(b):null;const r=http.request({host:'127.0.0.1',port:PORT,path:p,method:m,headers:Object.assign({'Content-Type':'application/json'},h||{})},s=>{let x='';s.on('data',c=>x+=c);s.on('end',()=>{try{ok(JSON.parse(x))}catch(e){ok({})}})});r.on('error',ko);if(d)r.write(d);r.end()});
(async()=>{
 const db=JSON.parse(fs.readFileSync(DATA,'utf8')),L=[];
 for(const k in db.acc||{}){const a=db.acc[k];try{const G=JSON.parse(a.save);if(G.col&&G.col[id])L.push({n:a.n,uid:a.uid})}catch(e){}}
 console.log(L.length+' joueur(s) ont le Pokemon '+id+' :');L.forEach(x=>console.log(' -',x.n,x.uid));
 if(!go){console.log('\nSimulation : rien envoye. Relance avec --go pour le retirer a tous.');return}
 let ok=0;
 for(const x of L){
  const c={op:'rmmon',id,i:Date.now().toString(36)+Math.random().toString(36).slice(2,5),t:Date.now()};
  const cur=await rq('GET','/api/d/adm/'+x.uid),Q=((cur.d&&cur.d.c)||[]).slice(-40);Q.push(c);
  const r=await rq('PUT','/api/d/adm/'+x.uid,{c:Q},{'X-Token':KEY,'X-Admin':KEY});
  if(r.ok)ok++;else console.log('Erreur',x.n,JSON.stringify(r))}
 console.log(ok+'/'+L.length+' ordres enregistres (appliques a la prochaine connexion, ou sous 1 minute).');
})();
