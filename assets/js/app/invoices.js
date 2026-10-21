import { icon, LOGO_SVG } from '../lib/icons.js';
import { esc, avatar, money, fmtDate, $, uid } from '../lib/util.js';
import { store, sel } from '../store.js';
import { scanReveal, confetti } from '../ui/fx.js';
import { modal, toast, confirmModal } from '../ui/overlay.js';
import { navigate, current } from '../router.js';
import { INV_META, kpiCard } from './overview.js';

let tab = 'all', q = '';

export function renderInvoices(view) {
  const s = store.get();
  const sum = (st) => s.invoices.filter((i) => st === 'all' || i.status === st).reduce((a, i) => a + sel.invTotal(i), 0);
  const count = (st) => s.invoices.filter((i) => st === 'all' || i.status === st).length;
  view.innerHTML = `
  <div class="page-head route-enter"><div><h1>Invoices</h1><p>${s.invoices.length} invoices · ${money(sum('paid'))} collected</p></div>
    <div class="page-actions"><button class="btn btn-primary" id="new-inv" data-magnetic>${icon('plus')} New invoice</button></div></div>
  <div class="grid g-4">
    ${kpiCard({ label: 'Collected', value: sum('paid'), prefix: '$', delta: 22.4, icon: 'checkCircle', color: '#2ee59d', i: 0 })}
    ${kpiCard({ label: 'Pending', value: sum('pending'), prefix: '$', delta: 6.1, icon: 'clock', color: '#ffb547', i: 1 })}
    ${kpiCard({ label: 'Overdue', value: sum('overdue'), prefix: '$', delta: -12.8, icon: 'flag', color: '#ff5470', i: 2 })}
    ${kpiCard({ label: 'Drafts', value: count('draft'), delta: 3, icon: 'file', color: '#7b61ff', i: 3 })}
  </div>
  <div class="card" data-reveal="up">
    <div class="toolbar card-pad" style="padding-bottom:6px">
      <div class="seg" id="inv-seg"><span class="seg-ind"></span>${['all', 'paid', 'pending', 'overdue', 'draft'].map((t) => `<button data-t="${t}" class="${t === tab ? 'active' : ''}" style="text-transform:capitalize">${t} <span class="dim">${count(t)}</span></button>`).join('')}</div>
      <div class="input-icon" style="margin-left:auto">${icon('search')}<input class="input" id="inv-q" placeholder="Search invoices…" value="${esc(q)}"/></div>
    </div>
    <div class="table-wrap"><table class="table"><thead><tr><th>Invoice</th><th>Client</th><th>Project</th><th>Issued</th><th>Due</th><th>Status</th><th style="text-align:right">Amount</th></tr></thead><tbody id="inv-body"></tbody></table></div>
  </div>`;
  scanReveal(view);
  const seg = $('#inv-seg'), ind = seg.querySelector('.seg-ind');
  const place = () => { const a = seg.querySelector('.active'); ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft - 4}px)`; };
  requestAnimationFrame(place);
  const draw = () => {
    const rows = s.invoices.filter((i) => (tab === 'all' || i.status === tab) && (!q || (i.number + sel.client(i.clientId)?.name).toLowerCase().includes(q.toLowerCase())));
    $('#inv-body').innerHTML = rows.map((i, k) => { const c = sel.client(i.clientId); const p = sel.project(i.projectId); return `<tr class="clickable" style="--i:${Math.min(k, 20)}" data-href="/app/invoices/${i.id}"><td><b class="mono">${i.number}</b></td><td><div class="row">${avatar(c?.name || '?', 30, 'sq')}${esc(c?.name || '—')}</div></td><td class="muted">${esc(p?.title || '—')}</td><td>${fmtDate(i.issue)}</td><td>${fmtDate(i.due)}</td><td><span class="badge ${INV_META[i.status]}" style="text-transform:capitalize">${i.status}</span></td><td class="mono" style="text-align:right"><b>${money(sel.invTotal(i))}</b></td></tr>`; }).join('') || `<tr><td colspan="7"><div class="empty">${icon('receipt')}No invoices here</div></td></tr>`;
  };
  draw();
  seg.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; tab = b.dataset.t; seg.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b)); place(); draw(); };
  $('#inv-q').oninput = (e) => { q = e.target.value; draw(); };
  $('#new-inv').onclick = () => newInvoiceModal();
  if (current().includes('new=1')) { const cid = (current().match(/client=([^&]+)/) || [])[1]; history.replaceState(null, '', '#/app/invoices'); newInvoiceModal(cid); }
}

export function newInvoiceModal(clientId) {
  const s = store.get();
  let items = [{ desc: 'Frontend development', qty: 1, rate: 2400 }];
  modal({
    title: 'New invoice', wide: true,
    body: `<div class="grid g-3" style="gap:14px"><div class="field"><label>Client</label><select class="select" id="ni-c">${s.clients.map((c) => `<option value="${c.id}" ${c.id === clientId ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label>Project</label><select class="select" id="ni-p"></select></div><div class="field"><label>Due in</label><select class="select" id="ni-d"><option value="7">7 days</option><option value="14" selected>14 days</option><option value="30">30 days</option></select></div></div>
      <div><label style="font-size:13px;font-weight:600;color:var(--text-2)">Line items</label><div id="ni-items" style="display:grid;gap:8px;margin-top:8px"></div><button class="btn btn-ghost btn-sm" id="ni-add" style="margin-top:10px">${icon('plus')} Add line</button></div>
      <div class="row between wrap" style="padding:16px;border-radius:16px;background:var(--surface-2)"><div class="field" style="width:140px"><label>Tax %</label><input class="input" id="ni-tax" type="number" value="14" min="0"/></div><div style="text-align:right"><small class="dim">Total due</small><div class="grad-text" style="font-family:var(--font-display);font-size:36px;font-weight:800" id="ni-total">$0</div></div></div>`,
    foot: `<button class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-ghost" id="ni-draft">Save draft</button><button class="btn btn-primary" id="ni-send">${icon('send')} Create & send</button>`,
    onMount(m, close) {
      const cSel = m.querySelector('#ni-c'), pSel = m.querySelector('#ni-p');
      const fillP = () => { const ps = s.projects.filter((p) => p.clientId === cSel.value); pSel.innerHTML = ps.map((p) => `<option value="${p.id}">${esc(p.title)}</option>`).join('') || '<option value="">— No project —</option>'; };
      fillP(); cSel.onchange = fillP;
      const total = () => { const sub = items.reduce((a, it) => a + (+it.qty || 0) * (+it.rate || 0), 0); const tx = +m.querySelector('#ni-tax').value || 0; const el = m.querySelector('#ni-total'); el.textContent = money(Math.round(sub * (1 + tx / 100))); el.animate([{ transform: 'scale(1.06)' }, { transform: 'none' }], { duration: 300 }); };
      const drawItems = () => {
        m.querySelector('#ni-items').innerHTML = items.map((it, i) => `<div class="row" style="gap:8px;animation:rowIn .4s var(--ease-out) both" data-i="${i}"><input class="input" data-f="desc" value="${esc(it.desc)}" placeholder="Description" style="flex:3"/><input class="input" data-f="qty" type="number" min="1" value="${it.qty}" style="flex:.7"/><input class="input" data-f="rate" type="number" min="0" value="${it.rate}" style="flex:1.2"/><button class="icon-btn" data-rm="${i}">${icon('x')}</button></div>`).join('');
        total();
      };
      drawItems();
      m.querySelector('#ni-items').addEventListener('input', (e) => { const row = e.target.closest('[data-i]'); items[+row.dataset.i][e.target.dataset.f] = e.target.dataset.f === 'desc' ? e.target.value : +e.target.value; total(); });
      m.querySelector('#ni-items').addEventListener('click', (e) => { const b = e.target.closest('[data-rm]'); if (b && items.length > 1) { items.splice(+b.dataset.rm, 1); drawItems(); } });
      m.querySelector('#ni-add').onclick = () => { items.push({ desc: '', qty: 1, rate: 500 }); drawItems(); };
      m.querySelector('#ni-tax').oninput = total;
      const create = (status) => {
        if (items.some((it) => !String(it.desc).trim())) { toast('Missing description', 'Every line needs a description.', 'error'); return; }
        const id = uid('i'); let number = '';
        store.set((st) => {
          const n = st.invoices.reduce((mx, i) => Math.max(mx, +i.number.split('-').pop()), 0) + 1;
          number = 'INV-2026-' + String(n).padStart(4, '0');
          st.invoices.unshift({ id, number, clientId: cSel.value, projectId: pSel.value, issue: new Date().toISOString(), due: new Date(Date.now() + +m.querySelector('#ni-d').value * 864e5).toISOString(), items: items.map((it) => ({ ...it })), tax: +m.querySelector('#ni-tax').value || 0, currency: 'USD', status, paidAt: null });
          st.activity.unshift({ id: uid('a'), who: st.profile.name, what: status === 'draft' ? 'drafted invoice' : 'sent invoice', target: number, color: '#2ee59d', at: new Date().toISOString() });
        });
        close(); if (status !== 'draft') confetti(80);
        toast(status === 'draft' ? 'Draft saved' : 'Invoice sent ✈️', number, 'success');
        navigate('/app/invoices/' + id);
      };
      m.querySelector('#ni-send').onclick = () => create('pending');
      m.querySelector('#ni-draft').onclick = () => create('draft');
    },
  });
}

