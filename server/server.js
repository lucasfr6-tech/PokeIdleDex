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
/* remise a zero generale (nouvelle epoque EP) : copie de securite puis tout est efface, sauf les identifiants de compte (pseudo, mot de passe, Google/Discord)
   et les bannis. Les jeux a jour envoient ep=EP ; les anciennes versions encore ouvertes sont refusees pour ne rien recreer. */
const EP='r3',FULL_RESET=2;
if(db.meta.fullReset!==FULL_RESET){
 try{if(fs.existsSync(DATA))fs.copyFileSync(DATA,DATA+'.avant-reset-'+FULL_RESET)}catch(e){console.error('backup',e.message)}
 for(const c in COLS)db[c]={};
 db.dm={};
 const fl={};for(const k in (db.flag||{})){if(db.flag[k]&&db.flag[k].m)fl[k]={m:1,s:[],l:[],t:db.flag[k].t||0}}db.flag=fl;
 for(const k in db.acc){const a=db.acc[k];if(!(typeof a.save=='string'&&a.save.includes('"ep":"'+EP+'"'))){a.save='';a.t=0}}
 db.meta.fullReset=FULL_RESET;db.meta.chatReset=CHAT_RESET;db.meta.rankReset=RANK_RESET;resetChat=1;console.log('Remise a zero generale effectuee')}
const epOk=d=>!!d&&d.ep===EP,svOk=sv=>typeof sv=='string'&&sv.includes('"ep":"'+EP+'"');
const pwh=(pw,salt)=>crypto.scryptSync(String(pw),salt,32).toString('hex');
const NAME=/^[\p{L}\p{N}_ -]{2,16}$/u;
let dirty=resetChat;const flush=()=>{if(!dirty)return;dirty=0;try{fs.writeFileSync(DATA+'.tmp',JSON.stringify(db));fs.renameSync(DATA+'.tmp',DATA)}catch(e){console.error('save',e.message)}};
setInterval(flush,5000);process.on('SIGTERM',()=>{flush();process.exit(0)});process.on('SIGINT',()=>{flush();process.exit(0)});
/* guildes vides : supprimees automatiquement (aucun membre, doc inchange depuis 1 h) */

/* ---- messages prives ---- */
db.dm=db.dm||{};
db.sug=Array.isArray(db.sug)?db.sug:[];
if(db.mkt||db.mkd){delete db.mkt;delete db.mkd;dirty=1}
const dmKey=(a,b)=>a<b?a+'.'+b:b+'.'+a,dmLast=new Map();
const dmFr=(a,b)=>{const f=x=>{const o=db.fr[x]&&db.fr[x].d;return o&&Array.isArray(o.f)?o.f:[]};return f(a).includes(b)&&f(b).includes(a)};
setInterval(()=>{try{const n=Date.now();for(const k in db.dm){const m=db.dm[k].m||[];if(!m.length||n-m[m.length-1].t>30*864e5){delete db.dm[k];dirty=1}}}catch(e){console.error('dm',e.message)}},36e5);

const rid=p=>p+crypto.randomBytes(7).toString('hex');
const mkAuth=(uid,tok)=>{uid=String(uid||'');tok=String(tok||'');if(!ID.test(uid)||tok.length<16||tok.length>100)return null;const l=db.lb[uid];return l&&l.h===sha(tok)?uid:null};

/* ---- anti-triche : detection de valeurs impossibles (les joueurs suspects sont masques des classements) ---- */
db.flag=db.flag||{};
const hidden=id=>{const f=db.flag[id];return !!f&&!!(f.m||(f.s&&f.s.length)||(f.l&&f.l.length))};
const setFlag=(uid,key,arr)=>{if(!uid)return;const f=db.flag[uid]=db.flag[uid]||{m:0,s:[],l:[],t:0};
 const had=hidden(uid);f[key]=arr;if(arr.length)f.t=Date.now();
 if(!f.m&&!(f.s&&f.s.length)&&!(f.l&&f.l.length))delete db.flag[uid];
 if(arr.length&&!had)console.log('SUSPECT',uid,arr.join(' | '));dirty=1};
