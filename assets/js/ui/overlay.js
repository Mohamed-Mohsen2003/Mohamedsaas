import { icon } from '../lib/icons.js';
import { esc } from '../lib/util.js';

/* ---------- toasts ---------- */
const TT = { success: ['checkCircle', '#2ee59d'], error: ['x', '#ff5470'], info: ['sparkles', 'var(--accent)'], warning: ['bell', '#ffb547'] };
export function toast(title, body = '', type = 'success', ms = 3800) {
  const [ic, col] = TT[type] || TT.info;
  const t = document.createElement('div');
  t.className = 'toast';
  t.innerHTML = `<div class="t-ico" style="background:color-mix(in srgb, ${col} 18%, transparent);color:${col}">${icon(ic)}</div><div><b>${esc(title)}</b>${body ? `<span>${esc(body)}</span>` : ''}</div><i class="t-bar" style="animation-duration:${ms}ms"></i>`;
  document.getElementById('toasts').appendChild(t);
  const kill = () => { t.classList.add('out'); setTimeout(() => t.remove(), 450); };
  t.addEventListener('click', kill);
  setTimeout(kill, ms);
}

/* ---------- modal ---------- */
export function modal({ title, body, foot = '', wide = false, onMount } = {}) {
  const root = document.getElementById('modal-root');
  const bd = document.createElement('div');
  bd.className = 'modal-backdrop';
  bd.innerHTML = `<div class="modal ${wide ? 'wide' : ''}" role="dialog" aria-modal="true"><div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close>${icon('x')}</button></div><div class="modal-body">${body}</div>${foot ? `<div class="modal-foot">${foot}</div>` : ''}</div>`;
  root.appendChild(bd);
  const close = () => { bd.classList.add('out'); setTimeout(() => bd.remove(), 300); removeEventListener('keydown', onKey); };
  const onKey = (e) => e.key === 'Escape' && close();
  addEventListener('keydown', onKey);
  bd.addEventListener('click', (e) => { if (e.target === bd || e.target.closest('[data-close]')) close(); });
  onMount && onMount(bd.querySelector('.modal'), close);
  const f = bd.querySelector('input,select,textarea'); f && setTimeout(() => f.focus(), 60);
  return close;
}

export function confirmModal(title, text, okLabel = 'Confirm', danger = false) {
  return new Promise((res) => {
    modal({
      title, body: `<p class="muted">${esc(text)}</p>`,
      foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(okLabel)}</button>`,
      onMount(m, close) { m.querySelector('[data-ok]').onclick = () => { res(true); close(); }; m.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => res(false))); },
    });
  });
}

/* ---------- dropdown ---------- */
let openDD = null;
export function dropdown(anchor, html, { align = 'right', onMount } = {}) {
  closeDropdown();
  const d = document.createElement('div');
  d.className = 'dropdown';
  d.innerHTML = html;
  document.body.appendChild(d);
  const r = anchor.getBoundingClientRect();
  const dw = d.offsetWidth;
  let left = align === 'right' ? r.right - dw : r.left;
  left = Math.max(10, Math.min(innerWidth - dw - 10, left));
  d.style.left = left + 'px'; d.style.top = r.bottom + 8 + scrollY + 'px';
  d.style.position = 'absolute';
  if (align !== 'right') d.style.transformOrigin = 'top left';
  openDD = d;
  setTimeout(() => document.addEventListener('click', outside), 0);
  onMount && onMount(d, closeDropdown);
  return d;
}
function outside(e) { if (openDD && !openDD.contains(e.target)) closeDropdown(); }
export function closeDropdown() { if (openDD) { openDD.remove(); openDD = null; document.removeEventListener('click', outside); } }
