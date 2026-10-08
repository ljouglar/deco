// Balise Pioupiou / OpenWindMap : mesure, historique, tendance, et le bloc « En direct »
import { ago, angleGap, arrowSvg, cardinal, esc, inSector, km, parisParts, r0, reasonsHtml, store } from "./outils.js";
import { kind, KINDS } from "./config.js";
import { limitsOf, site, state } from "./etat.js";
import { dirNote } from "./regles.js";

const PIOU_TTL = 3 * 60 * 1000;    // on ne redemande pas plus souvent (la balise émet toutes les ~4 min)

export const PIOU_STALE = 45 * 60 * 1000; // au-delà, la mesure ne reflète plus les conditions du moment

// Historique des 2 dernières heures (une mesure toutes les ~5 min) : [instant, moyenne, rafale, direction]
const HIST_SPAN = 2 * 3600 * 1000;

async function loadHist(id) {
  const start = new Date(Date.now() - HIST_SPAN - 10 * 60 * 1000).toISOString();
  const res = await fetch(`https://api.pioupiou.fr/v1/archive/${encodeURIComponent(id)}?start=${start}&stop=now`, { cache: "no-store" });
  const json = await res.json();
  return (json.data || []).map((x) => [Date.parse(x[0]), x[4], x[5], x[6]]).filter((x) => x[1] != null);
}

// Ce qui a changé depuis une heure : les 20 dernières minutes contre la même durée une heure plus tôt
function liveTrend(lv, s, L) {
  const h = lv.hist, out = [];
  if (!h || h.length < 6) return out;
  const end = h[h.length - 1][0], MIN = 60000;
  const win = (from, to) => h.filter((x) => x[0] > end - from * MIN && x[0] <= end - to * MIN);
  const now = win(20, 0);
  let past = win(80, 60);
  if (!past.length) past = h.filter((x) => x[0] <= h[0][0] + 20 * MIN); // historique plus court : on prend son début
  const mean = (a, f) => a.reduce((t, x) => t + f(x), 0) / a.length;
  const span = (mean(now, (x) => x[0]) - mean(past, (x) => x[0])) / MIN;
  if (!now.length || span < 30) return out;
  const per = span >= 50 && span <= 80 ? "en 1 h" : `en ${Math.round(span / 5) * 5} min`;

  const aNow = mean(now, (x) => x[1]), aPast = mean(past, (x) => x[1]), dA = aNow - aPast;
  if (dA >= 4) {
    const soon = aNow + dA * 60 / span > L.maxWind;
    out.push({ l: soon ? 1 : 0, msg: `Le vent forcit : +${r0(dA)} km/h ${per}${soon ? ", ta limite peut être atteinte dans l'heure" : ""}` });
  } else if (dA <= -4) out.push({ l: 0, msg: `Le vent faiblit : ${r0(dA)} km/h ${per}` });
  else out.push({ l: 0, msg: "Vent stable sur la dernière heure" });

  // Direction moyenne par vecteurs (sinon 350° et 10° donneraient 180°), seulement quand la girouette porte
  const dir = (a) => { const v = a.filter((x) => x[1] >= 3 && x[3] != null); if (v.length < 2) return null;
    const r = Math.PI / 180, sx = mean(v, (x) => Math.sin(x[3] * r)), cy = mean(v, (x) => Math.cos(x[3] * r));
    return (Math.atan2(sx, cy) / r + 360) % 360; };
  const dPast = dir(past), dNow = dir(now);
  if (dPast != null && dNow != null && angleGap(dPast, dNow) > 40) {
    const inA = inSector(dPast, s.secMin, s.secMax), inB = inSector(dNow, s.secMin, s.secMax);
    out.push({ l: !inA && inB ? 0 : 1, msg: `Direction qui tourne : de ${cardinal(dPast)} à ${cardinal(dNow)} ${per}${!inA && inB ? ", vers l'axe" : inA && !inB ? ", hors de l'axe" : ""}` });
  }

  const gNow = mean(now, (x) => x[2] - x[1]), gPast = mean(past, (x) => x[2] - x[1]);
  if (gNow - gPast >= 5 && gNow > L.maxGustDelta * 0.7) out.push({ l: 1, msg: `Rafales de plus en plus irrégulières : écart ${r0(gPast)} → ${r0(gNow)} km/h` });
  return out;
}