const susp=sv=>{let G;try{G=JSON.parse(sv)}catch(e){return[]}if(!G||typeof G!='object')return[];
 const r=[],n=x=>+x||0,col=G.col&&typeof G.col=='object'?G.col:{};
 const m=n(G.m),gain=n(G.gain);
 if(!isFinite(m)||m<0||m>gain*5+5e9)r.push('pieces '+m.toExponential(2)+' pour '+gain.toExponential(2)+' gagnes');
 const k=Math.floor(n(G.bf)/8),pts=k*k+4*k,pt=Math.max(n(G.pp),n(G.pt));
 if(pt>3*Math.max(1,n(G.st))*Math.max(pts,5)+50)r.push('prestige '+pt+' points pour '+n(G.st)+' prestige(s), etage max '+n(G.bf));
 const ids=Object.keys(col),sh=ids.filter(i=>col[i]&&col[i].sh).length,mu=ids.filter(i=>col[i]&&col[i].mi>0).length;
 if(n(G.mut)>n(G.caps)*.5+5)r.push('mutations '+n(G.mut)+' pour '+n(G.caps)+' captures');
 if(sh>n(G.mut)+40||mu>n(G.mut)+40)r.push('chromatiques/mutes possedes '+sh+'/'+mu+' pour '+n(G.mut)+' mutations captees');
 if(n(G.caps)>n(G.ko)*3+500)r.push('captures '+n(G.caps)+' pour '+n(G.ko)+' ko');
 if(G.tw&&(!Number.isFinite(+G.tw.b)||n(G.tw.b)>700))r.push('tour etage '+n(G.tw.b));
 if(!isFinite(+G.bf)||n(G.bf)<0||n(G.bf)>2500||n(G.cl)>2500||n(G.fl)>2500)r.push('etage impossible '+n(G.bf)+'/'+n(G.cl)+'/'+n(G.fl));
 /* valeurs impossibles dans les Pokemon : signe d'une modification de la partie */
 let bad=0;for(const i of ids){const c=col[i];if(!c||typeof c!='object')continue;
  if(n(c.mi)>10||n(c.mi)<0||n(c.zi)>6||n(c.zi)<0||n(c.l)>5000||n(c.n)<0)bad++;
  else if(Array.isArray(c.iv)&&c.iv.some(v=>n(v)>31||n(v)<0))bad++;
  else if(Array.isArray(c.ev)&&(c.ev.some(v=>n(v)>252||n(v)<0)||c.ev.reduce((a,v)=>a+n(v),0)>1000))bad++}
 if(bad>0)r.push('pokemon impossibles : '+bad+' (iv/ev/mutation/taille/niveau hors limites)');
 /* objets en quantite absurde */
 const inv=G.inv&&typeof G.inv=='object'?G.inv:{};let big=0;for(const k in inv){if(!isFinite(+inv[k])||n(inv[k])>1e12||n(inv[k])<0)big++}
 if(big>0)r.push('objets en quantite impossible : '+big);
 if(!isFinite(+G.gem)||n(G.gem)<0||n(G.gem)>1e9)r.push('gemmes '+G.gem);
 return r};
// Clear only obsolete Tower-limit flags, retaining every other moderation reason.
for(const uid of Object.keys(db.flag)){const f=db.flag[uid];if(!f||!Array.isArray(f.s))continue;const next=f.s.filter(x=>{const m=/^tour etage (\d+)$/.exec(x);return !m||+m[1]>700});if(next.length!==f.s.length)setFlag(uid,'s',next)}
const ckT=new Map();
const lbSus=d=>{const r=[],n=x=>+x||0;if(!isFinite(+d.bf)||n(d.bf)<0||n(d.bf)>2500)r.push('classement : etage impossible '+d.bf);if(n(d.sh)>n(d.dx)+5)r.push('classement : '+n(d.sh)+' chromatiques pour '+n(d.dx)+' especes');if(n(d.dx)>1100)r.push('classement : '+n(d.dx)+' especes');if(n(d.bf)>20000)r.push('classement : etage '+n(d.bf));if(n(d.caps)<0)r.push('classement : captures negatives');return r};
const gldClean=()=>{try{const used=new Set();for(const id in db.glm){const d=db.glm[id].d;if(d&&d.g)used.add(d.g)}let n=0;for(const id in db.gld){if(!used.has(id)&&Date.now()-(db.gld[id].t||0)>36e5){delete db.gld[id];n++}}if(n){dirty=1;console.log('guildes vides supprimees:',n)}}catch(e){console.error('gldClean',e.message)}};
setInterval(gldClean,6e5);setTimeout(gldClean,15000);
/* connexion Discord (OAuth2) : le secret reste dans l'environnement du serveur (DISCORD_SECRET), jamais dans le jeu */
const DC_ID=process.env.DISCORD_ID||'1561441130355237014',DC_SECRET=process.env.DISCORD_SECRET||'',DC_RED='https://api.pokeidledex.com/api/oauth/discord',SITE=process.env.SITE_URL||'https://pokeidledex.com';
const pendO=new Map();setInterval(()=>{const n=Date.now();pendO.forEach((v,k)=>{if(n-v.ts>6e5)pendO.delete(k)})},6e4);
const hreq=(url,opt,body)=>new Promise((ok,ko)=>{const r=require('https').request(url,opt,s=>{let x='';s.on('data',c=>x+=c);s.on('end',()=>{try{ok(JSON.parse(x))}catch(e){ko(new Error('json'))}})});r.on('error',ko);r.setTimeout(8000,()=>r.destroy(new Error('timeout')));if(body)r.write(body);r.end()});
/* Parrainage Discord : lit le salon #parrainage (bot) ; un joueur dont le compte Discord est lie et qui y poste le code d'un parrain double la recompense de ce parrain */
const REF_TOK=process.env.DISCORD_BOT_TOKEN||'',REF_CH=process.env.DISCORD_REF_CHANNEL||'',REF_ON=!!(REF_TOK&&/^\d{5,25}$/.test(REF_CH));
const REFN=x=>String(x||'').toUpperCase().replace(/[^A-Z0-9]/g,'');
db.refdc=db.refdc||{};db.meta.refLast=db.meta.refLast||'';
async function refPoll(){if(!REF_ON)return;
 for(let n=0;n<5;n++){
  const url='https://discord.com/api/v10/channels/'+REF_CH+'/messages?limit=100'+(db.meta.refLast?'&after='+db.meta.refLast:'');
  const L=await hreq(url,{method:'GET',headers:{Authorization:'Bot '+REF_TOK,'User-Agent':'PokeIdleDex (pokeidledex.com, 1)'}});
  if(!Array.isArray(L)||!L.length)return;
  L.sort((x,y)=>(BigInt(x.id)<BigInt(y.id)?-1:1));
  for(const m of L){db.meta.refLast=m.id;if(!m.author||m.author.bot)continue;const t=REFN(m.content);
   const o=db.refdc[m.author.id]=db.refdc[m.author.id]||{};
   for(const w of String(m.content||'').toUpperCase().split(/[^A-Z0-9-]+/)){const c=REFN(w);if(/^[A-HJ-NP-Z2-9]{8}$/.test(c))o[c]=Date.now()}
   const j=t.match(/[A-HJ-NP-Z2-9]{8}/g);if(j)for(const c of j)o[c]=o[c]||Date.now()}
  dirty=1;if(L.length<100)return}}
