// Le vol d'arrivée de la voile dans le ciel de l'en-tête, calculé image par image, sans bibliothèque.
// La voile suit une trajectoire lisse ; en virage, le pilote part en balancier vers l'extérieur sous l'effet
// de l'accélération, avec un temps de retard, puis revient en amortissant. À la fin, elle tient sa place
// comme en vol de pente, avec un léger flottement (CSS, .soar). Si le téléphone demande moins d'animations,
// elle est posée d'emblée, immobile.

const REST_ROLL = -4;  // légère inclinaison au repos, en degrés
const G = 1500;        // pesanteur apparente, en px/s² : règle l'amplitude du balancier
const PERIOD = 2.1;    // période du balancier, en secondes
const DAMPING = .45;   // amortissement : un retour à peine, puis la voile se stabilise
const MAX_ROLL = 16;

// Trajectoires relatives à la position de repos (dernier point), en px
const HEADER = { path: [[330, 50], [180, 22], [40, 40], [-80, 28], [-45, 10], [0, 0]], duration: 5600, scale: [.7, 1] };
const WELCOME = { path: [[-380, 120], [-180, 40], [40, 58], [130, 18], [40, -8], [0, 0]], duration: 6000, scale: [.5, 1] };

// Catmull-Rom uniforme : passe par chaque point, sans cassure
function along(P, u) {
  const n = P.length - 1, f = Math.min(u, .99999) * n, i = Math.floor(f), t = f - i;
  const p0 = P[Math.max(i - 1, 0)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(i + 2, n)];
  const c = (a, b, c2, d) => .5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t * t + (-a + 3 * b - 3 * c2 + d) * t * t * t);
  return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])];
}

// Avance rapide au départ, puis la voile ralentit pour se poser dans le vent
const ease = (t) => 1 - Math.pow(1 - t, 1.35);

function fly(el, { path, duration, scale }, still) {
  el.classList.add("ready");
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rest = () => { el.style.setProperty("transform", `rotate(${REST_ROLL}deg)`); if (!calm) el.classList.add("soar"); };
  if (still || calm) { rest(); return; }

  const pos = (ms) => along(path, ease(Math.min(Math.max(ms, 0) / duration, 1)));
  const k = (2 * Math.PI / PERIOD) ** 2, c = 2 * DAMPING * Math.sqrt(k);
  let roll = 0, spin = 0, last = null, t0 = null;

  const frame = (now) => {
    if (!el.isConnected) return;
    if (t0 == null) { t0 = now; last = now; }
    const ms = now - t0, dt = Math.min((now - last) / 1000, .05); last = now;
    // Accélération latérale de la voile (différences finies sur la trajectoire)
    const h = 16, [xa] = pos(ms - h), [x] = pos(ms), [xb] = pos(ms + h);
    const ax = (xb - 2 * x + xa) / ((h / 1000) ** 2);
    // Le pilote pend selon la pesanteur apparente : vers l'extérieur du virage
    const target = Math.max(-MAX_ROLL, Math.min(MAX_ROLL, Math.atan2(ax, G) * 180 / Math.PI));
    spin += (-k * (roll - target) - c * spin) * dt;
    roll += spin * dt;
    const [px, py] = pos(ms), u = ease(Math.min(ms / duration, 1));
    const s = scale[0] + (scale[1] - scale[0]) * u;
    el.style.setProperty("transform", `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px) rotate(${(roll + REST_ROLL).toFixed(2)}deg) scale(${s.toFixed(3)})`);
    // Une fois posée et le balancier calmé, on s'arrête net sur la position de repos
    if (ms > duration && Math.abs(roll) < .3 && Math.abs(spin) < 1) { rest(); return; }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

export const flyHeader = (el) => fly(el, HEADER);

// L'accueil peut se redessiner : la grande voile ne fait son entrée qu'une fois
let welcomed = false;
export function flyWelcome(el) { fly(el, WELCOME, welcomed); welcomed = true; }
