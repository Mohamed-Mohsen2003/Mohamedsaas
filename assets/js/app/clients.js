import { icon } from '../lib/icons.js';
import { esc, avatar, money, fmtDate, $, $$, uid } from '../lib/util.js';
import { store, sel } from '../store.js';
import { scanReveal, confetti } from '../ui/fx.js';
import { modal, toast, confirmModal } from '../ui/overlay.js';
import { coverArt } from '../ui/cover.js';
import { lineChart } from '../ui/charts.js';
import { navigate, current } from '../router.js';
import { STATUS_META, INV_META } from './overview.js';

const ST = { Active: 'badge-success', Lead: 'badge-info', Paused: 'badge-warning', Churned: 'badge-danger' };
let sortKey = 'revenue', sortDir = -1, q = '', stFilter = 'All';

export function renderClients(view) {
  const s = store.get();
  view.innerHTML = `
  <div class="page-head route-enter"><div><h1>Clients</h1><p>${s.clients.length} companies across ${new Set(s.clients.map((c) => c.country)).size} countries</p></div>
    <div class="page-actions"><button class="btn btn-ghost" id="export-c">${icon('download')} Export CSV</button><button class="btn btn-primary" id="new-c" data-magnetic>${icon('plus')} Add client</button></div></div>
  <div class="grid g-4">${['Active', 'Lead', 'Paused', 'Churned'].map((st, i) => `<button class="card kpi card-hover spotlight st-card" data-st="${st}" data-reveal="up" style="--d:${i * 80}ms;text-align:left"><span class="badge ${ST[st]}">${st}</span><div class="k-val" data-count="${s.clients.filter((c) => c.status === st).length}">0</div><div class="k-label" style="margin-top:0">clients</div></button>`).join('')}</div>
  <div class="card" data-reveal="up">
    <div class="toolbar card-pad" style="padding-bottom:6px"><div class="input-icon">${icon('search')}<input class="input" id="c-q" placeholder="Search by name, contact or country…" value="${esc(q)}"/></div><span class="dim" id="c-count"></span></div>
    <div class="table-wrap"><table class="table"><thead><tr>${[['name', 'Company'], ['contact', 'Contact'], ['country', 'Country'], ['status', 'Status'], ['projects', 'Projects'], ['revenue', 'Revenue'], ['since', 'Client since']].map(([k, l]) => `<th class="sortable ${sortKey === k ? 'sorted ' + (sortDir < 0 ? 'desc' : '') : ''}" data-k="${k}">${l}<span class="sort-ind">▲</span></th>`).join('')}<th></th></tr></thead><tbody id="c-body"></tbody></table></div>
  </div>`;
  scanReveal(view);
  const draw = () => {
    const rows = s.clients.map((c) => ({ c, projects: s.projects.filter((p) => p.clientId === c.id).length, revenue: sel.clientRevenue(c.id) }))
      .filter(({ c }) => (stFilter === 'All' || c.status === stFilter) && (!q || (c.name + c.contact + c.country + c.industry).toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => { const va = sortKey in a ? a[sortKey] : a.c[sortKey], vb = sortKey in b ? b[sortKey] : b.c[sortKey]; return (va > vb ? 1 : va < vb ? -1 : 0) * sortDir; });
    $('#c-count').textContent = `${rows.length} results${stFilter !== 'All' ? ' · ' + stFilter : ''}`;
    $('#c-body').innerHTML = rows.map(({ c, projects, revenue }, i) => `<tr class="clickable" style="--i:${i}" data-href="/app/clients/${c.id}"><td><div class="row">${avatar(c.name, 38, 'sq')}<div><b>${esc(c.name)}</b><div class="dim" style="font-size:12px">${esc(c.industry)}</div></div></div></td><td><div class="row">${avatar(c.contact, 28)}${esc(c.contact)}</div></td><td>${esc(c.country)}</td><td><span class="badge ${ST[c.status]}">${c.status}</span></td><td class="mono">${projects}</td><td class="mono"><b>${money(revenue)}</b></td><td>${fmtDate(c.since)}</td><td>${icon('chevRight').replace('<svg', '<svg style="width:18px;color:var(--text-3)"')}</td></tr>`).join('') || `<tr><td colspan="8"><div class="empty">${icon('users')}No clients found</div></td></tr>`;
  };
  draw();
  $('#c-q').oninput = (e) => { q = e.target.value; draw(); };
  view.querySelectorAll('th.sortable').forEach((th) => (th.onclick = () => { const k = th.dataset.k; if (sortKey === k) sortDir *= -1; else { sortKey = k; sortDir = 1; } view.querySelectorAll('th.sortable').forEach((x) => x.classList.remove('sorted', 'desc')); th.classList.add('sorted'); if (sortDir < 0) th.classList.add('desc'); draw(); }));
  $$('.st-card', view).forEach((b) => (b.onclick = () => { stFilter = stFilter === b.dataset.st ? 'All' : b.dataset.st; $$('.st-card', view).forEach((x) => (x.style.borderColor = x.dataset.st === stFilter ? 'var(--accent)' : '')); draw(); }));
  $('#new-c').onclick = () => newClientModal(() => renderClients(view));
  $('#export-c').onclick = () => {
    const csv = ['Company,Contact,Email,Country,Status,Revenue', ...s.clients.map((c) => [c.name, c.contact, c.email, c.country, c.status, sel.clientRevenue(c.id)].map((v) => `"${v}"`).join(','))].join('\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'nexora-clients.csv'; a.click();
    toast('Export ready', 'nexora-clients.csv downloaded', 'success');
  };
  if (current().includes('new=1')) { history.replaceState(null, '', '#/app/clients'); newClientModal(() => renderClients(view)); }
}

function newClientModal(done) {
  modal({
    title: 'Add new client',
    body: `<div class="grid g-2" style="gap:14px"><div class="field"><label>Company</label><input class="input" name="name" placeholder="Acme Inc."/></div><div class="field"><label>Industry</label><input class="input" name="industry" placeholder="SaaS"/></div></div>
      <div class="grid g-2" style="gap:14px"><div class="field"><label>Contact name</label><input class="input" name="contact" placeholder="Jane Doe"/></div><div class="field"><label>Email</label><input class="input" name="email" type="email" placeholder="jane@acme.com"/></div></div>
      <div class="grid g-2" style="gap:14px"><div class="field"><label>Country</label><input class="input" name="country" placeholder="United States"/></div><div class="field"><label>Status</label><select class="select" name="status"><option>Lead</option><option>Active</option><option>Paused</option></select></div></div>`,
    foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="c-ok">${icon('plus')} Add client</button>`,
    onMount(m, close) {
      m.querySelector('#c-ok').onclick = () => {
        const v = (n) => m.querySelector(`[name=${n}]`).value.trim();
        if (!v('name') || !v('contact')) { m.querySelector('.modal-body').classList.add('shake'); setTimeout(() => m.querySelector('.modal-body').classList.remove('shake'), 500); toast('Missing info', 'Company and contact are required.', 'error'); return; }
        store.set((s) => s.clients.unshift({ id: uid('c'), name: v('name'), industry: v('industry') || 'General', country: v('country') || '—', contact: v('contact'), email: v('email') || '—', phone: '—', status: v('status'), since: new Date().toISOString(), rating: 5, website: '—', notes: '' }));
        close(); confetti(70); toast('Client added', v('name'), 'success'); done && done();
      };
    },
  });
}

export function renderClient(view, { id }) {
  const s = store.get(); const c = sel.client(id);
  if (!c) return navigate('/app/clients');
  const projects = s.projects.filter((p) => p.clientId === id);
  const invs = s.invoices.filter((i) => i.clientId === id);
  const rev = sel.clientRevenue(id);
  const months = Array.from({ length: 12 }, (_, k) => { const d = new Date(); d.setMonth(d.getMonth() - 11 + k); return d; });
  const series = months.map((d) => invs.filter((i) => i.status === 'paid' && new Date(i.paidAt).getMonth() === d.getMonth() && new Date(i.paidAt).getFullYear() === d.getFullYear()).reduce((a, i) => a + sel.invTotal(i), 0));
  view.innerHTML = `
  <div class="route-enter"><div class="crumbs"><a href="#/app/clients">Clients</a>/<span>${esc(c.name)}</span></div>
  <div class="card card-pad spotlight" style="display:flex;gap:22px;align-items:center;flex-wrap:wrap">
    ${avatar(c.name, 84, 'sq')}
    <div style="flex:1;min-width:240px"><div class="row wrap"><h1 style="font-size:34px" data-split>${esc(c.name)}</h1><span class="badge ${ST[c.status]}">${c.status}</span></div>
      <p class="muted" style="margin-top:6px">${esc(c.industry)} · ${esc(c.country)} · <span class="stars">★</span> ${c.rating}</p></div>
    <div class="page-actions"><a href="#/app/messages" class="btn btn-ghost">${icon('chat')} Message</a><a href="#/app/invoices?new=1&client=${c.id}" class="btn btn-primary">${icon('receipt')} Invoice</a><button class="btn btn-danger btn-icon" id="del-c">${icon('trash')}</button></div>
  </div></div>
  <div class="grid g-4">${[['Lifetime value', money(rev), '#7b61ff'], ['Projects', projects.length, '#ff3d9a'], ['Invoices', invs.length, '#ffb547'], ['Outstanding', money(invs.filter((i) => i.status === 'pending' || i.status === 'overdue').reduce((a, i) => a + sel.invTotal(i), 0)), '#ff5470']].map(([l, v, col], i) => `<div class="card kpi" data-reveal="up" style="--d:${i * 80}ms;--kc:${col}"><div class="k-label" style="margin-top:0">${l}</div><div class="k-val">${v}</div></div>`).join('')}</div>
  <div class="grid g-12">
    <div class="card card-pad" data-reveal="up"><div class="card-title"><h3>Contact</h3></div>
      <div class="row" style="margin-bottom:16px">${avatar(c.contact, 48, '', true)}<div><b>${esc(c.contact)}</b><div class="dim" style="font-size:13px">Primary contact</div></div></div>
      ${[['mail', c.email], ['phone', c.phone], ['globe', c.website], ['mapPin', c.country], ['calendar', 'Since ' + fmtDate(c.since)]].map(([ic, v], i) => `<div class="list-i" style="--i:${i}">${icon(ic).replace('<svg', '<svg style="width:18px;color:var(--text-3)"')}<span>${esc(v)}</span></div>`).join('')}
    </div>
    <div class="card card-pad" data-reveal="up" style="--d:100ms"><div class="card-title"><h3>Revenue from ${esc(c.name)}</h3></div><div id="c-rev"></div></div>
  </div>
  <div class="card card-pad" data-reveal="up"><div class="card-title"><h3>Projects</h3></div>
    <div class="port-grid">${projects.map((p, i) => `<a href="#/app/projects/${p.id}" class="port-card pop" style="--i:${i}"><div class="pc-cover">${coverArt(p)}</div><div class="pc-body"><div><b>${esc(p.title)}</b><small>${esc(p.type)}</small></div><span class="badge ${STATUS_META[p.status][2]}">${STATUS_META[p.status][0]}</span></div></a>`).join('') || `<div class="empty">${icon('folder')}No projects yet</div>`}</div>
  </div>
  <div class="card" data-reveal="up"><div class="card-pad" style="padding-bottom:0"><h3 style="font-size:16px;font-family:var(--font-body)">Invoices</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Number</th><th>Issued</th><th>Due</th><th>Status</th><th>Amount</th></tr></thead><tbody>${invs.map((i, k) => `<tr class="clickable" style="--i:${k}" data-href="/app/invoices/${i.id}"><td><b>${i.number}</b></td><td>${fmtDate(i.issue)}</td><td>${fmtDate(i.due)}</td><td><span class="badge ${INV_META[i.status]}" style="text-transform:capitalize">${i.status}</span></td><td class="mono"><b>${money(sel.invTotal(i))}</b></td></tr>`).join('') || '<tr><td colspan="5"><div class="empty">No invoices</div></td></tr>'}</tbody></table></div></div>`;
  scanReveal(view);
  lineChart($('#c-rev'), { labels: months.map((d) => d.toLocaleDateString('en-US', { month: 'short' })), series: [{ name: 'Paid', data: series, color: 'var(--accent)' }], height: 240, fmt: (v, cpt) => money(v, 'USD', cpt) });
  $('#del-c').onclick = async () => { if (await confirmModal('Remove client?', `${c.name}, its projects, invoices and messages will be removed.`, 'Remove', true)) { store.set((st) => { st.clients = st.clients.filter((x) => x.id !== id); st.projects = st.projects.filter((x) => x.clientId !== id); st.invoices = st.invoices.filter((x) => x.clientId !== id); st.threads = st.threads.filter((x) => x.clientId !== id); }); toast('Client removed', c.name, 'error'); navigate('/app/clients'); } };
}
