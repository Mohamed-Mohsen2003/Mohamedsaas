import { icon } from '../lib/icons.js';
import { esc, avatar, money, num, fmtDate, fmtTime, ago, $, $$, uid } from '../lib/util.js';
import { store, sel } from '../store.js';
import { scanReveal, confetti, onCleanup } from '../ui/fx.js';
import { modal, toast, confirmModal } from '../ui/overlay.js';
import { lineChart, barChart, donut, hbars } from '../ui/charts.js';
import { navigate, current } from '../router.js';
import { applySettings } from '../theme.js';
import { kpiCard } from './overview.js';
import { refreshBadges } from './shell.js';

/* ================= Messages ================= */
let activeThread = null;
const REPLIES = ['Perfect, thank you! 🙌', 'Got it — I’ll share with the team.', 'Amazing work as always!', 'Can we hop on a quick call tomorrow?', 'Looks great, approved ✅', 'Love it. Let’s ship it 🚀'];
export function renderMessages(view) {
  const s = store.get();
  if (!activeThread && s.threads[0] && innerWidth > 860) activeThread = s.threads[0].id;
  view.innerHTML = `<div class="page-head route-enter"><div><h1>Messages</h1><p>Talk to clients without leaving your workspace</p></div></div>
  <div class="card chat ${activeThread ? 'has-active' : ''}" id="chat" data-reveal="up">
    <div class="chat-list"><div class="cl-head"><div class="input-icon">${icon('search')}<input class="input" id="th-q" placeholder="Search conversations…"/></div></div><div class="chat-threads" id="threads"></div></div>
    <div class="chat-main" id="chat-main"></div>
  </div>`;
  scanReveal(view);
  const drawThreads = (f = '') => {
    $('#threads').innerHTML = store.get().threads.filter((t) => sel.client(t.clientId)?.name.toLowerCase().includes(f.toLowerCase())).map((t, i) => { const c = sel.client(t.clientId); const last = t.messages.at(-1); return `<div class="thread ${t.id === activeThread ? 'active' : ''}" data-id="${t.id}" style="--i:${i}">${avatar(c.contact, 44, '', i % 3 === 0)}<div class="grow"><div class="row between"><b>${esc(c.contact)}</b><small class="dim">${ago(last.at)}</small></div><p>${last.me ? 'You: ' : ''}${esc(last.text)}</p></div>${t.unread ? `<span class="unread">${t.unread}</span>` : ''}</div>`; }).join('');
  };
  const drawChat = () => {
    const main = $('#chat-main');
    const t = store.get().threads.find((x) => x.id === activeThread);
    $('#chat').classList.toggle('has-active', !!t);
    if (!t) { main.innerHTML = `<div class="empty" style="margin:auto">${icon('chat')}<b>Select a conversation</b></div>`; return; }
    const c = sel.client(t.clientId);
    let lastDay = '';
    main.innerHTML = `<div class="chat-head"><button class="icon-btn mobile-only" id="back-th">${icon('arrowLeft')}</button>${avatar(c.contact, 42, '', true)}<div class="grow" style="flex:1"><b>${esc(c.contact)}</b><div class="dim" style="font-size:12px">${esc(c.name)} · <span style="color:var(--success)">Online</span></div></div><button class="icon-btn" id="call">${icon('phone')}</button><button class="icon-btn" id="vid">${icon('video')}</button><a class="icon-btn" href="#/app/clients/${c.id}">${icon('user')}</a></div>
      <div class="chat-msgs" id="msgs">${t.messages.map((m) => { const d = fmtDate(m.at, { weekday: 'long', month: 'short', day: 'numeric' }); const sep = d !== lastDay ? `<div class="day-sep">${d}</div>` : ''; lastDay = d; return sep + `<div class="msg ${m.me ? 'me' : ''}">${esc(m.text)}<small>${fmtTime(m.at)}</small></div>`; }).join('')}</div>
      <form class="chat-input" id="chat-form"><button type="button" class="icon-btn">${icon('paperclip')}</button><input class="input" id="chat-in" placeholder="Write a message…" autocomplete="off"/><button class="btn btn-primary btn-icon" type="submit">${icon('send')}</button></form>`;
    const box = $('#msgs'); box.scrollTop = box.scrollHeight;
    $('#back-th').onclick = () => { activeThread = null; drawThreads(); drawChat(); };
    $('#call').onclick = () => toast('Calling ' + c.contact + '…', 'Demo call — no real dial 📞', 'info');
    $('#vid').onclick = () => toast('Starting video call…', 'Demo only 🎥', 'info');
    $('#chat-form').onsubmit = (e) => {
      e.preventDefault(); const inp = $('#chat-in'); const text = inp.value.trim(); if (!text) return; inp.value = '';
      store.set((st) => st.threads.find((x) => x.id === t.id).messages.push({ id: uid('m'), me: true, text, at: new Date().toISOString() }));
      box.insertAdjacentHTML('beforeend', `<div class="msg me">${esc(text)}<small>${fmtTime(new Date())}</small></div>`); box.scrollTop = box.scrollHeight; drawThreads();
      const typing = document.createElement('div'); typing.className = 'typing'; typing.innerHTML = '<i></i><i></i><i></i>';
      const t1 = setTimeout(() => { box.appendChild(typing); box.scrollTop = box.scrollHeight; }, 700);
      const t2 = setTimeout(() => {
        typing.remove(); const reply = REPLIES[Math.floor(Math.random() * REPLIES.length)];
        store.set((st) => st.threads.find((x) => x.id === t.id).messages.push({ id: uid('m'), me: false, text: reply, at: new Date().toISOString() }));
        if (document.body.contains(box)) { box.insertAdjacentHTML('beforeend', `<div class="msg">${esc(reply)}<small>${fmtTime(new Date())}</small></div>`); box.scrollTop = box.scrollHeight; drawThreads(); }
      }, 2300);
      onCleanup(() => { clearTimeout(t1); clearTimeout(t2); });
    };
    setTimeout(() => $('#chat-in')?.focus(), 50);
  };
  drawThreads(); drawChat();
  $('#threads').onclick = (e) => { const th = e.target.closest('.thread'); if (!th) return; activeThread = th.dataset.id; store.set((st) => (st.threads.find((x) => x.id === activeThread).unread = 0)); refreshBadges(); drawThreads($('#th-q').value); drawChat(); };
  $('#th-q').oninput = (e) => drawThreads(e.target.value);
}