if(REF_ON){const run=()=>refPoll().catch(e=>console.error('refpoll',e.message));setTimeout(run,3000);setInterval(run,45000)}
const GG_ID=process.env.GOOGLE_ID||'637104354464-n2esf9qoa4mh514f70v65qintii1lr3g.apps.googleusercontent.com',usedG=new Set();setInterval(()=>usedG.clear(),36e5);
/* fin de connexion Discord/Google : retrouve, lie ou cree le compte (champ f = 'dc' ou 'gg') */
function ssoFinish(res,d,tok,p,f){
 for(const kk in db.acc){const a=db.acc[kk];if(a[f]==p.id){send(res,200,{ok:1,exists:1,name:a.n,uid:a.uid,tok:a.tok,save:a.save||'',t:a.t||0});return}}
 if(tok.length>=16){for(const kk in db.acc){const a=db.acc[kk];if(a.tok===tok&&!a[f]){a[f]=p.id;dirty=1;send(res,200,{ok:1,linked:1,name:a.n});return}}}
 if(!ID.test(String(d.uid||''))||tok.length<16||tok.length>100){send(res,400,{e:'id'});return}
 if(Object.keys(db.acc).length>=20000){send(res,507,{e:'full'});return}
 const sv=typeof d.save=='string'&&d.save.length<MAXSAVE&&svOk(d.save)?d.save:'',want=String(d.want||'').replace(/\s+/g,' ').trim();
 const mk=(n,named)=>{const o={n,salt:crypto.randomBytes(12).toString('hex'),ph:crypto.randomBytes(32).toString('hex'),uid:d.uid,tok,save:sv,t:Date.now()};o[f]=p.id;db.acc[n.toLowerCase()]=o;dirty=1;send(res,200,{ok:1,created:1,named,name:n})};
 if(NAME.test(want)&&pidCensor(want)===want&&!db.acc[want.toLowerCase()]){mk(want,1);return}
 let base=p.un.replace(/[^\p{L}\p{N}_ -]/gu,'').replace(/\s+/g,' ').trim().slice(0,12);if(base.length<2||pidCensor(base)!==base)base='Dresseur';
 let n2=base;while(db.acc[n2.toLowerCase()])n2=base+(1000+Math.floor(Math.random()*9000));
 mk(n2,0)}
