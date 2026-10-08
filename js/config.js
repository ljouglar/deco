// Configuration : sites préréglés, limites et niveaux, modèles météo, ce qui distingue un déco d'un terrain
// Préréglages de l'auteur, livrés aux seuls téléphones qui avaient déjà des sites (voir withPresets)
export const DEFAULT_SITES = [{
  id: "sapenay", name: "Sapenay", lat: 45.8109, lon: 5.8657, alt: 890, secMin: 225, secMax: 315, piou: 1446,
  note: "Déco ouest. Approche de Chambéry-Aix : ne pas monter à plus de 300 m au-dessus du déco. Vent d'est = déco sous le vent."
}, {
  id: "sthilaire", name: "Saint-Hilaire", lat: 45.3069, lon: 5.8881, alt: 1000, secMin: 45, secMax: 135, piou: 1333,
  note: "Déco est au-dessus de Lumbin. Deux décos : le Nord (tapis, confortable) peut se retrouver sous le vent de la brise, le Sud (herbe) prend mieux la brise de face. Atterro officiel à Lumbin."
}, {
  id: "aiguebelette", name: "Aiguebelette", lat: 45.6016, lon: 5.8073, alt: 1120, secMin: 200, secMax: 315, piou: 1722,
  note: "Déco des Provinces (l'Épine), face ouest sur le lac. La brise monte souvent après 13 h : la balise mesure surtout cette brise, pas le vent météo."
}, {
  id: "marennes", type: "gonflage", name: "Marennes", lat: 45.6154, lon: 4.9038, alt: 230, secMin: 315, secMax: 45, piou: 2229,
  note: "Pente école face nord, chemin des Condamines. Terrain de club : se renseigner avant d'y aller. Se garer le long de la route ou du chemin, ne pas monter jusqu'à la maison ni y faire demi-tour."
}, {
  id: "miribel", type: "gonflage", name: "Miribel-Jonage", lat: 45.7936, lon: 4.9578, alt: 175, secMin: 135, secMax: 225,
  note: "Grand champ plat au sud-est du lac, idéal en vent météo sud. Cerfs-volants et paramoteurs fréquents. Vols signalés dans les voitures : ne rien laisser en vue."
}, {
  id: "rebat", type: "gonflage", name: "Le Rebat", lat: 45.8651, lon: 4.7935, alt: 450, secMin: 285, secMax: 15,
  note: "Pente école face nord-nord-ouest à Poleymieux, près du déco de la Croix Rampau. Pas de balise en service à proximité."
}];

export const DEFAULT_LIMITS = {
  maxWind: 20,      // vent moyen max au déco (km/h)
  maxGust: 25,      // rafales max (km/h)
  maxGustDelta: 10, // écart rafales - vent moyen (km/h)
  maxAlt: 25,       // vent max vers 1500 m / 850 hPa (km/h)
  capeWarn: 400,    // J/kg : instable
  capeStop: 1000,   // J/kg : risque orageux
  minBase: 500,     // base des nuages mini au-dessus du déco (m)
  startHour: 9, endHour: 18, model: "best_match"
};

// Gonflage face voile : il faut assez de vent, mais régulier, et le plafond est plus bas qu'au déco
export const DEFAULT_LIMITS_G = {
  minWind: 8, maxWind: 20, maxGust: 25, maxGustDelta: 8,
  maxAlt: 35, capeWarn: 300, capeStop: 1000, startHour: 9, endHour: 19
};

export const MODELS = {
  best_match: "Automatique",
  meteofrance_seamless: "Météo-France (AROME)",
  icon_seamless: "ICON (DWD)",
  ecmwf_ifs025: "ECMWF"
};

export const FORECAST_DAYS = 6; // aujourd'hui + 5 jours ; au-delà de J+2, c'est une tendance

// Les trois modèles comparés pour l'accord, toujours demandés avec le modèle choisi
export const ENSEMBLE = ["meteofrance_seamless", "icon_seamless", "ecmwf_ifs025"];

export const MODEL_SHORT = { meteofrance_seamless: "Météo-France", icon_seamless: "ICON", ecmwf_ifs025: "ECMWF" };

export const HOURLY = [
  "temperature_2m", "dew_point_2m", "precipitation_probability", "precipitation",
  "cloud_cover_low", "cloud_cover_mid", "cloud_cover_high",
  "wind_speed_10m", "wind_direction_10m", "wind_gusts_10m",
  "wind_speed_850hPa", "wind_direction_850hPa", "wind_speed_700hPa", "wind_direction_700hPa",
  "cape", "boundary_layer_height"
];

