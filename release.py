#!/usr/bin/env python3
"""Fabrique release/index.html à partir de ../pokeidle.html. Relancer après chaque mise à jour du jeu."""
import os,sys
D=os.path.dirname(os.path.abspath(__file__));s=open(os.path.join(D,'..','pokeidle_rel.html'),encoding='utf8').read()
URL=os.environ.get('SITE_URL','')  # ex. https://pokeidledex.netlify.app
def rep(a,b):
    global s
    assert s.count(a)==1,(a,s.count(a));s=s.replace(a,b)
T="PokeIdleDex"; DESC="Jeu idle de collection gratuit dans ton navigateur : capture, entraîne, fais évoluer tes créatures, prestige et raids. Fan-game non officiel."
head=f'''<meta name="description" content="{DESC}"><meta name="theme-color" content="#0f172a"><meta name="application-name" content="{T}"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="{T}"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<link rel="manifest" href="manifest.webmanifest"><link rel="icon" type="image/png" sizes="32x32" href="favicon-32.png"><link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta property="og:type" content="website"><meta property="og:title" content="{T}"><meta property="og:description" content="{DESC}"><meta property="og:image" content="{URL}/og-image.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:locale" content="fr_FR">{('<meta property="og:url" content="'+URL+'/"><link rel="canonical" href="'+URL+'/">') if URL else ''}
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="{T}"><meta name="twitter:description" content="{DESC}"><meta name="twitter:image" content="{URL}/og-image.png">
<style>#pidw{{position:fixed;left:8px;right:8px;bottom:8px;z-index:99999;background:#7c2d12;color:#ffedd5;border-radius:10px;padding:10px 12px;font:13px/1.4 system-ui,sans-serif;display:flex;gap:10px;align-items:center}}#pidw button{{margin-left:auto;background:#fed7aa;color:#431407;border:0;border-radius:6px;padding:4px 10px;font-weight:700}}#pidb{{position:fixed;inset:0;z-index:100000;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;text-align:center;padding:24px;font:16px/1.5 system-ui,sans-serif}}</style>'''
rep('<meta charset="UTF-8">','<meta charset="UTF-8">'+head)
# vérif navigateur, avant le jeu
pre='''<script>(function(){var ok=!!(window.Promise&&window.fetch&&Object.assign&&window.CSS&&CSS.supports&&CSS.supports("display","grid")&&CSS.supports("--a","0"));if(!ok){window.PID_OLD=1;document.addEventListener("DOMContentLoaded",function(){var d=document.createElement("div");d.id="pidb";d.innerHTML="<div><h2>Navigateur trop ancien</h2><p>PokeIdleDex a besoin d'un navigateur récent (Chrome, Edge, Firefox ou Safari à jour).</p></div>";document.body.appendChild(d)})}})()</script><script src="config.js"></script><script src="shim.js"></script>'''
i=s.index('<script>');s=s[:i]+pre+s[i:]
# lien mentions légales dans les paramètres
rep('Paramètres du compte</h2><button data-a="set">','Paramètres du compte</h2><a class="mu" href="legal.html" target="_blank" rel="noopener">Mentions légales</a><button data-a="set">')
post='''<script>(function(){function warn(t){var d=document.createElement("div");d.id="pidw";d.innerHTML="<span>"+t+"</span><button type=button>OK</button>";d.querySelector("button").onclick=function(){d.remove()};document.body.appendChild(d)}
var okS=false;try{localStorage.setItem("pid_t","1");okS=localStorage.getItem("pid_t")==="1";localStorage.removeItem("pid_t")}catch(e){}
if(!okS)warn("Le stockage de ton navigateur est bloqué (navigation privée ou réglages) : ta progression ne sera pas sauvegardée. Autorise le stockage du site ou quitte la navigation privée.");
else{try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persist()}catch(e){}}
if("serviceWorker"in navigator&&location.protocol.indexOf("http")===0&&!window.PID_OLD){window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})})}
window.addEventListener("offline",function(){if(!document.getElementById("pidw"))warn("Tu es hors ligne : le jeu continue, mais images et classement peuvent manquer.")})})()</script></body>'''
rep('</body>',post)
import hashlib
H=hashlib.md5((s+open(os.path.join(D,'config.js'),encoding='utf8').read()).encode('utf8')).hexdigest()[:10]
CFG=open(os.path.join(D,'config.js'),encoding='utf8').read()
rep('<script src="config.js"></script>','<script>window.PID_BUILD="'+H+'"</script><script>'+CFG+'</script>')
rep('<script src="shim.js"></script>','<script src="shim.js?v='+H+'"></script>')
open(os.path.join(D,'version.json'),'w').write('{"v":"'+H+'"}')
open(os.path.join(D,'index.html'),'w',encoding='utf8').write(s);print('index.html',len(s))
