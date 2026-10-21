import { mulberry32, esc } from '../lib/util.js';

const PALETTES = [
  ['#1b1240', '#7b61ff', '#ff3d9a', '#ffb547'], ['#061a2b', '#00c8ff', '#2ee59d', '#7b61ff'],
  ['#2a0f1c', '#ff3d9a', '#ff6b5b', '#ffb547'], ['#0e1a0a', '#8be000', '#c6ff3d', '#00c8ff'],
  ['#1d1030', '#c86bff', '#ff6bd5', '#7b61ff'], ['#2b1a06', '#ffb547', '#ff6b5b', '#ff3d9a'],
  ['#071226', '#5b8cff', '#00e1ff', '#c86bff'], ['#10061d', '#ff3d9a', '#7b61ff', '#00e1ff'],
];

export function coverArt(p, { tag = true } = {}) {
  const r = mulberry32(p.seed || 1);
  const [bg, c1, c2, c3] = PALETTES[(p.seed || 0) % PALETTES.length];
  const blobs = [c1, c2, c3].map((c, i) => {
    const s = 40 + r() * 50;
    return `<span class="ca-b" style="width:${s}%;height:${s * 1.3}%;left:${r() * 70 - 10}%;top:${r() * 70 - 15}%;background:${c};animation:blob${(i % 3) + 1} ${14 + i * 4}s ease-in-out infinite alternate"></span>`;
  }).join('');
  const isPhone = p.type === 'Mobile App';
  const isMono = p.type === 'Branding' || p.type === 'Video';
  const device = isMono
    ? `<div class="ca-mono">${esc(p.title.split(' ')[0])}${p.type === 'Video' ? ' ▶' : '.'}</div>`
    : `<div class="ca-device ${isPhone ? 'phone' : ''}" style="--c2:${c2}"><i></i><i class="acc"></i><i style="width:${50 + r() * 40}%"></i><i style="width:${40 + r() * 50}%"></i>${isPhone ? '<i></i><i class="acc" style="width:70%"></i>' : '<i style="height:30%;background:rgba(255,255,255,.08)"></i>'}</div>`;
  return `<div class="cover-art" style="--c1:${bg};--c2:${c2};background:${bg}">${blobs}${device}${tag ? `<span class="ca-tag">${esc(p.type)}</span>` : ''}</div>`;
}
