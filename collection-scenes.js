/* Décors de collection : vingt scènes et vingt signatures indépendantes. */
(()=>{'use strict';
const B=[];
const AB=[
 ['Danse psychique','Psychic dance'],['Éclats de Méga-Steelix','Mega Steelix shards'],['Vérité et Idéal','Truth and Ideals'],['Trio spectral','Spectral trio'],
 ['Aura de Lucario','Lucario aura'],['Dragon des mers','Sea dragon'],['Fureur des abysses','Fury of the deep'],['Désastre blanc','White calamity'],
 ['Foudre cosmique','Cosmic lightning'],['Brasier de Dracaufeu','Charizard blaze'],['Forêt des Pikachu','Pikachu forest'],['Arc-en-ciel chibi','Chibi rainbow'],
 ['Bataille d’eau','Splash party'],['Motif Mimiqui','Mimikyu pattern'],['Genèse d’Arceus','Arceus genesis'],['Rencontre au zénith','Zenith encounter'],
 ['Festin de Chochodile','Fuecoco feast'],['Écorcia au crépuscule','Ecruteak at dusk']
].map((v,i)=>{const k='a'+String(i+1).padStart(2,'0');return {id:k,n:v,kind:'art',img:'img/banners/'+k+'.webp'}});
B.push(...AB);
/* Prix : de PMIN (bannière la moins chère) à PMAX (la plus chère), progression géométrique. */
const PMIN=5e7,PMAX=1e12;
/* Boutique : uniquement les 18 bannières illustrées. Les anciens décors dessinés restent dans B pour s'afficher chez ceux qui les ont déjà, mais ne sont plus en vente. */
const SHOP=B.filter(b=>b.img);
SHOP.forEach((b,i)=>{b.price=Math.round(PMIN*Math.pow(PMAX/PMIN,i/(SHOP.length-1)))});
const S=[
 ['Grâce éternelle','Eternal grace','✧','engraved'],['Forgé dans l’orage','Forged in thunder','ϟ','metal'],
 ['Pacte de minuit','Midnight pact','☾','wax'],['Serment d’ivoire','Ivory vow','✦','engraved'],
 ['Sceau des anciens','Ancient seal','◆','stone'],['Éclat du nord','Northern gleam','❄','crystal'],
 ['Encre interdite','Forbidden ink','✒','scroll'],['Souffle de jade','Jade breath','❧','leaf'],
 ['Voyageur des étoiles','Star voyager','✶','plate'],['Mémoire des racines','Roots remember','❦','leaf'],
 ['Cœur des Titans','Heart of Titans','⚙','metal'],['Dernier rappel','Final curtain','◈','velvet'],
 ['Perle des abysses','Pearl of the deep','◉','shell'],['Maître du temps','Master of time','⌛','plate'],
 ['Roi de braise','Ember sovereign','♛','wax'],['Gardien du givre','Frost guardian','✳','crystal'],
 ['Étoile tombée','Fallen star','✷','stone'],['Litanie du soir','Evening litany','✠','scroll'],
 ['Héritier des dragons','Dragon heir','♜','metal'],['Reflet sans fin','Endless reflection','◇','glass']
].map((v,i)=>({id:'s'+String(i+1).padStart(0,'0'),n:v.slice(0,2),icon:v[2],material:v[3],price:(4+i*.4)*1e12}));
const defaults={90001:7,90002:2,90003:4,90004:1,90005:5,90006:0,90011:2,90012:16,90013:14,90014:12,90015:18};
/* Bannière illustrée par défaut de chaque Pokémon exclusif (id Pokémon -> id de bannière). */
const EXDEF={90001:'a05',90002:'a04',90003:'a06',90004:'a11',90005:'a02',90006:'a01',90011:'a08',90012:'a09',90013:'a10',90014:'a07',90015:'a03'};
const special=id=>(+id>90000&&+id<90100&&!!SPM[id]&&!SPM[id].hw)||!!EXDEF[id];
const hasScene=(id,ban,sig)=>special(id)||!!B.find(x=>x.id===store().beq[id])||!!store().seq[id]||!!B.find(x=>x.id===ban)||!!S.find(x=>x.id===sig);
let cleaned=false;
const store=()=>{const c=COSS();c.bown=c.bown||{};c.beq=c.beq||{};c.sown=c.sown||{};c.seq=c.seq||{};if(!cleaned&&B.length){cleaned=true;for(const k of Object.keys(c.beq))if(!B.find(x=>x.id===c.beq[k]))delete c.beq[k]}return c};
const NONE={id:'none',n:['Aucune','None']};
const exBan=id=>EXDEF[id]&&B.find(x=>x.id===EXDEF[id]);
const bi=id=>{const c=store(),v=c.beq[id];return B.find(x=>x.id===v)||exBan(id)||NONE};
const si=id=>{const c=store(),v=c.seq[id];return S.find(x=>x.id===v)||S[defaults[id]??0]};
const basePower=baseNew;baseNew=function(id){const value=basePower.apply(this,arguments);const c=G.cos||{},ban=c.beq?.[id],sig=c.seq?.[id];return value*(ban&&c.bown?.[ban]?1.01:1)*(sig&&c.sown?.[sig]?1.005:1)};
const valid=(v,list)=>list.find(x=>x.id===v);
const art=(id,ban,sig)=>({banner:valid(ban,B)||(ban!==undefined&&ban!==null?(exBan(id)||NONE):bi(id)),signature:valid(sig,S)||si(id)});
function scene(cv,theme,tm=0){const box=cv.getBoundingClientRect();if(!box.width||!box.height)return;const d=Math.min(devicePixelRatio||1,2),w=box.width,h=box.height;cv.width=Math.ceil(w*d);cv.height=Math.ceil(h*d);const q=cv.getContext('2d');q.scale(d,d);const C={};for(const k of ['dark','light','mid'])C[k]=theme[k];const rect=(x,y,a,b,c)=>{q.fillStyle=c;q.fillRect(x,y,a,b)},line=(x,y,a,b,c,n=1)=>{q.strokeStyle=c;q.lineWidth=n;q.beginPath();q.moveTo(x,y);q.lineTo(a,b);q.stroke()},poly=(p,c)=>{q.fillStyle=c;q.beginPath();p.forEach(([x,y],i)=>i?q.lineTo(x,y):q.moveTo(x,y));q.closePath();q.fill()},oval=(x,y,a,b,c)=>{q.fillStyle=c;q.beginPath();q.ellipse(x,y,a,b,0,0,7);q.fill()},ring=(x,y,r,c,n)=>{q.strokeStyle=c;q.lineWidth=n;q.beginPath();q.arc(x,y,r,0,7);q.stroke()};
rect(0,0,w,h,C.dark);const floor=h*.73,kind=theme.kind;
const pillars=(count=4)=>{for(let i=0;i<count;i++){let x=(i+.5)*w/count;rect(x-7,22,14,floor-12,C.mid);rect(x-12,20,24,6,C.light);rect(x-12,floor-13,24,8,C.light)}};
const windows=(count=3)=>{for(let i=0;i<count;i++){let x=(i+.5)*w/count;q.fillStyle=C.mid;q.beginPath();q.roundRect(x-w/(count*3),33,w/(count*1.5),floor-39,[w/(count*3),w/(count*3),0,0]);q.fill();line(x,38,x,floor,C.light,2);for(let j=0;j<4;j++)line(x-w/(count*3),floor*.35+j*23,x+w/(count*3),floor*.35+j*23,C.light,1)}};
const hills=()=>{for(let i=0;i<5;i++){let x=i*w/4;poly([[x-110,floor],[x+12,35+i%2*25],[x+125,floor]],i%2?C.mid:C.light)}};
const trees=(leaf=true)=>{for(const x of [w*.06,w*.23,w*.77,w*.94]){line(x,floor,x+8,45,C.mid,9);for(let i=0;i<4;i++)line(x+8,65+i*27,x+(x>w/2?-1:1)*(40+i*10),36+i*24,C.mid,5);if(leaf)for(let j=0;j<5;j++)oval(x+(j-2)*13,68+(j%2)*18,20,14,C.light)}};
const towers=()=>{for(const x of [w*.13,w*.86]){rect(x-13,43,26,floor-28,C.mid);rect(x-19,43,38,10,C.light);rect(x-18,floor-32,36,9,C.light)}};
switch(kind){
case 'palace':windows(3);pillars(4);for(const x of [0,w-48]){poly([[x,0],[x+48,0],[x+43+Math.sin(tm)*3,floor],[x+6,floor]],'#714f69');for(let i=0;i<4;i++)line(x+i*11,0,x+i*11,floor,'#ad8391',2)}break;
case 'storm':hills();towers();line(w*.13,43,w/2,65,C.light,3);line(w/2,65,w*.86,43,C.light,3);for(let i=0;i<3;i++)line(w*.31+i*18,20,w*.28+i*18,65,'#eac38b',2);break;
case 'crypt':oval(w*.76,67,34,34,C.light);trees(false);for(let i=0;i<4;i++){let x=i*w/3;poly([[x,floor],[x,floor-105],[x+40,floor-130],[x+80,floor-105],[x+80,floor]],C.mid);rect(x+32,floor-87,15,30,C.light)}break;
case 'observatory':hills();pillars(3);ring(w/2,90,57,C.light,5);ring(w/2,90,42,C.mid,3);for(let i=0;i<12;i++){let a=i*Math.PI/6;line(w/2+Math.cos(a)*43,90+Math.sin(a)*43,w/2+Math.cos(a)*56,90+Math.sin(a)*56,C.light,2)}break;
case 'temple':for(let j=0;j<4;j++)rect(j*w/4,45+j%2*25,w/5,floor-55,C.mid);pillars(5);poly([[0,40],[w/2,0],[w,40]],C.light);break;
case 'throne':hills();poly([[w*.24,floor],[w*.28,65],[w*.37,52],[w*.5,85],[w*.63,52],[w*.72,65],[w*.76,floor]],C.mid);for(let i=0;i<7;i++)poly([[i*w/6,35],[i*w/6+15,4],[i*w/6+28,35]],C.light);break;
case 'library':for(let i=0;i<5;i++){let x=i*w/5;rect(x+5,22,w/5-11,floor-30,C.mid);for(let j=0;j<5;j++){line(x+5,48+j*27,x+w/5-6,48+j*27,C.light,3);for(let k=0;k<5;k++)rect(x+12+k*12,31+j*27,7,16,k%2?C.dark:C.light)}}break;
case 'garden':windows(4);for(let i=0;i<8;i++){let x=i*w/7;line(x,floor,x+Math.sin(tm+i)*4,floor-55,C.mid,4);oval(x,floor-55,13,10,C.light);oval(x+8,floor-44,4,4,'#e5c9a5')}break;
case 'harbor':oval(w*.75,54,32,32,C.light);rect(0,floor-30,w,40,C.mid);for(let i=0;i<3;i++){let x=i*w/3;line(x+40,62,x+40,floor-25,C.light,3);poly([[x+42,70],[x+42,floor-40],[x+100,floor-42]],C.mid)}break;
case 'forest':trees();for(let i=0;i<9;i++)oval(i*w/8,35+i%3*18,29,19,C.mid);for(let i=0;i<5;i++)oval(i*w/4,floor-15,8,5,C.light);break;
case 'forge':hills();towers();for(let x of [w*.28,w*.72]){ring(x,75,26,C.light,7);ring(x,75,8,C.mid,4)}for(let i=0;i<10;i++)rect((i*53+tm*14)%w,35+(i*17)%100,2,4,C.light);break;
case 'theater':for(const x of [0,w-70])poly([[x,0],[x+70,0],[x+55+Math.sin(tm)*3,floor],[x+10,floor]],C.mid);for(let i=0;i<5;i++)line(0,25+i*15,w,25+i*15,C.light,1);poly([[w*.25,floor],[w*.25,65],[w*.75,65],[w*.75,floor]],C.dark);break;
case 'sunken':windows(3);for(let i=0;i<11;i++){let x=(i*53+tm*13)%w,y=20+i*29%floor;ring(x,y,2+i%3,C.light,1)}for(let i=0;i<7;i++)poly([[i*w/6,floor],[i*w/6+6,floor-50-i%3*17],[i*w/6+15,floor]],C.mid);break;
case 'clock':windows(3);ring(w/2,85,64,C.light,8);ring(w/2,85,51,C.mid,3);for(let i=0;i<12;i++){let a=i*Math.PI/6;oval(w/2+Math.cos(a)*57,85+Math.sin(a)*57,3,3,C.light)}line(w/2,85,w/2+29,58,C.light,4);line(w/2,85,w/2-6,44,C.light,3);break;
case 'arena':for(let i=0;i<5;i++){let x=i*w/4;rect(x,30,w/5,floor-38,C.mid);for(let j=0;j<3;j++)line(x,70+j*30,x+w/5,70+j*30,C.light,3)}pillars(5);break;
case 'ice':hills();for(let i=0;i<10;i++){let x=i*w/9;poly([[x,floor],[x+6,35+(i*13)%85],[x+24,floor]],i%2?C.light:C.mid)}break;
case 'greenhouse':windows(5);for(let i=0;i<8;i++){let x=i*w/7;line(x,floor,x-5,floor-70,C.mid,5);for(let j=0;j<4;j++)oval(x+(j%2?12:-12),floor-55+j*12,9,4,C.light)}break;
case 'cathedral':windows(3);pillars(4);poly([[w*.37,20],[w/2,2],[w*.63,20],[w*.63,floor],[w*.37,floor]],C.mid);ring(w/2,75,26,C.light,5);break;
case 'dragon':hills();towers();for(let x of [w*.25,w*.75]){poly([[x-45,floor],[x,55],[x+45,floor]],C.mid);poly([[x-23,90],[x,58],[x+23,90]],C.light)}break;
case 'mirage':for(let i=0;i<5;i++){let x=(i+.5)*w/5;poly([[x-25,floor],[x-18,35+i%2*28],[x+18,35+i%2*28],[x+25,floor]],i%2?C.mid:C.light);line(x,36+i%2*28,x,floor,C.dark,3)}break;
}
rect(0,floor,w,h-floor,C.dark);for(let i=0;i<9;i++)line(w/2,floor-10,i*w/8,h,C.mid,1);
// Solid architectural pedestal: tiered stone or metal, never a light beam.
oval(w/2,h-30,w*.29,21,'#10121a');poly([[w*.23,h-57],[w*.35,h-70],[w*.65,h-70],[w*.77,h-57],[w*.74,h-30],[w*.26,h-30]],C.mid);poly([[w*.24,h-58],[w*.36,h-78],[w*.64,h-78],[w*.76,h-58],[w*.65,h-46],[w*.35,h-46]],C.light);poly([[w*.32,h-59],[w*.38,h-68],[w*.62,h-68],[w*.68,h-59],[w*.62,h-53],[w*.38,h-53]],C.dark);for(let i=0;i<7;i++)oval(w*.29+i*w*.07,h-36,2,2,C.light);
}
function sigNode(s){const el=document.createElement('span');el.className='cs-sign cs-'+s.material;el.textContent=s.icon+' '+LS(...s.n);return el}
function paint(root){for(const box of root.querySelectorAll('[data-cs-banner]')){const b=B.find(v=>v.id===box.dataset.csBanner);if(!b){for(const q of box.querySelectorAll(':scope > .cs-art,:scope > canvas.cs-canvas'))q.remove();continue}if(b.img){let d=box.querySelector(':scope > .cs-art');if(!d){d=document.createElement('div');d.className='cs-art';d.setAttribute('aria-hidden','true');box.prepend(d)}if(d._img!==b.img){d.style.setProperty('--art','url('+b.img+')');d._img=b.img}const old=box.querySelector(':scope > canvas.cs-canvas');if(old)old.remove();continue}{const d=box.querySelector(':scope > .cs-art');if(d)d.remove()}let cv=box.querySelector(':scope > canvas.cs-canvas');if(!cv){cv=document.createElement('canvas');cv.className='cs-canvas';cv.setAttribute('aria-hidden','true');box.prepend(cv)}if(cv._theme!==b.id||cv.width!==Math.ceil(cv.getBoundingClientRect().width*Math.min(devicePixelRatio||1,2))){scene(cv,b);cv._theme=b.id}}}
const origPl=plRow;plRow=function(id){let h=origPl.apply(this,arguments);if(!hasScene(id))return h;const a=art(id),t=document.createElement('template');t.innerHTML=h;const row=t.content.firstElementChild;row.classList.add('cs-scene','cs-atlas');row.dataset.csBanner=a.banner.id;row.appendChild(sigNode(a.signature));return t.innerHTML};
const origPk=pkModal;pkModal=function(){let h=origPk.apply(this,arguments);if(!hasScene(OPEN))return h;const a=art(OPEN),t=document.createElement('template');t.innerHTML=h;const stage=t.content.querySelector('.pqst');if(stage){stage.classList.add('cs-scene','cs-profile');stage.dataset.csBanner=a.banner.id;stage.appendChild(sigNode(a.signature))}return t.innerHTML};
const origScan=bpScan;bpScan=function(){origScan.apply(this,arguments);const b=G.bpk;if(b&&hasScene(b.i)){b.ban=bi(b.i).id;b.sig=si(b.i).id}};
const origDoc=lbDoc;lbDoc=function(){const d=origDoc.apply(this,arguments);if(d.bp&&hasScene(d.bp[6])){d.bp[8]=bi(d.bp[6]).id;d.bp[9]=si(d.bp[6]).id}return d};
const origRank=rkbList;rkbList=function(){let h=origRank.apply(this,arguments);const t=document.createElement('template');t.innerHTML=h;const rows=rkbRows();for(const el of t.content.querySelectorAll('[data-bpr]')){const r=rows[+el.dataset.bpr],b=r?.bp,id=b?.[6];if(!hasScene(id,b?.[8],b?.[9]))continue;const a=art(id,b[8],b[9]);el.classList.add('cs-scene','cs-ranking');el.dataset.csBanner=a.banner.id;el.appendChild(sigNode(a.signature))}return t.innerHTML};
const origModal=bpModal;bpModal=function(r){origModal.apply(this,arguments);const b=r.bp,id=b?.[6],stage=document.querySelector('#bpdm .bpimg');if(!stage||!hasScene(id,b?.[8],b?.[9]))return;const a=art(id,b[8],b[9]);stage.classList.add('cs-scene','cs-profile');stage.dataset.csBanner=a.banner.id;stage.appendChild(sigNode(a.signature));paint(document.getElementById('bpdm'))};
let tabCos='banners',cosSearch='';const oldView=vCos;vCos=function(){if(lockOf('cos'))return oldView();const id=cosSel(),active=!!(id&&G.col[id]),state=store(),list=tabCos==='banners'?SHOP:S,owned=tabCos==='banners'?state.bown:state.sown,eq=tabCos==='banners'?state.beq:state.seq,a=active?art(id):null;
const tabs=`<div class="cs-tabs"><button data-cs-tab="banners" class="${tabCos==='banners'?'on':''}">${LS('Bannières','Banners')} · ${SHOP.length}</button><button data-cs-tab="signatures" class="${tabCos==='signatures'?'on':''}">${LS('Signatures','Signatures')} · 20</button><button data-cs-tab="frames">${LS('Cadres de profil','Profile frames')}</button></div>`;
if(tabCos==='frames'){COSV='fr';return `<div class="cs-legacy-back"><button data-cs-tab="banners">← ${LS('Bannières et signatures','Banners and signatures')}</button></div>`+oldView().replace(/<div class="cos-tabs">[\s\S]*?<\/div>/,'').replace(/<h1>Collections<\/h1>/,`<h1>${LS('Cadres de profil','Profile frames')}</h1>`)}
const pk=ids().filter(i=>!cosSearch||norm(nm(i)).includes(norm(cosSearch))).sort((x,y)=>base(y)-base(x)).slice(0,150).map(i=>`<button data-cs-poke="${i}" class="${id===i?'on':''}">${sp(i,G.col[i].sh)}<span>${dn(i)}</span></button>`).join('');
const preview=active?`<div class="cs-feature cs-scene" data-cs-banner="${a.banner.id}" data-cs-pk="${id}">${sp(id,G.col[id].sh)}<span class="cs-caption">${dn(id)}</span>${sigNode(a.signature).outerHTML}</div>`:`<div class="cs-feature cs-empty">${LS('Choisis un Pokémon ci-dessous pour essayer les décors.','Choose a Pokémon below to preview the scenes.')}</div>`;
const cards=list.map(x=>{const b=tabCos==='banners'?x:(a?.banner&&a.banner.img?a.banner:SHOP[0]),s=tabCos==='signatures'?x:a?.signature||S[0],on=eq[id]===x.id,own=!!owned[x.id];return `<article class="cs-option"><div class="cs-option-scene cs-scene" data-cs-banner="${b.id}">${active?sp(id,G.col[id].sh):''}${sigNode(s).outerHTML}</div><div class="cs-option-foot"><b>${esc(LS(...x.n))}</b><small>${tabCos==='banners'?(x.img?LS('Illustration · puissance +1 %','Artwork · power +1%'):LS('Décor + véritable socle · puissance +1 %','Scene + solid pedestal · power +1%')):LS('Signature · puissance +0,5 %','Signature · power +0.5%')}</small></div><button data-cs-action="${tabCos==='banners'?'b':'s'}:${x.id}" ${!active||!own&&G.m<x.price?'disabled':''}>${own?(on?LS('Équipé','Equipped'):LS('Équiper','Equip')):fmt(x.price)+' ₽'}</button></article>`}).join('');
return `<div class="cosv cs-page"><header class="cos-hd"><div><small>${LS('COLLECTION / ATELIER ESTHÉTIQUE','COLLECTION / STYLE WORKSHOP')}</small><h1>${LS('Bannières et signatures','Banners and signatures')}</h1><p>${LS('Choisis une bannière et une signature pour chaque Pokémon, y compris les Pokémon Halloween. Elles apparaissent dans la collection, sur la fiche et dans le classement.','Choose a banner and signature for any Pokémon, including Halloween Pokémon. They appear in your collection, profile and rankings.')}</p></div><span class="cos-wal">${ico('coin')} ${fmt(G.m)} ₽</span></header>${tabs}<div class="cs-feature-wrap">${preview}<div><b>${active?dn(id):LS('Aperçu','Preview')}</b><p>${LS('Bannière : ','Banner: ')}${active?LS(...a.banner.n):'—'}</p><p>${LS('Signature : ','Signature: ')}${active?LS(...a.signature.n):'—'}</p><small>${LS('Sans aura. L’image du Pokémon reste entièrement visible devant le décor.','No aura. The Pokémon remains fully visible in front of the scene.')}</small></div></div><input class="glx-in" data-cs-search="1" type="search" value="${esc(cosSearch)}" placeholder="${LS('Rechercher un Pokémon…','Search for a Pokémon…')}"><div class="cs-pokemon-list">${pk||LS('Aucun Pokémon trouvé.','No Pokémon found.')}</div><div class="cs-grid">${cards}</div></div>`};window.vCos=vCos;
document.addEventListener('input',e=>{if(!e.target.matches('[data-cs-search]'))return;cosSearch=e.target.value;const p=e.target.selectionStart;const scroll=e.target.closest('.cs-page')?.getBoundingClientRect().top;show();const field=document.querySelector('[data-cs-search]');if(field){field.focus();try{field.setSelectionRange(p,p)}catch(_){}}if(scroll!=null)window.scrollBy(0,field.closest('.cs-page').getBoundingClientRect().top-scroll)});
document.addEventListener('click',e=>{const t=e.target.closest('[data-cs-tab]');if(t&&tab==='cos'){tabCos=t.dataset.csTab;show();return}const p=e.target.closest('[data-cs-poke]');if(p&&tab==='cos'){COSP=+p.dataset.csPoke;show();return}const b=e.target.closest('[data-cs-action]');if(!b||tab!=='cos'||!G.col[cosSel()])return;const [k,key]=b.dataset.csAction.split(':'),v=valid(key,k==='b'?B:S),st=store(),owned=k==='b'?st.bown:st.sown,eq=k==='b'?st.beq:st.seq,id=cosSel();if(!v)return;if(!owned[key]){if(G.m<v.price)return;G.m-=v.price;owned[key]=1}eq[id]=key;try{recomp()}catch(_){}save();show()});
const mo=new MutationObserver(()=>{if(mo._busy)return;mo._busy=true;requestAnimationFrame(()=>{mo._busy=false;paint(document)})});mo.observe(document.getElementById('view')||document.body,{childList:true,subtree:true});mo.observe(document.getElementById('md'),{childList:true,subtree:true});new ResizeObserver(()=>paint(document)).observe(document.getElementById('view'));paint(document);
if(!matchMedia('(prefers-reduced-motion: reduce)').matches)setInterval(()=>{if(document.hidden)return;for(const cv of document.querySelectorAll('.cs-feature>.cs-canvas,.cs-profile>.cs-canvas,.rkb-podium-card>.cs-canvas')){if(!cv.getBoundingClientRect().width)continue;const b=B.find(v=>v.id===cv.parentElement.dataset.csBanner);if(b)scene(cv,b,Date.now()/1000)}},900);
window.CS={B,S,art,scene,special,paint};
})();
