// ===== Hand-rolled animated SVG charts =====
import { esc, uid } from '../lib/util.js';

let tip;
function tooltip() {
  if (!tip) { tip = document.createElement('div'); tip.className = 'chart-tip'; document.body.appendChild(tip); }
  return tip;
}
export function showTip(html, x, y) {
  const t = tooltip(); t.innerHTML = html; t.classList.add('show');
  const r = t.getBoundingClientRect();
  let left = x + 16, top = y - r.height - 12;
  if (left + r.width > innerWidth - 10) left = x - r.width - 16;
  if (top < 10) top = y + 16;
  t.style.left = left + 'px'; t.style.top = top + 'px';
}
export const hideTip = () => tip && tip.classList.remove('show');

const niceMax = (v) => { if (v <= 0) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); const n = v / p; return ([1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((x) => n <= x) || 10) * p; };
const smooth = (pts) => {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1] || pts[i], [x1, y1] = pts[i], [x2, y2] = pts[i + 1], [x3, y3] = pts[i + 2] || pts[i + 1];
    const t = .18;
    d += ` C${x1 + (x2 - x0) * t},${y1 + (y2 - y0) * t} ${x2 - (x3 - x1) * t},${y2 - (y3 - y1) * t} ${x2},${y2}`;
  }
  return d;
};

export function lineChart(el, { labels, series, height = 280, fmt = (v) => v, yTicks = 4, area = true }) {
  const W = Math.max(320, el.clientWidth || 600), H = height, pl = 52, pr = 12, pt = 16, pb = 30;
  const max = niceMax(Math.max(...series.flatMap((s) => s.data)) * 1.08);
  const x = (i) => pl + (i * (W - pl - pr)) / Math.max(1, labels.length - 1);
  const y = (v) => pt + (1 - v / max) * (H - pt - pb);
  const id = uid('g');
  let g = '';
  for (let k = 0; k <= yTicks; k++) { const v = (max / yTicks) * k; g += `<line class="grid-l" x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text class="axis-t" x="${pl - 10}" y="${y(v) + 4}" text-anchor="end">${esc(fmt(v, true))}</text>`; }
  const step = Math.ceil(labels.length / Math.floor((W - pl) / 64));
  labels.forEach((l, i) => { if (i % step === 0 || i === labels.length - 1) g += `<text class="axis-t" x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`; });
  let defs = '', paths = '';
  series.forEach((s, si) => {
    const pts = s.data.map((v, i) => [x(i), y(v)]);
    const d = smooth(pts);
    defs += `<linearGradient id="${id}${si}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.color}" stop-opacity=".35"/><stop offset="1" stop-color="${s.color}" stop-opacity="0"/></linearGradient>`;
    if (area && !s.dashed) paths += `<path class="area" d="${d} L${x(s.data.length - 1)},${H - pb} L${pl},${H - pb} Z" fill="url(#${id}${si})"/>`;
    paths += `<path class="line ${s.dashed ? '' : 'draw'}" d="${d}" stroke="${s.color}" ${s.dashed ? 'stroke-dasharray="5 6" opacity=".7"' : ''} style="--dl:${si * .25}s"/>`;
    paths += s.data.map((v, i) => `<circle class="dot-pt" data-i="${i}" cx="${x(i)}" cy="${y(v)}" r="5" fill="var(--surface)" stroke="${s.color}" stroke-width="2.5"/>`).join('');
  });
  el.classList.add('chart');
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${H}px"><defs>${defs}</defs>${g}${paths}<line class="hover-line" x1="0" x2="0" y1="${pt}" y2="${H - pb}"/><rect x="${pl}" y="0" width="${W - pl - pr}" height="${H}" fill="transparent" class="hit"/></svg>`;
  el.querySelectorAll('.line.draw').forEach((p) => { const L = p.getTotalLength(); p.style.setProperty('--len', L); });
  const svg = el.querySelector('svg'), hl = el.querySelector('.hover-line');
  svg.addEventListener('pointermove', (e) => {
    const r = svg.getBoundingClientRect(); const mx = ((e.clientX - r.left) / r.width) * W;
    const i = Math.max(0, Math.min(labels.length - 1, Math.round(((mx - pl) / (W - pl - pr)) * (labels.length - 1))));
    hl.setAttribute('x1', x(i)); hl.setAttribute('x2', x(i));
    el.querySelectorAll('.dot-pt').forEach((c) => (c.style.opacity = +c.dataset.i === i ? 1 : 0));
    showTip(`<span class="dim">${esc(labels[i])}</span>` + series.map((s) => `<div class="row" style="gap:8px;margin-top:4px"><i style="width:8px;height:8px;border-radius:2px;background:${s.color}"></i>${esc(s.name)}<b style="margin-left:auto;font-size:13px">${esc(fmt(s.data[i]))}</b></div>`).join(''), e.clientX, e.clientY);
  });
  svg.addEventListener('pointerleave', () => { hideTip(); el.querySelectorAll('.dot-pt').forEach((c) => (c.style.opacity = 0)); });
}

