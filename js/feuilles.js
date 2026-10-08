// Feuilles : limites, modèle météo, mes sites et recherche ParaglidingEarth
import { $, cardinal, el, esc, fold, km, store } from "./outils.js";
import { kind, KINDS, LEVEL_NAMES, MODEL_INFO, MODELS } from "./config.js";
import { site, state } from "./etat.js";
import { nearestPiou } from "./balise.js";
import { render } from "./rendu.js";
import { loadOverview, openSite, reevaluate, refresh } from "./chargement.js";

// Limites d'un type de site (celui affiché, ou au choix depuis le tableau) ; le modèle météo est commun
let limitsKind = KINDS.deco;

export function openLimits(K) {
  limitsKind = K;
  const L = state[K.key];
  $("limitsTitle").textContent = K.limitsTitle;
  $("limitsForm").innerHTML = `<div class="levels" role="group" aria-label="Niveau">${Object.entries(LEVEL_NAMES).map(([k, n]) =>
      `<button type="button" data-level="${k}" aria-pressed="false">${n}</button>`).join("")}</div>
    <p class="hint" id="levelHint"></p>` + K.fields.map(([k, label, sub]) =>
    `<label class="field"><span>${label}<small>${sub}</small></span><input type="number" name="${k}" value="${L[k]}" inputmode="numeric"></label>`
  ).join("") + `
    <div class="actions">
      <button type="submit" class="btn primary">Enregistrer</button>
    </div>`;
  markLevel();
  $("limitsDlg").showModal();
}

// Le niveau dont les valeurs sont celles du formulaire, sinon « personnalisé »
function markLevel() {
  const f = $("limitsForm"), levels = limitsKind.levels;
  const cur = Object.keys(levels).find((k) => Object.entries(levels[k]).every(([n, v]) => +el(f, n).value === v));
  f.querySelectorAll("[data-level]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.level === cur)));
  $("levelHint").textContent = (cur ? `Repères ${LEVEL_NAMES[cur].toLowerCase()}` : "Réglages personnalisés")
    + ", indicatifs : ajuste-les avec ton moniteur. Rien n'est pris en compte avant « Enregistrer ».";
}

$("limitsForm").addEventListener("click", (e) => {
  const b = e.target.closest("[data-level]"); if (!b) return;
  const f = $("limitsForm");
  Object.entries(limitsKind.levels[b.dataset.level]).forEach(([n, v]) => { el(f, n).value = v; });
  markLevel();
});

$("limitsForm").addEventListener("input", (e) => { if (e.target.type === "number") markLevel(); });

$("limitsForm").addEventListener("submit", () => {
  const fd = new FormData($("limitsForm")), K = limitsKind;
  const next = { ...state[K.key] };
  for (const [k] of K.fields) { const n = parseFloat(fd.get(k)); if (!Number.isNaN(n)) next[k] = n; }
  state[K.key] = next; store.set(K.key, next);
  reevaluate(); render();
});

export function openModel() {
  $("modelForm").innerHTML = `<p class="hint">Le verdict principal suit ce modèle. Météo-France, ICON et ECMWF sont de toute façon comparés en plus.</p>
    ${Object.entries(MODELS).map(([k, n]) => `<label class="choice"><input type="radio" name="model" value="${k}"${k === state.limits.model ? " checked" : ""}>
      <span><b>${n}</b><small>${MODEL_INFO[k]}</small></span></label>`).join("")}
    <div class="actions"><button type="submit" class="btn primary">Enregistrer</button></div>`;
  $("modelDlg").showModal();
}

$("modelForm").addEventListener("submit", () => {
  const m = new FormData($("modelForm")).get("model");
  if (!m || m === state.limits.model) return;
  state.limits.model = m; store.set("limits", state.limits);
  refresh();
});

export function openSites() { renderSitesList(); resetSiteForm(); $("sitesDlg").showModal(); }

function renderSitesList() {
  $("sitesList").innerHTML = state.sites.map((s) => `
    <div class="site-row">
      <button class="info" data-use="${esc(s.id)}" aria-label="Ouvrir ${esc(s.name)}"><b>${esc(s.name)}</b><small>${kind(s).label} ${s.alt} m, ${cardinal(s.secMin)} à ${cardinal(s.secMax)}${s.piou ? ` · balise ${esc(s.piou)}` : ""}</small></button>
      <button class="btn" data-edit="${esc(s.id)}">Modifier</button>
      <button class="btn danger" data-del="${esc(s.id)}" aria-label="Supprimer ${esc(s.name)}">✕</button>
    </div>`).join("");
}

function resetSiteForm(s) {
  const f = $("siteForm");
  f.reset();
  el(f, "id").value = s ? s.id : "";
  if (s) ["name", "lat", "lon", "alt", "secMin", "secMax", "piou", "note"].forEach((k) => { el(f, k).value = s[k] ?? ""; });
  el(f, "type").value = s && s.type === "gonflage" ? "gonflage" : "deco";
  $("pgeSearch").hidden = !!s;
  $("pge-q").value = ""; $("pgeResults").innerHTML = ""; $("pgeStatus")?.remove();
  $("siteFormTitle").textContent = s ? `Modifier ${s.name}` : "Ajouter un site";
  $("siteSubmit").textContent = s ? "Enregistrer le site" : "Ajouter le site";
}

// Instantané embarqué (tools/pge_snapshot.py) : l'API n'a ni recherche par nom ni CORS.
// Une ligne : [nom, lat, lon, altitude, orientations N→NO (2 principale, 1 possible), n° PGE]
const PGE_DIRS = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];

