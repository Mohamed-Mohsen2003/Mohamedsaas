export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const uid = (p = 'id') => p + '_' + Math.random().toString(36).slice(2, 9);
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash(str) { let h = 2166136261; for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }

export const money = (n, cur = 'USD', compact = false) => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: compact ? 1 : 0, notation: compact ? 'compact' : 'standard' }).format(n);
export const num = (n, compact = false) => new Intl.NumberFormat('en-US', { notation: compact ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(n);
export const pct = (n) => (n > 0 ? '+' : '') + n.toFixed(1) + '%';
export const fmtDate = (d, opts = { month: 'short', day: 'numeric', year: 'numeric' }) => new Date(d).toLocaleDateString('en-US', opts);
export const fmtTime = (d) => new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
export function ago(d) {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return 'just now';
  const m = s / 60; if (m < 60) return Math.floor(m) + 'm ago';
  const h = m / 60; if (h < 24) return Math.floor(h) + 'h ago';
  const dd = h / 24; if (dd < 30) return Math.floor(dd) + 'd ago';
  return fmtDate(d, { month: 'short', day: 'numeric' });
}
export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);

const GRADS = [
  ['#7b61ff', '#ff3d9a'], ['#00c8ff', '#7b61ff'], ['#ff6b5b', '#ffb547'], ['#2ee59d', '#00c8ff'],
  ['#ff3d9a', '#ffb547'], ['#8be000', '#2ee59d'], ['#5b8cff', '#00e1ff'], ['#c86bff', '#ff6bd5'],
];
export const gradFor = (s) => GRADS[hash(s) % GRADS.length];
export const initials = (n) => String(n).split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
export function avatar(name, size = 36, extra = '', status = false) {
  const [a, b] = gradFor(name);
  return `<span class="avatar ${extra}" style="--s:${size}px;background:linear-gradient(135deg,${a},${b})" title="${esc(name)}">${initials(name)}${status ? '<i class="status"></i>' : ''}</span>`;
}

export function debounce(fn, ms = 200) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
