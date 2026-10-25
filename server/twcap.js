// Ramene au meme etage (par defaut 700) tous les scores de la Tour superieurs, dans le classement.
// Usage : sudo ADMIN_KEY=... node /opt/pid/twcap.js [ETAGE]
const http=require('http'),KEY=process.env.ADMIN_KEY||'',PORT=process.env.PORT||3000,F=+process.argv[2]||700;
if(KEY.length<12){console.log('ADMIN_KEY manquante (12 caracteres min).');process.exit(1)}
const d=JSON.stringify({floor:F});
const r=http.request({host:'127.0.0.1',port:PORT,path:'/api/adm/twcap',method:'POST',headers:{'Content-Type':'application/json','X-Admin':KEY,'Content-Length':Buffer.byteLength(d)}},s=>{let x='';s.on('data',c=>x+=c);s.on('end',()=>console.log(x))});
r.on('error',e=>console.log('Erreur',e.message));r.write(d);r.end();
