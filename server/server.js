// Idle Dex - mini serveur (aucune dépendance). Sert le jeu ET le classement/amis/chat/boss monde.
// Lancer : node server.js   (variables : PORT, DATA_FILE, ALLOWED_ORIGIN, STATIC_DIR)
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=+process.env.PORT||3000,DATA=process.env.DATA_FILE||path.join(__dirname,'data.json');
const ORIGIN=process.env.ALLOWED_ORIGIN||'*',STATIC=process.env.STATIC_DIR||path.join(__dirname,'..');
const COLS={lb:1,fr:1,chat:1,wb:1,pvp:1,twr:1,gld:1,glm:1,adm:1},ADMIN_KEY=process.env.ADMIN_KEY||'',MAXSAVE=4000000,MAXDOC=16384,MAXDOCS=50000,ID=/^[A-Za-z0-9_-]{6,64}$/;
/*CENSOR_BEGIN*/
function pidCensor(t){
 if(typeof t!="string"||!t)return t;
 const SQ=s=>s.replace(/(.)\1+/g,"$1");
 const NORM=s=>SQ(s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[@4]/g,"a").replace(/3|€/g,"e").replace(/[1!|]/g,"i").replace(/0/g,"o").replace(/[5$]/g,"s").replace(/7/g,"t").replace(/[^a-z]/g,""));
 const W=a=>new Set(a.split(" ").map(SQ));
 const EXACT=W("con cons conne connes cul culs bite bites tg ftg ntm fdp pd pds pede pedes pedale pedales tapette tapettes tarlouze fiotte gouine gouines pute putes ptn ptns pttn pttns nsm tmtc tgl salo encule enculee encules enculer enculez bz bzz nik niker stfu fck fuk kys kms gtfo wtf nazi nazis heil negre negres negresse negro negros nga ngr niak niaks niaque bicot bicots bicote bougnoule bougnoules youpin youpins youpine feuj crouille crouilles bamboula rebeu renoi retard retarde retards retardee mongol mongols mongole attarde attardee triso trisos debile slut sluts whore whores cunt cunts dick dickhead fag fags faggot faggots bastard bastards asshole assholes shit shits merde merdes batard batards batarde bitch bitches chintok chintoks chleuh sidaique vtff");
 const PRE=["nique","niqu","fuck","bitch","nigg","salop","connard","connass","conasse","petass","pouffi","batard","trouduc","putain","encul","branl","merd","negro","bougnoul","enfoire","tarlouz","pedal"].map(SQ);
 const STEM=["connard","salope","encule","fuck","bitch","nigga","nigger","bougnoul","negresse","chintok","enfoire","trouduc","putain","tarlouze","nique"].map(SQ).filter(x=>x.length>=6);
 const RACE=W("arabe arabes noir noire noirs noires blanc blanche juif juive juifs juives negre negres asiat asiatique chinois chinoise musulman musulmane rebeu renoi gitan gitane gitans turc turque");
 const SAL=W("sale sales sal sal salle sacre");
 const bad=n=>{if(!n||n.length<2)return false;if(EXACT.has(n))return true;for(const p of PRE)if(p.length>=4&&n.startsWith(p))return true;for(const s of STEM)if(n.includes(s))return true;return false};
 // liens
 let o=t.replace(/(?:https?:\/\/|ftp:\/\/|www\.)\S*/gi,"***")
  .replace(/\b(?:discord|dsc|disc0rd)\s*\.?\s*(?:gg|com|me)\b[\s\/]*\S*/gi,"***")
  .replace(/\b[a-z0-9-]+(?:\s*(?:\.|\(\s*\.\s*\)|\[\s*\.\s*\]|\bpoint\b|\bdot\b)\s*)(?:com|fr|net|org|io|gg|me|xyz|tk|ru|co|be|ly|tv|app|dev|info|gl|to|cc|ws|ch|de|uk|us|eu|biz|shop|site|online|link|click|top|club|live|pro|cn|jp|ml|ga|cf|gq|su)\b(?:\/\S*)?/gi,"***")
  .replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g,"***")
  .replace(/\S+@\S+\.\S+/g,"***")
  .replace(/\b(?:t\.me|bit\.ly|tinyurl)\S*/gi,"***");
 const parts=o.split(/(\s+)/),idx=[];
 for(let i=0;i<parts.length;i++)if(!/^\s*$/.test(parts[i]))idx.push(i);
 const hit=new Set();
 for(let k=0;k<idx.length;k++){
  const raw=parts[idx[k]],n=NORM(raw);
  if(raw=="1488"||/^n[i1!|]+g{2,}[ae4]/i.test(raw.replace(/[^a-z0-9!|]/gi,""))||bad(n))hit.add(idx[k]);
  if(RACE.has(n)&&k>0&&SAL.has(NORM(parts[idx[k-1]]))){hit.add(idx[k]);hit.add(idx[k-1])}
 }
 // lettres espacees : "c o n n a r d"
 for(let k=0;k<idx.length;){
  let j=k;while(j<idx.length&&NORM(parts[idx[j]]).length==1&&parts[idx[j]].length<=2)j++;
  if(j-k>=3){const n=idx.slice(k,j).map(i=>NORM(parts[i])).join("");if(bad(SQ(n)))for(let q=k;q<j;q++)hit.add(idx[q]);k=j}else k++}
 hit.forEach(i=>{parts[i]="*".repeat(Math.max(3,Math.min(parts[i].length,8)))});
 return parts.join("");
}
/*CENSOR_END*/
const CHAT_RESET=1;
let db={};try{db=JSON.parse(fs.readFileSync(DATA,'utf8'))}catch(e){db={}}
for(const c in COLS)db[c]=db[c]||{};
db.acc=db.acc||{};
db.meta=db.meta||{};
var resetChat=0;if(db.meta.chatReset!==CHAT_RESET){db.chat={};db.meta.chatReset=CHAT_RESET;resetChat=1}
const RANK_RESET=1;
if(db.meta.rankReset!==RANK_RESET){ // remise a zero unique : etages (lb.bf), JCJ, Tower, XP de guilde ; Pokedex et chromatiques intacts
 for(const k in db.lb){if(db.lb[k]&&typeof db.lb[k]=='object')db.lb[k].bf=0}
 db.pvp={};db.twr={};
 for(const k in db.glm){if(db.glm[k]&&typeof db.glm[k]=='object')db.glm[k].gx=0}
 db.meta.rankReset=RANK_RESET;resetChat=1}
