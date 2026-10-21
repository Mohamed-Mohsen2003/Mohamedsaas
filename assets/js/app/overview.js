import { icon } from '../lib/icons.js';
import { esc, avatar, money, ago, fmtDate, fmtTime, $, sleep } from '../lib/util.js';
import { store, sel } from '../store.js';
import { scanReveal, particles, reduced } from '../ui/fx.js';
import { lineChart, donut, sparkline, barChart } from '../ui/charts.js';
import { coverArt } from '../ui/cover.js';

export const STATUS_META = {
  backlog: ['Backlog', '#8b89a3', ''], in_progress: ['In progress', 'var(--accent)', 'badge-accent'], review: ['In review', '#ffb547', 'badge-warning'], done: ['Done', '#2ee59d', 'badge-success'],
};
export const INV_META = { paid: 'badge-success', pending: 'badge-warning', overdue: 'badge-danger', draft: '' };

export function skeleton(view) {
  view.innerHTML = `<div class="skel" style="height:44px;width:280px"></div><div class="grid g-4">${'<div class="skel" style="height:150px;border-radius:24px"></div>'.repeat(4)}</div><div class="grid g-21"><div class="skel" style="height:360px;border-radius:24px"></div><div class="skel" style="height:360px;border-radius:24px"></div></div>`;
}

export function kpiCard({ label, value, prefix = '', suffix = '', delta, icon: ic, color, spark, i = 0, dec = 0 }) {
  const up = delta >= 0;
  return `<div class="card kpi card-hover spotlight" data-reveal="up" style="--d:${i * 90}ms;--kc:${color}">
    <div class="k-top"><div class="k-ico" style="background:color-mix(in srgb, ${color} 16%, transparent);color:${color}">${icon(ic)}</div><span class="k-delta ${up ? 'up' : 'down'}">${icon(up ? 'trendUp' : 'trendDown')}${Math.abs(delta)}%</span></div>
    <div class="k-label">${esc(label)}</div>
    <div class="k-val" data-count="${value}" data-prefix="${prefix}" data-suffix="${suffix}" data-dec="${dec}">${prefix}0</div>
    ${spark ? sparkline(spark, color) : ''}
  </div>`;
}

