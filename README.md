# Déco – conditions de vol et de gonflage jusqu'à J+5

PWA sans dépendance : HTML + JS, prévisions Open-Meteo et mesures en temps réel
des balises Pioupiou / OpenWindMap (gratuites, sans clé).

## Fichiers
- `index.html` : la structure de la page (en-tête, feuilles), rien d'autre
- `style.css` : la feuille de style, rangée par composant, thèmes clair et sombre
- `js/` : le code, en modules ES natifs (pas d'outil de compilation), chargés depuis
  `js/main.js`. Chaque module importe ce qu'il utilise ; les dépendances vont
  toujours dans le même sens :
  `outils` → `config` → `etat` → `regles` → `donnees` → `balise` → `rendu` →
  `chargement` → `feuilles` → `main`
  - `outils.js` : petites aides sans état (DOM, texte, vent, distances, stockage)
  - `config.js` : sites préréglés, limites et niveaux, modèles, `KINDS`
  - `etat.js` : l'état de l'appli (`state`), chargé depuis le téléphone
  - `regles.js` : évaluation heure par heure, verdict du jour, accord des modèles ;
    ni DOM ni réseau, il se teste seul
  - `donnees.js` : prévisions Open-Meteo et cache local
  - `balise.js` : balise Pioupiou, historique, tendance, bloc « En direct »
  - `rendu.js` : en-tête, tableau, écran d'un site, pied de page
  - `chargement.js` : chargements et navigation (seul le plus récent s'applique)
  - `feuilles.js` : limites, modèle météo, mes sites, recherche ParaglidingEarth
  - `main.js` : événements de l'écran principal et démarrage
- `manifest.webmanifest` + `icons/` : installation sur l'écran d'accueil
- `sw.js` : service worker (ouverture hors ligne)
- `sites-fr.json` : instantané des décos ParaglidingEarth pour la recherche par nom,
  généré par `tools/pge_snapshot.py`

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
pousse, puis ferme et rouvre l'appli sur le téléphone. Un nouveau fichier (module,
feuille de style) doit aussi entrer dans la liste `SHELL` de `sw.js`, sinon l'appli
ne s'ouvre plus hors ligne.

## Réseau faible et hors ligne
Au déco, la 3G peut traîner :
- chaque appel à Open-Meteo et Pioupiou abandonne au bout de 8 s (`fetchT`,
  `outils.js`) ; l'appli affiche alors « Réseau trop lent » et les dernières
  prévisions enregistrées, au lieu de tourner indéfiniment ;
- le service worker sert la page depuis le réseau, mais au bout de 3 s sans réponse
  il donne la copie en cache. Les autres fichiers (CSS, modules, icônes) viennent
  tout de suite du cache de la version installée et sont rafraîchis en
  arrière-plan ; une nouvelle version (`CACHE`) recharge tout le lot. Mesuré avec
  10 s par réponse : l'appli installée s'ouvre en 3 s, contre 40 s sans service
  worker.
- Sur `localhost`, le service worker passe toujours par le réseau : en
  développement, chaque rechargement voit tes modifications.

Les modules ne sont pas des variables globales : depuis la console, ou une page de
contrôle qui charge l'appli dans un cadre, l'état et la navigation sont exposés
dans `window.deco` (`state`, `site`, `load`, `loadOverview`, `openSite`, `refresh`).

## Balise Pioupiou : prévision vs mesure
Chaque site peut porter un numéro de balise (`piou`). L'appli interroge
`https://api.pioupiou.fr/v1/live/<n°>` et affiche, en tête d'écran sous le nom du
site et avant le choix du jour (bloc « En direct au déco »), la mesure du moment
en face de la prévision pour la même heure : vent moyen, rafales, direction, puis
ce que l'écart dit du modèle (« le modèle sous-estime le vent de 8 km/h à cette
heure »). La flèche jaune sur la rose des vents est la balise.

Le bloc vit hors de `#main`, dans son conteneur `#live` : il ne dépend pas du jour
sélectionné, c'est toujours « maintenant ».

Sous la comparaison, une courbe des 2 dernières heures (historique
`/v1/archive/<n°>`, une mesure toutes les ~5 min) : la moyenne en trait plein, les
rafales en zone claire, la prévision du modèle en pointillés et ta limite de vent
en rouge. La tendance se lit en comparant les 20 dernières minutes aux mêmes
20 minutes une heure plus tôt :
- « Le vent forcit : +6 km/h en 1 h » (orange si, à ce rythme, ta limite peut être
  atteinte dans l'heure), « faiblit » ou « stable » ;
- « Direction qui tourne : de S à O en 1 h, vers l'axe » (au-delà de 40°, et
  seulement quand le vent dépasse 3 km/h) ;
