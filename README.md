# Déco

**Conditions de vol et de gonflage en parapente, site par site, d'aujourd'hui à J+5.**

Déco est une application web installable (PWA) qui croise les prévisions de trois
modèles météo avec vos limites de pilote, et les confronte en direct aux balises
installées sur les sites. Sans compte, sans serveur, sans publicité : tout tourne
sur le téléphone.

**→ https://ljouglar.github.io/deco/**

<p>
  <img src="screenshots/tableau.png" alt="Tableau « Où voler ? » : tous les sites, jour par jour" width="280">
  <img src="screenshots/deco.png" alt="Écran d'un déco : balise en direct, verdict et accord des modèles" width="280">
</p>

> **Avertissement.** Déco est une aide à la préparation, un indicateur de tendance.
> Le verdict dit si les conditions *prévues* restent dans vos limites ; il ne dit pas
> si vous pouvez voler. La décision se prend sur place, avec la balise, la manche à
> air, l'avis des pilotes présents et celui de votre moniteur.

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Installer et utiliser](#installer-et-utiliser)
- [Comment Déco juge les conditions](#comment-déco-juge-les-conditions)
- [La balise en direct](#la-balise-en-direct)
- [Hors ligne et réseau faible](#hors-ligne-et-réseau-faible)
- [Données, confidentialité et licences](#données-confidentialité-et-licences)
- [Développement](#développement)
- [Sites préréglés](#sites-préréglés)
- [Licence](#licence)

## Fonctionnalités

- **Où voler ?** : un tableau de tous vos sites, une bande horaire par jour : le
  créneau favorable se voit d'un coup d'œil.
- **Vol et gonflage** : chaque site est un déco ou un terrain de gonflage face
  voile, jugé avec ses propres règles et ses propres limites.
- **Trois modèles comparés** : Météo-France (AROME/ARPEGE), ICON et ECMWF ; un créneau
  favorable qu'un seul modèle annonce se repère d'un coup d'œil.
- **Déco et atterro** : quand l'atterro est connu, son vent compte dans le verdict et
  l'écran du site montre sa rose, à côté de celle du déco.
- **Balise en direct** : la mesure du moment face à la prévision, et la tendance des
  deux dernières heures (le vent forcit, faiblit, tourne).
- **Limites par niveau** : repères débutant, intermédiaire et confirmé, entièrement
  réglables.
- **Ajout de sites en deux gestes** : les décos autour de soi ou par leur nom
  (base ParaglidingEarth), avec leur atterro quand il est connu et la balise la plus
  proche.
- **Hors ligne** : l'appli s'ouvre sans réseau et tient avec une 3G faible.
- **Vos données restent chez vous** : rien n'est envoyé nulle part ; export et import
  des sites pour changer de téléphone.

## Installer et utiliser

### Installation

Ouvrir https://ljouglar.github.io/deco/ puis :

- **Android (Chrome)** : menu ⋮ > « Installer l'application » (ou « Ajouter à l'écran d'accueil ») ;
- **iPhone (Safari)** : bouton Partager > « Sur l'écran d'accueil ».

L'appli est développée et testée sur Android avec Chrome.

### Premier lancement

Sans site enregistré, l'appli propose :

- **Décos autour de moi** : les 12 décos connus les plus proches, à moins de 60 km ;
- **Chercher un déco par son nom** (accents et majuscules ignorés) ;
- **Saisir un site à la main**, notamment pour un terrain de gonflage, absent de la
  base des décos. Des coordonnées copiées de Google Maps (« 45.7936, 4.9578 », ou en
  degrés-minutes-secondes) se collent d'un bloc dans le champ latitude ou longitude ;
  l'altitude suit, d'après le relief ;
- **Importer des sites exportés** depuis un autre téléphone.

Dans les résultats, « Ajouter » enregistre le déco tout de suite ; toucher son nom
remplit le formulaire pour vérifier l'altitude et le secteur avant d'enregistrer.

### Le tableau « Où voler ? »

L'écran d'accueil : un bloc par site (vol, puis gonflage), une colonne par jour.
Avec votre commune réglée dans « Mes sites », chaque groupe est classé du plus proche
au plus loin, la distance à vol d'oiseau à côté du nom (« ≈ 38 km » : ce n'est pas
la route, un massif peut la doubler).

- **Bande horaire** : la journée heure par heure, de votre première à votre dernière
  heure. La clarté porte le verdict : **foncé et plein** favorable, **hachuré** à
  surveiller, **pâle** défavorable ; lisible même sans voir les couleurs.
- **Créneau** : le plus long créneau favorable est écrit sous la bande (« 10–16 »).
- **Trait sous une heure** : les modèles ne s'accordent pas sur son côté favorable.
- **« tendance »** au-delà de J+2 ; **« fini »** : la journée est terminée.

Toucher une bande ouvre l'écran du site sur ce jour.

### L'écran d'un site

De haut en bas : les jours, le verdict avec la rose des vents (et celle de l'atterro
quand il est connu) et la bande du jour, dont chaque heure se touche ; puis, pour
aujourd'hui, la balise en direct ; le détail de l'heure choisie (dont le vent selon
chaque modèle et à l'atterro), enfin la liste des heures.

Ouvert depuis la liste des sites, l'écran montre aujourd'hui tant qu'il reste des
heures dans ta journée (on est au déco, la balise compte), demain ensuite (on prépare
la sortie). Depuis le tableau, il s'ouvre sur le jour touché.

Au centre de chaque rose, une **manche à air** suit le vent prévu à l'heure choisie :
orientée sous le vent, elle se gonfle d'un anneau par tranche d'environ 5,5 km/h
(3 nœuds), toute droite vers 28 km/h, comme les vraies.

### Réglages

- **Mes sites** : votre commune (« J'habite à »), pour classer les sites par distance
  et chercher les décos autour de chez vous ; ajouter, modifier, supprimer ; exporter
  et importer.
- **Mes limites** (ou « Lim. vol » / « Lim. gonflage » depuis le tableau) : un
  niveau en un geste, puis chaque seuil à la main.
- **Modèle météo** (« changer », en pied de page) : le modèle du verdict principal,
  pour tous les sites. Les trois autres restent toujours comparés.

## Comment Déco juge les conditions

Chaque heure entre 7 h et 20 h reçoit un niveau : **favorable**, **à surveiller** ou
**défavorable**. Le jour est favorable s'il offre au moins deux heures favorables
d'affilée dans votre journée (9 h – 18 h par défaut), à surveiller s'il reste des
heures jouables, défavorable sinon. Pour aujourd'hui, seules les heures restantes
comptent.

### Au déco

| Critère | À surveiller | Défavorable |
| --- | --- | --- |
| Pluie | probabilité ≥ 30 % | ≥ 60 % ou ≥ 0,3 mm |
| Direction | travers (≤ 30° hors secteur) | hors secteur : déco sous le vent possible |
| Vent moyen | > 80 % de la limite | > limite |
| Rafales | écart rafales / vent > limite | > limite |
| Vent vers 1500 m | > 75 % de la limite | > limite |
| Flux de sud vers 3000 m | ≥ 25 km/h (foehn) | ≥ 40 km/h |
| Instabilité (CAPE) | ≥ seuil de vigilance | ≥ seuil d'orage |
| Base des nuages (nuages bas ≥ 50 %) | sous le minimum | à moins de 200 m du déco |
| Vent moyen à l'atterro (s'il est connu) | > 80 % de la limite | > limite |
| Rafales à l'atterro | | > limite |
| Coucher du soleil | dans l'heure | heure entière après |

À l'atterro, la direction n'est pas jugée : on s'y pose face au vent, d'où qu'il
vienne. Son vent vient d'une seconde requête, plus légère ; son altitude, du relief
d'Open-Meteo. Le déco et l'atterro sont souvent à quelques kilomètres : Météo-France
(AROME) et ICON les distinguent, ECMWF (maille de 9 km) beaucoup moins.

L'heure du coucher du soleil, demandée avec la prévision, s'affiche sous le créneau ;
pour un déco, l'heure où il se couche passe à surveiller (« prévois d'être posé
avant ») et les suivantes en défavorable. Le gonflage, au sol, n'est pas concerné.

Sous 6 km/h de vent météo, la direction n'est pas jugée : la brise de pente devrait
s'installer.

### Sur un terrain de gonflage (face voile)

| Critère | À surveiller | Défavorable |
| --- | --- | --- |
| Vent moyen | sous le minimum (face voile laborieux) ou > 85 % du maximum | > maximum (on se fait traîner) |
| Rafales | écart rafales / vent > limite | > limite |
| Direction | travers, ou hors secteur (turbulences d'obstacles) | – |
| Pluie, instabilité | comme au déco | comme au déco |
| Vent vers 1500 m | > limite (rafales possibles au sol) | – |

Le secteur d'un terrain, ce sont les directions d'où le vent arrive sans passer par
des haies ou des arbres. La base des nuages ne compte pas.

### Repères par niveau

Indicatifs, à ajuster avec son moniteur. Le seuil d'orage (CAPE 1000 J/kg) ne
dépend pas du pilote et reste le même à tous les niveaux.

| Vol | Débutant | Intermédiaire | Confirmé |
| --- | --- | --- | --- |
| Vent moyen max (km/h) | 20 | 25 | 30 |
| Rafales max (km/h) | 25 | 30 | 35 |
| Écart rafales / vent (km/h) | 10 | 12 | 15 |
| Vent vers 1500 m (km/h) | 25 | 30 | 40 |
| CAPE vigilance (J/kg) | 400 | 600 | 800 |
| Base des nuages mini (m au-dessus du déco) | 500 | 400 | 300 |
| Vent moyen max à l'atterro (km/h) | 18 | 22 | 28 |
| Rafales max à l'atterro (km/h) | 25 | 30 | 35 |

| Gonflage | Débutant | Intermédiaire | Confirmé |
| --- | --- | --- | --- |
| Vent moyen mini (km/h) | 8 | 6 | 5 |
| Vent moyen max (km/h) | 20 | 25 | 30 |
| Rafales max (km/h) | 25 | 30 | 35 |
| Écart rafales / vent (km/h) | 8 | 10 | 12 |
| Vent vers 1500 m (km/h) | 35 | 40 | 45 |
| CAPE vigilance (J/kg) | 300 | 500 | 700 |

### Accord entre modèles

Le verdict principal suit le modèle choisi (« Automatique » par défaut). Météo-France,
ICON et ECMWF sont évalués en plus, avec les mêmes règles et les mêmes limites.
L'accord renforce la confiance sans la garantir : les modèles partagent une partie
de leurs observations et ratent souvent les mêmes effets locaux (brise de lac,
confluence, foehn).

Météo-France s'arrête vers J+4 en début d'après-midi et ne fournit pas la
probabilité de pluie : il ne voit la pluie qu'à sa quantité prévue.

## La balise en direct

Un site peut être associé à une balise **Pioupiou / OpenWindMap** (son numéro figure
dans l'adresse de la station sur [openwindmap.org](https://www.openwindmap.org/),
par exemple `PIOU_1446`). L'écran du site affiche alors :

- la mesure du moment face à la prévision de la même heure, et ce que l'écart dit du
  modèle (« le modèle sous-estime le vent de 8 km/h à cette heure ») ;
- une courbe des deux dernières heures : vent moyen, rafales, prévision et votre
  limite ;
- la tendance, en comparant les 20 dernières minutes à la même durée une heure plus
  tôt : le vent forcit (avec alerte si la limite peut être atteinte dans l'heure),
  faiblit ou reste stable ; la direction tourne, vers l'axe ou hors de l'axe ; les
  rafales deviennent plus irrégulières.

La mesure est rafraîchie toutes les 4 minutes tant que l'appli est ouverte, et
signalée trop ancienne au-delà de 45 minutes. Sous 3 km/h, la direction n'est pas
interprétée. Une balise reste un point : abritée ou prise dans une brise locale,
elle peut ne pas représenter tout le site.

## Hors ligne et réseau faible

- **Hors ligne** : l'appli s'ouvre depuis le cache de son service worker, et chaque
  site affiche sa dernière prévision enregistrée.
- **Réseau faible** : chaque appel à Open-Meteo ou à une balise abandonne au bout de
  12 s ; l'appli affiche alors « Réseau trop lent » et les prévisions enregistrées.
  La page elle-même est servie depuis le cache si le réseau ne répond pas en 3 s.
  Mesuré avec 10 s par réponse : l'appli installée s'ouvre en 3 s, contre 40 s sans
  service worker.

## Données, confidentialité et licences

### Confidentialité

Déco n'a ni serveur ni compte, et ne collecte rien. Vos sites, notes et limites
restent dans le stockage du navigateur ; l'appli demande qu'il ne soit pas effacé
quand le téléphone manque de place. **Mes sites > Exporter** produit un fichier
`deco-sites-AAAA-MM-JJ.json` à réimporter sur un autre appareil. Les seuls appels
réseau vont vers Open-Meteo (les coordonnées de vos sites, et le nom tapé dans « J'habite
à » pour trouver la commune) et Pioupiou. La position
n'est demandée que sur action : « Décos autour de moi » la garde sur le téléphone,
« Ma position » l'envoie à Open-Meteo pour obtenir l'altitude.

### Sources de données

| Données | Source | Licence |
| --- | --- | --- |
| Prévisions | [Open-Meteo](https://open-meteo.com/) | CC BY 4.0, usage non commercial gratuit |
| Mesures des balises | [OpenWindMap / Pioupiou](https://www.openwindmap.org/) | © contributeurs du réseau OpenWindMap, [conditions](https://developers.pioupiou.fr/data-licensing) |
| Liste des décos | [ParaglidingEarth](https://www.paraglidingearth.com/) | CC BY-SA 3.0 |
| Polices Barlow et Barlow Condensed | [The Barlow Project](https://github.com/jpt/barlow) | SIL Open Font License 1.1 (`fonts/OFL.txt`) |

## Développement

Sans dépendance ni outil de compilation : HTML, CSS et modules ES natifs.

### Lancer en local

```sh
python3 -m http.server 8000
```

puis ouvrir http://localhost:8000 dans Chrome (outils de développement > mode
appareil pour simuler un téléphone). Sur `localhost`, le service worker passe
toujours par le réseau : chaque rechargement voit les modifications.

### Structure

```
index.html            structure de la page et politique de sécurité (CSP)
style.css             feuille de style, rangée par composant, thèmes clair et sombre
js/                   modules ES, chargés depuis main.js
sw.js                 service worker : cache de l'appli, ouverture hors ligne
manifest.webmanifest  installation (icônes dans icons/, captures dans screenshots/)
fonts/                polices Barlow, servies par le site
sites-fr.json         instantané des décos ParaglidingEarth et de leurs atterros (recherche par nom)
tools/                vérificateur, banc d'essai, mise à jour de sites-fr.json
```

Les modules dépendent les uns des autres dans un seul sens, sans boucle :

```
outils → config → etat → regles → donnees → balise → vol → rendu → chargement → feuilles → maj → main
```

| Module | Rôle |
| --- | --- |
| `outils.js` | aides sans état : DOM, texte, vent, distances, stockage, `fetchT` (délai réseau) |
| `config.js` | sites préréglés, limites et niveaux, modèles, `KINDS` (déco ou terrain) |
| `etat.js` | état de l'appli (`state`), préréglages, stockage persistant |
| `regles.js` | évaluation heure par heure, verdict du jour, accord des modèles ; ni DOM ni réseau |
| `donnees.js` | prévisions Open-Meteo (sites, et vent de leurs atterros) et cache local |
| `balise.js` | balise Pioupiou : mesure, historique, tendance, bloc « En direct » |
| `vol.js` | la voile qui arrive en vol dans le ciel de l'en-tête : trajectoire, balancier, vol de pente |
| `rendu.js` | en-tête, tableau, écran d'un site (roses du déco et de l'atterro), pied de page |
| `chargement.js` | chargements et navigation : seul le chargement le plus récent s'applique |
| `feuilles.js` | limites, modèle météo, mes sites, sauvegarde, recherche de décos |
| `maj.js` | service worker : enregistrement, recherche de mise à jour, avis « Nouvelle version », numéro de version |
| `main.js` | événements de l'écran principal et démarrage |

### Où modifier quoi

| Pour changer… | Voir |
| --- | --- |
| les règles de jugement | `evaluate()`, `evaluateGonflage()` et les règles communes (`flagRain`, `flagGusts`, `flagCape`, `dirNote`) dans `regles.js` |
| le verdict du jour, l'accord des modèles | `dayVerdict()`, `buildDays()`, `buildAll()` dans `regles.js` |
| les limites par défaut, les niveaux | `DEFAULT_LIMITS`, `DEFAULT_LIMITS_G`, `LEVELS_VOL`, `LEVELS_G` dans `config.js` |
| les libellés et phrases propres à un type de site | `KINDS` dans `config.js` |
| l'horizon, les variables demandées | `FORECAST_DAYS`, `HOURLY` ([liste Open-Meteo](https://open-meteo.com/en/docs)) dans `config.js` |
| la lecture de la balise | `liveNotes()`, `liveTrend()`, `trendSvg()` dans `balise.js` |
| le tableau, l'écran d'un site | `renderOverview()`, `render()` et ses parties dans `rendu.js` |

Depuis la console (ou une page de contrôle), l'état et la navigation sont exposés
dans `window.deco` : `state`, `site`, `load`, `loadOverview`, `openSite`, `refresh`.

### Vérifier avant de commiter

```sh
tools/verifier.sh                # tous les contrôles (environ une minute)
tools/verifier.sh --accepter     # une règle a changé exprès : met à jour la référence
tools/verifier.sh --lighthouse   # ajoute un audit Lighthouse (seuil 90 par catégorie)
```

Sans framework : un serveur local, Chrome sans fenêtre et un banc d'essai
(`tools/banc.html`) où l'appli tourne avec un réseau et une heure simulés
(prévision figée `tools/prevision-figee.json`, heure figée à midi, balise simulée).
Il contrôle :

- **les verdicts** des six sites, heure par heure, comparés à `tools/attendu.txt` ;
  après `--accepter`, `git diff tools/attendu.txt` montre quels sites, jours et
  heures basculent, et pourquoi ;
- **un parcours complet** sans erreur JS ni violation de la CSP : tableau, écran d'un
  site, balise, limites, modèle météo, recherche et ajout de sites, export et
  import, suppression jusqu'à l'accueil ;
- **le réseau lent** : Open-Meteo ne répond plus, l'appli doit retomber sur le cache ;
- **le service worker** : chaque fichier de l'appli figure dans `SHELL`, et `CACHE`
  a changé si l'appli a changé depuis le dernier commit.

Le banc s'ouvre aussi à la main, en local uniquement :
http://localhost:8000/tools/banc.html#parcours (ou `#lent`, `#tableau`, `#deco`…).
Il efface le stockage local de `localhost`.

### Publier une nouvelle version

L'appli est servie par GitHub Pages depuis la branche `main` (racine) : un push la
publie en une minute environ.

1. Incrémenter `CACHE` dans `sw.js`, sans quoi les téléphones gardent l'ancienne
   version ; ajouter tout nouveau fichier à `SHELL`, sans quoi l'appli ne s'ouvre
   plus hors ligne. Le vérificateur contrôle les deux.
2. Lancer `tools/verifier.sh`, commiter, pousser.
3. Sur le téléphone, la nouvelle version est cherchée à chaque retour de l'appli au
   premier plan ; dès qu'elle est installée, un avis « Nouvelle version de Déco
   disponible » propose de recharger. Le numéro de la version installée figure en
   bas de l'écran (« Déco v21 »).

### Mettre à jour la liste des décos

L'API ParaglidingEarth n'a ni recherche par nom ni en-têtes CORS : la liste est
embarquée (`sites-fr.json`, environ 60 Ko) et se régénère avec :

```sh
python3 tools/pge_snapshot.py            # France
python3 tools/pge_snapshot.py fr ch it   # plusieurs pays
```

puis incrémenter `CACHE`. Le secteur d'un déco ajouté est tiré de ses orientations
**principales** seulement (les orientations « possibles » sont souvent très larges) ;
les autres sont reprises dans sa note.

## Sites préréglés

Les sites de l'auteur, livrés aux seuls téléphones qui avaient déjà des sites
enregistrés, une seule fois chacun : un site supprimé ne revient pas, et les
réglages ne sont jamais écrasés. Un nouveau téléphone démarre sans site.

| Site | Type | Altitude | Secteur | Balise |
| --- | --- | --- | --- | --- |
| Sapenay | déco | 890 m | SO à NO (225–315°) | 1446 – Déco SAPENAY 901m |
| Saint-Hilaire | déco | 1000 m | NE à SE (45–135°) | 1333 – Décollage A5 / déco Nord |
| Aiguebelette | déco | 1120 m | SSO à NO (200–315°) | 1722 – Déco Aiguebelette 1121m |
| Marennes | gonflage | 230 m | NO à NE (315–45°), pente école face nord | 2229 – Pente Ecole MARENNES |
| Miribel-Jonage | gonflage | 175 m | SE à SO (135–225°), champ plat | aucune à moins de 15 km |
| Le Rebat (Poleymieux) | gonflage | 450 m | ONO à NNE (285–15°), pente école face NNO | aucune en service |

- À Sapenay, la balise est à 2 km au nord-est du point de prévision : la comparaison
  mesure / modèle porte sur deux points voisins, pas sur la même maille.
- Marennes est un terrain de club : se renseigner avant d'y aller.
- Sources des terrains : ParaglidingEarth et le fil « Gonflage près de Lyon » sur
  parapentiste.info.

## Licence

Le code est distribué sous licence [MIT](LICENSE). Les polices Barlow (licence SIL
OFL, `fonts/OFL.txt`) et les données des services tiers restent sous leurs propres
licences, détaillées dans [Sources de données](#sources-de-données).