export async function renderOverview(view) {
  skeleton(view);
  await sleep(reduced() ? 0 : 450);
  const s = store.get();
  const t = sel.totals();
  const months = sel.revenueByMonth(12);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const upcoming = s.events.filter((e) => new Date(e.at) > Date.now()).sort((a, b) => new Date(a.at) - new Date(b.at)).slice(0, 5);
  const active = s.projects.filter((p) => p.status === 'in_progress').slice(0, 5);
  const typeCounts = {}; s.projects.forEach((p) => (typeCounts[p.type] = (typeCounts[p.type] || 0) + 1));
  const COLORS = ['#7b61ff', '#ff3d9a', '#ffb547', '#00c8ff', '#2ee59d', '#ff6b5b', '#c86bff', '#8be000', '#5b8cff'];
  const types = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).map(([label, value], i) => ({ label, value, color: COLORS[i % COLORS.length] }));
  const topClients = s.clients.map((c) => ({ c, rev: sel.clientRevenue(c.id) })).sort((a, b) => b.rev - a.rev).slice(0, 5);
  const maxRev = topClients[0]?.rev || 1;
  const invStatus = ['paid', 'pending', 'overdue', 'draft'].map((st) => [st, s.invoices.filter((i) => i.status === st).length]);

  view.innerHTML = `
  <div class="welcome route-enter">
    <canvas id="welcome-canvas"></canvas>
    <div><h2 data-split>${greet}, ${esc(s.profile.name.split(' ')[0])} <span class="wave">👋</span></h2><p>You have <b>${active.length} active projects</b>, <b>${upcoming.length} upcoming events</b> and <b>${money(t.outstanding)}</b> waiting to be collected.</p></div>
    <div class="page-actions"><a href="#/app/invoices?new=1" class="btn btn-ghost">${icon('receipt')} New invoice</a><a href="#/app/projects?new=1" class="btn btn-primary" data-magnetic>${icon('plus')} New project</a></div>
  </div>

  <div class="grid g-4">
    ${kpiCard({ label: 'Total revenue (paid)', value: t.paid, prefix: '$', delta: 18.2, icon: 'dollar', color: '#7b61ff', spark: months.map((m) => m.paid + 1), i: 0 })}
    ${kpiCard({ label: 'Outstanding', value: t.outstanding, prefix: '$', delta: -4.1, icon: 'wallet', color: '#ffb547', spark: [8, 9, 7, 10, 8, 11, 9, 7, 8, 6, 7, 6], i: 1 })}
    ${kpiCard({ label: 'Active projects', value: t.active, delta: 12.5, icon: 'kanban', color: '#ff3d9a', spark: [10, 12, 11, 14, 16, 15, 18, 19, 21, 20, 23, t.active], i: 2 })}
    ${kpiCard({ label: 'Active clients', value: t.activeClients, delta: 8.3, icon: 'users', color: '#2ee59d', spark: [6, 7, 9, 8, 10, 11, 12, 13, 13, 15, 16, t.activeClients], i: 3 })}
  </div>

  <div class="grid g-21">
    <div class="card card-pad" data-reveal="up">
      <div class="card-title"><div><h3>Revenue overview</h3><small class="dim">Paid vs billed · last 12 months</small></div>
        <div class="seg" id="rev-seg"><span class="seg-ind"></span><button data-r="6">6M</button><button class="active" data-r="12">12M</button></div></div>
      <div id="rev-chart"></div>
    </div>
    <div class="card card-pad" data-reveal="up" style="--d:120ms">
      <div class="card-title"><h3>Work by type</h3><a href="#/app/projects" class="btn btn-ghost btn-sm">View all</a></div>
      <div id="type-donut"></div>
      <div class="legend" style="margin-top:18px">${types.slice(0, 5).map((t) => `<div class="legend-i"><i style="background:${t.color}"></i>${esc(t.label)}<b>${t.value}</b></div>`).join('')}</div>
    </div>
  </div>

  <div class="grid g-21">
    <div class="card card-pad" data-reveal="up">
      <div class="card-title"><h3>Active projects</h3><a href="#/app/projects" class="btn btn-ghost btn-sm">Board ${icon('arrowRight')}</a></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Project</th><th>Client</th><th>Team</th><th>Due</th><th style="width:160px">Progress</th></tr></thead><tbody>
        ${active.map((p, i) => { const c = sel.client(p.clientId); return `<tr class="clickable" style="--i:${i}" data-href="/app/projects/${p.id}"><td><div class="row"><div style="width:42px;height:42px;border-radius:12px;overflow:hidden;position:relative;flex:none">${coverArt(p, { tag: false })}</div><div><b>${esc(p.title)}</b><div class="dim" style="font-size:12px">${esc(p.type)}</div></div></div></td><td>${esc(c.name)}</td><td><div class="avatar-stack">${p.members.map((m) => avatar(sel.member(m).name, 28)).join('')}</div></td><td>${fmtDate(p.due, { month: 'short', day: 'numeric' })}</td><td><div class="row" style="gap:10px"><div class="progress" style="flex:1"><span data-w="${p.progress}%"></span></div><b class="mono" style="font-size:12px">${p.progress}%</b></div></td></tr>`; }).join('')}
      </tbody></table></div>
    </div>
    <div class="card card-pad" data-reveal="up" style="--d:120ms">
      <div class="card-title"><h3>Live activity</h3><span class="badge badge-success">Live</span></div>
      <div class="timeline">${s.activity.map((a, i) => `<div class="tl-i" style="--i:${i};--tc:${a.color}"><b>${esc(a.who)}</b> <span class="muted" style="font-size:14px">${esc(a.what)}</span> <b>${esc(a.target)}</b><br/><small>${ago(a.at)}</small></div>`).join('')}</div>
    </div>
  </div>

  <div class="grid g-3">
    <div class="card card-pad" data-reveal="up">
      <div class="card-title"><h3>Top clients</h3><a href="#/app/clients" class="btn btn-ghost btn-sm">All</a></div>
      ${topClients.map(({ c, rev }, i) => `<a href="#/app/clients/${c.id}" class="list-i" style="--i:${i}">${avatar(c.name, 40, 'sq')}<div class="grow"><b>${esc(c.name)}</b><div class="progress" style="margin-top:6px"><span data-w="${(rev / maxRev) * 100}%"></span></div></div><b class="mono" style="font-size:13px">${money(rev, 'USD', true)}</b></a>`).join('')}
    </div>
    <div class="card card-pad" data-reveal="up" style="--d:100ms">
      <div class="card-title"><h3>Upcoming</h3><a href="#/app/calendar" class="btn btn-ghost btn-sm">Calendar</a></div>
      ${upcoming.map((e, i) => `<div class="list-i" style="--i:${i}"><div style="width:46px;text-align:center;flex:none;padding:6px 0;border-radius:12px;background:color-mix(in srgb, ${e.color} 14%, transparent)"><b style="color:${e.color};font-size:16px">${new Date(e.at).getDate()}</b><small style="display:block;font-size:10px;text-transform:uppercase">${fmtDate(e.at, { month: 'short' })}</small></div><div class="grow"><b>${esc(e.title)}</b><small>${fmtTime(e.at)} · ${e.duration} min</small></div></div>`).join('')}
    </div>
    <div class="card card-pad" data-reveal="up" style="--d:200ms">
      <div class="card-title"><h3>Invoices status</h3><a href="#/app/invoices" class="btn btn-ghost btn-sm">All</a></div>
      <div id="inv-bars"></div>
      <div class="legend" style="margin-top:12px">${invStatus.map(([st, n]) => `<div class="legend-i"><span class="badge ${INV_META[st]}" style="text-transform:capitalize">${st}</span><b>${n}</b></div>`).join('')}</div>
    </div>
  </div>`;

  scanReveal(view);
  if (!reduced()) particles($('#welcome-canvas'), { count: 40, link: 100, mouse: false });
  const drawRev = (n) => { const m = months.slice(-n); lineChart($('#rev-chart'), { labels: m.map((x) => x.label), series: [{ name: 'Paid', data: m.map((x) => x.paid), color: 'var(--accent)' }, { name: 'Billed', data: m.map((x) => x.billed), color: 'var(--accent-2)' }], height: 290, fmt: (v, c) => money(v, 'USD', c) }); };
  drawRev(12);
  const seg = $('#rev-seg'), ind = seg.querySelector('.seg-ind');
  const place = () => { const a = seg.querySelector('.active'); ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft - 4}px)`; };
  requestAnimationFrame(place);
  seg.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; seg.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b)); place(); drawRev(+b.dataset.r); };
  donut($('#type-donut'), { data: types, size: 200, thick: 22, center: s.projects.length, sub: 'projects' });
  barChart($('#inv-bars'), { labels: months.slice(-6).map((m) => m.label), series: [{ name: 'Paid', data: months.slice(-6).map((m) => m.paid), color: '#2ee59d' }, { name: 'Billed', data: months.slice(-6).map((m) => Math.max(0, m.billed - m.paid)), color: '#ffb547' }], stacked: true, height: 170, fmt: (v, c) => money(v, 'USD', true) });
}