let pgeRows = null;

function pgeLoad() {
  pgeRows ??= fetch("sites-fr.json").then((r) => r.json())
    .then((rows) => rows.map((r) => ({ r, key: fold(r[0]) })))
    .catch((e) => { pgeRows = null; throw e; });
  return pgeRows;
}

// Secteur bâti sur les orientations principales seulement : les « possibles » sont souvent très larges
function pgeSector(o) {
  const lvl = o.includes("2") ? "2" : o.includes("1") ? "1" : null;
  if (!lvl) return null;
  const on = [...o].map((c) => c === lvl);
  let best = null;
  if (on.every(Boolean)) best = { i: 0, n: 8 };
  else for (let i = 0; i < 8; i++) {
    if (!on[i] || on[(i + 7) % 8]) continue;
    let n = 0; while (on[(i + n) % 8]) n++;
    if (!best || n > best.n) best = { i, n };
  }
  const run = Array.from({ length: best.n }, (_, k) => (best.i + k) % 8);
  const pad = best.n === 1 ? 22 : 0; // une seule direction : ± un demi-quart
  return {
    min: best.n === 8 ? 0 : (run[0] * 45 - pad + 360) % 360,
    max: best.n === 8 ? 359 : (run[run.length - 1] * 45 + pad) % 360,
    others: [...o].map((c, i) => (c !== "0" && !run.includes(i) ? PGE_DIRS[i] : null)).filter(Boolean)
  };
}

const orientText = (o) => [...o].map((c, i) => (c === "2" ? PGE_DIRS[i] : null)).filter(Boolean).join(" ")
  || [...o].map((c, i) => (c === "1" ? `(${PGE_DIRS[i]})` : null)).filter(Boolean).join(" ") || "orientation inconnue";

async function pgeSearch() {
  const q = fold($("pge-q").value.trim()), out = $("pgeResults");
  if (q.length < 2) { out.innerHTML = ""; return; }
  let rows;
  try { rows = await pgeLoad(); } catch { out.innerHTML = `<p class="hint">Liste des sites indisponible.</p>`; return; }
  if (fold($("pge-q").value.trim()) !== q) return; // une frappe plus récente a pris le relais
  const words = q.split(/\s+/);
  const hits = rows.filter((x) => words.every((w) => x.key.includes(w)))
    .sort((a, b) => b.key.startsWith(words[0]) - a.key.startsWith(words[0]) || a.key.localeCompare(b.key)).slice(0, 8);
  pgeRender(hits, "Aucun déco trouvé.");
}

// Déjà dans mes sites : même fiche, ou un déco à moins de 300 m
const pgeHave = (r) => state.sites.some((s) => s.id === `pge${r[5]}` || (kind(s) === KINDS.deco && km(s.lat, s.lon, r[1], r[2]) < 0.3));

