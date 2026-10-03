# Déco – conditions de vol à J-1 / J-2

PWA sans dépendance : HTML + JS, prévisions Open-Meteo et mesures en temps réel
des balises Pioupiou / OpenWindMap (gratuites, sans clé).

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
Après une modification, incrémente `CACHE = "deco-v2"` dans `sw.js`,
pousse, puis ferme et rouvre l'appli sur le téléphone.

## Balise Pioupiou : prévision vs mesure
Chaque site peut porter un numéro de balise (`piou`). L'appli interroge
`https://api.pioupiou.fr/v1/live/<n°>` et affiche, sous le verdict, la mesure du
moment en face de la prévision pour la même heure : vent moyen, rafales,
direction, puis ce que l'écart dit du modèle (« le modèle sous-estime le vent de
8 km/h à cette heure »). La flèche jaune sur la rose des vents est la balise.

La mesure est rafraîchie toutes les 4 min tant que l'appli est au premier plan,
et au-delà de 45 min elle est signalée comme trop ancienne pour être comparée.

Trouver un numéro : sur https://www.openwindmap.org/, il est dans l'adresse de
la station (`PIOU_1446`). On le saisit dans « Mes sites ».

Sites préréglés et leur balise :

| Site | Déco | Secteur | Balise |
| --- | --- | --- | --- |
| Sapenay | 890 m | SO à NO (225–315°) | 1446 – Déco SAPENAY 901m |
| Saint-Hilaire | 1000 m | NE à SE (45–135°) | 1333 – Décollage A5 / déco Nord |
| Aiguebelette | 1120 m | SSO à NO (200–315°) | 1722 – Déco Aiguebelette 1121m |

Les sites livrés avec l'appli sont fusionnés au démarrage avec ceux déjà
enregistrés sur le téléphone : tes réglages ne sont pas écrasés, seuls les sites
absents sont ajoutés.

Données balises : © contributeurs du réseau OpenWindMap,
https://developers.pioupiou.fr/data-licensing

## Où modifier la logique
Dans `index.html` :
- `DEFAULT_SITES` : sites par défaut (Sapenay, Saint-Hilaire, Aiguebelette)
- `DEFAULT_LIMITS` : limites débutant (aussi réglables dans l'appli, « Mes limites »)
- `evaluate()` : les règles vert / orange / rouge, heure par heure
- `liveNotes()` : la lecture de la balise et la comparaison avec le modèle
- `HOURLY` : variables demandées à Open-Meteo (liste : https://open-meteo.com/en/docs)
