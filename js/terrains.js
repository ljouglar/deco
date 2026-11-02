// Consignes FFVL des terrains : statut, niveau conseillé, restrictions et dangers, et le bloc « Consignes FFVL »
import { esc, km } from "./outils.js";
import { kind, KINDS } from "./config.js";
import { site } from "./etat.js";

const REACH = 2; // km : deux décos d'un même site peuvent être à plus d'un kilomètre l'un de l'autre
const MAX_PICKS = 5;

// Instantané embarqué (tools/ffvl_snapshot.py), chargé à la demande : environ 600 Ko.
// Une ligne : [n° FFVL, nom, lat, lon, altitude, statut, fonctions, vents favorables, niveau, restrictions, dangers, règles de vol]
let loading = null, loaded = null;
export function loadTerrains() {
  loading ??= fetch("terrains-ffvl.json").then((r) => r.json()).then((j) => {
    loaded = { date: j.date, rows: j.rows.map(([id, name, lat, lon, alt, status, fn, wind, level, rules, risks, air]) =>
      ({ id, name, lat, lon, alt, status, fn, wind, level, rules, risks, air })) };
    return loaded;
  }).catch((e) => { loading = null; throw e; });
  return loading;
}
export const terrainsReady = () => !!loaded;

const FORBID = { interdit: "Terrain interdit", interdit_sauf_autorisation: "Interdit sauf autorisation", actif_autorisation_systematique_requise: "Autorisation requise" };
const isBanned = (t) => t.status === "interdit" || t.status === "interdit_sauf_autorisation";

// Un déco de la recherche : la mention à afficher si la FFVL y interdit le décollage à moins de 300 m
export function banAt(lat, lon) {
  if (!loaded) return null;
  const t = loaded.rows.find((x) => isBanned(x) && x.fn.includes("décollage") && km(lat, lon, x.lat, x.lon) < 0.3);
  return t ? FORBID[t.status] : null;
}

const wanted = (t, s, part) => (part === "land" ? t.fn.includes("atterrissage")
  : kind(s) === KINDS.gonflage || !t.fn || /décollage|pente-école|treuil/.test(t.fn));

// Le pilote choisit lui-même : le terrain le plus proche n'est pas toujours le bon (Sapenay a deux décos à 1,2 km)
const nearby = (s, at, part) => loaded.rows.filter((t) => wanted(t, s, part))
  .map((t) => ({ t, d: km(at.lat, at.lon, t.lat, t.lon) })).filter((x) => x.d <= REACH)
  .sort((a, b) => a.d - b.d).slice(0, MAX_PICKS);

// Ce qui est ouvert le reste quand l'écran se redessine (nouvelle mesure, autre heure)
const opened = new Set();
export function noteToggled(d) { if (d.open) opened.add(d.dataset.note); else opened.delete(d.dataset.note); }

const clean = (text) => esc(text.replace(/\r/g, "").replace(/•\t/g, "• "));
function note(part, key, title, text) {
  if (!text) return "";
  const id = `${part}:${key}`;
  return `<details data-note="${id}"${opened.has(id) ? " open" : ""}><summary>${title}</summary><p>${clean(text)}</p></details>`;
}

function linked(part, who, t) {
  const facts = [t.fn && t.fn.replace(/;/g, ", "), t.level && `niveau conseillé ${t.level.replace("ippi", "IPPI ")}`, t.wind && `vents ${t.wind.replace(/;/g, ", ")}`].filter(Boolean);
  const body = note(part, "rules", "Restrictions", t.rules) + note(part, "risks", "Dangers", t.risks) + note(part, "air", "Règles de vol", t.air);
  return `<div class="terrain-part">
    <h3>${who} : ${esc(t.name)}</h3>
    ${FORBID[t.status] ? `<p class="ban l${isBanned(t) ? 2 : 1}">${FORBID[t.status]}</p>` : ""}
    ${facts.length ? `<p class="facts-line">${esc(facts.join(" · "))}</p>` : ""}
    ${body || `<p class="facts-line">Aucune consigne publiée.</p>`}
    <p class="terrain-foot"><a href="https://www.spotair.mobi/?lat=${t.lat}&amp;lng=${t.lon}&amp;zoom=15" target="_blank" rel="noopener">Voir sur SpotAiR</a> <button type="button" class="link" data-terrain-change="${part}">changer</button></p>
  </div>`;
}

function chooser(part, who, picks) {
  return `<div class="terrain-part">
    <h3>${who} : quel terrain ?</h3>
    <div class="terrain-picks">${picks.map(({ t, d }) => `<button type="button" class="terrain-pick" data-terrain="${part}:${t.id}"><b>${esc(t.name)}</b>
      <small>${esc(t.fn.replace(/;/g, ", "))}${t.fn ? " · " : ""}${d.toFixed(1).replace(".", ",")} km${t.wind ? ` · vents ${esc(t.wind.replace(/;/g, ", "))}` : ""}${FORBID[t.status] ? ` · <em>${FORBID[t.status].toLowerCase()}</em>` : ""}</small></button>`).join("")}</div>
    <button type="button" class="link" data-terrain="${part}:0">Aucun de ceux-là</button>
  </div>`;
}

function partHtml(s, part, who, at) {
  if (at.terrain === 0) {
    return nearby(s, at, part).length ? `<div class="terrain-part"><p class="facts-line">${who} : pas de terrain associé. <button type="button" class="link" data-terrain-change="${part}">choisir</button></p></div>` : "";
  }
  const t = at.terrain && loaded.rows.find((x) => x.id === at.terrain);
  if (t) return linked(part, who, t);
  const picks = nearby(s, at, part);
  return picks.length ? chooser(part, who, picks) : "";
}

export function terrainCard() {
  const s = site();
  if (!s || !loaded) return "";
  const parts = partHtml(s, "site", kind(s) === KINDS.gonflage ? "Terrain" : "Déco", s) + (s.land ? partHtml(s, "land", "Atterro", s.land) : "");
  if (!parts) return "";
  const date = new Date(loaded.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  return `<section class="terrain"><h2 class="kicker">Consignes FFVL</h2>${parts}
    <p class="terrain-src">Source FFVL sur <a href="https://www.data.gouv.fr/organizations/federation-francaise-de-vol-libre/datasets">data.gouv.fr</a>, Licence Ouverte, dernière évolution le ${date}. Vérifie sur place : panneau du site, club ou école.</p></section>`;
}
