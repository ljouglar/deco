// Service worker : l'appli s'ouvre même sans réseau.
// Les prévisions sont mises en cache par l'appli elle-même (dernier chargement réussi).
const CACHE = "deco-v15";
const SHELL = ["./", "./index.html", "./style.css", "./manifest.webmanifest", "./sites-fr.json",
  "./js/main.js", "./js/outils.js", "./js/config.js", "./js/etat.js", "./js/regles.js", "./js/donnees.js",
  "./js/balise.js", "./js/rendu.js", "./js/chargement.js", "./js/feuilles.js",
  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/maskable-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.hostname.endsWith("open-meteo.com") || url.hostname.endsWith("pioupiou.fr")) return; // toujours le réseau

  // Polices Google : servies depuis le cache, rafraîchies en arrière-plan
  if (url.hostname.includes("fonts.g")) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then((r) => { c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }

  // Fichiers de l'appli : réseau d'abord (pour récupérer tes mises à jour), cache si hors ligne
  if (url.origin === self.location.origin) {
    e.respondWith(fetch(e.request)
      .then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then((r) => r || caches.match("./index.html"))));
  }
});
