import { store } from './store.js';
import { icon } from './lib/icons.js';

export function applySettings() {
  const s = store.get().settings;
  const html = document.documentElement;
  html.dataset.theme = s.theme;
  html.dataset.accent = s.accent;
  html.classList.toggle('reduce-motion', !!s.reduceMotion);
  document.body.dataset.cursor = s.cursor ? 'on' : 'off';
  if (!s.cursor) document.body.classList.remove('has-cursor');
  document.querySelector('meta[name="theme-color"]').content = s.theme === 'dark' ? '#07070d' : '#f6f5fb';
  document.querySelectorAll('[data-theme-toggle]').forEach((b) => (b.innerHTML = icon(s.theme === 'dark' ? 'sun' : 'moon')));
}

export function toggleTheme(e) {
  const go = () => { store.set((st) => (st.settings.theme = st.settings.theme === 'dark' ? 'light' : 'dark')); applySettings(); };
  // circular reveal theme transition when supported
  if (document.startViewTransition && e && !store.get().settings.reduceMotion) {
    const x = e.clientX ?? innerWidth / 2, y = e.clientY ?? 0;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = document.startViewTransition(go);
    t.ready.then(() => document.documentElement.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] }, { duration: 700, easing: 'cubic-bezier(.77,0,.18,1)', pseudoElement: '::view-transition-new(root)' })).catch(() => {});
  } else go();
}
