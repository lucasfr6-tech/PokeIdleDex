# PokeIdleDex

Jeu idle de collection dans le navigateur (fan-game gratuit et non officiel) : capture, entraîne, fais évoluer tes créatures, prestige, raids, Tower, JCJ et guildes.

## Contenu
- `index.html` : le jeu
- `img/` : les images (sprites, objets)
- `server/server.js` : serveur Node.js (classements, amis, chat, JCJ, Tower, guildes, boss mondial). Il sert aussi le jeu.
- `config.js`, `shim.js`, `sw.js`, `manifest.webmanifest`, icônes : le site
- `legal.html` : mentions légales (à compléter)
- `release.py` : régénère `index.html` après une mise à jour du jeu
- `LISEZ-MOI.txt` : guide de mise en ligne pas à pas (VPS, HTTPS, sauvegardes)

## Lancer en local
```
node server/server.js
```
Puis ouvre http://localhost:3000

## Mise en ligne
Voir `LISEZ-MOI.txt`.

## Droits
Pokémon est une marque de Nintendo, Creatures Inc. et GAME FREAK inc. Projet de fans, gratuit, sans but lucratif.
