#!/usr/bin/env node
/* Lecture seule : etat de la sauvegarde EN LIGNE d'un joueur. Usage : sudo node /opt/pid/savecheck.js <pseudo> */
const fs=require('fs');
const q=String(process.argv[2]||'').trim().toLowerCase();
if(!q){console.log('Usage : node savecheck.js <pseudo>');process.exit(1)}
const db=JSON.parse(fs.readFileSync(process.env.DATA_FILE||'/opt/pid/data.json','utf8'));
const hits=Object.keys(db.acc||{}).filter(k=>k==q||String(db.acc[k].n||'').toLowerCase().includes(q));
if(!hits.length){console.log('Aucun compte.');process.exit(0)}
for(const k of hits.slice(0,3)){const a=db.acc[k];let s={};try{s=JSON.parse(a.save||'{}')}catch(e){console.log(a.n,': sauvegarde illisible')}
 const col=s.col||{};
 console.log('\n=== '+a.n+' | derniere sauvegarde serveur : '+(a.t?new Date(a.t).toISOString()+' (il y a '+Math.round((Date.now()-a.t)/6e4)+' min)':'jamais')+' | taille '+(a.save||'').length);
 console.log({prestiges:s.st,captures:s.caps,ko:s.ko,etage_max:s.bf,especes_col:Object.keys(col).length,groudon_383:col[383]||null,groudon_pinkan_90019:col[90019]||null,mewtwo_150:col[150]||null,derniere_action_client:s.last?new Date(s.last).toISOString():null});
 const ex=Object.keys(col).filter(i=>+i>=90000);console.log('Exclusifs (id>=90000) :',ex.length,ex.slice(0,40).join(','))}
