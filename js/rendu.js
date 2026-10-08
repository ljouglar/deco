// Rendu : en-tête, tableau « Où voler ? », écran d'un site, pied de page
import { $, arrowSvg, cap, cardinal, esc, parisParts, r0, reasonsHtml } from "./outils.js";
import { FORECAST_DAYS, kind, KINDS, MODEL_SHORT, MODELS } from "./config.js";
import { limitsOf, site, state } from "./etat.js";
import { inPlay } from "./regles.js";
import { liveCard, PIOU_STALE } from "./balise.js";

const DAY_SHORT = ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"];

// Petite voile, pour marquer le type de site au-dessus du verdict
const WING_SVG = `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 10 Q12 2 22 10"/><path d="M2 10 L12 21 L22 10 M8 7.2 L12 21 L16 7.2"/></svg>`;

function dialSvg(s, h, lv) {
  const p = (deg, r) => { const a = deg * Math.PI / 180; return [r * Math.sin(a), -r * Math.cos(a)].map((v) => v.toFixed(2)).join(" "); };
  const span = (s.secMax - s.secMin + 360) % 360;
  const sector = `M0 0 L${p(s.secMin, 50)} A50 50 0 ${span > 180 ? 1 : 0} 1 ${p(s.secMax, 50)} Z`;
  const arrow = (deg, cls, len) => deg == null ? "" :
    `<g transform="rotate(${deg})"><line class="${cls}" x1="0" y1="${-len}" x2="0" y2="${len - 8}"/><path class="${cls}" d="M-6 ${len - 15} L0 ${len - 7} L6 ${len - 15}" fill="none"/></g>`;
  return `<svg class="dial" viewBox="-62 -62 124 124" role="img" aria-label="Secteur favorable du site et direction du vent">
    <path class="sector" d="${sector}"/>
    <circle class="ring" r="50"/>
    ${["N", "E", "S", "O"].map((c, i) => `<text class="card" x="${p(i * 90, 57).split(" ")[0]}" y="${p(i * 90, 57).split(" ")[1]}">${c}</text>`).join("")}
    ${h ? arrow(h.d850, "w850", 34) : ""}
    ${h ? arrow(h.wd, "w10", 42) : ""}
    ${lv ? arrow(lv.wd, "wlive", 50) : ""}
  </svg>`;
}

function skyText(h) {
  const tot = Math.max(h.cl ?? 0, h.cm ?? 0, h.ch ?? 0);
  if ((h.pp ?? 0) >= 50) return "Pluie";
  if ((h.cl ?? 0) >= 70) return "Couvert bas";
  if (tot >= 70) return "Couvert";
  if (tot >= 30) return "Nuageux";
  return "Dégagé";
}

export function renderChrome() {
  const s = site(), ov = state.view === "overview";
  const has = (k) => state.sites.some((x) => kind(x) === k);
  $("backBtn").hidden = ov;
  $("siteName").textContent = ov ? "Où voler ?" : s ? s.name : "Aucun site";
  $("siteMeta").textContent = ov ? (state.sites.length ? `${state.sites.length} site${state.sites.length > 1 ? "s" : ""}, aujourd'hui à J+${FORECAST_DAYS - 1}` : "Aucun site pour l'instant")
    : s ? `${kind(s).label} ${s.alt} m, vent favorable ${cardinal(s.secMin)} à ${cardinal(s.secMax)}` : "";
  $("siteBtn").setAttribute("aria-label", ov ? "Mes sites" : "Changer de site");
  $("limitsBtn").hidden = ov;
  $("limitsVolBtn").hidden = !ov || !has(KINDS.deco);
  $("limitsGBtn").hidden = !ov || !has(KINDS.gonflage);
  $("refreshBtn").classList.toggle("spin", ov ? state.loadingOv : state.loadingSite);
}

// Aides communes au tableau et à l'écran du site
const mdot = (level) => `<i class="md ${level == null ? "none" : `l${level}`}"></i>`;

const modelDots = (d) => (d.models ? `<span class="mdots" aria-hidden="true">${d.models.map((x) => mdot(x.level)).join("")}</span>` : "");

const agreeText = (d) => (!d.agree || d.agree.n < 2 ? "" : d.agree.same ? `Les ${d.agree.n} modèles sont d'accord.` : "Les modèles divergent : à confirmer.");