export function barChart(el, { labels, series, height = 260, fmt = (v) => v, stacked = false, radius = 6 }) {
  const W = Math.max(320, el.clientWidth || 600), H = height, pl = 48, pr = 8, pt = 14, pb = 30;
  const totals = labels.map((_, i) => stacked ? series.reduce((s, se) => s + se.data[i], 0) : Math.max(...series.map((se) => se.data[i])));
  const max = niceMax(Math.max(...totals) * 1.08);
  const y = (v) => pt + (1 - v / max) * (H - pt - pb);
  const bw = (W - pl - pr) / labels.length;
  let g = '';
  for (let k = 0; k <= 4; k++) { const v = (max / 4) * k; g += `<line class="grid-l" x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}"/><text class="axis-t" x="${pl - 10}" y="${y(v) + 4}" text-anchor="end">${esc(fmt(v, true))}</text>`; }
  let bars = '';
  labels.forEach((l, i) => {
    const gx = pl + i * bw;
    g += `<text class="axis-t" x="${gx + bw / 2}" y="${H - 8}" text-anchor="middle">${esc(l)}</text>`;
    if (stacked) {
      let acc = 0; const w = Math.min(34, bw * .55);
      series.forEach((s, si) => { const v = s.data[i]; const y1 = y(acc + v), y0 = y(acc); acc += v; bars += `<rect class="bar" data-i="${i}" style="--i:${i}" x="${gx + (bw - w) / 2}" y="${y1}" width="${w}" height="${Math.max(0, y0 - y1)}" rx="${si === series.length - 1 ? radius : 0}" fill="${s.color}"/>`; });
    } else {
      const n = series.length, inner = Math.min(bw * .7, n * 22), w = inner / n - 3;
      series.forEach((s, si) => { const v = s.data[i]; bars += `<rect class="bar" data-i="${i}" style="--i:${i + si}" x="${gx + (bw - inner) / 2 + si * (w + 3)}" y="${y(v)}" width="${w}" height="${Math.max(0, H - pb - y(v))}" rx="${radius}" fill="${s.color}"/>`; });
    }
  });
  el.classList.add('chart');
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="height:${H}px">${g}${bars}</svg>`;
  el.querySelectorAll('.bar').forEach((b) => {
    b.addEventListener('pointermove', (e) => { const i = +b.dataset.i; showTip(`<span class="dim">${esc(labels[i])}</span>` + series.map((s) => `<div class="row" style="gap:8px;margin-top:4px"><i style="width:8px;height:8px;border-radius:2px;background:${s.color}"></i>${esc(s.name)}<b style="margin-left:auto;font-size:13px">${esc(fmt(s.data[i]))}</b></div>`).join(''), e.clientX, e.clientY); });
    b.addEventListener('pointerleave', hideTip);
  });
}

export function donut(el, { data, size = 200, thick = 20, center = '', sub = '' }) {
  const R = (size - thick) / 2 - 4, C = 2 * Math.PI * R;
  const total = data.reduce((s, d) => s + d.value, 0);
  let off = 0;
  const segs = data.map((d, i) => {
    const len = (d.value / total) * C;
    const s = `<circle class="donut-seg" data-i="${i}" style="--i:${i}" r="${R}" cx="${size / 2}" cy="${size / 2}" stroke="${d.color}" stroke-width="${thick}" stroke-dasharray="${Math.max(0, len - 3)} ${C}" stroke-dashoffset="${-off}" stroke-linecap="round"/>`;
    off += len; return s;
  }).join('');
  el.innerHTML = `<div style="position:relative;width:${size}px;height:${size}px;margin:auto"><svg viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg)"><circle r="${R}" cx="${size / 2}" cy="${size / 2}" fill="none" stroke="var(--surface-3)" stroke-width="${thick}" opacity=".5"/>${segs}</svg><div style="position:absolute;inset:0;display:grid;place-items:center;text-align:center"><div><div class="gauge-num">${center}</div><div class="dim" style="font-size:12px">${sub}</div></div></div></div>`;
  el.querySelectorAll('.donut-seg').forEach((s) => {
    s.addEventListener('pointermove', (e) => { const d = data[+s.dataset.i]; showTip(`<span class="dim">${esc(d.label)}</span><b>${Math.round((d.value / total) * 100)}%</b>`, e.clientX, e.clientY); });
    s.addEventListener('pointerleave', hideTip);
  });
}

export function sparkline(data, color = 'var(--accent)', w = 160, h = 60) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * w, h - 6 - ((v - min) / (max - min || 1)) * (h - 14)]);
  const d = smooth(pts); const id = uid('sp');
  return `<svg class="k-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".35"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><path d="${d} L${w},${h} L0,${h} Z" fill="url(#${id})"/><path d="${d}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" style="animation:drawLine 1.8s var(--ease-in-out) .3s forwards"/></svg>`;
}

export function hbars(el, rows, color = 'var(--accent)', fmt = (v) => v + '%') {
  const max = Math.max(...rows.map((r) => r[1]));
  el.innerHTML = rows.map(([l, v], i) => `<div style="display:grid;gap:6px;margin-bottom:14px"><div class="row between" style="font-size:13px"><span>${esc(l)}</span><b class="mono">${esc(fmt(v))}</b></div><div class="progress"><span style="width:0;background:${Array.isArray(color) ? color[i % color.length] : 'var(--grad)'}" data-w="${(v / max) * 100}%"></span></div></div>`).join('');
}

export function ringProgress(value, size = 140, color = 'url(#rpg)') {
  const r = (size - 14) / 2, c = 2 * Math.PI * r;
  return `<div class="ring-prog" style="width:${size}px;height:${size}px"><svg viewBox="0 0 ${size} ${size}"><defs><linearGradient id="rpg"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent-2)"/></linearGradient></defs><circle r="${r}" cx="${size / 2}" cy="${size / 2}" stroke="var(--surface-3)"/><circle class="fg" r="${r}" cx="${size / 2}" cy="${size / 2}" stroke="${color}" stroke-dasharray="${c}" stroke-dashoffset="${c}" data-dash="${c * (1 - value / 100)}"/></svg><div class="val"><span data-count="${value}" data-suffix="%">0%</span></div></div>`;
}
