import { icon, LOGO_SVG } from '../lib/icons.js';
import { esc, avatar, $, $$, ago } from '../lib/util.js';
import { store } from '../store.js';
import { dropdown, closeDropdown, toast } from '../ui/overlay.js';
import { navigate, current } from '../router.js';
import { applySettings } from '../theme.js';

const NAV = [
  ['Workspace', [['Overview', '/app', 'home'], ['Projects', '/app/projects', 'kanban'], ['Portfolio', '/app/portfolio', 'image'], ['Clients', '/app/clients', 'users'], ['Invoices', '/app/invoices', 'receipt']]],
  ['Collaborate', [['Messages', '/app/messages', 'chat', 'msgs'], ['Calendar', '/app/calendar', 'calendar'], ['Team', '/app/team', 'briefcase']]],
  ['Insights', [['Analytics', '/app/analytics', 'chart'], ['Settings', '/app/settings', 'settings']]],
];

export function mountShell(root) {
  const s = store.get();
  const unread = s.threads.reduce((n, t) => n + t.unread, 0);
  root.innerHTML = `
  <div class="shell ${s.settings.collapsed ? 'collapsed' : ''}" id="shell">
    <aside class="sidebar">
      <a href="#/" class="logo"><span class="logo-mark">${LOGO_SVG('sl')}</span><span>Nexora</span></a>
      <div class="side-nav" id="side-nav">
        <div class="side-ind" id="side-ind"></div>
        ${NAV.map(([g, links]) => `<div class="side-group">${g}</div>${links.map(([l, h, ic, badge]) => `<a class="side-link" href="#${h}" data-path="${h}">${icon(ic)}<span>${l}</span>${badge === 'msgs' && unread ? `<b class="count" id="msg-count">${unread}</b>` : ''}</a>`).join('')}`).join('')}
      </div>
      <div class="side-foot">
        <div class="upgrade"><b>Nexora Pro ✨</b><p>Unlock AI forecasting, automations and white-label portals.</p><button class="btn btn-primary btn-sm" id="upgrade-btn">Upgrade now</button></div>
        <button class="side-link desktop-only" id="collapse-btn">${icon('sidebar')}<span>Collapse sidebar</span></button>
      </div>
    </aside>
    <div class="side-scrim" id="side-scrim"></div>
    <div class="main">
      <header class="topbar">
        <button class="icon-btn mobile-only" id="open-side">${icon('menu')}</button>
        <button class="search-trigger" id="search-trigger">${icon('search')}<span>Search or jump to…</span><span class="kbd">⌘K</span></button>
        <div class="top-right">
          <button class="icon-btn" id="quick-add" title="Quick create">${icon('plus')}</button>
          <button class="icon-btn" data-theme-toggle title="Toggle theme">${icon(s.settings.theme === 'dark' ? 'sun' : 'moon')}</button>
          <button class="icon-btn" id="notif-btn" title="Notifications">${icon('bell')}${s.notifications.some((n) => !n.read) ? '<span class="dot"></span>' : ''}</button>
          <button class="user-chip" id="user-btn">${avatar(s.profile.name, 36, '', true)}<div style="text-align:left"><b>${esc(s.profile.name)}</b><small>${esc(s.profile.role)}</small></div></button>
        </div>
      </header>
      <div class="content" id="view"></div>
    </div>
  </div>`;

  const shell = $('#shell');
  $('#collapse-btn').onclick = () => { store.set((st) => (st.settings.collapsed = !st.settings.collapsed)); shell.classList.toggle('collapsed'); setTimeout(placeIndicator, 520); };
  $('#open-side').onclick = () => shell.classList.add('side-open');
  $('#side-scrim').onclick = () => shell.classList.remove('side-open');
  $$('.side-link[data-path]').forEach((a) => a.addEventListener('click', () => shell.classList.remove('side-open')));
  $('#search-trigger').onclick = () => openCommand();
  $('#upgrade-btn').onclick = () => toast('You’re on the house 🎁', 'Pro features are unlocked in this demo.', 'info');
  $('#notif-btn').onclick = (e) => { e.stopPropagation(); openNotifs($('#notif-btn')); };
  $('#user-btn').onclick = (e) => { e.stopPropagation(); openUserMenu($('#user-btn')); };
  $('#quick-add').onclick = (e) => {
    e.stopPropagation();
    dropdown($('#quick-add'), [['New project', 'kanban', '/app/projects?new=1'], ['New invoice', 'receipt', '/app/invoices?new=1'], ['New client', 'users', '/app/clients?new=1'], ['New event', 'calendar', '/app/calendar?new=1']].map(([l, ic, h]) => `<button class="dd-item" data-go="${h}">${icon(ic)}${l}</button>`).join(''), {
      onMount(d) { d.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { closeDropdown(); navigate(b.dataset.go); })); },
    });
  };
  addEventListener('resize', placeIndicator);
}

