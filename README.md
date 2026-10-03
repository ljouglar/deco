# Déco – conditions de vol à J-1 / J-2

PWA sans dépendance : HTML + JS, données Open-Meteo (gratuites, sans clé).

## Fichiers
- `index.html` : toute l'appli (interface, appel API, évaluation des conditions)
- `manifest.webmanifest` + `icons/` : installation sur l'écran d'accueil
- `sw.js` : service worker (ouverture hors ligne)

## Tester sur ton PC (Linux)
    cd deco
    python3 -m http.server 8000
puis ouvre http://localhost:8000 dans Chrome.
Astuce : outils de développement (F12), mode appareil, choisis un Pixel.

## Installer sur le Pixel 9
Une PWA doit être servie en HTTPS. Le plus simple, GitHub Pages :
1. Crée un dépôt GitHub (par ex. `deco`) et pousse le contenu du dossier.
2. Settings > Pages > Source : branche `main`, dossier `/ (root)`.
3. Ouvre `https://<ton-pseudo>.github.io/deco/` dans Chrome sur le Pixel.
4. Menu ⋮ > « Ajouter à l'écran d'accueil » > « Installer ».

Alternative sans compte Git : glisser le dossier sur https://app.netlify.com/drop

## Mettre à jour
Après une modification, change `CACHE = "deco-v1"` en `deco-v2` dans `sw.js`,
pousse, puis ferme et rouvre l'appli sur le téléphone.

## Où modifier la logique
Dans `index.html` :
- `DEFAULT_SITES` : sites par défaut (le Sapenay est préréglé)
- `DEFAULT_LIMITS` : limites débutant (aussi réglables dans l'appli, « Mes limites »)
- `evaluate()` : les règles vert / orange / rouge, heure par heure
- `HOURLY` : variables demandées à Open-Meteo (liste : https://open-meteo.com/en/docs)
