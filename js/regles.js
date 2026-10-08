// Les règles : évaluation heure par heure (vol, gonflage), verdict du jour, accord entre modèles.
// Aucun accès au DOM ni au réseau : ce module se teste seul.
import { cardinal, parisParts, r0, sectorGap } from "./outils.js";
import { ENSEMBLE, FORECAST_DAYS, HOURLY, kind } from "./config.js";
import { limitsOf, state } from "./etat.js";

function evaluate(h, s, L) {
  const reasons = [];
  let level = 0;
  const flag = (l, msg, tag) => { level = Math.max(level, l); reasons.push({ l, msg, tag }); };

  flagRain(h, flag);

  // Direction du vent au déco
  if (h.ws != null && h.wd != null) {
    if (h.ws < 6) flag(0, "Vent météo faible : la brise de pente devrait s'installer");
    else { const n = dirNote(h.wd, s); flag(n.l, n.msg, n.tag); }
  }

  // Force et rafales
  if (h.ws != null) {
    if (h.ws > L.maxWind) flag(2, `Vent moyen ${r0(h.ws)} km/h, au-dessus de ta limite`, "vent trop fort");
    else if (h.ws > L.maxWind * 0.8) flag(1, `Vent moyen ${r0(h.ws)} km/h, proche de ta limite`, "vent soutenu");
  }
  flagGusts(h, L, flag);

  // Altitude
  if (h.w850 != null) {
    if (h.w850 > L.maxAlt) flag(2, `Vent fort vers 1500 m (${r0(h.w850)} km/h ${cardinal(h.d850)})`, "vent fort en altitude");
    else if (h.w850 > L.maxAlt * 0.75) flag(1, `Vent soutenu vers 1500 m (${r0(h.w850)} km/h)`, "vent soutenu en altitude");
  }
  if (h.w700 != null && h.d700 != null && h.d700 >= 135 && h.d700 <= 225 && h.w700 >= 25) {
    flag(h.w700 >= 40 ? 2 : 1, `Flux de sud vers 3000 m (${r0(h.w700)} km/h) : risque de foehn et de turbulences`, "flux de sud");
  }

  flagCape(h, L, flag, "thermiques musclés", "masse d'air instable");

  // Base des nuages (estimation par l'écart température / point de rosée)
  let base = null;
  if (h.t != null && h.td != null) {
    base = s.alt + Math.max(0, h.t - h.td) * 125;
    if ((h.cl ?? 0) >= 50 && base - s.alt < L.minBase) {
      flag(base - s.alt < 200 ? 2 : 1, `Nuages bas vers ${Math.round(base / 50) * 50} m`, "nuages bas");
    }
  }
  return { level, reasons, base };
}

// Règles communes au vol et au gonflage
function flagRain(h, flag) {
  if ((h.pr ?? 0) >= 0.3 || (h.pp ?? 0) >= 60) flag(2, `Pluie probable (${r0(h.pp)} %)`, "pluie");
  else if ((h.pp ?? 0) >= 30) flag(1, `Risque d'averse (${r0(h.pp)} %)`, "risque d'averse");
}

function flagGusts(h, L, flag) {
  if (h.wg == null) return;
  if (h.wg > L.maxGust) flag(2, `Rafales ${r0(h.wg)} km/h`, "rafales");
  else if (h.ws != null && h.wg - h.ws > L.maxGustDelta) flag(1, `Vent irrégulier (rafales ${r0(h.wg)} km/h)`, "vent irrégulier");
}

function flagCape(h, L, flag, warnMsg, warnTag) {
  if (h.cape == null) return;
  if (h.cape >= L.capeStop) flag(2, `Masse d'air très instable (CAPE ${r0(h.cape)}) : risque orageux`, "risque orageux");
  else if (h.cape >= L.capeWarn) flag(1, `Masse d'air instable (CAPE ${r0(h.cape)}) : ${warnMsg}`, warnTag);
}

// Le vent d'une direction donnée, rapporté au secteur du site (prévision comme mesure)
export function dirNote(wd, s) {
  const D = kind(s).dir, gap = sectorGap(wd, s.secMin, s.secMax), c = cardinal(wd);
  if (gap === 0) return { l: 0, msg: `Vent ${c} ${D.ok}` };
  if (gap <= 30) return { l: 1, msg: `Vent ${c} ${D.cross}`, tag: "vent travers" };
  return { l: D.outLevel, msg: `Vent ${c} ${D.out}`, tag: "vent hors secteur" };
}

// Gonflage face voile : trop peu de vent gêne, trop ou irrégulier fait traîner ; la base des nuages ne compte pas
function evaluateGonflage(h, s, L) {
  const reasons = [];
  let level = 0;
  const flag = (l, msg, tag) => { level = Math.max(level, l); reasons.push({ l, msg, tag }); };

  flagRain(h, flag);

  if (h.ws != null) {
    if (h.ws < L.minWind) flag(1, `Vent faible (${r0(h.ws)} km/h) : face voile difficile`, "vent trop faible");
    else if (h.ws > L.maxWind) flag(2, `Vent moyen ${r0(h.ws)} km/h, au-dessus de ta limite`, "vent trop fort");
    else if (h.ws > L.maxWind * 0.85) flag(1, `Vent moyen ${r0(h.ws)} km/h, proche de ta limite`, "vent soutenu");
    else flag(0, `Vent ${r0(h.ws)} km/h : bonne plage pour le face voile`);
    if (h.wd != null && h.ws >= L.minWind) { const n = dirNote(h.wd, s); flag(n.l, n.msg, n.tag); }
  }
  flagGusts(h, L, flag);
  if (h.w850 != null && h.w850 > L.maxAlt) flag(1, `Vent fort vers 1500 m (${r0(h.w850)} km/h) : rafales possibles au sol`, "vent fort en altitude");
  flagCape(h, L, flag, "thermiques et rafales irrégulières", "thermiques");
  return { level, reasons, base: null };
}

