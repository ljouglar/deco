// Service worker : l'appli s'ouvre même sans réseau.
// Les prévisions sont mises en cache par l'appli elle-même (dernier chargement réussi).
const CACHE = "deco-v17";
const NET_WAIT = 3000; // au-delà, la copie en cache plutôt que d'attendre un réseau lent
// En développement (python3 -m http.server sur localhost), toujours le réseau : chaque rechargement voit tes modifications
const DEV = self.location.hostname === "localhost";
const SHELL = ["./", "./index.html", "./style.css", "./manifest.webmanifest", "./sites-fr.json",
  "./js/main.js", "./js/outils.js", "./js/config.js", "./js/etat.js", "./js/regles.js", "./js/donnees.js",
  "./js/balise.js", "./js/rendu.js", "./js/chargement.js", "./js/feuilles.js",
  "./fonts/barlow-400.woff2", "./fonts/barlow-500.woff2", "./fonts/barlow-600.woff2",
  "./fonts/barlow-condensed-500.woff2", "./fonts/barlow-condensed-700.woff2",
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

  if (url.origin !== self.location.origin) return;
  e.respondWith((async () => {
    const net = fetch(e.request).then((r) => {
      if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); }
      return r;
    });
    const cached = await caches.match(e.request);
    if (!cached || DEV) return net.catch(() => cached || caches.match("./index.html"));
    // Les fichiers de l'appli (CSS, modules, icônes) : la copie de cette version, tout de suite ; le réseau
    // la rafraîchit en arrière-plan. Une nouvelle version (CACHE) recharge tout le lot à l'installation.
    if (e.request.mode !== "navigate") { net.catch(() => {}); return cached; }
    // La page elle-même : le réseau d'abord, mais au déco avec un réseau qui traîne, la copie au bout de NET_WAIT
    return Promise.race([net.catch(() => cached), new Promise((ok) => setTimeout(() => ok(cached), NET_WAIT))]);
  })());
});
