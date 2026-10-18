// Idle Dex - mini serveur (aucune dépendance). Sert le jeu ET le classement/amis/chat/boss monde.
// Lancer : node server.js   (variables : PORT, DATA_FILE, ALLOWED_ORIGIN, STATIC_DIR)
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=+process.env.PORT||3000,DATA=process.env.DATA_FILE||path.join(__dirname,'data.json');
const ORIGIN=process.env.ALLOWED_ORIGIN||'*',STATIC=process.env.STATIC_DIR||path.join(__dirname,'..');
const COLS={lb:1,fr:1,chat:1,wb:1,pvp:1,twr:1,gld:1,glm:1},MAXSAVE=4000000,MAXDOC=16384,MAXDOCS=50000,ID=/^[A-Za-z0-9_-]{6,64}$/;
let db={};try{db=JSON.parse(fs.readFileSync(DATA,'utf8'))}catch(e){db={}}
for(const c in COLS)db[c]=db[c]||{};
db.acc=db.acc||{};
const pwh=(pw,salt)=>crypto.scryptSync(String(pw),salt,32).toString('hex');
const NAME=/^[\p{L}\p{N}_ -]{2,16}$/u;
let dirty=0;const flush=()=>{if(!dirty)return;dirty=0;try{fs.writeFileSync(DATA+'.tmp',JSON.stringify(db));fs.renameSync(DATA+'.tmp',DATA)}catch(e){console.error('save',e.message)}};
setInterval(flush,5000);process.on('SIGTERM',()=>{flush();process.exit(0)});process.on('SIGINT',()=>{flush();process.exit(0)});
const hits=new Map();setInterval(()=>hits.clear(),60000);
const limited=(ip,n)=>{const v=(hits.get(ip)||0)+1;hits.set(ip,v);return v>n};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const send=(res,code,obj,extra)=>{const b=JSON.stringify(obj);res.writeHead(code,Object.assign({'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Headers':'Content-Type,X-Token','Access-Control-Allow-Methods':'GET,PUT,POST,OPTIONS','Cache-Control':'no-store'},extra));res.end(b)};
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.webmanifest':'application/manifest+json','.json':'application/json','.svg':'image/svg+xml','.txt':'text/plain'};
const clean=v=>{if(typeof v=='string')return v.slice(0,2000);if(Array.isArray(v))return v.slice(0,500).map(clean);if(v&&typeof v=='object'){const o={};for(const k of Object.keys(v).slice(0,200)){if(k=='__proto__'||k=='constructor'||k=='prototype')continue;o[k]=(k=='ai'&&typeof v[k]=='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]*$/.test(v[k]))?v[k].slice(0,9000):clean(v[k])}return o}return v};
http.createServer((req,res)=>{
 const u=new URL(req.url,'http://x'),ip=(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();
 if(req.method=='OPTIONS'){send(res,204,{});return}
 if(u.pathname=='/api/health'){send(res,200,{ok:1,docs:Object.keys(COLS).reduce((a,c)=>a+Object.keys(db[c]).length,0)});return}

 if(u.pathname.startsWith('/api/acc/')&&req.method=='POST'){
  const act=u.pathname.slice(9);
  if(limited(ip+'a',12)){send(res,429,{e:'rate'});return}
  let b='';req.on('data',c=>{b+=c;if(b.length>MAXSAVE+20000){req.destroy()}});
  req.on('end',()=>{let d;try{d=JSON.parse(b)}catch(e){send(res,400,{e:'json'});return}
   if(!d||typeof d!='object'){send(res,400,{e:'obj'});return}
   const nm=String(d.name||'').trim(),k=nm.toLowerCase(),tok=req.headers['x-token']||'';
   if(act=='register'){
    if(!NAME.test(nm)){send(res,400,{e:'name'});return}
    if(String(d.pw||'').length<4||String(d.pw).length>64){send(res,400,{e:'pw'});return}
    if(db.acc[k]){send(res,409,{e:'taken'});return}
    if(!ID.test(String(d.uid||''))||tok.length<16||tok.length>100){send(res,400,{e:'id'});return}
    if(Object.keys(db.acc).length>=20000){send(res,507,{e:'full'});return}
    const salt=crypto.randomBytes(12).toString('hex');
    db.acc[k]={n:nm,salt,ph:pwh(d.pw,salt),uid:d.uid,tok,save:typeof d.save=='string'&&d.save.length<MAXSAVE?d.save:'',t:Date.now()};dirty=1;send(res,200,{ok:1});return}
   if(act=='login'){
    const a=db.acc[k];
    if(!a||!crypto.timingSafeEqual(Buffer.from(pwh(d.pw,a.salt)),Buffer.from(a.ph))){send(res,401,{e:'bad'});return}
    send(res,200,{ok:1,name:a.n,uid:a.uid,tok:a.tok,save:a.save||''});return}
   if(act=='save'){
    const a=db.acc[k];
    if(!a||a.tok!==tok){send(res,401,{e:'bad'});return}
    if(typeof d.save!='string'||d.save.length>=MAXSAVE){send(res,400,{e:'size'});return}
    a.save=d.save;a.t=Date.now();dirty=1;send(res,200,{ok:1});return}
   send(res,404,{e:'act'})});
  return}
 const m=/^\/api\/(c|d)\/(\w+)(?:\/([^/]+))?$/.exec(u.pathname);
 if(m){
  if(!COLS[m[2]]){send(res,404,{e:'col'});return}
  const col=db[m[2]];
  if(m[1]=='c'&&req.method=='GET'){
   if(limited(ip,240)){send(res,429,{e:'rate'});return}
   let L=Object.keys(col).map(id=>({id,d:col[id].d}));
   const f=u.searchParams.get('f'),v=u.searchParams.get('v');
   if(f)L=L.filter(x=>String(x.d&&x.d[f])===v);
   const ob=u.searchParams.get('ob');
   if(ob){const dir=u.searchParams.get('dir')=='asc'?1:-1;L.sort((a,b)=>dir*((+a.d[ob]||0)-(+b.d[ob]||0)))}
   L=L.slice(0,Math.min(+u.searchParams.get('lim')||200,500));
   send(res,200,{docs:L});return}
  if(m[1]=='d'&&m[3]&&ID.test(m[3])){
   if(req.method=='GET'){const x=col[m[3]];send(res,200,x?{exists:true,id:m[3],d:x.d}:{exists:false,id:m[3]});return}
   if(req.method=='PUT'){
    if(limited(ip+'w',40)){send(res,429,{e:'rate'});return}
    const tok=req.headers['x-token'];if(!tok||tok.length<16||tok.length>100){send(res,401,{e:'token'});return}
    let b='';req.on('data',c=>{b+=c;if(b.length>MAXDOC){req.destroy()}});
    req.on('end',()=>{let d;try{d=JSON.parse(b)}catch(e){send(res,400,{e:'json'});return}
     if(!d||typeof d!='object'||Array.isArray(d)){send(res,400,{e:'obj'});return}
     const x=col[m[3]],h=sha(tok);
     if(x&&x.h!==h){send(res,403,{e:'owner'});return}
     if(!x&&Object.keys(col).length>=MAXDOCS){send(res,507,{e:'full'});return}
     col[m[3]]={h,d:clean(d),t:Date.now()};dirty=1;send(res,200,{ok:1})});
    return}
  }
  send(res,400,{e:'bad'});return}
 // fichiers statiques
 let p=decodeURIComponent(u.pathname);if(p=='/')p='/index.html';
 const f=path.normalize(path.join(STATIC,p));
 if(!f.startsWith(path.resolve(STATIC))||f.includes(path.sep+'server'+path.sep)){res.writeHead(404);res.end('404');return}
 fs.readFile(f,(e,buf)=>{if(e){res.writeHead(404);res.end('404');return}
  res.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream','Cache-Control':p=='/sw.js'||p=='/index.html'?'no-cache':(p.indexOf('/img/')==0?'public, max-age=2592000, immutable':'public, max-age=3600')});res.end(buf)});
}).listen(PORT,()=>console.log('Idle Dex sur http://localhost:'+PORT));
