// Prévisions Open-Meteo et cache local
import { store } from "./outils.js";
import { ENSEMBLE, FORECAST_DAYS, HOURLY } from "./config.js";
import { state } from "./etat.js";

const requestedModels = () => [...new Set([state.limits.model, ...ENSEMBLE])];

// Le cache ne garde que ce qui sert : prévisions des sites présents pour le modèle choisi, leurs balises.
// Le reste (sites supprimés, autre modèle, anciennes clés « fc: ») s'accumulerait à ~40 Ko la prévision.
export function pruneCache() {
  const fc = new Set(state.sites.map((s) => `fcm:${s.id}:${state.limits.model}`));
  const piou = new Set(state.sites.filter((s) => s.piou).map((s) => `piou:${s.piou}`));
  try {
    Object.keys(localStorage).filter((k) => (/^fcm?:/.test(k) && !fc.has(k)) || (k.startsWith("piou:") && !piou.has(k)))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

const FC_FRESH = 10 * 60 * 1000; // une prévision chargée par le tableau resert telle quelle à l'ouverture du site

export const fcKey = (s) => `fcm:${s.id}:${state.limits.model}`; // « fcm » : réponse multi-modèles

// Une seule requête pour plusieurs sites : Open-Meteo accepte des listes de coordonnées
export async function fetchForecasts(sites, force) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: sites.map((s) => s.lat).join(","), longitude: sites.map((s) => s.lon).join(","),
    elevation: sites.map((s) => s.alt).join(","),
    hourly: HOURLY.join(","), models: requestedModels().join(","),
    timezone: "Europe/Paris", forecast_days: FORECAST_DAYS, wind_speed_unit: "kmh"
  });
  const res = await fetch(url, { cache: force ? "reload" : "default" });
  const json = await res.json();
  if (!res.ok || json.error) throw new Error(json.reason || `Erreur ${res.status}`);
  const list = Array.isArray(json) ? json : [json];
  const at = Date.now();
  sites.forEach((s, i) => store.set(fcKey(s), { at, json: list[i] }));
  return list;
}

export const fetchError = (e) => (navigator.onLine ? `Prévisions indisponibles : ${e.message}` : "Hors ligne.");

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