export function setActive() {
  const path = current().split('?')[0];
  let best = null;
  $$('.side-link[data-path]').forEach((a) => { const p = a.dataset.path; const match = p === '/app' ? path === '/app' : path.startsWith(p); a.classList.toggle('active', match); if (match) best = a; });
  placeIndicator();
  return best;
}
function placeIndicator() {
  const ind = $('#side-ind'); const a = $('.side-link.active[data-path]');
  if (!ind) return;
  if (!a) { ind.style.opacity = 0; return; }
  ind.style.opacity = 1; ind.style.transform = `translateY(${a.offsetTop}px)`;
}

export function refreshBadges() {
  const s = store.get(); const unread = s.threads.reduce((n, t) => n + t.unread, 0);
  const c = $('#msg-count'); if (c) { if (unread) c.textContent = unread; else c.remove(); }
  const nb = $('#notif-btn'); if (nb && !s.notifications.some((n) => !n.read)) nb.querySelector('.dot')?.remove();
}

function openNotifs(anchor) {
  const s = store.get();
  dropdown(anchor, `<div class="notif-panel"><div class="np-head"><b>Notifications</b><button class="btn btn-ghost btn-sm" id="mark-all">Mark all read</button></div><div class="np-list">${s.notifications.map((n, i) => `<div class="notif ${n.read ? '' : 'unread'}" style="--i:${i}"><div class="n-ico" style="background:color-mix(in srgb, ${n.color} 16%, transparent);color:${n.color}">${icon(n.icon)}</div><div><p><b>${esc(n.title)}</b> — ${esc(n.body)}</p><small>${ago(n.at)}</small></div></div>`).join('')}</div></div>`, {
    onMount(d) { d.querySelector('#mark-all').onclick = () => { store.set((st) => st.notifications.forEach((n) => (n.read = true))); d.querySelectorAll('.notif').forEach((n) => n.classList.remove('unread')); refreshBadges(); toast('All caught up ✨', '', 'success', 2000); }; },
  });
}

function openUserMenu(anchor) {
  const s = store.get();
  dropdown(anchor, `<div style="padding:10px 10px 12px;display:flex;gap:10px;align-items:center">${avatar(s.profile.name, 40)}<div><b style="font-size:14px">${esc(s.profile.name)}</b><div class="dim" style="font-size:12px">${esc(s.profile.email)}</div></div></div><div class="dd-sep"></div>
    <button class="dd-item" data-go="/app/settings">${icon('user')}Profile & settings</button><button class="dd-item" data-go="/">${icon('globe')}View public site</button><button class="dd-item" data-go="/app/team">${icon('users')}Team</button><div class="dd-sep"></div><button class="dd-item" id="logout" style="color:var(--danger)">${icon('logout')}Sign out</button>`, {
    onMount(d) {
      d.querySelectorAll('[data-go]').forEach((b) => (b.onclick = () => { closeDropdown(); navigate(b.dataset.go); }));
      d.querySelector('#logout').onclick = () => { closeDropdown(); store.set((st) => (st.user = null)); toast('Signed out', 'See you soon 👋', 'info'); navigate('/login'); };
    },
  });
}

