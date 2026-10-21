import { runCleanups } from './ui/fx.js';
import { closeDropdown } from './ui/overlay.js';
import { hideTip } from './ui/charts.js';

const routes = [];
export function route(pattern, handler, opts = {}) {
  const keys = [];
  const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '/?$');
  routes.push({ re, keys, handler, ...opts });
}
export const navigate = (path) => { if (location.hash.slice(1) === path) render(); else location.hash = path; };
export const current = () => location.hash.slice(1) || '/';

let guard = null;
export const setGuard = (fn) => (guard = fn);
let lastShell = null;

export async function render() {
  const path = current().split('?')[0];
  for (const r of routes) {
    const m = path.match(r.re);
    if (!m) continue;
    const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
    if (guard) { const redirect = guard(r, path); if (redirect) return navigate(redirect); }
    runCleanups(); closeDropdown(); hideTip();
    const keepShell = r.shell && lastShell === r.shell;
    if (!keepShell) window.scrollTo(0, 0);
    lastShell = r.shell || null;
    await r.handler(params, { keepShell });
    return;
  }
  navigate('/');
}
export function startRouter() { addEventListener('hashchange', render); render(); }
