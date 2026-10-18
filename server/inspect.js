// Lecture seule : sudo node /opt/pid/inspect.js "#1234567"   (ne modifie rien)
const fs=require('fs'),path=require('path');
const DATA=process.env.DATA_FILE||path.join(__dirname,'data.json');
const who=process.argv[2];if(!who){console.log('Usage: sudo node /opt/pid/inspect.js "#1234567"');process.exit(1)}
const pidOf=u=>{let h=2166136261;for(const c of String(u)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return '#'+(1000000+h%9000000)};
const db=JSON.parse(fs.readFileSync(DATA,'utf8'));
const ids=Object.keys(db.lb||{}).filter(k=>pidOf(k)==who);
if(!ids.length){console.log('Aucun joueur pour',who);process.exit(0)}
const uid=ids[0],lb=(db.lb[uid]||{}).d||{};
const ago=t=>t?Math.round((Date.now()-t)/36e5*10)/10+' h':'?';
console.log('=== Classement (lb) ===');
console.log({uid,nom:lb.n,etage_max:lb.bf,prestiges:lb.st,pokedex:lb.dx,captures:lb.caps,chromatiques:lb.sh,titre:lb.tt,niveau_dresseur:lb.tl,derniere_maj_il_y_a:ago(lb.t)});
const tw=(db.twr||{})[uid],pv=(db.pvp||{})[uid],gm=(db.glm||{})[uid];
console.log('Tour :',tw?JSON.stringify(tw.d).slice(0,200):'aucune donnee','| JCJ :',pv?JSON.stringify({r:pv.d.r,w:pv.d.w,l:pv.d.l,br:pv.d.br}):'aucune donnee','| Guilde :',gm?JSON.stringify({g:gm.d.g,n:gm.d.n}):'aucune');
let acc=null,an=null;for(const k in db.acc)if(db.acc[k].uid==uid){acc=db.acc[k];an=k}
console.log('\n=== Compte ===');
if(!acc)console.log('Pas de compte en ligne : sauvegarde locale uniquement (non verifiable cote serveur).');
else{console.log({pseudo:acc.n,cree_il_y_a:ago(acc.t),lie_discord:!!acc.dc,lie_google:!!acc.gg,taille_sauvegarde:(acc.save||'').length});
 let G=null;try{G=JSON.parse(acc.save)}catch(e){}
 if(!G)console.log('Sauvegarde illisible.');
 else{const col=G.col||{},ids2=Object.keys(col),sh=ids2.filter(i=>col[i].sh).length,mut=ids2.filter(i=>col[i].mi>0).length,sz=ids2.filter(i=>col[i].zi>=3).length,al=ids2.filter(i=>col[i].al).length;
  const dur=G.t0?Math.round((Date.now()-G.t0)/36e5*10)/10:null;
  console.log('\n=== Sauvegarde (G) ===');
  console.log({debut_il_y_a_h:dur,etage:G.fl,meilleur_etage:G.bf,etage_cl:G.cl,prestiges:G.st,points_prestige:G.pp,pieces:G.m,gain_total:G.gain,ko:G.ko,captures:G.caps,mutations_captees:G.mut,boss_alpha:G.boss,pokemon_possedes:ids2.length,chromatiques:sh,mutes:mut,tailles_imposantes_plus:sz,alphas:al,tour_etage_max:G.tw&&G.tw.b,jcj:G.pv&&{r:G.pv.r,w:G.pv.w,l:G.pv.l,f:G.pv.f},titre:G.tt,admin:G.adm,succes:Object.keys(G.ach||{}).length,derniere_activite_il_y_a:ago(G.last)});
  console.log('\n=== Controle de coherence ===');
  const f=[];
  if(dur&&G.bf>=100&&dur<24)f.push('Etage '+G.bf+' en '+dur+' h seulement');
  if(dur&&sh>=10&&dur<48)f.push(sh+' chromatiques en '+dur+' h');
  if(G.caps&&sh/(G.caps||1)>0.01)f.push('Taux de chromatiques eleve : '+(100*sh/G.caps).toFixed(2)+' % des captures (le jeu donne ~0,2 % par mutation)');
  if(G.ko&&G.ko<G.bf*5)f.push('Tres peu de victimes pour cet etage ('+G.ko+' KO)');
  if(G.adm||G.tt=='adm'||G.tt=='own')f.push('Titre admin/owner present');
  if(G.gain&&dur&&G.gain/dur>5e9)f.push('Gain tres eleve : '+(G.gain/dur).toExponential(2)+' pieces/h');
  console.log(f.length?f.map(x=>'- '+x).join('\n'):'Rien d\'anormal detecte automatiquement.');}}