- « Rafales de plus en plus irrégulières » quand l'écart rafales / moyenne se creuse.

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

Ces sites préréglés ne vont qu'aux téléphones qui avaient déjà des sites
enregistrés (le mien) : chacun n'est proposé qu'une fois (mémoire `presets`), donc
un site supprimé ne revient pas, et les réglages ne sont jamais écrasés. Un
nouveau téléphone démarre sans site (voir « Premier lancement »).

Données balises : © contributeurs du réseau OpenWindMap,
https://developers.pioupiou.fr/data-licensing

## Accord entre modèles
Chaque requête demande, en plus du modèle choisi, Météo-France (AROME/ARPEGE),
ICON et ECMWF (Open-Meteo suffixe alors chaque variable par le nom du modèle).
Le verdict reste celui du modèle choisi ; les trois autres sont évalués avec les
mêmes règles et les mêmes limites, pour voir s'ils sont d'accord :
- dans le tableau, trois pastilles par case (Météo-France, ICON, ECMWF), et une
  bordure en pointillés quand leurs verdicts diffèrent ;
- sur l'écran du site, le verdict de chacun sous le verdict principal, puis
  « Les 3 modèles sont d'accord » ou « Les modèles divergent : à confirmer » ;
- dans le détail de l'heure, vent et rafales selon chaque modèle.

Le modèle du verdict principal se choisit dans le pied de page (« changer ») : il
vaut pour tous les sites.

Météo-France s'arrête vers J+4 14 h (pastille creuse au-delà) et ne donne pas la
probabilité de pluie : il ne voit la pluie qu'à sa quantité prévue.

## Premier lancement
Un téléphone qui n'a encore aucun site arrive sur un écran d'accueil :
- **Décos autour de moi** : les 12 décos ParaglidingEarth les plus proches (à moins
  de 60 km), avec leur distance ;
- **Chercher un déco par son nom** ;
- **Saisir un site à la main**, notamment pour un terrain de gonflage.

Dans les résultats, « Ajouter » enregistre le déco tout de suite (secteur, balise
la plus proche) et le tableau se met à jour derrière la feuille ; toucher le nom
remplit le formulaire pour vérifier avant d'enregistrer.

## Tableau « Où voler ? »
L'appli s'ouvre sur un tableau de tous tes sites : une ligne par site, regroupés
en vol puis gonflage, une case par jour (aujourd'hui à J+5). Chaque case prend la
couleur du verdict du jour, calculé avec les règles et les limites du site, et
porte son meilleur créneau (« 10–16 »). Au-delà de J+2, les cases sont atténuées :
c'est une tendance. Une case grise « · » : le modèle ne couvre pas ce jour.

Pour aujourd'hui, seules les heures restantes comptent : les heures passées restent
affichées, grisées, mais ne pèsent plus sur le verdict ni sur le créneau. Le soir,
quand il ne reste plus d'heure de ta journée, la case passe à « – » et l'écran du
site affiche « Journée terminée ».

Toucher une case ouvre l'écran du site sur ce jour ; toucher le nom l'ouvre sur
demain. La flèche en haut à gauche ramène au tableau. Depuis le tableau, « Lim. vol »
et « Lim. gonflage » règlent chaque type de site.

Une seule requête Open-Meteo sert tous les sites (listes de coordonnées). Chaque
réponse est enregistrée par site : ouvrir un site dans les 10 minutes ne refait
pas d'appel, et hors ligne chaque site retombe sur sa dernière prévision.

## Ajouter un déco par son nom
Dans « Mes sites », le champ « Chercher un déco par son nom » parcourt les décos
français de ParaglidingEarth (accents et majuscules ignorés). En touchant un
résultat, le formulaire se remplit :
- nom, position et altitude du déco ;
- secteur tiré des orientations **principales** seulement (les « possibles » sont
  souvent très larges : Saint-Hilaire est noté possible dans les 8 directions) ;
  les autres orientations sont reprises dans la note ;
- balise Pioupiou en service la plus proche, si elle est à moins de 3 km.

Il reste à vérifier l'altitude et le secteur avant d'enregistrer. Les terrains de
gonflage ne sont pas dans ParaglidingEarth : ils se saisissent à la main.

L'API ParaglidingEarth n'a ni recherche par nom ni en-têtes CORS, d'où la liste
embarquée (~60 Ko). Pour la rafraîchir, ou ajouter des pays :

    python3 tools/pge_snapshot.py            # France
    python3 tools/pge_snapshot.py fr ch it   # plusieurs pays

puis incrémenter `CACHE` dans `sw.js`. Données © contributeurs ParaglidingEarth,
CC BY-SA 3.0.

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
site affiché).

