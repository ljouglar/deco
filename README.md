# Déco – conditions de vol et de gonflage jusqu'à J+5

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
Après une modification, incrémente `CACHE` dans `sw.js` (`deco-v3` → `deco-v4`…),
pousse, puis ferme et rouvre l'appli sur le téléphone.

## Balise Pioupiou : prévision vs mesure
Chaque site peut porter un numéro de balise (`piou`). L'appli interroge
`https://api.pioupiou.fr/v1/live/<n°>` et affiche, en tête d'écran sous le nom du
site et avant le choix du jour (bloc « En direct au déco »), la mesure du moment
en face de la prévision pour la même heure : vent moyen, rafales, direction, puis
ce que l'écart dit du modèle (« le modèle sous-estime le vent de 8 km/h à cette
heure »). La flèche jaune sur la rose des vents est la balise.

Le bloc vit hors de `#main`, dans son conteneur `#live` : il ne dépend pas du jour
sélectionné, c'est toujours « maintenant ».

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

À Sapenay, la balise n'est pas au point de prévision : le site est réglé sur
45.8109 / 5.8657, la balise 1446 est à 45.8268 / 5.8792, 2 km au
nord-est. La comparaison mesure / modèle y porte donc sur deux points voisins,
pas sur la même maille.

Les sites livrés avec l'appli sont fusionnés au démarrage avec ceux déjà
enregistrés sur le téléphone : tes réglages ne sont pas écrasés, seuls les sites
absents sont ajoutés.

Données balises : © contributeurs du réseau OpenWindMap,
https://developers.pioupiou.fr/data-licensing

## Terrains de gonflage
Un site est soit un déco, soit un terrain de gonflage (« Type de site » dans
« Mes sites » ; un site sans type est un déco). Sur un terrain, l'appli évalue le
gonflage face voile niveau débutant au lieu du vol :
- vent moyen entre 8 et 20 km/h : en dessous le face voile est laborieux (orange),
  au-dessus on se fait traîner (rouge) ;
- rafales au-delà de 25 km/h (rouge), écart rafales / vent au-delà de 8 km/h (orange) ;
- secteur = directions où le vent arrive sans passer par des haies ou des arbres ;
  hors secteur, c'est orange (turbulences d'obstacles), pas rouge comme au déco ;
- pluie (rouge), instabilité et vent fort vers 1500 m (orange : rafales au sol) ;
- la base des nuages et le plafond thermique ne comptent pas.

Ces limites ont leurs propres réglages (« Mes limites » affiche celles du type de
site affiché) ; le modèle météo est commun aux deux.

| Terrain | Altitude | Secteur | Balise |
| --- | --- | --- | --- |
| Marennes | 230 m | NO à NE (315–45°), pente école face nord | 2229 – Pente Ecole MARENNES |
| Miribel-Jonage | 175 m | SE à SO (135–225°), champ plat | aucune à moins de 15 km |
| Le Rebat (Poleymieux) | 450 m | ONO à NNE (285–15°), pente école face NNO | aucune en service (la n° 97, à 3 km, est muette) |

Sources : ParaglidingEarth, fil « Gonflage près de Lyon » sur parapentiste.info.
Marennes est un terrain de club : se renseigner avant d'y aller.

## Où modifier la logique
Dans `index.html` :
- `DEFAULT_SITES` : sites par défaut (trois décos, trois terrains de gonflage)
- `FORECAST_DAYS` : horizon de prévision (6 = aujourd'hui + 5 jours ; Météo-France
  ne va que jusqu'à J+4 vers 14 h, les heures sans vent prévu sont écartées)
- `DEFAULT_LIMITS` / `DEFAULT_LIMITS_G` : limites débutant, vol et gonflage (aussi
  réglables dans l'appli, « Mes limites »)
- `KINDS` : ce qui distingue un déco d'un terrain (libellés, limites, évaluation)
- `evaluate()` / `evaluateGonflage()` : les règles vert / orange / rouge, heure par heure
- `liveNotes()` : la lecture de la balise et la comparaison avec le modèle
- `HOURLY` : variables demandées à Open-Meteo (liste : https://open-meteo.com/en/docs)
