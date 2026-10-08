// Point d'entrée : événements de l'écran principal, rafraîchissements, démarrage
import { $ } from "./outils.js";
import { kind, KINDS } from "./config.js";
import { protectStorage, site, state } from "./etat.js";
import { pruneCache } from "./donnees.js";
import { render } from "./rendu.js";
import { load, loadOverview, openSite, refresh, refreshLive } from "./chargement.js";
import { openLimits, openModel, openSites, pgeNear } from "./feuilles.js";

pruneCache();
if (state.sites.length) protectStorage();

$("days").addEventListener("click", (e) => {
  const b = e.target.closest("[data-day]"); if (!b) return;
  state.dayIdx = +b.dataset.day; state.hourSel = null; render();
});

$("main").addEventListener("click", (e) => {
  const w = e.target.closest("[data-start]");
  if (w) {
    openSites();
    if (w.dataset.start === "near") pgeNear();
    else if (w.dataset.start === "search") $("pge-q").focus();
    else if (w.dataset.start === "import") $("importFile").click();
    else { $("siteForm").scrollIntoView({ block: "start" }); $("sf-name").focus({ preventScroll: true }); }
    return;
  }
  const o = e.target.closest("[data-ov-site]");
  if (o) { openSite(o.dataset.ovSite, o.dataset.ovDate || null); return; }
  const b = e.target.closest("[data-hour]"); if (!b) return;
  state.hourSel = +b.dataset.hour; render();
  document.querySelector(".verdict")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
});

$("refreshBtn").addEventListener("click", () => refresh(true));

$("status").addEventListener("click", (e) => { if (e.target.closest("[data-model]")) openModel(); });

$("backBtn").addEventListener("click", () => { window.scrollTo(0, 0); loadOverview(); });

$("siteBtn").addEventListener("click", openSites);

$("sitesBtn").addEventListener("click", openSites);

$("limitsBtn").addEventListener("click", () => openLimits(kind(site())));

$("limitsVolBtn").addEventListener("click", () => openLimits(KINDS.deco));

$("limitsGBtn").addEventListener("click", () => openLimits(KINDS.gonflage));

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  const stale = (at) => !at || Date.now() - at > 30 * 60 * 1000;
  if (state.view === "overview") { if (stale(state.ov && state.ov.fetchedAt)) loadOverview(); }
  else if (stale(state.fetchedAt)) load();
  else refreshLive();
});

// La balise émet toutes les ~4 min : on la resuit en continu, sans retoucher aux prévisions
setInterval(() => { if (document.visibilityState === "visible" && state.view === "site") refreshLive(); }, 4 * 60 * 1000);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
}

// Accès de débogage depuis la console (et pour les pages de contrôle) : les modules ne sont pas globaux
window.deco = { state, site, load, loadOverview, openSite, refresh };

loadOverview();
