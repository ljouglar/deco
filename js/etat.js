// L'état de l'appli, chargé depuis le téléphone au démarrage
import { store } from "./outils.js";
import { DEFAULT_LIMITS, DEFAULT_LIMITS_G, DEFAULT_SITES, kind } from "./config.js";

// Un nouveau téléphone démarre sans site. Les préréglages ne vont qu'aux téléphones qui avaient déjà
// des sites, une seule fois chacun : un site supprimé ne revient plus, les réglages ne sont jamais écrasés.
function withPresets(saved) {
  const seen = store.get("presets", []);
  const out = Array.isArray(saved) ? saved.map((s) => ({ ...s })) : [];
  if (out.length) for (const d of DEFAULT_SITES) if (!seen.includes(d.id) && !out.some((s) => s.id === d.id)) out.push({ ...d });
  store.set("presets", DEFAULT_SITES.map((d) => d.id));
  return out;
}

export const state = {
  sites: withPresets(store.get("sites", null)),
  limits: { ...DEFAULT_LIMITS, ...store.get("limits", {}) },     // vol, et choix du modèle météo
  limitsG: { ...DEFAULT_LIMITS_G, ...store.get("limitsG", {}) }, // gonflage
  siteId: store.get("siteId", "sapenay"),
  dayIdx: 1, hourSel: null, days: [], fcJson: null, fetchedAt: null, fromCache: false, error: null,
  loadingSite: false, loadingOv: false, live: null,
  view: "overview", ov: null, wantDate: null // l'appli s'ouvre sur le tableau « Où voler ? »
};

store.set("sites", state.sites);

export const site = () => state.sites.find((s) => s.id === state.siteId) || state.sites[0];

export const limitsOf = (s) => state[kind(s).key];