const winShort = (w) => (!w ? "" : w.from === w.to ? `${w.from} h` : `${w.from}–${w.to + 1}`);

// Écart en jours avec aujourd'hui (heure de Paris) : 0 aujourd'hui, 1 demain…
const dayOffset = (date) => Math.round((Date.parse(`${date}T12:00Z`) - Date.parse(`${parisParts(Date.now()).date}T12:00Z`)) / 86400000);

function dayLabel(date) {
  const dt = new Date(`${date}T12:00`), today = dayOffset(date) === 0;
  const full = dt.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  return { short: today ? "Auj" : DAY_SHORT[dt.getDay()], num: dt.getDate(), full, aria: today ? `Aujourd'hui, ${full}` : full };
}

const bannerHtml = (fromCache) => (state.error
  ? `<div class="banner">${esc(state.error)}${fromCache ? " Affichage des dernières prévisions enregistrées." : " Vérifie ta connexion puis actualise."}</div>` : "");

function renderOverview() {
  const ov = state.ov;
  $("live").innerHTML = ""; $("days").innerHTML = "";
  $("banner").innerHTML = bannerHtml(ov && ov.fromCache);
  if (!ov) { $("main").innerHTML = `<p class="empty">Chargement des prévisions…</p>`; renderStatus(); return; }
  if (!state.sites.length) { $("main").innerHTML = welcomeHtml(); renderStatus(); return; }

  // Colonnes : les dates connues d'au moins un site (Météo-France s'arrête plus tôt que les autres)
  const dates = [...new Set(ov.rows.flatMap((r) => r.days.map((d) => d.date)))].sort().slice(0, FORECAST_DAYS);
  if (!dates.length) { $("main").innerHTML = `<p class="empty">Aucune prévision pour l'instant. Actualise pour charger les données.</p>`; renderStatus(); return; }
  const head = dates.map((date) => { const l = dayLabel(date); return `<div class="hd">${l.short}<small>${l.num}</small></div>`; }).join("");

  const groups = [KINDS.deco, KINDS.gonflage].map((K) => {
    const rows = ov.rows.filter((r) => kind(r.s) === K);
    if (!rows.length) return "";
    return `<div class="grp kicker">${WING_SVG}${K.kicker}</div>` + rows.map((r) =>
      `<button class="nm" data-ov-site="${esc(r.s.id)}"><b>${esc(r.s.name)}</b><small>${r.s.alt} m</small></button>`
      + dates.map((date) => overviewCell(r, date)).join("")).join("");
  }).join("");

  $("main").innerHTML = `<div class="ov"><div></div>${head}${groups}</div>
    <p class="ov-legend">Chaque case : le verdict du jour selon les limites du site, et son meilleur créneau. Les trois pastilles : Météo-France, ICON et ECMWF ; bordure en pointillés quand ils ne sont pas d'accord. Au-delà de J+2, cases atténuées : c'est une tendance. Touche une case pour le détail heure par heure.</p>`;
  // Le nombre de colonnes passe par le CSSOM : la politique de sécurité interdit les styles écrits dans le HTML
  $("main").querySelector(".ov").style.setProperty("--n", dates.length);
  renderStatus();
}

function overviewCell(r, date) {
  const day = r.days.find((d) => d.date === date), name = esc(r.s.name), full = dayLabel(date).full;
  const at = `data-ov-site="${esc(r.s.id)}" data-ov-date="${date}"`;
  if (!day) return `<span class="c none" aria-label="${name}, ${full} : pas de prévision">·</span>`;
  const v = day.verdict;
  if (v.level == null) return `<button class="c none" ${at} aria-label="${name}, ${full} : journée terminée">–</button>`;
  const w = winShort(v.win), split = day.agree && day.agree.n > 1 && !day.agree.same;
  return `<button class="c l${v.level}${dayOffset(date) >= 3 ? " far" : ""}${split ? " split" : ""}" ${at}
    aria-label="${name}, ${full} : ${esc(v.title)}${w ? `, créneau ${w} h` : ""}. ${agreeText(day)}">${modelDots(day)}<span>${w}</span></button>`;
}

