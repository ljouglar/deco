// Petites aides sans état : DOM, texte, vent et géographie, stockage local, dessins partagés
export const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};

export const $ = (id) => document.getElementById(id);

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const r0 = (v) => (v == null || Number.isNaN(v) ? "–" : Math.round(v));

export const el = (form, name) => form.elements.namedItem(name);

const CARD = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];

export const cardinal = (d) => (d == null ? "–" : CARD[Math.round(((d % 360) + 360) % 360 / 22.5) % 16]);

export const inSector = (d, a, b) => (a <= b ? d >= a && d <= b : d >= a || d <= b);

export const angleGap = (x, y) => { const t = Math.abs(x - y) % 360; return t > 180 ? 360 - t : t; };

// Distance en km, à plat : assez juste à l'échelle de quelques dizaines de km
export const km = (la1, lo1, la2, lo2) => 111.2 * Math.hypot(la2 - la1, (lo2 - lo1) * Math.cos(la1 * Math.PI / 180));

export function sectorGap(d, a, b) {
  if (inSector(d, a, b)) return 0;
  return Math.min(angleGap(d, a), angleGap(d, b));
}

// Date et heure locales (Europe/Paris) d'un instant, pour retrouver l'heure de prévision correspondante
export function parisParts(ts) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false
  }).formatToParts(new Date(ts));
  const g = (t) => parts.find((x) => x.type === t).value;
  return { date: `${g("year")}-${g("month")}-${g("day")}`, hour: +g("hour") % 24 };
}

export function ago(ms) {
  const m = Math.round(ms / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.round(m / 60);
  return h < 24 ? `il y a ${h} h` : `il y a ${Math.round(h / 24)} j`;
}

export const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

export function arrowSvg(deg) {
  return `<svg viewBox="-10 -10 20 20" aria-hidden="true"><g transform="rotate(${deg ?? 0})"><path d="M0 -8 V6 M-4.5 2 L0 7 L4.5 2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
}

export const reasonsHtml = (list) => list.map((r) => `<li><span class="dot l${r.l}"></span><span>${esc(r.msg)}</span></li>`).join("");

export const fold = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
