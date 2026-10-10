// Chargements et navigation : seul le chargement le plus récent s'applique
import { parisParts, store } from "./outils.js";
import { limitsOf, site, state } from "./etat.js";
import { buildAll, inPlay } from "./regles.js";
import { fcKey, fetchError, fetchForecasts, loadForecast } from "./donnees.js";
import { loadLive } from "./balise.js";
import { render, renderChrome } from "./rendu.js";

// Chaque chargement porte un numéro : seul le plus récent s'applique, une réponse lente d'un site
// quitté entre-temps ne vient pas écraser celui qu'on regarde
let siteGen = 0, ovGen = 0;

export async function load(force = false) {
  const s = site();
  if (!s) return;
  const gen = ++siteGen;
  state.loadingSite = true; state.error = null; state.live = null; state.liveLand = null; renderChrome();
  // L'atterro a sa balise à lui (loadLive lit son numéro dans s.land.piou)
  const [fc, live, liveLand] = await Promise.all([loadForecast(s, force), loadLive(s, force), loadLive(s.land, force)]);
  if (gen !== siteGen) return;
  state.error = fc.error;
  if (fc.json) ingest(fc.json, fc.at, fc.fromCache);
  state.live = live; state.liveLand = liveLand;
  state.loadingSite = false;
  render();
}

export async function loadOverview(force = false) {
  const gen = ++ovGen;
  state.view = "overview"; state.loadingOv = true; state.error = null; renderChrome();
  const sites = state.sites.slice(), ov = { rows: [], fetchedAt: Date.now(), fromCache: false };
  if (!sites.length) { state.ov = { rows: [], fetchedAt: null }; state.loadingOv = false; render(); return; }
  let error = null;
  try {
    const list = await fetchForecasts(sites, force);
    ov.rows = sites.map((s, i) => ({ s, json: list[i] }));
  } catch (e) {
    // Hors ligne : chaque site retombe sur sa dernière prévision enregistrée
    error = fetchError(e);
    ov.fromCache = true;
    ov.rows = sites.map((s) => { const c = store.get(fcKey(s), null); return { s, json: c && c.json, at: c && c.at }; });
    const ats = ov.rows.map((r) => r.at).filter(Boolean);
    ov.fetchedAt = ats.length ? Math.min(...ats) : null;
  }
  if (gen !== ovGen) return;
  ov.rows.forEach((r) => { r.days = r.json ? buildAll(r.json, r.s) : []; });
  state.ov = ov; state.error = error; state.loadingOv = false;
  render();
}

export function openSite(id, date = null) {
  state.siteId = id; store.set("siteId", id);
  // Sans jour demandé, le jour se choisit à l'arrivée de la prévision (voir ingest)
  state.view = "site"; state.wantDate = date || "auto"; state.hourSel = null;
  window.scrollTo(0, 0);
  load();
}

// Recharge la vue affichée
export const refresh = (force = false) => (state.view === "overview" ? loadOverview(force) : load(force));

export async function refreshLive(force = false) {
  const s = site();
  if (!s || !(s.piou || (s.land && s.land.piou))) return;
  const [live, liveLand] = await Promise.all([loadLive(s, force), loadLive(s.land, force)]);
  if (state.view !== "site" || site() !== s) return; // on a changé d'écran entre-temps
  state.live = live; state.liveLand = liveLand;
  render();
}

function ingest(json, at, fromCache) {
  state.fcJson = json;
  state.days = buildAll(json, site());
  state.fetchedAt = at; state.fromCache = fromCache;
  // Ouverture depuis la liste : aujourd'hui tant qu'il reste des heures à jouer (on est au déco, la balise
  // compte), demain sinon (on prépare la sortie)
  if (state.wantDate === "auto") {
    const today = state.days[0], L = limitsOf(site());
    state.dayIdx = today && today.date === parisParts(Date.now()).date && today.hours.some((h) => inPlay(h, L)) ? 0 : 1;
    state.wantDate = null;
  }
  // Arrivée depuis le tableau : on ouvre le jour touché
  if (state.wantDate) {
    const i = state.days.findIndex((d) => d.date === state.wantDate);
    if (i >= 0) state.dayIdx = i;
    state.wantDate = null;
  }
  if (state.dayIdx >= state.days.length) state.dayIdx = 0;
  state.hourSel = null;
}

export function reevaluate() {
  if (state.view === "overview") {
    state.ov && state.ov.rows.forEach((r) => { if (r.json) r.days = buildAll(r.json, r.s); });
    return;
  }
  // Tout est recalculé depuis la réponse : les verdicts des trois modèles suivent les nouvelles limites
  if (state.fcJson) state.days = buildAll(state.fcJson, site());
  if (state.dayIdx >= state.days.length) state.dayIdx = 0;
  state.hourSel = null;
}
