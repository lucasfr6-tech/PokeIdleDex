// Idle Dex - mini serveur (aucune dépendance). Sert le jeu ET le classement/amis/chat/boss monde.
// Lancer : node server.js   (variables : PORT, DATA_FILE, ALLOWED_ORIGIN, STATIC_DIR)
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const PORT=+process.env.PORT||3000,DATA=process.env.DATA_FILE||path.join(__dirname,'data.json');
const ORIGIN=process.env.ALLOWED_ORIGIN||'*',STATIC=process.env.STATIC_DIR||path.join(__dirname,'..');
const COLS={lb:1,fr:1,chat:1,wb:1,pvp:1,twr:1,gld:1,glm:1},MAXSAVE=4000000,MAXDOC=16384,MAXDOCS=50000,ID=/^[A-Za-z0-9_-]{6,64}$/;
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
let resetChat=0;if(db.meta.chatReset!==CHAT_RESET){db.chat={};db.meta.chatReset=CHAT_RESET;resetChat=1}
const pwh=(pw,salt)=>crypto.scryptSync(String(pw),salt,32).toString('hex');
const NAME=/^[\p{L}\p{N}_ -]{2,16}$/u;
let dirty=resetChat;const flush=()=>{if(!dirty)return;dirty=0;try{fs.writeFileSync(DATA+'.tmp',JSON.stringify(db));fs.renameSync(DATA+'.tmp',DATA)}catch(e){console.error('save',e.message)}};
setInterval(flush,5000);process.on('SIGTERM',()=>{flush();process.exit(0)});process.on('SIGINT',()=>{flush();process.exit(0)});
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