const welcomeHtml = () => `<section class="welcome">
    <h2>Bienvenue</h2>
    <p>Ajoute tes sites : l'appli te dira, jour par jour, où les conditions restent dans tes limites.</p>
    <button class="btn primary" data-start="near">Décos autour de moi</button>
    <button class="btn" data-start="search">Chercher un déco par son nom</button>
    <button class="btn" data-start="manual">Saisir un site à la main</button>
    <button class="btn" data-start="import">Importer des sites exportés</button>
    <p class="hint">Les terrains de gonflage ne sont pas dans la liste des décos : saisis-les à la main, type « Terrain de gonflage ».</p>
  </section>`;

export function render() {
  renderChrome();
  if (state.view === "overview") { renderOverview(); return; }
  const s = site(), K = kind(s), L = limitsOf(s);
  renderTabs();
  $("live").innerHTML = liveCard();
  $("banner").innerHTML = bannerHtml(state.fromCache);

  const day = state.days[state.dayIdx];
  if (!day) { $("main").innerHTML = `<p class="empty">Aucune prévision pour l'instant. Actualise pour charger les données.</p>`; renderStatus(); return; }
  if (state.hourSel == null) {
    // Le milieu du créneau ; aujourd'hui sans créneau, l'heure en cours plutôt que 13 h déjà passé
    const v = day.verdict, nowH = dayOffset(day.date) === 0 ? parisParts(Date.now()).hour : null;
    state.hourSel = v.win ? Math.round((v.win.from + v.win.to) / 2) : nowH != null && nowH >= 7 && nowH <= 20 ? nowH : 13;
  }
  const sel = day.hours.find((h) => h.hour === state.hourSel) || day.hours[0];
  $("main").innerHTML = verdictHtml(s, K, day, sel) + detailHtml(s, K, sel) + hoursHtml(K, L, day, sel);
  renderStatus();
}

function renderTabs() {
  $("days").innerHTML = state.days.map((d, i) => {
    const l = dayLabel(d.date);
    return `<button class="day" role="tab" aria-selected="${i === state.dayIdx}" data-day="${i}" aria-label="${l.aria}">
      <span class="pip l${d.verdict.level}"></span><span class="d1">${l.short}</span><span class="d2">${l.num}</span></button>`;
  }).join("");
}

function verdictHtml(s, K, day, sel) {
  const v = day.verdict, off = dayOffset(day.date);
  const winTxt = v.level == null ? "Plus d'heure à juger aujourd'hui"
    : v.win ? (v.win.from === v.win.to ? `Créneau vers ${v.win.from} h` : `Créneau ${v.win.from} h – ${v.win.to + 1} h`) : "Pas de créneau favorable";
  const why = v.level == null ? "Les heures de ta journée sont passées : regarde demain."
    : v.level === 0 ? (v.top.length ? `Hors créneau : ${v.top.join(", ")}.` : "Conditions dans tes limites sur la journée.")
    : (v.top.length ? `${cap(v.top.join(", "))}.` : "");
  const last = day.hours[day.hours.length - 1].hour;
  const caveat = [
    off >= 3 ? `À J+${off}, c'est une tendance : à reconfirmer la veille.` : "",
    last < 20 ? `Ce modèle ne prévoit pas au-delà de ${last + 1} h ce jour-là.` : ""
  ].filter(Boolean).join(" ");
  const models = day.models && v.level != null
    ? `<p class="models">${day.models.map((x) => `<span>${mdot(x.level)}${esc(MODEL_SHORT[x.m])} ${x.level == null ? "–" : esc(x.title.toLowerCase())}</span>`).join("")}<em>${esc(agreeText(day))}</em></p>` : "";
  // La flèche « balise » n'a de sens qu'en regard d'aujourd'hui, et seulement si la mesure est fraîche
  const lv = state.live;
  const dialLive = lv && !lv.failed && lv.wd != null && lv.ws >= 3 && Date.now() - (lv.date || lv.at) <= PIOU_STALE && off === 0 ? lv : null;
  return `<section class="verdict l${v.level}" aria-live="polite">
      <div>
        <p class="kicker">${WING_SVG}${K.kicker}</p>
        <h1>${v.title}</h1>
        <p class="window">${winTxt}</p>
        ${why ? `<p class="why">${esc(why)}</p>` : ""}
        ${models}
        ${caveat ? `<p class="why">${esc(caveat)}</p>` : ""}
      </div>
      <div>${dialSvg(s, sel, dialLive)}<div class="dial-legend"><i></i>sol <i class="alt"></i>1500 m${dialLive ? ` <i class="bal"></i>balise` : ""}</div></div>
    </section>`;
}