// Courbe des 2 dernières heures : moyenne, zone des rafales, prévision en pointillés, limite de vent
function trendSvg(lv, L) {
  const h = lv.hist;
  if (!h || h.length < 6) return "";
  const end = h[h.length - 1][0], t0 = end - HIST_SPAN, W = 300, H = 64;
  const pts = h.filter((x) => x[0] >= t0);
  const fc = [];
  for (let t = Math.ceil(t0 / 3600000) * 3600000; t <= end; t += 3600000) { const f = forecastAt(t); if (f && f.ws != null) fc.push([t, f.ws]); }
  const top = Math.max(20, L.maxWind, ...pts.map((x) => x[2] ?? x[1]), ...fc.map((x) => x[1])) * 1.1;
  const X = (t) => ((t - t0) / HIST_SPAN * W).toFixed(1), Y = (v) => (H - v / top * H).toFixed(1);
  const line = (a, i) => a.map((x) => `${X(x[0])},${Y(x[i])}`).join(" ");
  const area = `${line(pts, 1)} ${pts.slice().reverse().map((x) => `${X(x[0])},${Y(x[2] ?? x[1])}`).join(" ")}`;
  const hh = (t) => `${parisParts(t).hour} h ${String(new Date(t).getMinutes()).padStart(2, "0")}`;
  return `<div class="trend">
    <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="Vent mesuré sur les 2 dernières heures">
      <line class="lim" x1="0" x2="${W}" y1="${Y(L.maxWind)}" y2="${Y(L.maxWind)}" vector-effect="non-scaling-stroke"/>
      <polygon class="area" points="${area}"/>
      ${fc.length > 1 ? `<polyline class="fc" points="${line(fc, 1)}" vector-effect="non-scaling-stroke"/>` : ""}
      <polyline class="avg" points="${line(pts, 1)}" vector-effect="non-scaling-stroke"/>
    </svg>
    <div class="axis"><span>${hh(t0)}</span><span><i class="k avg"></i>moyenne <i class="k area"></i>rafales${fc.length > 1 ? ` <i class="k fc"></i>prévu` : ""} <i class="k lim"></i>${r0(L.maxWind)} km/h</span><span>${hh(end)}</span></div>
  </div>`;
}

// Mesure de la balise d'un site (null sans balise), sans toucher à l'état
export async function loadLive(s, force = false) {
  if (!s || !s.piou) return null;
  const key = `piou:${s.piou}`;
  const cached = store.get(key, null);
  if (cached && !force && Date.now() - cached.at < PIOU_TTL) return cached;
  try {
    const [res, hist] = await Promise.all([
      fetch(`https://api.pioupiou.fr/v1/live/${encodeURIComponent(s.piou)}`, { cache: "no-store" }),
      loadHist(s.piou).catch(() => null) // sans historique, on garde la mesure du moment
    ]);
    const json = await res.json();
    const d = json && json.data;
    if (!res.ok || !d || !d.measurements) throw new Error("balise injoignable");
    const m = d.measurements;
    const live = {
      at: Date.now(), id: d.id, name: (d.meta && d.meta.name) || `Balise ${d.id}`,
      date: m.date ? Date.parse(m.date) : null,
      ws: m.wind_speed_avg, wg: m.wind_speed_max, wd: m.wind_heading,
      on: !d.status || d.status.state === "on", hist
    };
    store.set(key, live);
    return live;
  } catch {
    // Hors ligne ou balise injoignable : on montre la dernière mesure connue, son âge fait foi
    return cached ? { ...cached, offline: true } : { id: s.piou, failed: true };
  }
}

// Heure de prévision correspondant à un instant donné (null la nuit, hors 7 h – 20 h)
function forecastAt(ts) {
  const { date, hour } = parisParts(ts);
  const d = state.days.find((x) => x.date === date);
  return d ? d.hours.find((h) => h.hour === hour) || null : null;
}

// Ce que la mesure dit, et ce qu'elle dit du modèle
function liveNotes(lv, fc, s, L) {
  const out = [], g = kind(s) === KINDS.gonflage;
  if (g && lv.ws != null && lv.ws < L.minWind) out.push({ l: 1, msg: `Vent ${r0(lv.ws)} km/h : trop faible pour le face voile` });
  if (lv.wd != null && lv.ws >= 3) {
    const n = dirNote(lv.wd, s);
    out.push({ l: n.l, msg: n.msg });
  } else if (!g) {
    out.push({ l: 0, msg: "Vent nul ou très faible à la balise" });
  }
  if (lv.wg != null && lv.wg > L.maxGust) out.push({ l: 2, msg: `Rafales ${r0(lv.wg)} km/h, au-dessus de ta limite` });
  else if (lv.ws != null && lv.ws > L.maxWind) out.push({ l: 2, msg: `Vent moyen ${r0(lv.ws)} km/h, au-dessus de ta limite` });
  else if (lv.ws != null && lv.wg != null && lv.wg - lv.ws > L.maxGustDelta) out.push({ l: 1, msg: `Vent irrégulier : ${r0(lv.ws)} à ${r0(lv.wg)} km/h` });

  if (fc && fc.ws != null && lv.ws != null) {
    const d = lv.ws - fc.ws;
    if (Math.abs(d) < 5) out.push({ l: 0, msg: `Le modèle colle à la mesure à cette heure` });
    else out.push({ l: 1, msg: `Le modèle ${d > 0 ? "sous-estime" : "surestime"} le vent de ${r0(Math.abs(d))} km/h à cette heure` });
    if (lv.wd != null && fc.wd != null && lv.ws >= 3) {
      const dd = angleGap(lv.wd, fc.wd);
      if (dd > 45) out.push({ l: 1, msg: `Direction décalée de ${r0(dd)}° par rapport au modèle` });
    }
  }
  return out;
}