// Une heure qui compte pour le verdict : dans ta journée, et pas déjà passée
export const inPlay = (h, L) => !h.past && h.hour >= L.startHour && h.hour <= L.endHour;

function bestWindow(hours, L) {
  let best = null, cur = null;
  for (const h of hours) {
    const open = inPlay(h, L);
    if (open && h.ev.level === 0) {
      if (!cur) cur = { from: h.hour, to: h.hour };
      else cur.to = h.hour;
      if (!best || cur.to - cur.from > best.to - best.from) best = { ...cur };
    } else cur = null;
  }
  return best;
}

// level null : plus aucune heure à juger (le soir pour aujourd'hui)
function dayVerdict(day, L, K) {
  const open = day.hours.filter((h) => inPlay(h, L));
  if (!open.length) return { level: null, title: "Journée terminée", win: null, top: [] };
  const win = bestWindow(day.hours, L);
  const counts = [0, 0, 0];
  open.forEach((h) => counts[h.ev.level]++);
  // Principales raisons de blocage sur la journée
  const tally = {};
  open.forEach((h) => h.ev.reasons.filter((r) => r.l > 0 && r.tag).forEach((r) => {
    tally[r.tag] = tally[r.tag] || { n: 0, l: 0, tag: r.tag };
    tally[r.tag].n++; tally[r.tag].l = Math.max(tally[r.tag].l, r.l);
  }));
  const top = Object.values(tally).sort((a, b) => b.l - a.l || b.n - a.n).slice(0, 3).map((t) => t.tag);
  if (win && win.to - win.from >= 1) return { level: 0, title: K.titles[0], win, top };
  if (counts[0] + counts[1] > 0) return { level: 1, title: K.titles[1], win, top };
  return { level: 2, title: K.titles[2], win: null, top };
}

// Avec plusieurs modèles, Open-Meteo suffixe chaque variable (wind_speed_10m_icon_seamless) : on isole un modèle
function modelJson(json, m) {
  const H = json.hourly;
  if (H.wind_speed_10m) return m === state.limits.model ? json : null; // réponse à un seul modèle (ancien cache)
  if (!H[`wind_speed_10m_${m}`]) return null;
  return { hourly: Object.fromEntries([["time", H.time], ...HOURLY.map((v) => [v, H[`${v}_${m}`] || null])]) };
}

// Jours du modèle choisi, avec pour chaque jour le verdict des trois modèles et, par heure, leur vent
export function buildAll(json, s) {
  const main = modelJson(json, state.limits.model);
  if (!main) return [];
  const days = buildDays(main, s);
  const ens = ENSEMBLE.map((m) => { const j = modelJson(json, m); return { m, days: j ? buildDays(j, s) : [] }; });
  for (const d of days) {
    d.models = ens.map(({ m, days: md }) => {
      const x = md.find((y) => y.date === d.date);
      return x ? { m, level: x.verdict.level, title: x.verdict.title, win: x.verdict.win, hours: x.hours } : { m, level: null };
    });
    const lv = d.models.filter((x) => x.level != null).map((x) => x.level);
    d.agree = { n: lv.length, same: lv.length > 1 && lv.every((l) => l === lv[0]) };
    for (const h of d.hours) {
      h.ens = d.models.map((x) => { const y = x.hours && x.hours.find((z) => z.hour === h.hour); return { m: x.m, ws: y ? y.ws : null, wg: y ? y.wg : null }; });
    }
  }
  return days;
}

// Jours évalués d'un site, à partir d'une réponse Open-Meteo à un modèle
function buildDays(json, s) {
  const H = json.hourly, K = kind(s), L = limitsOf(s), now = parisParts(Date.now());
  const pick = (k, i) => (H[k] ? H[k][i] : null);
  const byDate = new Map();
  H.time.forEach((t, i) => {
    const h = {
      time: t, date: t.slice(0, 10), hour: +t.slice(11, 13),
      past: t.slice(0, 10) === now.date && +t.slice(11, 13) < now.hour, // l'heure en cours compte encore
      t: pick("temperature_2m", i), td: pick("dew_point_2m", i),
      pp: pick("precipitation_probability", i), pr: pick("precipitation", i),
      cl: pick("cloud_cover_low", i), cm: pick("cloud_cover_mid", i), ch: pick("cloud_cover_high", i),
      ws: pick("wind_speed_10m", i), wd: pick("wind_direction_10m", i), wg: pick("wind_gusts_10m", i),
      w850: pick("wind_speed_850hPa", i), d850: pick("wind_direction_850hPa", i),
      w700: pick("wind_speed_700hPa", i), d700: pick("wind_direction_700hPa", i),
      cape: pick("cape", i), blh: pick("boundary_layer_height", i)
    };
    h.ev = EVALUATE[K.id](h, s, L);
    if (!byDate.has(h.date)) byDate.set(h.date, []);
    byDate.get(h.date).push(h);
  });
  // Sans vent prévu, l'heure est hors de portée du modèle (Météo-France s'arrête vers J+4) : on l'écarte
  // plutôt que de la noter verte faute de règle déclenchée
  return [...byDate.entries()].slice(0, FORECAST_DAYS).map(([date, hours]) => {
    const day = { date, hours: hours.filter((h) => h.hour >= 7 && h.hour <= 20 && h.ws != null) };
    day.verdict = dayVerdict(day, L, K);
    return day;
  }).filter((d) => d.hours.length);
}

// La fonction d'évaluation de chaque type de site (KINDS, dans config, n'en dépend pas)
const EVALUATE = { deco: evaluate, gonflage: evaluateGonflage };
