import { icon } from '../lib/icons.js';
import { esc, num, $, $$ } from '../lib/util.js';
import { store, sel } from '../store.js';
import { scanReveal } from '../ui/fx.js';
import { toast } from '../ui/overlay.js';
import { coverArt } from '../ui/cover.js';

let cat = 'All';
export function renderPortfolio(view) {
  const s = store.get();
  const pub = s.projects.filter((p) => p.featured);
  const cats = ['All', ...new Set(pub.map((p) => p.type))];
  const totalViews = pub.reduce((a, p) => a + p.views, 0), totalLikes = pub.reduce((a, p) => a + p.likes, 0);
  view.innerHTML = `
  <div class="page-head route-enter"><div><h1>Portfolio</h1><p>${pub.length} published case studies · ${num(totalViews, true)} views · ${num(totalLikes, true)} appreciations</p></div>
    <div class="page-actions"><a href="#/" class="btn btn-ghost">${icon('globe')} View public site</a><button class="btn btn-primary" id="share-port" data-magnetic>${icon('link')} Copy share link</button></div></div>
  <div class="row wrap" style="gap:8px" id="cat-chips" data-reveal="up">${cats.map((c) => `<button class="chip ${c === cat ? 'active' : ''}" data-c="${c}">${c}${c !== 'All' ? ` <span class="dim">${pub.filter((p) => p.type === c).length}</span>` : ''}</button>`).join('')}</div>
  <div class="port-grid" id="port-grid">
    ${pub.map((p, i) => `<div class="port-card pop ${cat !== 'All' && p.type !== cat ? 'hide' : ''}" data-type="${esc(p.type)}" data-slug="${p.slug}" style="--i:${i}">
      <div class="pc-cover" data-tilt="6">${coverArt(p)}<div class="glare" style="position:absolute;inset:0;background:radial-gradient(circle at var(--gx,50%) var(--gy,50%),rgba(255,255,255,.3),transparent 50%);mix-blend-mode:overlay"></div></div>
      <div class="pc-body"><div><b>${esc(p.title)}</b><small>${esc(sel.client(p.clientId).name)}</small></div>
        <div class="likes"><button class="like" data-id="${p.id}" title="Appreciate">${icon('heart')}<span>${num(p.likes, true)}</span></button><span>${icon('eye')}${num(p.views, true)}</span></div></div>
    </div>`).join('')}
  </div>`;
  scanReveal(view);
  $('#cat-chips').onclick = (e) => {
    const b = e.target.closest('.chip'); if (!b) return; cat = b.dataset.c;
    $$('#cat-chips .chip').forEach((c) => c.classList.toggle('active', c === b));
    let k = 0;
    $$('#port-grid .port-card').forEach((card) => { const show = cat === 'All' || card.dataset.type === cat; card.classList.toggle('hide', !show); if (show) { card.classList.remove('pop'); void card.offsetWidth; card.style.setProperty('--i', k++); card.classList.add('pop'); } });
  };
  $('#port-grid').onclick = (e) => {
    const like = e.target.closest('.like');
    if (like) {
      e.stopPropagation();
      let n = 0; store.set((st) => { const p = st.projects.find((x) => x.id === like.dataset.id); p.likes++; n = p.likes; });
      like.querySelector('span').textContent = num(n, true); like.style.color = 'var(--magenta)';
      like.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 500, easing: 'cubic-bezier(.34,1.56,.64,1)' });
      return;
    }
    const card = e.target.closest('.port-card'); if (card) location.hash = '/case/' + card.dataset.slug;
  };
  $('#share-port').onclick = () => { const url = location.href.split('#')[0] + '#/'; navigator.clipboard?.writeText(url).catch(() => {}); toast('Link copied 🔗', url, 'success'); };
}
