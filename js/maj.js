// Mises à jour de l'appli : enregistrement du service worker, recherche d'une nouvelle version, avis pour
// recharger, et numéro de la version installée en pied de page
import { $ } from "./outils.js";

// La version installée est le nom du cache du service worker (« deco-v21 ») : on la lui demande
function showVersion() {
  const sw = navigator.serviceWorker.controller;
  if (!sw) return;
  const ch = new MessageChannel();
  ch.port1.onmessage = (e) => {
    const n = String(e.data).match(/-v(\d+)$/);
    $("version").textContent = n ? `Déco v${n[1]}` : "";
  };
  sw.postMessage("version", [ch.port2]);
}

export function initUpdates() {
  if (!("serviceWorker" in navigator)) return;
  const sw = navigator.serviceWorker, hadController = !!sw.controller;
  // Une nouvelle version a pris la main, mais la page tourne encore avec l'ancienne : on propose de recharger
  // plutôt que de recharger d'autorité, ce qui pourrait couper une saisie en cours
  sw.addEventListener("controllerchange", () => {
    if (hadController) $("update").hidden = false;
    showVersion();
  });
  $("updateBtn").addEventListener("click", () => location.reload());
  window.addEventListener("load", () => sw.register("sw.js").then((reg) => {
    showVersion();
    // Une appli reprise depuis l'arrière-plan ne recharge pas sa page, donc le navigateur ne cherche pas
    // de nouvelle version : on le lui demande à chaque retour au premier plan
    document.addEventListener("visibilitychange", () => { if (reg && document.visibilityState === "visible") reg.update().catch(() => {}); });
  }).catch(() => {}));
}