// Toucher le nom remplit le formulaire pour vérifier ; « Ajouter » enregistre tout de suite
function pgeRender(hits, none) {
  $("pgeResults").innerHTML = hits.length ? hits.map(({ r, d }) => `<div class="pge-item">
      <button type="button" class="pge-pick" data-pge="${r[5]}"><b>${esc(r[0])}</b>
        <small>${r[3] != null ? `${r[3]} m · ` : ""}${esc(orientText(r[4]))}${d != null ? ` · ${d.toFixed(d < 10 ? 1 : 0).replace(".", ",")} km` : ""}</small></button>
      ${pgeHave(r) ? `<span class="pge-done">Ajouté</span>`
        : pgeSector(r[4]) ? `<button type="button" class="btn pge-add" data-pge-add="${r[5]}" aria-label="Ajouter ${esc(r[0])}">Ajouter</button>` : ""}
    </div>`).join("") : `<p class="hint">${esc(none)}</p>`;
}

// Un déco ParaglidingEarth devenu site : secteur des orientations principales, les autres dans la note
function pgeSite(r) {
  const [name, lat, lon, alt, o, id] = r, sec = pgeSector(o);
  return { sec, site: {
    id: `pge${id}`, type: "deco", name, lat, lon, alt: alt ?? "", secMin: sec ? sec.min : "", secMax: sec ? sec.max : "", piou: null,
    note: sec && sec.others.length ? `ParaglidingEarth donne aussi : ${sec.others.join(", ")}.` : ""
  } };
}

async function pgeQuickAdd(id, btn) {
  const { r } = (await pgeLoad()).find((x) => x.r[5] === id);
  const { site: s } = pgeSite(r);
  btn.disabled = true; btn.textContent = "…";
  try { const b = await nearestPiou(s.lat, s.lon); if (b) s.piou = b.id; } catch {}
  state.sites.push(s); store.set("sites", state.sites);
  renderSitesList();
  if (state.view === "overview") loadOverview(); // le tableau se met à jour derrière la feuille
  btn.outerHTML = `<span class="pge-done">Ajouté</span>`;
}

const NEAR_KM = 60;

export function pgeNear() {
  const out = $("pgeResults");
  $("pge-q").value = "";
  if (!navigator.geolocation) { out.innerHTML = `<p class="hint">Position indisponible sur cet appareil : cherche par nom.</p>`; return; }
  out.innerHTML = `<p class="hint">Recherche de ta position…</p>`;
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude: la, longitude: lo } = pos.coords;
    let rows;
    try { rows = await pgeLoad(); } catch { out.innerHTML = `<p class="hint">Liste des sites indisponible.</p>`; return; }
    const hits = rows.map((x) => ({ r: x.r, d: km(la, lo, x.r[1], x.r[2]) })).filter((x) => x.d <= NEAR_KM)
      .sort((a, b) => a.d - b.d).slice(0, 12);
    pgeRender(hits, `Aucun déco connu à moins de ${NEAR_KM} km.`);
  }, () => {
    out.innerHTML = `<p class="hint">Position refusée ou introuvable : autorise la localisation, ou cherche par nom.</p>`;
  }, { timeout: 10000, maximumAge: 10 * 60 * 1000 });
}

let pgePick = 0;

async function pgeFill(id) {
  const { r } = (await pgeLoad()).find((x) => x.r[5] === id);
  const { site: s, sec } = pgeSite(r), { name, lat, lon } = s, f = $("siteForm"), pick = ++pgePick;
  resetSiteForm();
  ["name", "lat", "lon", "alt", "secMin", "secMax", "note"].forEach((k) => { el(f, k).value = s[k]; });
  const status = document.createElement("p");
  status.className = "hint"; status.id = "pgeStatus";
  status.textContent = `${name} : ${sec ? "secteur repris des orientations principales" : "pas d'orientation connue, secteur à saisir"}. Recherche d'une balise…`;
  $("pgeSearch").after(status);
  status.scrollIntoView({ block: "start" });
  try {
    const b = await nearestPiou(lat, lon);
    if (pick !== pgePick) return;
    if (b) el(f, "piou").value = b.id;
    status.textContent = status.textContent.replace("Recherche d'une balise…",
      b ? `Balise n° ${b.id}${b.name ? ` « ${b.name.trim()} »` : ""} à ${b.d.toFixed(1).replace(".", ",")} km.` : "Aucune balise en service à moins de 3 km.");
  } catch {
    if (pick === pgePick) status.textContent = status.textContent.replace("Recherche d'une balise…", "Balises injoignables, numéro à saisir si besoin.");
  }
}