const hits=new Map();setInterval(()=>hits.clear(),60000);
const limited=(ip,n)=>{const v=(hits.get(ip)||0)+1;hits.set(ip,v);return v>n};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const PRES=new Map(),BPDC=new Map();
const LAST=new Map();
const SEEN_PID='#1397371';
const SUG_PID='#7458921',sugLast=new Map(),sugDay=new Map();
const pidOfS=u=>{let h=2166136261;for(const c of String(u)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return '#'+(1000000+h%9000000)};
const send=(res,code,obj,extra)=>{const b=JSON.stringify(obj);res.writeHead(code,Object.assign({'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Headers':'Content-Type,X-Token','Access-Control-Allow-Methods':'GET,PUT,POST,OPTIONS','Cache-Control':'no-store'},extra));res.end(b)};
const MIME={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.webmanifest':'application/manifest+json','.json':'application/json','.svg':'image/svg+xml','.txt':'text/plain'};
const CK=new Set(['n','x','nm','name','desc','tag','motd','bio','t0']);
const clean=(v,k)=>{if(typeof v=='string')return CK.has(k)&&k!='t0'?pidCensor(v.slice(0,2000)):v.slice(0,2000);if(Array.isArray(v))return v.slice(0,500).map(e=>clean(e,k));if(v&&typeof v=='object'){const o={};for(const k of Object.keys(v).slice(0,200)){if(k=='__proto__'||k=='constructor'||k=='prototype')continue;o[k]=(k=='ai'&&typeof v[k]=='string'&&/^data:image\/jpeg;base64,[A-Za-z0-9+\/=]*$/.test(v[k]))?v[k].slice(0,9000):clean(v[k],k)}return o}return v};
/* Fil d'activité public : taille bornée, identité du classement, horodatage serveur. */
const ACT_EPOCH=EP+'.'+FULL_RESET;
if(!db.activity||db.activity.epoch!==ACT_EPOCH)db.activity={epoch:ACT_EPOCH,events:[],seen:{},joins:Object.fromEntries(Object.keys(db.lb).map(k=>[k,1])),boss:{}};
const ACT_RARE=new Set([5,6,7,8,9,10]);
const actName=d=>pidCensor(String(d.n||'Dresseur').replace(/[<>"&]/g,'').trim().slice(0,24))||'Dresseur';
function actAdd(e,key){
 const a=db.activity;if(a.seen[key])return false;const now=Date.now();a.seen[key]=now;a.events.unshift(Object.assign({id:rid('A'),t:now},e));
 a.events=a.events.filter(x=>now-x.t<7*864e5).slice(0,100);const keys=Object.keys(a.seen);if(keys.length>2000)keys.sort((x,y)=>a.seen[y]-a.seen[x]).slice(1500).forEach(k=>delete a.seen[k]);dirty=1;return true}
function actJoin(uid,d){if(db.activity.joins[uid]||hidden(uid)||!d||(!d.n)||(/^(Dresseur|Trainer)$/i.test(d.n)&&!(d.caps>30||d.bf>1)))return;db.activity.joins[uid]=1;actAdd({kind:'join',uid,n:actName(d),tt:String(d.tt||'t0').slice(0,32)},'join:'+uid)}
function actBossState(k){
 const rows=Object.keys(db.wb).filter(id=>!hidden(id)).map(id=>db.wb[id].d).filter(d=>d&&d.k===k&&d.rg),clamp=x=>Math.max(0,Math.min(1e15,+x||0));
 const base=rows.reduce((n,x)=>n+clamp(x.pa),0)*11,mins=[15e4,45e4,12e5,22e5,4e6,6e6,9e6,13e6,2e7,3e7],frac=[.01,.02,.04,.06,.09,.13,.18,.25,.33,.45];
 const thresholds=mins.map((v,i)=>Math.max(v,Math.round(frac[i]*base))),total=rows.reduce((n,x)=>n+clamp(x.d),0);
 const hp=Math.round(Math.min(1e15,Math.max(1e6,rows.reduce((n,x)=>n+clamp(x.pa)*(1+.03*Math.max(0,thresholds.filter(t=>clamp(x.d)>=t).length-1)),0)*11)));
 return {dead:!!rows.length&&total>=hp,total,hp}}
function actBossChanged(k,before){if(!k||!before||before.dead||db.activity.boss[k])return;const now=actBossState(k);if(!now.dead)return;db.activity.boss[k]=Date.now();const keys=Object.keys(db.activity.boss);if(keys.length>50)keys.sort((a,b)=>db.activity.boss[b]-db.activity.boss[a]).slice(40).forEach(k=>delete db.activity.boss[k]);actAdd({kind:'worldboss',uid:'server',n:'Communauté',cycle:String(k).slice(0,64)},'boss:'+k)}
function actAccept(uid,ev){
 if(!ev||!['shiny','mutation','size'].includes(ev.kind)||!/^[a-z0-9_-]{8,80}$/i.test(String(ev.k||'')))return false;
 const id=+ev.id,mi=+ev.mi,zi=+ev.zi;if(!Number.isInteger(id)||!((id>=1&&id<=1025)||(id>=90001&&id<=90099))||!Number.isInteger(mi)||mi<0||mi>10||!Number.isInteger(zi)||zi<0||zi>6)return false;
 if(ev.kind==='shiny'&&!ev.sh||ev.kind==='mutation'&&!ACT_RARE.has(mi)||ev.kind==='size'&&zi<4)return false;
 const p=db.lb[uid].d,mf=+ev.mf||0,hfv=['','normal','heat','wash','frost','fan','mow','altered','origin'].includes(ev.hfv)?ev.hfv:'';
 return actAdd({kind:ev.kind,uid,n:actName(p),tt:/^[a-z0-9_-]{1,32}$/i.test(String(p.tt||''))?p.tt:'t0',p:id,sh:ev.sh?1:0,mi,zi,hf:ev.hf?1:0,hfv,mf:Number.isInteger(mf)&&mf>=10001&&mf<=11000?mf:0},uid+':'+ev.k)}

http.createServer((req,res)=>{
 const u=new URL(req.url,'http://x'),ip=(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();
 if(req.method=='OPTIONS'){send(res,204,{});return}
 if(u.pathname==='/api/activity'){
  if(req.method==='GET'){if(limited(ip+'activity-read',240)){send(res,429,{e:'rate'});return}send(res,200,{ok:1,events:db.activity.events.filter(x=>Date.now()-x.t<7*864e5&&(x.uid==='server'||!hidden(x.uid))).slice(0,35)});return}
  if(req.method==='POST'){
   if(limited(ip+'activity-post',60)){send(res,429,{e:'rate'});return}let body='';req.on('data',c=>{body+=c;if(body.length>8000)req.destroy()});
   req.on('end',()=>{let d;try{d=JSON.parse(body)}catch(e){send(res,400,{e:'json'});return}if(!d||!epOk(d)){send(res,409,{e:'ep'});return}
    const uid=mkAuth(d.uid,req.headers['x-token']);if(!uid||hidden(uid)){send(res,403,{e:'auth'});return}if(limited(uid+'activity',10)){send(res,429,{e:'rate'});return}
    if(!Array.isArray(d.events)||d.events.length>6){send(res,400,{e:'events'});return}let accepted=0;for(const e of d.events)if(actAccept(uid,e))accepted++;send(res,200,{ok:1,accepted})});return}
  send(res,405,{e:'method'});return}

/* suggestions et bugs : tout joueur connecte peut envoyer ; seul le proprietaire (SUG_PID) peut les lire */
 if(u.pathname.startsWith('/api/sug/')&&req.method=='POST'){
  const act=u.pathname.slice(9);
  if(limited(ip+'g',30)){send(res,429,{e:'rate'});return}
  let b='';req.on('data',c=>{b+=c;if(b.length>8000)req.destroy()});
  req.on('end',()=>{let d;try{d=JSON.parse(b)}catch(e){send(res,400,{e:'json'});return}
   const me=d&&typeof d=='object'?mkAuth(d.uid,req.headers['x-token']):null;if(!me){send(res,401,{e:'auth'});return}
   if(act=='send'){
    const x=String(d.x||'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,'').replace(/\r/g,'').trim().slice(0,1000);
    if(x.length<5){send(res,400,{e:'short'});return}
    const now=Date.now(),day=new Date(now).toISOString().slice(0,10);
    if(now-(sugLast.get(me)||0)<30000){send(res,429,{e:'slow'});return}
    const dd=sugDay.get(me);const cnt=dd&&dd.d==day?dd.n:0;if(cnt>=10){send(res,429,{e:'day'});return}
    sugLast.set(me,now);sugDay.set(me,{d:day,n:cnt+1});if(sugLast.size>20000){sugLast.clear();sugDay.clear()}
    const n=String(d.n||'Dresseur').replace(/[<>"&\u0000-\u001f]/g,'').trim().slice(0,20)||'Dresseur';
    const m=String(d.m||'').replace(/[\u0000-\u001f]/g,' ').trim().slice(0,300);
    db.sug.unshift({id:rid('S'),t:now,u:me,p:pidOfS(me),n,k:d.k=='b'?'b':'s',x,m});
    if(db.sug.length>300)db.sug.length=300;dirty=1;send(res,200,{ok:1});return}
   if(pidOfS(me)!==SUG_PID){send(res,403,{e:'no'});return}
   if(act=='inbox'){send(res,200,{ok:1,l:db.sug.slice(0,50).reverse()});return}
   if(act=='ack'){const ids=new Set((Array.isArray(d.ids)?d.ids:[]).slice(0,100).map(String));db.sug=db.sug.filter(v=>!ids.has(v.id));dirty=1;send(res,200,{ok:1});return}
   send(res,404,{e:'act'})});return}
 if(u.pathname=='/api/seen'&&req.method=='POST'){
  if(limited(ip+'s',60)){send(res,429,{e:'rate'});return}
  let b='';req.on('data',c=>{b+=c;if(b.length>4000)req.destroy()});
  req.on('end',()=>{let d;try{d=JSON.parse(b)}catch(e){send(res,400,{e:'json'});return}
   const me=d&&mkAuth(d.uid,req.headers['x-token']);if(!me||pidOfS(me)!==SEEN_PID){send(res,403,{e:'no'});return}
   const now=Date.now(),on=new Set();for(const[k,v]of PRES){if(v.u&&now-v.t<=25000)on.add(v.u)}
   const out={};(Array.isArray(d.ids)?d.ids:[]).slice(0,500).forEach(id=>{id=String(id);if(!ID.test(id))return;const l=db.lb[id];const t=Math.max(LAST.get(id)||0,(l&&l.t)||0);out[id]={t,o:on.has(id)?1:0}});
   send(res,200,{ok:1,m:out})});return}
 if(u.pathname=='/api/ref/dc'&&req.method=='GET'){
  if(limited(ip+'rd',60)){send(res,429,{e:'rate'});return}
  const uid=String(u.searchParams.get('u')||''),c=REFN(u.searchParams.get('c'));
  if(!REF_ON||!ID.test(uid)||c.length!=8){send(res,200,{on:REF_ON?1:0,v:0});return}
  let dc='';for(const k in db.acc){const a=db.acc[k];if(a.uid==uid&&a.dc){dc=String(a.dc);break}}
  const m=dc&&db.refdc[dc];send(res,200,{on:1,v:m&&m[c]?1:0});return}
 if(u.pathname=='/api/online'&&req.method=='GET'){
  if(limited(ip+'o',150)){send(res,429,{e:'rate'});return}
  const sid=String(u.searchParams.get('s')||'');const uid=String(u.searchParams.get('u')||'');const now=Date.now();const lst=!!u.searchParams.get('l');
  if(u.searchParams.get('x')){const pv=PRES.get(sid);if(pv&&pv.u)LAST.set(pv.u,now);PRES.delete(sid);send(res,200,{n:0});return}
  if(!lst&&/^[a-z0-9]{8,24}$/.test(sid)&&(PRES.size<20000||PRES.has(sid)))PRES.set(sid,{t:now,u:/^u?[A-Za-z0-9_-]{6,40}$/.test(uid)?uid:''});
  if(!lst&&uid&&/^u?[A-Za-z0-9_-]{6,40}$/.test(uid)&&(LAST.size<60000||LAST.has(uid)))LAST.set(uid,now);
  const seen=new Set(),L=[];let anon=0;
  for(const[k,v]of PRES){if(now-v.t>25000){PRES.delete(k);continue}
   const r=v.u&&db.lb[v.u]&&db.lb[v.u].d;const nm=r&&typeof r.n=='string'?r.n.slice(0,16):'';
   if(nm){if(!seen.has(v.u)){seen.add(v.u);if(L.length<100)L.push({u:v.u,n:nm})}}else anon++}
  const n=seen.size+anon;
  if(lst){send(res,200,{n,l:L,a:anon});return}
  send(res,200,{n});return}
 /* fiche du meilleur Pokémon d'un joueur (classement), lue dans sa sauvegarde en ligne : seulement les champs utiles de ce Pokémon */
 if(u.pathname.startsWith('/api/bpd/')&&req.method=='GET'){
  if(limited(ip+'b',60)){send(res,429,{e:'rate'});return}
  const uid=decodeURIComponent(u.pathname.slice(9));if(!ID.test(uid)){send(res,400,{e:'id'});return}
  const l=db.lb[uid],bp=l&&l.d&&Array.isArray(l.d.bp)?l.d.bp:null,id=bp?+bp[6]:0;if(!id){send(res,404,{e:'none'});return}
  let a=null;for(const k in db.acc){if(db.acc[k].uid===uid){a=db.acc[k];break}}
  if(!a||!a.save){send(res,404,{e:'nosave'});return}
  const ck=BPDC.get(uid);if(ck&&ck.t===a.t&&ck.i===id){send(res,200,ck.r);return}
  let g=null;try{g=JSON.parse(a.save)}catch(e){}
  const c=g&&g.col&&g.col[id];if(!c){send(res,404,{e:'nomon'});return}
  const pick={};['l','mx','n','st','iv','ev','it','ha','ai','mv','src','mi','zi','sh','al','mf','dy','q'].forEach(k=>{if(c[k]!==undefined)pick[k]=c[k]});
  const r={ok:1,i:id,c:pick};BPDC.set(uid,{t:a.t,i:id,r});if(BPDC.size>2000)BPDC.clear();send(res,200,r);return}
 if(u.pathname=='/api/health'){send(res,200,{ok:1,docs:Object.keys(COLS).reduce((a,c)=>a+Object.keys(db[c]).length,0)});return}
  if(u.pathname==='/api/guild/transfer'&&req.method==='POST'){
   if(limited(ip+'guild-transfer',20)){send(res,429,{e:'rate'});return}
   let body='';req.on('data',c=>{body+=c;if(body.length>2000)req.destroy()});
   req.on('end',()=>{let d;try{d=JSON.parse(body)}catch(e){send(res,400,{e:'json'});return}
    if(!epOk(d)){send(res,409,{e:'ep'});return}
    const uid=mkAuth(d.uid,req.headers['x-token']),gid=String(d.guild||''),target=String(d.target||'');
    if(!uid||!ID.test(gid)||!ID.test(target)||uid===target){send(res,403,{e:'auth'});return}
    const guild=db.gld[gid],from=db.glm[uid],to=db.glm[target];
    if(!guild||!from||!to||guild.d.ow!==uid||from.d.g!==gid||to.d.g!==gid||to.d.pend||!to.d.a){send(res,409,{e:'member'});return}
    const mod=from.d.mod||{};
    if((mod.kick||[]).some(k=>k.u===target&&(+to.d.jd||0)<=k.ts)){send(res,409,{e:'kicked'});return}
    // The guild document must become writable with the successor's own token.
    guild.d.ow=target;guild.d.mod=mod;guild.d.transferAt=Date.now();guild.h=to.h;guild.t=Date.now();
    to.d.mod=Object.assign({},mod,{kick:(mod.kick||[]).filter(k=>k.u!==target)});
    from.d.g='';from.d.pend=0;from.d.a=0;from.t=Date.now();dirty=1;
    send(res,200,{ok:1,owner:target})});return}

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
  const sy=act=='load'||act=='save';if(limited(ip+(sy?'y':'a'),sy?40:12)){send(res,429,{e:'rate'});return}
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
    db.acc[k]={n:nm,salt,ph:pwh(d.pw,salt),uid:d.uid,tok,save:typeof d.save=='string'&&d.save.length<MAXSAVE&&svOk(d.save)?d.save:'',t:Date.now()};dirty=1;send(res,200,{ok:1});return}
   if(act=='login'){
    const a=db.acc[k];
    if(!a||!crypto.timingSafeEqual(Buffer.from(pwh(d.pw,a.salt)),Buffer.from(a.ph))){send(res,401,{e:'bad'});return}
    send(res,200,{ok:1,name:a.n,uid:a.uid,tok:a.tok,save:a.save||'',t:a.t||0});return}
   if(act=='load'){
    const a=db.acc[k];
    if(!a||a.tok!==tok){send(res,401,{e:'bad'});return}
    const t=a.t||0,since=+d.since||0;
    if(since>=t){send(res,200,{ok:1,t});return}
    send(res,200,{ok:1,t,save:a.save||''});return}
   if(act=='save'){
    const a=db.acc[k];
    if(!a||a.tok!==tok){send(res,401,{e:'bad'});return}
    if(typeof d.save!='string'||d.save.length>=MAXSAVE){send(res,400,{e:'size'});return}
    if(!svOk(d.save)){send(res,409,{e:'ep'});return}
    /* synchro multi-appareils : si un autre appareil a sauvegardé depuis la dernière synchro de celui-ci, on refuse (l'appareil récupère alors la version en ligne) */
    if(typeof d.base=='number'&&!d.force&&(a.t||0)>d.base){send(res,409,{e:'stale',t:a.t});return}
    a.save=d.save;a.t=Math.max(Date.now(),(a.t||0)+1);dirty=1;try{const nw=Date.now();if(a.uid&&nw-(ckT.get(a.uid)||0)>60000){ckT.set(a.uid,nw);setFlag(a.uid,'s',susp(d.save))}}catch(e){console.error('susp',e.message)}send(res,200,{ok:1,t:a.t});return}
   if(act=='oauth'){
    const p=pendO.get(String(d.state||''));if(!p){send(res,400,{e:'state'});return}pendO.delete(String(d.state));
    ssoFinish(res,d,tok,p,'dc');return}
   if(act=='google'){
    hreq('https://oauth2.googleapis.com/tokeninfo?id_token='+encodeURIComponent(String(d.idt||'').slice(0,4000)),{}).then(t=>{
     if(!t||t.aud!==GG_ID||!t.sub||!/^accounts\.google\.com$|^https:\/\/accounts\.google\.com$/.test(String(t.iss))||String(t.nonce||'')!==String(d.nonce||'')||!d.nonce||+t.exp<Date.now()/1000){send(res,400,{e:'state'});return}
     if(usedG.has(String(t.sub)+String(t.exp))){send(res,400,{e:'state'});return}usedG.add(String(t.sub)+String(t.exp));
     ssoFinish(res,d,tok,{id:String(t.sub),un:String(t.name||t.given_name||'Dresseur')},'gg')}).catch(()=>send(res,502,{e:'net'}));return}
   if(act=='rename'){
    const a=db.acc[k];if(!a||a.tok!==tok){send(res,401,{e:'bad'});return}
    const nn=String(d.nn||'').replace(/\s+/g,' ').trim();if(!NAME.test(nn)||pidCensor(nn)!==nn){send(res,400,{e:'name'});return}
    const k2=nn.toLowerCase();if(k2!=k&&db.acc[k2]){send(res,409,{e:'taken'});return}
    delete db.acc[k];a.n=nn;db.acc[k2]=a;dirty=1;send(res,200,{ok:1,name:nn});return}
   send(res,404,{e:'act'})});
  return}


 if(u.pathname.startsWith('/api/adm/')&&req.method=='POST'){
  const op=u.pathname.slice(9);
  if(!ADMIN_KEY||ADMIN_KEY.length<12||req.headers['x-admin']!==ADMIN_KEY){send(res,403,{e:'admin'});return}
  let b='';req.on('data',c=>{b+=c;if(b.length>5000)req.destroy()});
  req.on('end',()=>{let d={};try{d=JSON.parse(b||'{}')}catch(e){}
   const uid=String(d.uid||'');
   if(op=='flags'){send(res,200,{ok:1,flags:Object.keys(db.flag).map(id=>Object.assign({uid:id,n:(db.lb[id]&&db.lb[id].d&&db.lb[id].d.n)||''},db.flag[id]))});return}
   if(!ID.test(uid)){send(res,400,{e:'id'});return}
   if(op=='purge'){let n=0;['lb','pvp','twr','wb','glm'].forEach(c=>{if(db[c][uid]){delete db[c][uid];n++}});
    const f=db.flag[uid]=db.flag[uid]||{m:0,s:[],l:[],t:0};f.m=1;f.t=Date.now();dirty=1;send(res,200,{ok:1,supprimes:n});return}
   if(op=='unflag'){delete db.flag[uid];dirty=1;send(res,200,{ok:1});return}
   send(res,404,{e:'op'})});
  return}
/* ---- Messages prives entre amis (visibles uniquement par les deux participants) ---- */
 if(u.pathname.startsWith('/api/dm/')){
  const act=u.pathname.slice(8);
  if(limited(ip+'d',240)){send(res,429,{e:'rate'});return}
  if(req.method!='POST'){send(res,404,{e:'act'});return}
  let b='';req.on('data',c=>{b+=c;if(b.length>8000)req.destroy()});
  req.on('end',()=>{let d;try{d=JSON.parse(b)}catch(e){send(res,400,{e:'json'});return}
   if(!d||typeof d!='object'){send(res,400,{e:'obj'});return}
   const uid=mkAuth(d.uid,req.headers['x-token']);if(!uid){send(res,401,{e:'auth'});return}
   if(act=='list'){const out=[];for(const k in db.dm){const p=k.split('.');if(p[0]!=uid&&p[1]!=uid)continue;const o=p[0]==uid?p[1]:p[0],c=db.dm[k],m=c.m||[],r=(c.r&&c.r[uid])||0;if(!m.length)continue;const l=m[m.length-1];out.push({u:o,x:l.x.slice(0,60),t:l.t,f:l.u==uid?1:0,n:m.filter(q=>q.u!=uid&&q.t>r).length})}
    send(res,200,{ok:1,c:out.sort((a,b)=>b.t-a.t).slice(0,80)});return}
   const to=String(d.with||d.to||'');if(!ID.test(to)||to==uid){send(res,400,{e:'to'});return}
   if(!dmFr(uid,to)){send(res,403,{e:'friends'});return}
   const k=dmKey(uid,to),c=db.dm[k]=db.dm[k]||{m:[],r:{}};
   if(act=='get'){if(d.mark){c.r[uid]=Date.now();dirty=1}send(res,200,{ok:1,m:c.m.slice(-80),r:c.r[to]||0});return}
   if(act=='send'&&!epOk(d)){send(res,409,{e:'ep'});return}
   if(act=='send'){const x=pidCensor(String(d.x||'').replace(/\s+/g,' ').trim().slice(0,300));if(!x){send(res,400,{e:'empty'});return}
    const n=Date.now(),lt=dmLast.get(uid)||0;if(n-lt<1500){send(res,429,{e:'slow'});return}dmLast.set(uid,n);
    if(db.dm[k].m.length&&db.dm[k].m[db.dm[k].m.length-1].u==uid&&db.dm[k].m[db.dm[k].m.length-1].x==x&&n-db.dm[k].m[db.dm[k].m.length-1].t<20000){send(res,429,{e:'dup'});return}
    c.m.push({u:uid,x,t:n});if(c.m.length>80)c.m.splice(0,c.m.length-80);c.r[uid]=n;dirty=1;send(res,200,{ok:1,t:n});return}
   send(res,404,{e:'act'})});return}
 const m=/^\/api\/(c|d)\/(\w+)(?:\/([^/]+))?$/.exec(u.pathname);
 if(m){
  if(!COLS[m[2]]){send(res,404,{e:'col'});return}
  const col=db[m[2]];
  if(m[1]=='c'&&req.method=='GET'){
   if(limited(ip,240)){send(res,429,{e:'rate'});return}
   const HID={lb:1,pvp:1,twr:1,wb:1,glm:1};let L=Object.keys(col).filter(id=>!(HID[m[2]]&&hidden(id))).map(id=>({id,d:col[id].d}));
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
     if(m[2]!='adm'&&!epOk(d)){send(res,409,{e:'ep'});return}
     const x=col[m[3]],h=sha(tok);
     if(x&&x.h!==h&&m[2]!='adm'){send(res,403,{e:'owner'});return}
     if(!x&&Object.keys(col).length>=MAXDOCS){send(res,507,{e:'full'});return}
     const bossBefore=m[2]==='wb'?actBossState(d.k):null;
     // An authenticated replay, prestige or older device cannot lower a published Tower best.
     if(m[2]==='twr'&&x&&x.d&&x.d.ep===d.ep&&(+x.d.rs||1)===(+d.rs||1)&&(+x.d.b||0)>=(+d.b||0)){if((+x.d.b||0)>(+d.b||0)){for(const k of ['tm','mv','it','lv','sx','up'])if(x.d[k]!=null)d[k]=x.d[k]}d.b=x.d.b;d.bt=x.d.bt||d.bt}
     col[m[3]]={h,d:clean(d),t:Date.now()};dirty=1;if(m[2]=='lb'){try{setFlag(m[3],'l',lbSus(d));actJoin(m[3],col[m[3]].d)}catch(e){}}
     if(m[2]==='wb')actBossChanged(d.k,bossBefore);send(res,200,{ok:1})});
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
