/* Supprime un joueur à partir de son identifiant public (#1234567).
   Usage (serveur arrêté) :
     node purge-pid.js "#1397371"          -> affiche seulement le joueur trouvé
     node purge-pid.js "#1397371" --oui    -> supprime ses données (sauvegarde data.json.bak avant) */
const fs=require('fs'),path=require('path');
const DATA=process.env.DATA_FILE||path.join(__dirname,'data.json');
const target=String(process.argv[2]||'').trim(),go=process.argv.includes('--oui');
if(!/^#\d{7}$/.test(target)){console.log('Donne un identifiant du type "#1234567"');process.exit(1)}
const pidOfS=u=>{let h=2166136261;for(const c of String(u)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)>>>0}return '#'+(1000000+h%9000000)};
const db=JSON.parse(fs.readFileSync(DATA,'utf8'));
const uids=new Set();
for(const c of Object.keys(db)){const o=db[c];if(!o||typeof o!='object'||Array.isArray(o))continue;for(const k of Object.keys(o)){if(pidOfS(k)===target)uids.add(k);const v=o[k];if(v&&typeof v=='object'){if(v.uid&&pidOfS(v.uid)===target)uids.add(v.uid);if(v.s&&pidOfS(v.s)===target)uids.add(v.s)}}}
if(!uids.size){console.log('Aucun joueur trouvé pour',target);process.exit(0)}
for(const uid of uids){
 const lb=db.lb&&db.lb[uid],nm=lb&&lb.d&&lb.d.n;
 const accs=Object.keys(db.acc||{}).filter(k=>db.acc[k].uid===uid).map(k=>db.acc[k].n);
 console.log('Trouvé :',uid,'· pseudo classement :',nm||'?','· compte(s) en ligne :',accs.join(', ')||'aucun');
}
if(!go){console.log('\nRien n\'a été supprimé. Relance avec --oui pour supprimer.');process.exit(0)}
fs.copyFileSync(DATA,DATA+'.bak');
let n=0;
for(const uid of uids){
 for(const c of Object.keys(db)){const o=db[c];if(!o||typeof o!='object'||Array.isArray(o))continue;
  for(const k of Object.keys(o)){const v=o[k];
   if(k===uid||(v&&typeof v=='object'&&(v.uid===uid||(c==='mkt'&&v.s===uid)))||(c==='dm'&&k.includes(uid))){delete o[k];n++}}}
}
fs.writeFileSync(DATA,JSON.stringify(db));
console.log('Supprimé :',n,'entrées. Copie de sécurité :',DATA+'.bak');