export function renderInvoice(view, { id }) {
  const inv = sel.invoice(id);
  if (!inv) return navigate('/app/invoices');
  const s = store.get(); const c = sel.client(inv.clientId); const p = sel.project(inv.projectId);
  const sub = sel.invSub(inv), total = sel.invTotal(inv);
  view.innerHTML = `
  <div class="page-head route-enter"><div><div class="crumbs"><a href="#/app/invoices">Invoices</a>/<span>${inv.number}</span></div><h1 class="mono">${inv.number}</h1></div>
    <div class="page-actions">
      ${inv.status !== 'paid' ? `<button class="btn btn-primary" id="mark-paid" data-magnetic>${icon('checkCircle')} Mark as paid</button><button class="btn btn-ghost" id="remind">${icon('bell')} Send reminder</button>` : ''}
      <button class="btn btn-ghost" id="print">${icon('printer')} Print / PDF</button><button class="btn btn-ghost btn-icon" id="dup" title="Duplicate">${icon('copy')}</button><button class="btn btn-danger btn-icon" id="del-i" title="Delete">${icon('trash')}</button>
    </div></div>
  <div class="grid g-21" style="align-items:start">
    <div class="inv-doc" id="inv-doc" data-reveal="flip">
      <div class="stamp ${inv.status}">${inv.status.toUpperCase()}</div>
      <div class="row between wrap" style="align-items:start">
        <div><div class="row" style="gap:10px"><span class="logo-mark" style="width:42px;height:42px">${LOGO_SVG('il')}</span><b style="font-family:var(--font-display);font-size:24px">Nexora Studio</b></div><p class="muted" style="margin-top:10px;font-size:13px">${esc(s.profile.name)}<br/>${esc(s.profile.location)}<br/>billing@nexora.studio</p></div>
        <div style="text-align:right"><div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.1em">Invoice</div><b class="mono" style="font-size:20px">${inv.number}</b><p class="muted" style="font-size:13px;margin-top:6px">Issued ${fmtDate(inv.issue)}<br/>Due ${fmtDate(inv.due)}</p></div>
      </div>
      <div style="margin-top:34px;display:grid;grid-template-columns:1fr 1fr;gap:20px"><div><div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.1em">Billed to</div><b style="font-size:16px">${esc(c?.name || '—')}</b><p class="muted" style="font-size:13px">${esc(c?.contact || '')}<br/>${esc(c?.email || '')}<br/>${esc(c?.country || '')}</p></div><div><div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.1em">Project</div><b>${esc(p?.title || '—')}</b></div></div>
      <table><thead><tr><th>Description</th><th style="text-align:center">Qty</th><th style="text-align:right">Rate</th><th style="text-align:right">Amount</th></tr></thead><tbody>${inv.items.map((it) => `<tr><td>${esc(it.desc)}</td><td style="text-align:center">${it.qty}</td><td style="text-align:right">${money(it.rate)}</td><td style="text-align:right"><b>${money(it.qty * it.rate)}</b></td></tr>`).join('')}</tbody></table>
      <div class="tot"><span class="muted">Subtotal ${money(sub)}</span><span class="muted">Tax (${inv.tax}%) ${money(total - sub)}</span><b>${money(total)}</b></div>
      <p class="muted" style="font-size:12px;margin-top:30px">Thank you for your business! Payment via bank transfer or card within the due date.</p>
    </div>
    <div class="stack">
      <div class="card card-pad" data-reveal="up"><div class="card-title"><h3>Summary</h3></div>
        <div class="list-i"><span class="grow muted">Status</span><span class="badge ${INV_META[inv.status]}" style="text-transform:capitalize">${inv.status}</span></div>
        <div class="list-i"><span class="grow muted">Amount</span><b class="mono">${money(total)}</b></div>
        <div class="list-i"><span class="grow muted">Client</span><a href="#/app/clients/${c?.id}" class="row" style="gap:8px">${avatar(c?.name || '?', 24)}${esc(c?.name || '—')}</a></div>
        ${inv.paidAt ? `<div class="list-i"><span class="grow muted">Paid on</span><b>${fmtDate(inv.paidAt)}</b></div>` : ''}
      </div>
      <div class="card card-pad" data-reveal="up" style="--d:100ms"><div class="card-title"><h3>History</h3></div><div class="timeline">
        <div class="tl-i" style="--i:0"><b>Invoice created</b><br/><small>${fmtDate(inv.issue)}</small></div>
        ${inv.status !== 'draft' ? `<div class="tl-i" style="--i:1;--tc:#00c8ff"><b>Sent to ${esc(c?.contact || 'client')}</b><br/><small>${fmtDate(inv.issue)}</small></div><div class="tl-i" style="--i:2;--tc:#ffb547"><b>Viewed by client</b><br/><small>${fmtDate(new Date(new Date(inv.issue).getTime() + 864e5))}</small></div>` : ''}
        ${inv.paidAt ? `<div class="tl-i" style="--i:3;--tc:#2ee59d"><b>Payment received 🎉</b><br/><small>${fmtDate(inv.paidAt)}</small></div>` : ''}
      </div></div>
    </div>
  </div>`;
  scanReveal(view);
  const mp = $('#mark-paid');
  mp && (mp.onclick = () => { store.set((st) => { const i = st.invoices.find((x) => x.id === inv.id); i.status = 'paid'; i.paidAt = new Date().toISOString(); st.notifications.unshift({ id: uid('n'), title: 'Payment received', body: `${c?.name} paid ${inv.number} · ${money(total)}`, icon: 'wallet', color: '#2ee59d', at: new Date().toISOString(), read: false }); }); confetti(220); toast('Payment recorded 💸', `${money(total)} from ${c?.name}`, 'success'); renderInvoice(view, { id }); });
  const rm = $('#remind'); rm && (rm.onclick = () => toast('Reminder sent', `${c?.contact} will get a friendly nudge.`, 'info'));
  $('#print').onclick = () => window.print();
  $('#dup').onclick = () => { const nid = uid('i'); store.set((st) => { const n = st.invoices.reduce((mx, i) => Math.max(mx, +i.number.split('-').pop()), 0) + 1; st.invoices.unshift({ ...JSON.parse(JSON.stringify(inv)), id: nid, number: 'INV-2026-' + String(n).padStart(4, '0'), status: 'draft', paidAt: null, issue: new Date().toISOString() }); }); toast('Invoice duplicated', 'Saved as draft', 'success'); navigate('/app/invoices/' + nid); };
  $('#del-i').onclick = async () => { if (await confirmModal('Delete invoice?', `${inv.number} will be permanently removed.`, 'Delete', true)) { store.set((st) => (st.invoices = st.invoices.filter((x) => x.id !== inv.id))); toast('Invoice deleted', inv.number, 'error'); navigate('/app/invoices'); } };
}