export function liveCard() {
  const s = site(), K = kind(s), L = limitsOf(s), lv = state.live;
  if (!s || !s.piou) return "";
  if (!lv || lv.failed) {
    return `<section class="live"><h2 class="kicker"><span class="pulse off"></span>En direct ${K.here}<span class="age">balise injoignable</span></h2>
      <p class="stale">Aucune mesure reçue de la balise n° ${esc(s.piou)}. Vérifie ta connexion, ou le numéro dans « Mes sites ».</p></section>`;
  }
  const age = Date.now() - (lv.date || lv.at);
  const fresh = age <= PIOU_STALE;
  const fc = fresh ? forecastAt(lv.date || lv.at) : null;
  const head = (stale) => `<h2 class="kicker"><span class="pulse${stale ? " off" : ""}"></span>En direct ${K.here}<span class="age">mesure ${esc(ago(age))}${lv.offline ? " · hors ligne" : ""}</span></h2>
    <span class="bname">Balise ${esc(lv.name || `n° ${lv.id}`)}</span>`;

  if (!fresh) {
    return `<section class="live">${head(true)}
      <p class="stale">La balise n'a rien envoyé depuis ${esc(ago(age).replace(/^il y a /, ""))} : pas de comparaison possible avec la prévision.${lv.on === false ? " Elle est signalée hors service." : ""}</p></section>`;
  }

  // Sous 3 km/h la girouette tourne au hasard : on n'affiche ni flèche ni direction
  const dirKnown = lv.wd != null && lv.ws >= 3;
  const meas = `<div class="col meas"><span class="lbl">Mesuré maintenant</span>
      <span class="val">${dirKnown ? arrowSvg(lv.wd) : ""}<span>${r0(lv.ws)} km/h${dirKnown ? ` ${cardinal(lv.wd)}` : ""}</span></span>
      <small>rafales ${r0(lv.wg)} km/h</small></div>`;
  const pred = fc
    ? `<div class="col"><span class="lbl">Prévu pour ${fc.hour} h</span>
         <span class="val">${arrowSvg(fc.wd)}<span>${r0(fc.ws)} km/h ${cardinal(fc.wd)}</span></span>
         <small>rafales ${r0(fc.wg)} km/h</small></div>`
    : `<div class="col"><span class="lbl">Prévu</span><span class="val">–</span><small>${state.days.length ? "hors plage horaire" : "pas de prévision"}</small></div>`;

  const notes = [...liveNotes(lv, fc, s, L), ...liveTrend(lv, s, L)].sort((a, b) => b.l - a.l);
  return `<section class="live">${head(false)}
    <div class="cmp">${meas}${pred}</div>
    ${trendSvg(lv, L)}
    <ul class="reasons">${reasonsHtml(notes)}</ul>
  </section>`;
}

// La liste de toutes les balises pèse ~650 Ko : une seule fois par séance d'ajout
let piouAll = null;

function piouList() {
  if (!piouAll || Date.now() - piouAll.at > 10 * 60 * 1000) {
    const p = fetch("https://api.pioupiou.fr/v1/live-with-meta/all").then((r) => r.json()).then((j) => j.data);
    piouAll = { at: Date.now(), p };
    p.catch(() => { piouAll = null; });
  }
  return piouAll.p;
}

// Balise en service la plus proche, si elle est assez près pour parler du même site
export async function nearestPiou(lat, lon) {
  const data = await piouList();
  const day = Date.now() - 24 * 3600 * 1000;
  return data.filter((b) => b.location && b.location.latitude != null && (!b.status || b.status.state === "on")
      && b.measurements && Date.parse(b.measurements.date) > day)
    .map((b) => ({ id: b.id, name: b.meta && b.meta.name, d: km(lat, lon, b.location.latitude, b.location.longitude) }))
    .filter((b) => b.d <= 3).sort((a, b) => a.d - b.d)[0] || null;
}