| Terrain | Altitude | Secteur | Balise |
| --- | --- | --- | --- |
| Marennes | 230 m | NO à NE (315–45°), pente école face nord | 2229 – Pente Ecole MARENNES |
| Miribel-Jonage | 175 m | SE à SO (135–225°), champ plat | aucune à moins de 15 km |
| Le Rebat (Poleymieux) | 450 m | ONO à NNE (285–15°), pente école face NNO | aucune en service (la n° 97, à 3 km, est muette) |

Sources : ParaglidingEarth, fil « Gonflage près de Lyon » sur parapentiste.info.
Marennes est un terrain de club : se renseigner avant d'y aller.

## Niveaux et verdicts
Le verdict s'écrit **Favorable / À surveiller / Défavorable**, pour le vol comme
pour le gonflage (le type de site est écrit au-dessus) : il dit si les conditions
prévues restent dans tes limites, pas si tu peux voler.

En tête de « Mes limites », trois boutons remplissent les champs avec des repères
par niveau ; rien n'est pris en compte avant « Enregistrer », et toute retouche
passe en « Réglages personnalisés ». Ces repères sont indicatifs, à ajuster avec
son moniteur.

| Vol | Débutant | Intermédiaire | Confirmé |
| --- | --- | --- | --- |
| Vent moyen max (km/h) | 20 | 25 | 30 |
| Rafales max (km/h) | 25 | 30 | 35 |
| Écart rafales / vent (km/h) | 10 | 12 | 15 |
| Vent vers 1500 m (km/h) | 25 | 30 | 40 |
| CAPE vigilance (J/kg) | 400 | 600 | 800 |
| Base des nuages mini (m au-dessus du déco) | 500 | 400 | 300 |

| Gonflage | Débutant | Intermédiaire | Confirmé |
| --- | --- | --- | --- |
| Vent moyen mini (km/h) | 8 | 6 | 5 |
| Vent moyen max (km/h) | 20 | 25 | 30 |
| Rafales max (km/h) | 25 | 30 | 35 |
| Écart rafales / vent (km/h) | 8 | 10 | 12 |
| Vent vers 1500 m (km/h) | 35 | 40 | 45 |
| CAPE vigilance (J/kg) | 300 | 500 | 700 |

Le seuil d'orage (CAPE 1000) est le même à tous les niveaux : il ne dépend pas du
pilote. Les heures de début et de fin de journée ne changent pas non plus.

## Où modifier la logique
- `DEFAULT_SITES` (`config.js`) / `withPresets()` (`etat.js`) : mes six sites
  préréglés, et la règle qui ne les donne qu'une fois aux téléphones existants
- `FORECAST_DAYS` : horizon de prévision (6 = aujourd'hui + 5 jours ; Météo-France
  ne va que jusqu'à J+4 vers 14 h, les heures sans vent prévu sont écartées)
- `DEFAULT_LIMITS` / `DEFAULT_LIMITS_G` : limites débutant, vol et gonflage (aussi
  réglables dans l'appli, « Mes limites »)
- `LEVELS_VOL` / `LEVELS_G` : repères débutant, intermédiaire, confirmé
- `KINDS` : ce qui distingue un déco d'un terrain (libellés, limites, phrases)
- `HOURLY` : variables demandées à Open-Meteo (liste : https://open-meteo.com/en/docs)

Dans `regles.js` :
- `evaluate()` / `evaluateGonflage()` : les règles vert / orange / rouge, heure par heure ;
  `flagRain()`, `flagGusts()`, `flagCape()` et `dirNote()` sont communes aux deux
  (les phrases de direction propres à chaque type sont dans `KINDS`)
- `buildDays()` / `buildAll()` / `dayVerdict()` : jours évalués d'un site, accord des
  modèles, verdict du jour

Ailleurs :
- `pruneCache()` (`donnees.js`) : au démarrage, ne garde en cache que les prévisions
  et balises utiles
- `liveNotes()` / `liveTrend()` / `trendSvg()` (`balise.js`) : la lecture de la
  balise, sa tendance des 2 dernières heures et sa courbe
- `renderOverview()` / `render()` (`rendu.js`) : le tableau « Où voler ? » et l'écran
  d'un site, assemblé par `verdictHtml()`, `detailHtml()` et `hoursHtml()`
- `loadOverview()` / `load()` / `openSite()` (`chargement.js`) : chargements et
  navigation