$("pge-q").addEventListener("input", pgeSearch);

// Sous la liste des sites, le champ finirait sous le clavier avec ses résultats : on le remonte en haut de la feuille
$("pge-q").addEventListener("focus", () => {
  pgeLoad().catch(() => {});
  $("siteFormTitle").scrollIntoView({ block: "start" });
});

$("pgeResults").addEventListener("click", (e) => {
  const a = e.target.closest("[data-pge-add]"); if (a) { pgeQuickAdd(+a.dataset.pgeAdd, a); return; }
  const b = e.target.closest("[data-pge]"); if (b) pgeFill(+b.dataset.pge);
});

$("pgeNear").addEventListener("click", pgeNear);

$("sitesList").addEventListener("click", (e) => {
  const b = e.target.closest("button"); if (!b) return;
  if (b.dataset.use) { $("sitesDlg").close(); openSite(b.dataset.use); }
  if (b.dataset.edit) resetSiteForm(state.sites.find((s) => s.id === b.dataset.edit));
  if (b.dataset.del) {
    const s = state.sites.find((x) => x.id === b.dataset.del);
    if (s && confirm(`Supprimer ${s.name} ?`)) {
      state.sites = state.sites.filter((x) => x.id !== s.id); store.set("sites", state.sites);
      const shown = state.siteId === s.id;
      if (shown && state.sites.length) { state.siteId = state.sites[0].id; store.set("siteId", state.siteId); }
      // Le site affiché disparaît, ou plus aucun site : retour au tableau (et à l'accueil s'il est vide)
      if (state.view === "overview" || shown) loadOverview();
      renderSitesList();
    }
  }
});

$("siteForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target;
  const s = {
    id: el(f, "id").value || `s${Date.now()}`, name: el(f, "name").value.trim(), type: el(f, "type").value,
    lat: +el(f, "lat").value, lon: +el(f, "lon").value, alt: Math.round(+el(f, "alt").value),
    secMin: ((+el(f, "secMin").value % 360) + 360) % 360, secMax: ((+el(f, "secMax").value % 360) + 360) % 360,
    piou: el(f, "piou").value.trim() ? Math.round(+el(f, "piou").value) : null,
    note: el(f, "note").value.trim()
  };
  const i = state.sites.findIndex((x) => x.id === s.id);
  if (i >= 0) state.sites[i] = s; else state.sites.push(s);
  store.set("sites", state.sites);
  $("sitesDlg").close();
  if (state.view === "overview") loadOverview(); else openSite(s.id);
});

$("geoBtn").addEventListener("click", () => {
  const b = $("geoBtn"), f = $("siteForm");
  if (!navigator.geolocation) { b.textContent = "Indisponible"; return; }
  b.textContent = "Recherche…";
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    el(f, "lat").value = latitude.toFixed(4); el(f, "lon").value = longitude.toFixed(4);
    try {
      const r = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${latitude}&longitude=${longitude}`);
      const j = await r.json();
      if (j.elevation) el(f, "alt").value = Math.round(j.elevation[0]);
    } catch {}
    b.textContent = "Ma position";
  }, () => { b.textContent = "Position refusée"; }, { enableHighAccuracy: true, timeout: 10000 });
});

$("siteCancel").addEventListener("click", () => $("sitesDlg").close());

// Fermer une feuille en touchant le fond. La cible seule ne suffit pas : un toucher dans la marge de la feuille,
// ou un défilement entre l'appui et le relâché (focus de la recherche), donne aussi la feuille pour cible
document.querySelectorAll("dialog").forEach((d) => d.addEventListener("click", (e) => {
  if (e.target !== d) return;
  const r = d.getBoundingClientRect();
  if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) d.close();
}));
