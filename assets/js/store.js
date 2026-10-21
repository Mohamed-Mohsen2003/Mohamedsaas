import { createSeed } from './data/seed.js';

const KEY = 'nexora:state';
const subs = new Set();
let state;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); if (s && s.version === 4) return s; }
  } catch (e) { /* storage unavailable */ }
  return createSeed();
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }

state = load();

export const store = {
  get: () => state,
  set(fn) { fn(state); save(); subs.forEach((s) => s(state)); },
  subscribe(fn) { subs.add(fn); return () => subs.delete(fn); },
  reset() { const user = state.user; state = createSeed(); state.user = user; save(); subs.forEach((s) => s(state)); },
};

// selectors
export const sel = {
  client: (id) => state.clients.find((c) => c.id === id),
  project: (id) => state.projects.find((p) => p.id === id || p.slug === id),
  member: (id) => state.team.find((m) => m.id === id),
  invoice: (id) => state.invoices.find((i) => i.id === id || i.number === id),
  invTotal(inv) { const sub = inv.items.reduce((s, it) => s + it.qty * it.rate, 0); return Math.round(sub * (1 + inv.tax / 100)); },
  invSub: (inv) => inv.items.reduce((s, it) => s + it.qty * it.rate, 0),
  clientRevenue(cid) { return state.invoices.filter((i) => i.clientId === cid && i.status === 'paid').reduce((s, i) => s + sel.invTotal(i), 0); },
  revenueByMonth(months = 12) {
    const out = [];
    const now = new Date();
    for (let k = months - 1; k >= 0; k--) {
      const d = new Date(now.getFullYear(), now.getMonth() - k, 1);
      const key = d.getFullYear() + '-' + d.getMonth();
      const paid = state.invoices.filter((i) => i.status === 'paid' && i.paidAt && (() => { const p = new Date(i.paidAt); return p.getFullYear() + '-' + p.getMonth() === key; })()).reduce((s, i) => s + sel.invTotal(i), 0);
      const billed = state.invoices.filter((i) => { const p = new Date(i.issue); return p.getFullYear() + '-' + p.getMonth() === key; }).reduce((s, i) => s + sel.invTotal(i), 0);
      out.push({ label: d.toLocaleDateString('en-US', { month: 'short' }), paid, billed, expenses: Math.round(billed * .34 + 2200) });
    }
    return out;
  },
  totals() {
    const paid = state.invoices.filter((i) => i.status === 'paid').reduce((s, i) => s + sel.invTotal(i), 0);
    const outstanding = state.invoices.filter((i) => i.status === 'pending' || i.status === 'overdue').reduce((s, i) => s + sel.invTotal(i), 0);
    const overdue = state.invoices.filter((i) => i.status === 'overdue').reduce((s, i) => s + sel.invTotal(i), 0);
    const active = state.projects.filter((p) => p.status !== 'done').length;
    const activeClients = state.clients.filter((c) => c.status === 'Active').length;
    return { paid, outstanding, overdue, active, activeClients };
  },
};