const pwh=(pw,salt)=>crypto.scryptSync(String(pw),salt,32).toString('hex');
const NAME=/^[\p{L}\p{N}_ -]{2,16}$/u;
let dirty=resetChat;const flush=()=>{if(!dirty)return;dirty=0;try{fs.writeFileSync(DATA+'.tmp',JSON.stringify(db));fs.renameSync(DATA+'.tmp',DATA)}catch(e){console.error('save',e.message)}};
setInterval(flush,5000);process.on('SIGTERM',()=>{flush();process.exit(0)});process.on('SIGINT',()=>{flush();process.exit(0)});
/* guildes vides : supprimees automatiquement (aucun membre, doc inchange depuis 1 h) */
const gldClean=()=>{try{const used=new Set();for(const id in db.glm){const d=db.glm[id].d;if(d&&d.g)used.add(d.g)}let n=0;for(const id in db.gld){if(!used.has(id)&&Date.now()-(db.gld[id].t||0)>36e5){delete db.gld[id];n++}}if(n){dirty=1;console.log('guildes vides supprimees:',n)}}catch(e){console.error('gldClean',e.message)}};
setInterval(gldClean,6e5);setTimeout(gldClean,15000);
/* connexion Discord (OAuth2) : le secret reste dans l'environnement du serveur (DISCORD_SECRET), jamais dans le jeu */
const DC_ID=process.env.DISCORD_ID||'1561441130355237014',DC_SECRET=process.env.DISCORD_SECRET||'',DC_RED='https://api.pokeidledex.com/api/oauth/discord',SITE=process.env.SITE_URL||'https://pokeidledex.com';
const pendO=new Map();setInterval(()=>{const n=Date.now();pendO.forEach((v,k)=>{if(n-v.ts>6e5)pendO.delete(k)})},6e4);
const hreq=(url,opt,body)=>new Promise((ok,ko)=>{const r=require('https').request(url,opt,s=>{let x='';s.on('data',c=>x+=c);s.on('end',()=>{try{ok(JSON.parse(x))}catch(e){ko(new Error('json'))}})});r.on('error',ko);r.setTimeout(8000,()=>r.destroy(new Error('timeout')));if(body)r.write(body);r.end()});
const hits=new Map();setInterval(()=>hits.clear(),60000);
const limited=(ip,n)=>{const v=(hits.get(ip)||0)+1;hits.set(ip,v);return v>n};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const send=(res,code,obj,extra)=>{const b=JSON.stringify(obj);res.writeHead(code,Object.assign({'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Headers':'Content-Type,X-Token','Access-Control-Allow-Methods':'GET,PUT,POST,OPTIONS','Cache-Control':'no-store'},extra));res.end(b)};
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.webmanifest':'application/manifest+json','.json':'application/json','.svg':'image/svg+xml','.txt':'text/plain'};
const CK=new Set(['n','x','nm','name','desc','tag','motd','bio','t0']);
const clean=(v,k)=>{if(typeof v=='string')return CK.has(k)&&k!='t0'?pidCensor(v.slice(0,2000)):v.slice(0,2000);if(Array.isArray(v))return v.slice(0,500).map(e=>clean(e,k));if(v&&typeof v=='object'){const o={};for(const k of Object.keys(v).slice(0,200)){if(k=='__proto__'||k=='constructor'||k=='prototype')continue;o[k]=(k=='ai'&&typeof v[k]=='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]*$/.test(v[k]))?v[k].slice(0,9000):clean(v[k],k)}return o}return v};
http.createServer((req,res)=>{
 const u=new URL(req.url,'http://x'),ip=(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();
 if(req.method=='OPTIONS'){send(res,204,{});return}
 if(u.pathname=='/api/health'){send(res,200,{ok:1,docs:Object.keys(COLS).reduce((a,c)=>a+Object.keys(db[c]).length,0)});return}

 if(u.pathname=='/api/oauth/discord'&&req.method=='GET'){
  const back=q=>{res.writeHead(302,{Location:SITE+'/?'+q});res.end()};
  const code=u.searchParams.get('code')||'',st=u.searchParams.get('state')||'';
  if(limited(ip+'o',20)||!code||!/^[A-Za-z0-9]{16,64}$/.test(st)||!DC_SECRET){back('dcerr=1');return}
  (async()=>{try{
   const tk=await hreq('https://discord.com/api/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'}},new URLSearchParams({client_id:DC_ID,client_secret:DC_SECRET,grant_type:'authorization_code',code,redirect_uri:DC_RED}).toString());
   if(!tk.access_token){back('dcerr=2');return}
   const me=await hreq('https://discord.com/api/users/@me',{headers:{Authorization:'Bearer '+tk.access_token}});
   if(!me.id){back('dcerr=3');return}
   pendO.set(st,{id:String(me.id),un:String(me.global_name||me.username||'Dresseur'),ts:Date.now()});back('dc='+st)
  }catch(e){back('dcerr=4')}})();return}
 if(u.pathname.startsWith('/api/acc/')&&req.method=='POST'){
  const act=u.pathname.slice(9);
  if(limited(ip+'a',12)){send(res,429,{e:'rate'});return}
  let b='';req.on('data',c=>{b+=c;if(b.length>MAXSAVE+20000){req.destroy()}});
  req.on('end',()=>{let d;try{d=JSON.parse(b)}catch(e){send(res,400,{e:'json'});return}
   if(!d||typeof d!='object'){send(res,400,{e:'obj'});return}
   const nm=String(d.name||'').trim(),k=nm.toLowerCase(),tok=req.headers['x-token']||'';
   if(act=='register'){
    if(!NAME.test(nm)||pidCensor(nm)!==nm){send(res,400,{e:'name'});return}
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
   if(act=='oauth'){
    const p=pendO.get(String(d.state||''));if(!p){send(res,400,{e:'state'});return}pendO.delete(String(d.state));
    for(const kk in db.acc){const a=db.acc[kk];if(a.dc==p.id){send(res,200,{ok:1,exists:1,name:a.n,uid:a.uid,tok:a.tok,save:a.save||''});return}}
    if(tok.length>=16){for(const kk in db.acc){const a=db.acc[kk];if(a.tok===tok&&!a.dc){a.dc=p.id;dirty=1;send(res,200,{ok:1,linked:1,name:a.n});return}}}
    if(!ID.test(String(d.uid||''))||tok.length<16||tok.length>100){send(res,400,{e:'id'});return}
    if(Object.keys(db.acc).length>=20000){send(res,507,{e:'full'});return}
    const want=String(d.want||'').replace(/\s+/g,' ').trim();
    if(NAME.test(want)&&pidCensor(want)===want&&!db.acc[want.toLowerCase()]){
     const salt0=crypto.randomBytes(12).toString('hex');
     db.acc[want.toLowerCase()]={n:want,salt:salt0,ph:crypto.randomBytes(32).toString('hex'),uid:d.uid,tok,save:typeof d.save=='string'&&d.save.length<MAXSAVE?d.save:'',dc:p.id,t:Date.now()};dirty=1;
     send(res,200,{ok:1,created:1,named:1,name:want});return}
    let base=p.un.replace(/[^\p{L}\p{N}_ -]/gu,'').replace(/\s+/g,' ').trim().slice(0,12);if(base.length<2||pidCensor(base)!==base)base='Dresseur';
    let n2=base,i=0;while(db.acc[n2.toLowerCase()]){i++;n2=base+(1000+Math.floor(Math.random()*9000))}
    const salt=crypto.randomBytes(12).toString('hex');
    db.acc[n2.toLowerCase()]={n:n2,salt,ph:crypto.randomBytes(32).toString('hex'),uid:d.uid,tok,save:typeof d.save=='string'&&d.save.length<MAXSAVE?d.save:'',dc:p.id,t:Date.now()};dirty=1;
    send(res,200,{ok:1,created:1,name:n2});return}
   if(act=='rename'){
    const a=db.acc[k];if(!a||a.tok!==tok){send(res,401,{e:'bad'});return}
    const nn=String(d.nn||'').replace(/\s+/g,' ').trim();if(!NAME.test(nn)||pidCensor(nn)!==nn){send(res,400,{e:'name'});return}
    const k2=nn.toLowerCase();if(k2!=k&&db.acc[k2]){send(res,409,{e:'taken'});return}
    delete db.acc[k];a.n=nn;db.acc[k2]=a;dirty=1;send(res,200,{ok:1,name:nn});return}
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
    if(m[2]=='adm'&&(!ADMIN_KEY||ADMIN_KEY.length<12||req.headers['x-admin']!==ADMIN_KEY)){send(res,403,{e:'admin'});return}
    let b='';req.on('data',c=>{b+=c;if(b.length>MAXDOC){req.destroy()}});
    req.on('end',()=>{let d;try{d=JSON.parse(b)}catch(e){send(res,400,{e:'json'});return}
     if(!d||typeof d!='object'||Array.isArray(d)){send(res,400,{e:'obj'});return}
     const x=col[m[3]],h=sha(tok);
     if(x&&x.h!==h&&m[2]!='adm'){send(res,403,{e:'owner'});return}
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
