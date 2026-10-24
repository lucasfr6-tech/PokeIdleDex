#!/usr/bin/env node
/* Outil proprietaire : affiche le detail d'un joueur (lecture seule).
   Usage : sudo node /opt/pid/player.js <pseudo ou ID> */
const fs=require('fs');
const q=String(process.argv[2]||'').trim().toLowerCase();
if(!q){console.log('Usage : node player.js <pseudo ou ID>');process.exit(1)}
const db=JSON.parse(fs.readFileSync(process.env.DATA_FILE||'/opt/pid/data.json','utf8'));
const MU=['Normal','M1','M2','M3','M4','M5','M6','M7','Sideral','Prismatique','Primordial'];
const hits=Object.keys(db.acc||{}).filter(k=>{const a=db.acc[k];return k==q||String(a.n||'').toLowerCase().includes(q)||String(a.uid||'').toLowerCase()==q});
if(!hits.length){console.log('Aucun compte trouve.');process.exit(0)}
for(const k of hits.slice(0,5)){
 const a=db.acc[k];console.log('\n=== '+a.n+'  (ID '+a.uid+')  derniere sauvegarde : '+(a.t?new Date(a.t).toISOString():'jamais'));
 const f=db.flag&&db.flag[a.uid];console.log('Signalement : '+(f?JSON.stringify(f):'aucun'));
 let G;try{G=JSON.parse(a.save||'')}catch(e){console.log('Sauvegarde vide ou illisible.');continue}
 const col=G.col||{},ids=Object.keys(col),N=x=>+x||0;
 console.log('Pieces '+N(G.m).toExponential(2)+' | gagnees au total '+N(G.gain).toExponential(2)+' | etage max '+N(G.bf)+' | prestiges '+N(G.st)+' | captures '+N(G.caps)+' | mutations obtenues '+N(G.mut)+' | gemmes '+N(G.gem));
 const by={};ids.forEach(i=>{const m=N(col[i].mi);by[m]=(by[m]||0)+1});
 console.log('Pokemon : '+ids.length+' | chromatiques '+ids.filter(i=>col[i].sh).length);
 console.log('Par mutation : '+Object.keys(by).sort((x,y)=>x-y).map(m=>(MU[m]||'?'+m)+' x'+by[m]).join(', '));
 const rare=ids.filter(i=>N(col[i].mi)>=8||N(col[i].zi)>=5);
 console.log('Rares (Sideral+ ou grande taille) : '+rare.length);
 rare.slice(0,40).forEach(i=>console.log('  #'+i+' mutation '+(MU[N(col[i].mi)]||col[i].mi)+' taille '+N(col[i].zi)+' niv '+N(col[i].l)+(col[i].sh?' chroma':'')));
}