const LIMIT_FIELDS = [
  ["maxWind", "Vent moyen max", "au déco, km/h"],
  ["maxGust", "Rafales max", "km/h"],
  ["maxGustDelta", "Écart rafales / vent", "irrégularité tolérée, km/h"],
  ["maxAlt", "Vent max vers 1500 m", "850 hPa, km/h"],
  ["capeWarn", "Instabilité : vigilance", "CAPE, J/kg"],
  ["capeStop", "Instabilité : orage", "CAPE, J/kg"],
  ["minBase", "Base des nuages mini", "m au-dessus du déco"],
  ["startHour", "Début de journée", "heure"],
  ["endHour", "Fin de journée", "heure"]
];

const LIMIT_FIELDS_G = [
  ["minWind", "Vent moyen mini", "en dessous, face voile difficile, km/h"],
  ["maxWind", "Vent moyen max", "au sol, km/h"],
  ["maxGust", "Rafales max", "km/h"],
  ["maxGustDelta", "Écart rafales / vent", "irrégularité tolérée, km/h"],
  ["maxAlt", "Vent vers 1500 m", "au-delà, rafales possibles au sol, km/h"],
  ["capeWarn", "Instabilité : vigilance", "CAPE, J/kg"],
  ["capeStop", "Instabilité : orage", "CAPE, J/kg"],
  ["startHour", "Début de journée", "heure"],
  ["endHour", "Fin de journée", "heure"]
];

// Repères par niveau, à ajuster avec son moniteur ; le seuil d'orage ne bouge pas, il ne dépend pas du pilote
export const LEVEL_NAMES = { debutant: "Débutant", inter: "Intermédiaire", confirme: "Confirmé" };

const LEVELS_VOL = {
  debutant: { maxWind: 20, maxGust: 25, maxGustDelta: 10, maxAlt: 25, capeWarn: 400, capeStop: 1000, minBase: 500 },
  inter: { maxWind: 25, maxGust: 30, maxGustDelta: 12, maxAlt: 30, capeWarn: 600, capeStop: 1000, minBase: 400 },
  confirme: { maxWind: 30, maxGust: 35, maxGustDelta: 15, maxAlt: 40, capeWarn: 800, capeStop: 1000, minBase: 300 }
};

const LEVELS_G = {
  debutant: { minWind: 8, maxWind: 20, maxGust: 25, maxGustDelta: 8, maxAlt: 35, capeWarn: 300, capeStop: 1000 },
  inter: { minWind: 6, maxWind: 25, maxGust: 30, maxGustDelta: 10, maxAlt: 40, capeWarn: 500, capeStop: 1000 },
  confirme: { minWind: 5, maxWind: 30, maxGust: 35, maxGustDelta: 12, maxAlt: 45, capeWarn: 700, capeStop: 1000 }
};

// Ce qui distingue un déco d'un terrain de gonflage ; `key` nomme ses limites dans state et localStorage,
// `dir` les phrases sur la direction du vent, partagées par la prévision et la balise
export const KINDS = {
  deco: {
    id: "deco", key: "limits", fields: LIMIT_FIELDS, levels: LEVELS_VOL,
    label: "Déco", place: "déco", here: "au déco", limitsTitle: "Mes limites de vol", kicker: "Vol",
    titles: ["Favorable", "À surveiller", "Défavorable"],
    dir: { ok: "dans l'axe du déco", cross: "travers au déco", out: "hors secteur : déco sous le vent possible", outLevel: 2 }
  },
  gonflage: {
    id: "gonflage", key: "limitsG", fields: LIMIT_FIELDS_G, levels: LEVELS_G,
    label: "Gonflage", place: "terrain", here: "sur le terrain", limitsTitle: "Mes limites de gonflage", kicker: "Gonflage face voile",
    titles: ["Favorable", "À surveiller", "Défavorable"],
    // Sur un terrain, un vent hors secteur passe par les haies et les arbres : turbulent, sans être un piège de déco
    dir: { ok: "bien orienté sur le terrain", cross: "de travers sur le terrain", out: "hors secteur : turbulences d'obstacles possibles", outLevel: 1 }
  }
};

export const kind = (s) => KINDS[s && s.type === "gonflage" ? "gonflage" : "deco"];

// Le modèle météo vaut pour tous les sites : il a sa feuille, ouverte depuis le pied de page
export const MODEL_INFO = {
  best_match: "Open-Meteo choisit pour chaque point le meilleur modèle disponible.",
  meteofrance_seamless: "AROME à courte échéance, le plus fin en montagne, puis ARPEGE. S'arrête vers J+4.",
  icon_seamless: "Modèle allemand du DWD, ICON-D2 à courte échéance.",
  ecmwf_ifs025: "Modèle européen, plus lissé, solide à moyenne échéance."
};