/* ---------- Command palette ---------- */
export function openCommand() {
  if ($('.cmdk')) return;
  const s = store.get();
  const items = [
    ...NAV.flatMap(([, ls]) => ls.map(([l, h, ic]) => ({ g: 'Navigate', l, ic, run: () => navigate(h) }))),
    { g: 'Actions', l: 'Create new project', ic: 'plus', run: () => navigate('/app/projects?new=1') },
    { g: 'Actions', l: 'Create new invoice', ic: 'receipt', run: () => navigate('/app/invoices?new=1') },
    { g: 'Actions', l: 'Add new client', ic: 'users', run: () => navigate('/app/clients?new=1') },
    { g: 'Actions', l: 'Toggle dark / light theme', ic: 'moon', run: () => { store.set((st) => (st.settings.theme = st.settings.theme === 'dark' ? 'light' : 'dark')); applySettings(); } },
    { g: 'Actions', l: 'View public landing page', ic: 'globe', run: () => navigate('/') },
    ...s.projects.map((p) => ({ g: 'Projects', l: p.title, ic: 'folder', sub: p.type, run: () => navigate('/app/projects/' + p.id) })),
    ...s.clients.map((c) => ({ g: 'Clients', l: c.name, ic: 'user', sub: c.country, run: () => navigate('/app/clients/' + c.id) })),
    ...s.invoices.slice(0, 30).map((i) => ({ g: 'Invoices', l: i.number, ic: 'receipt', sub: s.clients.find((c) => c.id === i.clientId).name, run: () => navigate('/app/invoices/' + i.id) })),
  ];
  const bd = document.createElement('div');
  bd.className = 'modal-backdrop';
  bd.innerHTML = `<div class="cmdk"><div class="cmdk-input">${icon('search')}<input placeholder="Type a command or search…" id="cmdk-q" autocomplete="off"/><span class="kbd">ESC</span></div><div class="cmdk-list" id="cmdk-list"></div><div class="row between" style="padding:10px 16px;border-top:1px solid var(--border);font-size:12px;color:var(--text-3)"><span class="row" style="gap:6px"><span class="kbd">↑</span><span class="kbd">↓</span> navigate <span class="kbd">↵</span> open</span><span>Nexora Command</span></div></div>`;
  document.getElementById('modal-root').appendChild(bd);
  const q = bd.querySelector('#cmdk-q'), list = bd.querySelector('#cmdk-list');
  let filtered = [], idx = 0;
  const draw = () => {
    const term = q.value.toLowerCase().trim();
    filtered = (term ? items.filter((i) => (i.l + ' ' + (i.sub || '')).toLowerCase().includes(term)) : items.filter((i) => i.g === 'Navigate' || i.g === 'Actions')).slice(0, 40);
    idx = Math.min(idx, Math.max(0, filtered.length - 1));
    let g = '', html = '';
    filtered.forEach((it, i) => { if (it.g !== g) { g = it.g; html += `<div class="cmdk-group">${g}</div>`; } html += `<div class="cmdk-item ${i === idx ? 'sel' : ''}" data-i="${i}" style="--i:${i}">${icon(it.ic)}<span>${esc(it.l)}</span>${it.sub ? `<span class="k">${esc(it.sub)}</span>` : ''}</div>`; });
    list.innerHTML = html || '<div class="empty">' + icon('search') + 'No results for “' + esc(q.value) + '”</div>';
    list.querySelector('.sel')?.scrollIntoView({ block: 'nearest' });
  };
  const close = () => { bd.classList.add('out'); setTimeout(() => bd.remove(), 250); };
  const run = (i) => { const it = filtered[i]; if (!it) return; close(); setTimeout(it.run, 50); };
  q.addEventListener('input', () => { idx = 0; draw(); });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); idx = Math.min(filtered.length - 1, idx + 1); draw(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); idx = Math.max(0, idx - 1); draw(); }
    else if (e.key === 'Enter') run(idx);
    else if (e.key === 'Escape') close();
  });
  list.addEventListener('click', (e) => { const it = e.target.closest('.cmdk-item'); it && run(+it.dataset.i); });
  list.addEventListener('mousemove', (e) => { const it = e.target.closest('.cmdk-item'); if (it && +it.dataset.i !== idx) { idx = +it.dataset.i; list.querySelectorAll('.cmdk-item').forEach((x) => x.classList.toggle('sel', +x.dataset.i === idx)); } });
  bd.addEventListener('click', (e) => e.target === bd && close());
  draw(); setTimeout(() => q.focus(), 30);
}
