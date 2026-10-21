import { icon } from '../lib/icons.js';
import { esc, avatar, money, fmtDate, $, $$, uid, daysBetween } from '../lib/util.js';
import { store, sel } from '../store.js';
import { scanReveal, confetti } from '../ui/fx.js';
import { modal, toast, confirmModal } from '../ui/overlay.js';
import { coverArt } from '../ui/cover.js';
import { ringProgress, barChart } from '../ui/charts.js';
import { navigate, current } from '../router.js';
import { STATUS_META, INV_META } from './overview.js';

const TYPES = ['Web App', 'Mobile App', 'Branding', 'Shopify Store', 'WordPress', 'Odoo ERP', 'UI/UX', 'Desktop App', 'Video'];
const PRI = { Low: 'badge-info', Medium: '', High: 'badge-warning', Urgent: 'badge-danger' };
let viewMode = 'board', filterType = 'All', query = '';

export function renderProjects(view) {
  const s = store.get();
  view.innerHTML = `
  <div class="page-head route-enter">
    <div><h1>Projects</h1><p>${s.projects.length} projects · ${s.projects.filter((p) => p.status !== 'done').length} in flight</p></div>
    <div class="page-actions"><div class="seg" id="view-seg"><span class="seg-ind"></span><button data-v="board" class="${viewMode === 'board' ? 'active' : ''}">${icon('kanban')}</button><button data-v="list" class="${viewMode === 'list' ? 'active' : ''}">${icon('menu')}</button></div><button class="btn btn-primary" id="new-proj" data-magnetic>${icon('plus')} New project</button></div>
  </div>
  <div class="toolbar" data-reveal="up">
    <div class="input-icon">${icon('search')}<input class="input" id="p-q" placeholder="Search projects…" value="${esc(query)}"/></div>
    <div class="row wrap" style="gap:8px" id="type-chips">${['All', ...TYPES].map((t) => `<button class="chip ${t === filterType ? 'active' : ''}" data-t="${t}">${t}</button>`).join('')}</div>
  </div>
  <div id="proj-body"></div>`;
  const seg = $('#view-seg'), ind = seg.querySelector('.seg-ind');
  const place = () => { const a = seg.querySelector('.active'); ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft - 4}px)`; };
  requestAnimationFrame(place);
  seg.querySelectorAll('button').forEach((b) => (b.querySelector('svg').style.cssText = 'width:16px;height:16px'));
  seg.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; viewMode = b.dataset.v; seg.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b)); place(); drawBody(); };
  $('#type-chips').onclick = (e) => { const b = e.target.closest('.chip'); if (!b) return; filterType = b.dataset.t; $$('#type-chips .chip').forEach((c) => c.classList.toggle('active', c === b)); drawBody(); };
  $('#p-q').oninput = (e) => { query = e.target.value; drawBody(); };
  $('#new-proj').onclick = () => newProjectModal();
  scanReveal(view);
  drawBody();
  if (current().includes('new=1')) { history.replaceState(null, '', '#/app/projects'); newProjectModal(); }
}

function filtered() {
  const q = query.toLowerCase();
  return store.get().projects.filter((p) => (filterType === 'All' || p.type === filterType) && (!q || (p.title + sel.client(p.clientId).name).toLowerCase().includes(q)));
}

function cardHTML(p, i) {
  const c = sel.client(p.clientId);
  const left = daysBetween(Date.now(), p.due);
  return `<div class="k-card" data-id="${p.id}" style="--i:${i}">
    <div class="k-cover">${coverArt(p, { tag: false })}</div>
    <div class="row between"><span class="badge ${PRI[p.priority]}">${p.priority}</span><span class="dim" style="font-size:12px">${esc(p.type)}</span></div>
    <b>${esc(p.title)}</b>
    <div class="row" style="gap:10px"><div class="progress" style="flex:1"><span style="width:${p.progress}%"></span></div><small class="mono dim">${p.progress}%</small></div>
    <div class="k-meta"><div class="avatar-stack">${p.members.slice(0, 3).map((m) => avatar(sel.member(m).name, 24)).join('')}</div><span class="row" style="gap:4px">${icon('clock').replace('<svg', '<svg style="width:14px;height:14px"')}${p.status === 'done' ? 'Shipped' : left < 0 ? `<span style="color:var(--danger)">${-left}d late</span>` : left + 'd left'}</span></div>
    <small class="dim">${esc(c.name)}</small>
  </div>`;
}

function drawBody() {
  const body = $('#proj-body'); if (!body) return;
  const list = filtered();
  if (viewMode === 'list') {
    body.innerHTML = `<div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Project</th><th>Client</th><th>Status</th><th>Priority</th><th>Budget</th><th>Due</th><th>Progress</th></tr></thead><tbody>${list.map((p, i) => `<tr class="clickable" style="--i:${i}" data-href="/app/projects/${p.id}"><td><div class="row"><div style="width:38px;height:38px;border-radius:10px;overflow:hidden;position:relative;flex:none">${coverArt(p, { tag: false })}</div><b>${esc(p.title)}</b></div></td><td>${esc(sel.client(p.clientId).name)}</td><td><span class="badge ${STATUS_META[p.status][2]}">${STATUS_META[p.status][0]}</span></td><td><span class="badge ${PRI[p.priority]}">${p.priority}</span></td><td class="mono">${money(p.budget)}</td><td>${fmtDate(p.due)}</td><td style="min-width:140px"><div class="progress"><span style="width:${p.progress}%"></span></div></td></tr>`).join('') || `<tr><td colspan="7"><div class="empty">${icon('folder')}No projects match your filters</div></td></tr>`}</tbody></table></div></div>`;
    return;
  }
  body.innerHTML = `<div class="kanban">${Object.entries(STATUS_META).map(([st, [label, color]]) => { const items = list.filter((p) => p.status === st); return `<div class="k-col" data-status="${st}"><div class="k-head"><i style="background:${color};box-shadow:0 0 10px ${color}"></i><b>${label}</b><span class="n">${items.length}</span><button class="icon-btn" style="margin-left:auto;width:30px;height:30px" data-add="${st}">${icon('plus')}</button></div><div class="k-list">${items.map(cardHTML).join('')}</div></div>`; }).join('')}</div>`;
  body.querySelectorAll('[data-add]').forEach((b) => (b.onclick = () => newProjectModal(b.dataset.add)));
  enableDrag(body);
}

function enableDrag(body) {
  let drag = null;
  body.addEventListener('pointerdown', (e) => {
    const card = e.target.closest('.k-card'); if (!card || e.button !== 0) return;
    const r = card.getBoundingClientRect();
    drag = { card, id: card.dataset.id, sx: e.clientX, sy: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top, w: r.width, started: false };
    e.preventDefault();
    addEventListener('pointermove', move); addEventListener('pointerup', end); addEventListener('pointercancel', end);
  });
  const move = (e) => {
    if (!drag) return;
    if (!drag.started) {
      if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
      drag.started = true;
      drag.ghost = drag.card.cloneNode(true); drag.ghost.classList.add('k-ghost'); drag.ghost.style.width = drag.w + 'px'; drag.ghost.style.animation = 'none';
      document.body.appendChild(drag.ghost);
      drag.ph = document.createElement('div'); drag.ph.className = 'k-placeholder'; drag.ph.style.height = drag.card.offsetHeight + 'px';
      drag.card.after(drag.ph); drag.card.classList.add('dragging'); drag.card.style.display = 'none';
    }
    drag.ghost.style.left = e.clientX - drag.ox + 'px'; drag.ghost.style.top = e.clientY - drag.oy + 'px';
    drag.ghost.style.transform = `rotate(${Math.max(-6, Math.min(6, (e.clientX - drag.sx) / 30))}deg) scale(1.04)`;
    const under = document.elementFromPoint(e.clientX, e.clientY);
    const col = under && under.closest('.k-col');
    $$('.k-col', body).forEach((c) => c.classList.toggle('over', c === col));
    if (col) {
      const lst = col.querySelector('.k-list');
      const after = [...lst.querySelectorAll('.k-card:not(.dragging)')].find((c) => { const rr = c.getBoundingClientRect(); return e.clientY < rr.top + rr.height / 2; });
      if (after) lst.insertBefore(drag.ph, after); else lst.appendChild(drag.ph);
    }
  };
  const end = () => {
    removeEventListener('pointermove', move); removeEventListener('pointerup', end); removeEventListener('pointercancel', end);
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.started) { navigate('/app/projects/' + d.id); return; }
    const col = d.ph.closest('.k-col');
    const st = col ? col.dataset.status : null;
    d.ghost.remove();
    if (st) {
      store.set((s) => {
        const p = s.projects.find((x) => x.id === d.id); const prev = p.status; p.status = st;
        if (st === 'done') { p.progress = 100; p.tasks.forEach((t) => (t.done = true)); }
        if (st === 'review' && p.progress < 80) p.progress = 85;
        if (prev !== st) toast(`Moved to ${STATUS_META[st][0]}`, p.title, st === 'done' ? 'success' : 'info', 2600);
        // reorder within array based on placeholder position
        const ids = [...col.querySelectorAll('.k-card:not(.dragging), .k-placeholder')].map((n) => (n.classList.contains('k-placeholder') ? d.id : n.dataset.id));
        const others = s.projects.filter((x) => !ids.includes(x.id));
        s.projects = [...others, ...ids.map((id) => s.projects.find((x) => x.id === id))];
      });
      if (st === 'done') confetti();
    }
    drawBody();
  };
}

export function newProjectModal(status = 'backlog') {
  const s = store.get();
  modal({
    title: 'Create new project',
    body: `<div class="field"><label>Project name</label><input class="input" name="title" placeholder="e.g. Aurora Banking App" required/></div>
      <div class="grid g-2" style="gap:14px"><div class="field"><label>Client</label><select class="select" name="client">${s.clients.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label>Type</label><select class="select" name="type">${TYPES.map((t) => `<option>${t}</option>`).join('')}</select></div></div>
      <div class="grid g-2" style="gap:14px"><div class="field"><label>Budget (USD)</label><input class="input" name="budget" type="number" value="18000" min="0"/></div><div class="field"><label>Due date</label><input class="input" name="due" type="date" value="${new Date(Date.now() + 45 * 864e5).toISOString().slice(0, 10)}"/></div></div>
      <div class="grid g-2" style="gap:14px"><div class="field"><label>Priority</label><select class="select" name="priority"><option>Low</option><option selected>Medium</option><option>High</option><option>Urgent</option></select></div><div class="field"><label>Status</label><select class="select" name="status">${Object.entries(STATUS_META).map(([k, [l]]) => `<option value="${k}" ${k === status ? 'selected' : ''}>${l}</option>`).join('')}</select></div></div>`,
    foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="create-p">${icon('sparkles')} Create project</button>`,
    onMount(m, close) {
      m.querySelector('#create-p').onclick = () => {
        const v = (n) => m.querySelector(`[name=${n}]`).value;
        const title = v('title').trim();
        if (!title) { m.querySelector('[name=title]').classList.add('shake'); m.querySelector('[name=title]').focus(); return; }
        const id = uid('p');
        store.set((st) => {
          st.projects.unshift({ id, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + id.slice(-3), title, type: v('type'), clientId: v('client'), status: v('status'), priority: v('priority'), budget: +v('budget') || 0, spent: 0, progress: v('status') === 'done' ? 100 : 0, start: new Date().toISOString(), due: new Date(v('due')).toISOString(), members: ['m1', 'm2'], tasks: ['Kickoff & discovery workshop', 'Wireframes', 'High-fidelity UI', 'Build', 'QA & launch'].map((t, k) => ({ id: id + k, title: t, done: false, assignee: 'm1' })), stack: ['Figma', 'React'], featured: false, likes: 0, views: 0, seed: Math.floor(Math.random() * 99), summary: `A new ${v('type').toLowerCase()} project.`, results: [['—', 'Conversion lift'], ['—', 'LCP'], ['—', 'Lighthouse'], ['—', 'Users']] });
          st.activity.unshift({ id: uid('a'), who: st.profile.name, what: 'created project', target: title, color: '#7b61ff', at: new Date().toISOString() });
        });
        close(); confetti(90); toast('Project created 🎉', title, 'success');
        if (current().startsWith('/app/projects')) drawBody(); else navigate('/app/projects');
      };
    },
  });
}