/* ================= Calendar ================= */
let calOffset = 0;
export function renderCalendar(view) {
  const s = store.get();
  const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + calOffset);
  const y = base.getFullYear(), mo = base.getMonth();
  const start = new Date(y, mo, 1 - ((new Date(y, mo, 1).getDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  const today = new Date().toDateString();
  const evOn = (d) => s.events.filter((e) => new Date(e.at).toDateString() === d.toDateString()).sort((a, b) => new Date(a.at) - new Date(b.at));
  const monthEvents = s.events.filter((e) => { const d = new Date(e.at); return d.getMonth() === mo && d.getFullYear() === y; }).sort((a, b) => new Date(a.at) - new Date(b.at));
  view.innerHTML = `
  <div class="page-head route-enter"><div><h1>${base.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h1><p>${monthEvents.length} events this month</p></div>
    <div class="page-actions"><button class="btn btn-ghost btn-icon" id="prev-m">${icon('chevLeft')}</button><button class="btn btn-ghost" id="today-m">Today</button><button class="btn btn-ghost btn-icon" id="next-m">${icon('chevRight')}</button><button class="btn btn-primary" id="new-ev" data-magnetic>${icon('plus')} New event</button></div></div>
  <div class="grid g-21" style="align-items:start">
    <div class="card" style="overflow:hidden" data-reveal="up"><div class="cal">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => `<div class="cal-dow">${d}</div>`).join('')}
      ${days.map((d, i) => `<div class="cal-day ${d.getMonth() !== mo ? 'other' : ''} ${d.toDateString() === today ? 'today' : ''}" data-date="${d.toISOString()}" style="--i:${i}"><span class="dn">${d.getDate()}</span>${evOn(d).slice(0, 3).map((e) => `<div class="ev" style="--ec:${e.color}" title="${esc(e.title)}">${fmtTime(e.at)} ${esc(e.title)}</div>`).join('')}${evOn(d).length > 3 ? `<small class="dim">+${evOn(d).length - 3} more</small>` : ''}</div>`).join('')}</div></div>
    <div class="card card-pad" data-reveal="up" style="--d:100ms"><div class="card-title"><h3>Agenda</h3></div>
      ${monthEvents.slice(0, 12).map((e, i) => `<div class="list-i" style="--i:${i}"><i style="width:4px;align-self:stretch;border-radius:4px;background:${e.color};flex:none"></i><div class="grow"><b>${esc(e.title)}</b><small>${fmtDate(e.at, { weekday: 'short', month: 'short', day: 'numeric' })} · ${fmtTime(e.at)}</small></div></div>`).join('') || `<div class="empty">${icon('calendar')}Nothing scheduled</div>`}
    </div>
  </div>`;
  scanReveal(view);
  $('#prev-m').onclick = () => { calOffset--; renderCalendar(view); };
  $('#next-m').onclick = () => { calOffset++; renderCalendar(view); };
  $('#today-m').onclick = () => { calOffset = 0; renderCalendar(view); };
  const newEv = (date) => modal({
    title: 'New event', body: `<div class="field"><label>Title</label><input class="input" id="ev-t" placeholder="Design review · Northwind"/></div><div class="grid g-2" style="gap:14px"><div class="field"><label>Date</label><input class="input" type="date" id="ev-d" value="${(date || new Date()).toISOString().slice(0, 10)}"/></div><div class="field"><label>Time</label><input class="input" type="time" id="ev-h" value="11:00"/></div></div><div class="field"><label>Type</label><select class="select" id="ev-c"><option value="#7b61ff">Client call</option><option value="#ff3d9a">Design review</option><option value="#00c8ff">Sprint planning</option><option value="#2ee59d">Launch</option><option value="#ff5470">Deadline</option></select></div>`,
    foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="ev-ok">Add event</button>`,
    onMount(m, close) { m.querySelector('#ev-ok').onclick = () => { const t = m.querySelector('#ev-t').value.trim(); if (!t) return; const at = new Date(m.querySelector('#ev-d').value + 'T' + m.querySelector('#ev-h').value); const sel2 = m.querySelector('#ev-c'); store.set((st) => st.events.push({ id: uid('e'), title: t, type: sel2.options[sel2.selectedIndex].text, color: sel2.value, at: at.toISOString(), duration: 60 })); close(); toast('Event scheduled 📅', t, 'success'); renderCalendar(view); }; },
  });
  $('#new-ev').onclick = () => newEv();
  view.querySelector('.cal').onclick = (e) => { const d = e.target.closest('.cal-day'); d && newEv(new Date(d.dataset.date)); };
  if (current().includes('new=1')) { history.replaceState(null, '', '#/app/calendar'); newEv(); }
}

/* ================= Analytics ================= */
export function renderAnalytics(view) {
  const s = store.get(); const a = s.analytics;
  const last30 = a.traffic.slice(-30); const prev30 = a.traffic.slice(-60, -30);
  const sum = (arr, k) => arr.reduce((x, d) => x + d[k], 0);
  const v1 = sum(last30, 'visitors'), v0 = sum(prev30, 'visitors'), l1 = sum(last30, 'leads'), l0 = sum(prev30, 'leads');
  const COL = ['#7b61ff', '#ff3d9a', '#ffb547', '#00c8ff', '#2ee59d', '#ff6b5b', '#c86bff'];
  view.innerHTML = `
  <div class="page-head route-enter"><div><h1>Analytics</h1><p>Portfolio traffic, leads and conversion — last 90 days</p></div><div class="page-actions"><button class="btn btn-ghost" id="exp-a">${icon('download')} Export report</button></div></div>
  <div class="grid g-4">
    ${kpiCard({ label: 'Visitors (30d)', value: v1, delta: +(((v1 - v0) / v0) * 100).toFixed(1), icon: 'eye', color: '#7b61ff', spark: last30.map((d) => d.visitors), i: 0 })}
    ${kpiCard({ label: 'Leads (30d)', value: l1, delta: +(((l1 - l0) / l0) * 100).toFixed(1), icon: 'target', color: '#ff3d9a', spark: last30.map((d) => d.leads), i: 1 })}
    ${kpiCard({ label: 'Conversion rate', value: +((l1 / v1) * 100).toFixed(2), suffix: '%', dec: 2, delta: 3.4, icon: 'zap', color: '#ffb547', spark: last30.map((d) => d.leads / d.visitors), i: 2 })}
    ${kpiCard({ label: 'Avg. session', value: 3.42, suffix: 'm', dec: 2, delta: 9.1, icon: 'clock', color: '#2ee59d', spark: [3, 3.1, 3.3, 3.2, 3.5, 3.4, 3.6, 3.42], i: 3 })}
  </div>
  <div class="card card-pad" data-reveal="up"><div class="card-title"><div><h3>Traffic & leads</h3><small class="dim">Daily visitors · 90 days</small></div><div class="legend" style="display:flex;gap:16px"><div class="legend-i"><i style="background:var(--accent)"></i>Visitors</div><div class="legend-i"><i style="background:var(--accent-2)"></i>Leads ×40</div></div></div><div id="traffic"></div></div>
  <div class="grid g-3">
    <div class="card card-pad" data-reveal="up"><div class="card-title"><h3>Traffic sources</h3></div><div id="src"></div><div class="legend" style="margin-top:16px">${a.sources.map(([l, v], i) => `<div class="legend-i"><i style="background:${COL[i]}"></i>${l}<b>${v}%</b></div>`).join('')}</div></div>
    <div class="card card-pad" data-reveal="up" style="--d:100ms"><div class="card-title"><h3>Top countries</h3></div><div id="countries"></div></div>
    <div class="card card-pad" data-reveal="up" style="--d:200ms"><div class="card-title"><h3>Devices</h3></div><div id="dev"></div><div class="grid g-3" style="gap:8px;margin-top:16px;text-align:center">${a.devices.map(([l, v], i) => `<div><b class="mono" style="font-size:20px;color:${COL[i]}">${v}%</b><div class="dim" style="font-size:12px">${l}</div></div>`).join('')}</div></div>
  </div>
  <div class="grid g-21">
    <div class="card" data-reveal="up"><div class="card-pad" style="padding-bottom:0"><h3 style="font-size:16px;font-family:var(--font-body)">Top pages</h3></div><div class="table-wrap"><table class="table"><thead><tr><th>Page</th><th>Views</th><th>Conv.</th><th style="width:200px">Share</th></tr></thead><tbody>${a.pages.map(([p, v, c], i) => `<tr style="--i:${i}"><td class="mono">${p}</td><td class="mono">${num(v)}</td><td><span class="badge badge-success no-dot">${c}%</span></td><td><div class="progress"><span data-w="${(v / a.pages[0][1]) * 100}%"></span></div></td></tr>`).join('')}</tbody></table></div></div>
    <div class="card card-pad" data-reveal="up" style="--d:100ms"><div class="card-title"><h3>Activity heatmap</h3><small class="dim">26 weeks</small></div><div class="heat">${Array.from({ length: 182 }, (_, i) => `<i style="--i:${i};--o:${(.08 + Math.abs(Math.sin(i * 1.7) * Math.cos(i * .31)) * .92).toFixed(2)}"></i>`).join('')}</div><div class="row between" style="margin-top:12px;font-size:12px" ><span class="dim">Less</span><div class="row" style="gap:4px">${[.1, .3, .5, .7, .95].map((o) => `<i style="width:12px;height:12px;border-radius:3px;background:rgba(var(--accent-rgb),${o})"></i>`).join('')}</div><span class="dim">More</span></div></div>
  </div>`;
  scanReveal(view);
  lineChart($('#traffic'), { labels: a.traffic.map((d) => fmtDate(d.d, { month: 'short', day: 'numeric' })), series: [{ name: 'Visitors', data: a.traffic.map((d) => d.visitors), color: 'var(--accent)' }, { name: 'Leads ×40', data: a.traffic.map((d) => d.leads * 40), color: 'var(--accent-2)' }], height: 300, fmt: (v, c) => num(Math.round(v), c) });
  donut($('#src'), { data: a.sources.map(([label, value], i) => ({ label, value, color: COL[i] })), size: 190, thick: 20, center: num(v1, true), sub: 'visitors' });
  hbars($('#countries'), a.countries, COL);
  donut($('#dev'), { data: a.devices.map(([label, value], i) => ({ label, value, color: COL[i] })), size: 170, thick: 26, center: '58%', sub: 'desktop' });
  scanReveal(view);
  $('#exp-a').onclick = () => toast('Report generating…', 'You’ll get a PDF in your inbox shortly 📊', 'info');
}

/* ================= Team ================= */
export function renderTeam(view) {
  const s = store.get();
  view.innerHTML = `
  <div class="page-head route-enter"><div><h1>Team</h1><p>${s.team.length} members · ${s.team.filter((m) => m.online).length} online now</p></div><div class="page-actions"><button class="btn btn-primary" id="invite" data-magnetic>${icon('plus')} Invite member</button></div></div>
  <div class="grid g-4">${s.team.map((m, i) => `<div class="card member card-hover spotlight" data-reveal="up" style="--d:${i * 70}ms">
    <div class="ring-wrap" style="--p:${m.utilization}">${avatar(m.name, 76, '', m.online)}</div>
    <div><b style="font-size:16px">${esc(m.name)}</b><div class="dim" style="font-size:13px">${esc(m.role)}</div></div>
    <div class="skills">${m.skills.map((k) => `<span class="badge no-dot">${esc(k)}</span>`).join('')}</div>
    <div class="row" style="gap:18px;font-size:13px"><span><b class="mono">${m.utilization}%</b> <span class="dim">load</span></span><span><b class="mono">${m.projects}</b> <span class="dim">projects</span></span></div>
    <div class="row" style="gap:6px"><a class="icon-btn" href="#/app/messages" title="Message">${icon('chat')}</a><button class="icon-btn" data-mail="${esc(m.email)}" title="Email">${icon('mail')}</button><span class="dim row" style="gap:4px;font-size:12px">${icon('mapPin').replace('<svg', '<svg style="width:14px"')}${esc(m.city)}</span></div>
  </div>`).join('')}</div>
  <div class="card card-pad" data-reveal="up"><div class="card-title"><h3>Utilization this week</h3></div><div id="util"></div></div>`;
  scanReveal(view);
  barChart($('#util'), { labels: s.team.map((m) => m.name.split(' ')[0]), series: [{ name: 'Utilization', data: s.team.map((m) => m.utilization), color: 'var(--accent)' }], height: 240, fmt: (v) => Math.round(v) + '%' });
  view.querySelectorAll('[data-mail]').forEach((b) => (b.onclick = () => { navigator.clipboard?.writeText(b.dataset.mail).catch(() => {}); toast('Email copied', b.dataset.mail, 'success', 2000); }));
  $('#invite').onclick = () => modal({ title: 'Invite a teammate', body: `<div class="field"><label>Email</label><input class="input" id="inv-e" type="email" placeholder="name@company.com"/></div><div class="field"><label>Role</label><select class="select"><option>Designer</option><option>Developer</option><option>Project manager</option><option>Viewer</option></select></div>`, foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary" id="inv-ok">${icon('send')} Send invite</button>`, onMount(m, close) { m.querySelector('#inv-ok').onclick = () => { const e = m.querySelector('#inv-e').value.trim(); if (!/^\S+@\S+\.\S+$/.test(e)) { toast('Invalid email', '', 'error'); return; } close(); confetti(60); toast('Invite sent ✉️', e, 'success'); }; } });
}

/* ================= Settings ================= */
let setTab = 'appearance';
export function renderSettings(view) {
  const s = store.get(); const st = s.settings;
  const sw = (key, on) => `<button class="switch ${on ? 'on' : ''}" data-sw="${key}" aria-pressed="${on}"></button>`;
  const tabs = [['appearance', 'palette', 'Appearance'], ['profile', 'user', 'Profile'], ['notifications', 'bell', 'Notifications'], ['security', 'shield', 'Security'], ['data', 'box', 'Data']];
  const panes = {
    appearance: `<div class="set-row"><div><b>Theme</b><small>Choose how Nexora looks to you</small></div><div class="theme-cards">${[['dark', '#07070d', '#161625'], ['light', '#f6f5fb', '#ffffff']].map(([t, a, b]) => `<button class="theme-card ${st.theme === t ? 'active' : ''}" data-theme-set="${t}"><div class="tc-prev" style="background:${a}"><i style="background:${b}"></i><i style="background:${b}"></i></div><span style="text-transform:capitalize">${t}</span></button>`).join('')}</div></div>
      <div class="set-row"><div><b>Accent palette</b><small>Recolors the whole workspace instantly</small></div><div class="swatches">${[['violet', '#7b61ff,#ff3d9a'], ['cyan', '#00c8ff,#7b61ff'], ['magenta', '#ff3d9a,#ffb547'], ['lime', '#8be000,#00c8ff'], ['sunset', '#ff6b5b,#ffb547']].map(([k, g]) => `<button class="swatch ${st.accent === k ? 'active' : ''}" data-accent="${k}" style="background:linear-gradient(135deg,${g})" title="${k}"></button>`).join('')}</div></div>
      <div class="set-row"><div><b>Custom cursor</b><small>Magnetic trailing cursor on desktop</small></div>${sw('cursor', st.cursor)}</div>
      <div class="set-row"><div><b>Reduce motion</b><small>Tone down animations across the app</small></div>${sw('reduceMotion', st.reduceMotion)}</div>
      <div class="set-row"><div><b>Collapsed sidebar</b><small>More room for your work</small></div>${sw('collapsed', st.collapsed)}</div>`,
    profile: `<div class="row" style="gap:18px;margin-bottom:20px">${avatar(s.profile.name, 72)}<div><b style="font-size:18px">${esc(s.profile.name)}</b><div class="dim">${esc(s.profile.role)}</div></div></div>
      <form id="prof-form" style="display:grid;gap:14px"><div class="grid g-2" style="gap:14px"><div class="field"><label>Full name</label><input class="input" name="name" value="${esc(s.profile.name)}"/></div><div class="field"><label>Email</label><input class="input" name="email" value="${esc(s.profile.email)}"/></div></div>
      <div class="grid g-2" style="gap:14px"><div class="field"><label>Role</label><input class="input" name="role" value="${esc(s.profile.role)}"/></div><div class="field"><label>Location</label><input class="input" name="location" value="${esc(s.profile.location)}"/></div></div>
      <div class="field"><label>Bio</label><textarea class="textarea" name="bio">${esc(s.profile.bio)}</textarea></div><button class="btn btn-primary" style="justify-self:start">${icon('check')} Save changes</button></form>`,
    notifications: `<div class="set-row"><div><b>Email notifications</b><small>Payments, comments and deadlines</small></div>${sw('emailNotif', st.emailNotif)}</div><div class="set-row"><div><b>Push notifications</b><small>Real-time alerts on this device</small></div>${sw('pushNotif', st.pushNotif)}</div><div class="set-row"><div><b>Weekly digest</b><small>A Monday summary of your studio</small></div>${sw('weekly', st.weekly)}</div>`,
    security: `<div class="set-row"><div><b>Two-factor authentication</b><small>Protect your account with an authenticator app</small></div>${sw('twofa', st.twofa)}</div><div class="set-row"><div><b>Password</b><small>Last changed 3 months ago</small></div><button class="btn btn-ghost btn-sm" id="chg-pw">Change</button></div><div class="set-row"><div><b>Active sessions</b><small>Chrome on macOS · Cairo — this device</small></div><button class="btn btn-ghost btn-sm" id="sess">Sign out others</button></div>`,
    data: `<div class="set-row"><div><b>Export workspace</b><small>Download everything as JSON</small></div><button class="btn btn-ghost btn-sm" id="exp-json">${icon('download')} Export</button></div><div class="set-row"><div><b>Reset demo data</b><small>Restore all projects, clients and invoices to defaults</small></div><button class="btn btn-danger btn-sm" id="reset">${icon('refresh')} Reset</button></div>`,
  };
  view.innerHTML = `<div class="page-head route-enter"><div><h1>Settings</h1><p>Make Nexora feel like yours</p></div></div>
  <div class="grid" style="grid-template-columns:minmax(0,220px) minmax(0,1fr);align-items:start" id="set-grid">
    <div class="settings-nav card card-pad" style="padding:10px" data-reveal="left">${tabs.map(([k, ic, l]) => `<button data-tab="${k}" class="${k === setTab ? 'active' : ''}">${icon(ic)}${l}</button>`).join('')}</div>
    <div class="card card-pad route-enter" id="set-pane" data-reveal="up">${panes[setTab]}</div>
  </div>`;
  if (innerWidth < 760) $('#set-grid').style.gridTemplateColumns = '1fr';
  scanReveal(view);
  view.querySelector('.settings-nav').onclick = (e) => { const b = e.target.closest('[data-tab]'); if (b) { setTab = b.dataset.tab; renderSettings(view); } };
  const pane = $('#set-pane');
  pane.addEventListener('click', async (e) => {
    const sw2 = e.target.closest('[data-sw]');
    if (sw2) { const k = sw2.dataset.sw; store.set((x) => (x.settings[k] = !x.settings[k])); sw2.classList.toggle('on'); applySettings(); if (k === 'collapsed') document.getElementById('shell')?.classList.toggle('collapsed', store.get().settings.collapsed); toast('Preference saved', '', 'success', 1600); return; }
    const th = e.target.closest('[data-theme-set]'); if (th) { store.set((x) => (x.settings.theme = th.dataset.themeSet)); applySettings(); renderSettings(view); return; }
    const ac = e.target.closest('[data-accent]'); if (ac) { store.set((x) => (x.settings.accent = ac.dataset.accent)); applySettings(); pane.querySelectorAll('.swatch').forEach((q) => q.classList.toggle('active', q === ac)); toast('Palette applied 🎨', ac.dataset.accent, 'success', 1800); return; }
    if (e.target.closest('#reset')) { if (await confirmModal('Reset demo data?', 'All changes you made will be replaced with the original demo data.', 'Reset', true)) { store.reset(); applySettings(); toast('Demo data restored', '', 'success'); navigate('/app'); } }
    if (e.target.closest('#exp-json')) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(store.get(), null, 2)], { type: 'application/json' })); a.download = 'nexora-workspace.json'; a.click(); toast('Export ready', 'nexora-workspace.json', 'success'); }
    if (e.target.closest('#chg-pw')) toast('Password reset email sent', s.profile.email, 'info');
    if (e.target.closest('#sess')) toast('Other sessions signed out', '', 'success');
  });
  const pf = $('#prof-form');
  pf && (pf.onsubmit = (e) => { e.preventDefault(); const fd = new FormData(pf); store.set((x) => Object.assign(x.profile, Object.fromEntries(fd))); toast('Profile updated', '', 'success'); dispatchEvent(new Event('nexora:remount')); });
}