function detailHtml(s, K, sel) {
  const ev = sel.ev;
  const fact = (dt, dd) => `<div><dt>${dt}</dt><dd>${dd}</dd></div>`;
  const specific = K === KINDS.gonflage
    ? fact("Écart rafales", sel.ws != null && sel.wg != null ? `${r0(sel.wg - sel.ws)} km/h` : "–")
      + fact("Pluie", sel.pp != null ? `${r0(sel.pp)} %` : `${r0(sel.pr)} mm`)
    : fact("Base nuages", ev.base != null ? `${Math.round(ev.base / 50) * 50} m` : "–")
      + fact("Plafond thermique", sel.blh != null ? `${Math.round((s.alt + sel.blh) / 100) * 100} m` : "–");
  const ens = sel.ens
    ? `<p class="ens">Vent / rafales à ${sel.hour} h selon les modèles : ${sel.ens.map((x) => `${esc(MODEL_SHORT[x.m])} ${x.ws == null ? "–" : `${r0(x.ws)} / ${r0(x.wg)}`}`).join(" · ")} km/h</p>` : "";
  return `<section class="detail">
      <h2>${sel.hour} h</h2>
      <dl class="facts">
        ${fact(`Vent au ${K.place}`, `${r0(sel.ws)} km/h ${cardinal(sel.wd)}`)}${fact("Rafales", `${r0(sel.wg)} km/h`)}
        ${fact("Vers 1500 m", `${r0(sel.w850)} km/h ${cardinal(sel.d850)}`)}${specific}${fact("Température", `${r0(sel.t)} °C`)}
      </dl>
      ${ens}
      <ul class="reasons">${reasonsHtml(ev.reasons.slice().sort((a, b) => b.l - a.l))}</ul>
      ${s.note ? `<p class="site-note">${esc(s.note)}</p>` : ""}
    </section>`;
}

function hoursHtml(K, L, day, sel) {
  return `<div class="hours-head"><span>Heure</span><span>Vent / rafales</span><span>1500 m</span><span>Ciel</span><span></span></div>
    <div class="hours">${day.hours.map((h) => `<button class="hour l${h.ev.level}${inPlay(h, L) ? "" : " closed"}" aria-pressed="${h.hour === sel.hour}" data-hour="${h.hour}">
        <span class="h">${h.hour} h</span>
        <span class="w">${arrowSvg(h.wd)}<span><b>${r0(h.ws)}</b> <small>/ ${r0(h.wg)}</small></span></span>
        <span class="w">${arrowSvg(h.d850)}<span>${r0(h.w850)}</span></span>
        <span class="sky">${skyText(h)}</span>
        <span class="dot l${h.ev.level}" aria-label="${K.titles[h.ev.level].toLowerCase()}"></span>
      </button>`).join("")}</div>`;
}

// Appelée en fin de chaque rendu : c'est aussi elle qui découvre la barre et le pied de page au premier
function renderStatus() {
  delete $("app").dataset.loading;
  const ov = state.view === "overview", at = ov ? state.ov && state.ov.fetchedAt : state.fetchedAt;
  const t = at ? new Date(at).toLocaleString("fr-FR", { weekday: "short", hour: "2-digit", minute: "2-digit" }) : null;
  $("status").innerHTML = `
    <p>Données <a href="https://open-meteo.com/">Open-Meteo</a>${t ? `, mises à jour ${t}` : ""}. Verdict principal : modèle ${esc(MODELS[state.limits.model] || state.limits.model)} <button type="button" class="link" data-model>changer</button>. Vent en km/h, flèches dans le sens où souffle le vent.</p>
    ${!ov && site() && site().piou ? `<p>Mesures de la balise <a href="https://www.openwindmap.org/PIOU_${esc(site().piou)}">OpenWindMap</a> (© contributeurs du réseau OpenWindMap).</p>` : ""}
    <p>Aide à la préparation : la décision se prend ${ov ? "sur place" : kind(site()).here}, avec la balise et la manche à air sous les yeux.</p>`;
}
