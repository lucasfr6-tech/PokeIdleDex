# PokeIdleDex : notes pour Claude

- Le jeu est entièrement dans `index.html`. On le modifie directement : ne pas utiliser `release.py` (sa source `pokeidle_rel.html` n'est pas dans le dépôt et écraserait les changements).
- Le site pokeidledex.com est publié depuis la branche `main` (GitHub Pages). Le serveur en ligne (api.pokeidledex.com, `server/server.js`) est un VPS : s'il change, donner au propriétaire la commande pour le mettre à jour (voir `server/install.sh`).
- À chaque modification du jeu :
  1. **Mettre à jour le journal des mises à jour** : tableau `UPD` entre `/*UPD_BEGIN*/` et `/*UPD_END*/` dans `index.html`. Ajouter les entrées dans la version du jour (en haut), ou créer une nouvelle version `{d:"AAAA-MM-JJ",t:[titre FR, titre EN],e:[...]}`. Types : `new` (Nouveau), `imp` (Amélioré), `fix` (Corrigé), `rem` (Retiré). Entrée : `[type, titre FR, texte FR, titre EN, texte EN]`. Textes courts et clairs pour les joueurs.
  2. **Changer le numéro de version** : la même valeur dans `window.PID_BUILD="…"`, `shim.js?v=…` (dans `index.html`) et `version.json`. Les joueurs connectés rechargent alors automatiquement.
  3. Vérifier la syntaxe des scripts et tester dans un navigateur avant de pousser.
- Ne pas utiliser le mot « Pokémon » dans des publicités payantes ; le jeu est un fan-game gratuit, sans achat ni publicité.