/* ---------- project detail ---------- */
export function renderProject(view, { id }) {
  const p = sel.project(id);
  if (!p) return navigate('/app/projects');
  const c = sel.client(p.clientId);
  const invs = store.get().invoices.filter((i) => i.projectId === p.id);
  const done = p.tasks.filter((t) => t.done).length;
  const left = daysBetween(Date.now(), p.due);
  view.innerHTML = `
  <div class="route-enter">
    <div class="crumbs"><a href="#/app/projects">Projects</a>/<span>${esc(p.title)}</span></div>
    <div class="card" style="overflow:hidden">
      <div style="height:220px;position:relative">${coverArt(p)}<div style="position:absolute;inset:0;background:linear-gradient(transparent 30%,var(--surface))"></div></div>
      <div class="card-pad" style="margin-top:-70px;position:relative;display:flex;justify-content:space-between;align-items:end;gap:20px;flex-wrap:wrap">
        <div><span class="badge ${STATUS_META[p.status][2]}">${STATUS_META[p.status][0]}</span><h1 style="font-size:clamp(28px,4vw,44px);margin-top:10px" data-split>${esc(p.title)}</h1><p class="muted" style="margin-top:6px">${esc(c.name)} · ${esc(p.type)} · ${p.stack.join(' · ')}</p></div>
        <div class="page-actions">
          <select class="select" id="p-status" style="width:auto;height:44px;border-radius:99px">${Object.entries(STATUS_META).map(([k, [l]]) => `<option value="${k}" ${k === p.status ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <a class="btn btn-ghost" href="#/case/${p.slug}">${icon('eye')} Case study</a>
          <button class="btn btn-danger btn-icon" id="del-p" title="Delete">${icon('trash')}</button>
        </div>
      </div>
    </div>
  </div>
  <div class="grid g-4">
    ${[['Budget', money(p.budget), 'dollar', '#7b61ff'], ['Spent', money(p.spent), 'wallet', '#ff3d9a'], ['Tasks', `${done}/${p.tasks.length}`, 'checkCircle', '#2ee59d'], ['Deadline', p.status === 'done' ? 'Shipped ✓' : left < 0 ? `${-left}d overdue` : `${left} days left`, 'clock', '#ffb547']].map(([l, v, ic, col], i) => `<div class="card kpi spotlight" data-reveal="up" style="--d:${i * 80}ms;--kc:${col}"><div class="k-ico" style="background:color-mix(in srgb, ${col} 16%, transparent);color:${col}">${icon(ic)}</div><div class="k-label">${l}</div><div class="k-val" style="font-size:26px">${v}</div></div>`).join('')}
  </div>
  <div class="grid g-21">
    <div class="card card-pad" data-reveal="up">
      <div class="card-title"><h3>Tasks</h3><button class="btn btn-ghost btn-sm" id="add-task">${icon('plus')} Add task</button></div>
      <div id="tasks"></div>
    </div>
    <div class="stack">
      <div class="card card-pad" data-reveal="up" style="display:grid;justify-items:center;gap:12px"><h3 style="justify-self:start;font-family:var(--font-body);font-size:16px">Progress</h3><div id="ring">${ringProgress(p.progress)}</div><p class="muted" style="font-size:13px">${fmtDate(p.start)} → ${fmtDate(p.due)}</p></div>
      <div class="card card-pad" data-reveal="up" style="--d:100ms"><div class="card-title"><h3>Team</h3></div>${p.members.map((m, i) => { const mm = sel.member(m); return `<div class="list-i" style="--i:${i}">${avatar(mm.name, 38, '', mm.online)}<div class="grow"><b>${esc(mm.name)}</b><small>${esc(mm.role)}</small></div><span class="badge no-dot">${p.tasks.filter((t) => t.assignee === m).length} tasks</span></div>`; }).join('')}</div>
    </div>
  </div>
  <div class="grid g-2">
    <div class="card card-pad" data-reveal="up"><div class="card-title"><h3>Budget burn</h3><small class="dim">weekly spend</small></div><div id="burn"></div></div>
    <div class="card card-pad" data-reveal="up" style="--d:100ms"><div class="card-title"><h3>Invoices</h3><a href="#/app/invoices?new=1" class="btn btn-ghost btn-sm">${icon('plus')} New</a></div>${invs.length ? invs.map((i, k) => `<a href="#/app/invoices/${i.id}" class="list-i" style="--i:${k}"><div class="k-ico" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:var(--surface-2)">${icon('receipt').replace('<svg', '<svg style="width:18px"')}</div><div class="grow"><b>${i.number}</b><small>${fmtDate(i.issue)}</small></div><span class="badge ${INV_META[i.status]}" style="text-transform:capitalize">${i.status}</span><b class="mono" style="font-size:13px;min-width:80px;text-align:right">${money(sel.invTotal(i))}</b></a>`).join('') : `<div class="empty">${icon('receipt')}No invoices yet</div>`}</div>
  </div>`;
  scanReveal(view);
  const drawTasks = () => {
    const pp = sel.project(id);
    $('#tasks').innerHTML = pp.tasks.map((t, i) => `<div class="task ${t.done ? 'done' : ''}" data-t="${t.id}" style="--i:${i}"><span class="checkbox ${t.done ? 'on' : ''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span><b>${esc(t.title)}</b>${avatar(sel.member(t.assignee)?.name || 'Mohamed Mohsen', 26)}</div>`).join('');
  };
  drawTasks();
  $('#tasks').onclick = (e) => {
    const row = e.target.closest('.task'); if (!row) return;
    let prog = 0, allDone = false;
    store.set((s) => { const pp = s.projects.find((x) => x.id === id); const t = pp.tasks.find((x) => x.id === row.dataset.t); t.done = !t.done; pp.progress = Math.round((pp.tasks.filter((x) => x.done).length / pp.tasks.length) * 100); prog = pp.progress; allDone = prog === 100; if (allDone) pp.status = 'done'; });
    row.classList.toggle('done'); row.querySelector('.checkbox').classList.toggle('on');
    $('#ring').innerHTML = ringProgress(prog); scanReveal($('#ring'));
    if (allDone) { confetti(); toast('All tasks complete! 🏁', 'Project marked as done.', 'success'); }
  };
  $('#add-task').onclick = () => modal({ title: 'Add task', body: `<div class="field"><label>Task</label><input class="input" id="tt" placeholder="e.g. Accessibility audit"/></div><div class="field"><label>Assignee</label><select class="select" id="ta">${p.members.map((m) => `<option value="${m}">${esc(sel.member(m).name)}</option>`).join('')}</select></div>`, foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="ta-ok">Add</button>`, onMount(m, close) { m.querySelector('#ta-ok').onclick = () => { const v = m.querySelector('#tt').value.trim(); if (!v) return; store.set((s) => { const pp = s.projects.find((x) => x.id === id); pp.tasks.push({ id: uid('t'), title: v, done: false, assignee: m.querySelector('#ta').value }); pp.progress = Math.round((pp.tasks.filter((x) => x.done).length / pp.tasks.length) * 100); }); close(); drawTasks(); toast('Task added', v, 'success', 2200); }; } });
  $('#p-status').onchange = (e) => { store.set((s) => { const pp = s.projects.find((x) => x.id === id); pp.status = e.target.value; if (pp.status === 'done') pp.progress = 100; }); toast('Status updated', STATUS_META[e.target.value][0], 'info', 2200); if (e.target.value === 'done') confetti(); renderProject(view, { id }); };
  $('#del-p').onclick = async () => { if (await confirmModal('Delete project?', `“${p.title}” and its tasks will be removed. This can’t be undone.`, 'Delete', true)) { store.set((s) => (s.projects = s.projects.filter((x) => x.id !== id))); toast('Project deleted', p.title, 'error'); navigate('/app/projects'); } };
  const weeks = Array.from({ length: 10 }, (_, i) => `W${i + 1}`);
  let acc = 0; const per = p.spent / 10;
  barChart($('#burn'), { labels: weeks, series: [{ name: 'Spend', data: weeks.map((_, i) => Math.round(per * (0.6 + ((i * 37) % 9) / 10))), color: 'var(--accent)' }], height: 220, fmt: (v) => money(v, 'USD', true) });
}
