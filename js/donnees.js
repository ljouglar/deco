// Prévisions Open-Meteo et cache local
import { fetchT, store } from "./outils.js";
import { DAILY, ENSEMBLE, FORECAST_DAYS, HOURLY, HOURLY_LAND } from "./config.js";
import { state } from "./etat.js";

const requestedModels = () => [...new Set([state.limits.model, ...ENSEMBLE])];

// Le cache ne garde que ce qui sert : prévisions des sites présents pour le modèle choisi, leurs balises.
// Le reste (sites supprimés, autre modèle, anciennes clés « fc: ») s'accumulerait à ~40 Ko la prévision.
export function pruneCache() {
  const fc = new Set(state.sites.map((s) => `fcm:${s.id}:${state.limits.model}`));
  const piou = new Set(state.sites.flatMap((s) => [s.piou, s.land && s.land.piou]).filter(Boolean).map((p) => `piou:${p}`));
  try {
    Object.keys(localStorage).filter((k) => (/^fcm?:/.test(k) && !fc.has(k)) || (k.startsWith("piou:") && !piou.has(k)))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

const FC_FRESH = 10 * 60 * 1000; // une prévision chargée par le tableau resert telle quelle à l'ouverture du site

export const fcKey = (s) => `fcm:${s.id}:${state.limits.model}`; // « fcm » : réponse multi-modèles

// Une seule requête pour plusieurs points : Open-Meteo accepte des listes de coordonnées
async function forecastFor(points, hourly, force, daily = null) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: points.map((p) => p.lat).join(","), longitude: points.map((p) => p.lon).join(","),
    ...(points.every((p) => p.alt != null) ? { elevation: points.map((p) => p.alt).join(",") } : {}),
    hourly: hourly.join(","), ...(daily ? { daily: daily.join(",") } : {}), models: requestedModels().join(","),
    timezone: "Europe/Paris", forecast_days: FORECAST_DAYS, wind_speed_unit: "kmh"
  });
  const res = await fetchT(url, { cache: force ? "reload" : "default" });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.reason || `Erreur ${res.status}`);
  return Array.isArray(json) ? json : [json];
}

// Les sites, et à part, en plus léger, le vent de leurs atterros : leur altitude vient du relief d'Open-Meteo,
// rendue dans `elevation`. Sans réponse pour les atterros, les sites s'affichent quand même, sans eux.
export async function fetchForecasts(sites, force) {
  const withLand = sites.filter((s) => s.land);
  const [list, lands] = await Promise.all([
    forecastFor(sites, HOURLY, force, DAILY),
    withLand.length ? forecastFor(withLand.map((s) => ({ lat: s.land.lat, lon: s.land.lon })), HOURLY_LAND, force).catch(() => null) : null
  ]);
  if (lands) withLand.forEach((s, i) => { list[sites.indexOf(s)].land = lands[i]; });
  const at = Date.now();
  sites.forEach((s, i) => store.set(fcKey(s), { at, json: list[i] }));
  return list;
}

export const fetchError = (e) => (!navigator.onLine ? "Hors ligne."
  : e.name === "TimeoutError" ? "Réseau trop lent : pas de réponse d'Open-Meteo." : `Prévisions indisponibles : ${e.message}`);

// Prévision d'un site : { json, at, fromCache, error }, sans toucher à l'état
export async function loadForecast(s, force) {
  const cached = store.get(fcKey(s), null);
  if (!force && cached && Date.now() - cached.at < FC_FRESH) return { json: cached.json, at: cached.at, fromCache: false, error: null };
  try {
    const [json] = await fetchForecasts([s], force);
    return { json, at: Date.now(), fromCache: false, error: null };
  } catch (e) {
    return { json: cached && cached.json, at: cached && cached.at, fromCache: true, error: fetchError(e) };
  }
}
