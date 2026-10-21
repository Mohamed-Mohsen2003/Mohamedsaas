import { icon, LOGO_SVG } from '../lib/icons.js';
import { esc, avatar, $, $$, clamp } from '../lib/util.js';
import { store } from '../store.js';
import { scanReveal, particles, onCleanup, typewriter, reduced } from '../ui/fx.js';
import { coverArt } from '../ui/cover.js';
import { lineChart } from '../ui/charts.js';
import { toast } from '../ui/overlay.js';
import { navigate } from '../router.js';

const LOGO_GLYPHS = ['<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/>', '<path d="M3 20 12 4l9 16Z"/>', '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M4 12h16"/>', '<path d="M12 3c5 4 5 14 0 18-5-4-5-14 0-18Z"/>', '<path d="M4 12h6l2-8 2 16 2-8h4"/>', '<path d="M5 5h14v14H5z"/><path d="m5 5 14 14"/>', '<circle cx="8" cy="12" r="5"/><circle cx="16" cy="12" r="5"/>', '<path d="M12 2 4 7v10l8 5 8-5V7Z"/>'];

export const navHTML = () => `
<nav class="nav" id="nav">
  <a href="#/" class="logo"><span class="logo-mark">${LOGO_SVG('nl')}</span><span>Nexora</span></a>
  <div class="nav-links">
    <a href="#/" data-scroll="features">Features</a><a href="#/" data-scroll="work">Work</a><a href="#/" data-scroll="services">Services</a><a href="#/" data-scroll="pricing">Pricing</a><a href="#/" data-scroll="faq">FAQ</a>
  </div>
  <div class="nav-cta">
    <button class="icon-btn hide-sm" data-theme-toggle title="Toggle theme">${icon('sun')}</button>
    <a href="#/login" class="btn btn-ghost btn-sm hide-sm">Sign in</a>
    <a href="#/signup" class="btn btn-primary btn-sm" data-magnetic>Start free ${icon('arrowRight')}</a>
    <button class="icon-btn burger" id="burger">${icon('menu')}</button>
  </div>
</nav>
<div class="mobile-menu" id="mobile-menu">
  ${['features', 'work', 'services', 'pricing', 'faq'].map((s, i) => `<a href="#/" data-scroll="${s}" style="--i:${i}">${s[0].toUpperCase() + s.slice(1)}</a>`).join('')}
  <a href="#/login" style="--i:5" class="grad-text">Sign in →</a>
</div>`;

export function bindNav() {
  const nav = $('#nav'); let last = 0;
  const onS = () => { const y = scrollY; nav.classList.toggle('scrolled', y > 30); nav.classList.toggle('hide', y > last && y > 400); last = y; };
  addEventListener('scroll', onS, { passive: true }); onCleanup(() => removeEventListener('scroll', onS)); onS();
  const mm = $('#mobile-menu');
  $('#burger').onclick = () => mm.classList.toggle('open');
  $$('[data-scroll]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault(); mm.classList.remove('open');
    const t = document.getElementById(a.dataset.scroll);
    if (t) window.scrollTo({ top: t.getBoundingClientRect().top + scrollY - 80, behavior: 'smooth' });
    else navigate('/');
  }));
}

export const footerHTML = () => `
<footer class="footer">
  <div class="container">
    <div class="footer-grid">
      <div style="display:grid;gap:18px;align-content:start">
        <a href="#/" class="logo"><span class="logo-mark">${LOGO_SVG('fl')}</span><span>Nexora</span></a>
        <p class="muted" style="max-width:340px">The operating system for creative studios. Designed, engineered and animated by Mohamed Mohsen.</p>
        <div class="row">${['github', 'globe', 'mail', 'video'].map((i) => `<a href="#/" class="icon-btn" data-hover>${icon(i)}</a>`).join('')}</div>
      </div>
      ${[['Product', ['Features', 'Pricing', 'Changelog', 'Roadmap', 'Integrations']], ['Studio', ['Work', 'Services', 'About', 'Careers', 'Press kit']], ['Resources', ['Docs', 'API', 'Community', 'Status', 'Privacy']]].map(([h, ls]) => `<div><h5>${h}</h5><ul>${ls.map((l) => `<li><a href="#/">${l}</a></li>`).join('')}</ul></div>`).join('')}
    </div>
    <div class="giant" data-reveal="up">NEXORA</div>
    <div class="footer-bottom"><span>© ${new Date().getFullYear()} Nexora Studio. All rights reserved.</span><span>Crafted with obsession by <b class="grad-text">Mohamed Mohsen</b></span></div>
  </div>
</footer>`;

const TESTIMONIALS = [
  ['Olivia Carter', 'CPO, Northwind Labs', 'Nexora replaced five tools for us. The dashboard feels alive — our clients literally ask how it was built.'],
  ['Faisal Al Harbi', 'COO, Atlas Freight', 'Mohamed’s team shipped our fleet dashboard in 6 weeks. Fast, pixel-perfect and the animations are unreal.'],
  ['Lukas Becker', 'Founder, Quantum Pixel', 'The best developer-designer combo I have hired. Our app store rating jumped to 4.9 after the redesign.'],
  ['Layla Al Mansoori', 'Head of Digital, Solace Health', 'From brand identity to a working telehealth app — one partner, zero headaches. Truly end-to-end.'],
  ['Charlotte Hayes', 'CEO, Sable & Co', 'Our Shopify conversion rate went up 142% in the first quarter. The storefront looks like a luxury magazine.'],
  ['Omar Hassan', 'CTO, Kairo Fintech', 'Clean code, documented, tested. Our in-house engineers took over without a single question.'],
  ['Hamdan Al Falasi', 'GM, Monarch Hotels', 'The Odoo rollout across 4 properties was smooth. Reporting that took days now takes seconds.'],
];

const FAQ = [
  ['Is Nexora a real product?', 'Nexora is a fully working SaaS showcase built by Mohamed Mohsen. Every screen is interactive — create projects, drag tasks, send invoices, chat with clients. Data is demo data stored in your browser.'],
  ['Can you build something like this for my company?', 'Absolutely. Web apps, mobile apps (Flutter), desktop apps, Shopify, WordPress and Odoo — from brand identity and UI/UX to production deployment.'],
  ['Which technologies power this demo?', 'It is hand-crafted with zero dependencies: a custom router, state store, SVG chart engine, canvas particle system and motion library — all in vanilla JavaScript for maximum speed.'],
  ['How long does a typical project take?', 'Landing pages ship in 1–2 weeks, MVPs in 4–8 weeks, and larger platforms in iterative sprints with weekly demos.'],
  ['Do you work with international clients?', 'Yes — projects delivered for clients across the Middle East, the USA and Europe, with flexible overlap across time zones.'],
];

const SERVICES = [
  ['Web Applications', ['React', 'Next.js', 'Node', 'Laravel'], 0],
  ['Mobile Apps', ['Flutter', 'iOS', 'Android'], 1],
  ['Desktop Apps', ['Electron', 'Tauri', 'Offline-first'], 8],
  ['UI/UX & Design Systems', ['Figma', 'Prototyping', 'Research'], 6],
  ['Brand Identity', ['Logo', 'Guidelines', 'Social kits'], 5],
  ['Shopify · WordPress · Odoo', ['E-commerce', 'CMS', 'ERP'], 13],
  ['Motion & Video', ['After Effects', 'Reels', 'Launch films'], 12],
];

export function renderLanding(root) {
  const s = store.get();
  const featured = s.projects.filter((p) => p.featured).slice(0, 8);
  const clientNames = s.clients.map((c) => c.name);
  root.innerHTML = `
  <div class="noise"></div>
  ${navHTML()}
  <div class="svc-preview" id="svc-preview"></div>
  <div class="landing route-enter">

    <section class="hero">
      <div class="aurora"><span class="a1"></span><span class="a2"></span><span class="a3"></span><span class="a4"></span></div>
      <canvas id="hero-canvas"></canvas>
      <div class="grid-bg"></div>
      <div class="container hero-inner">
        <span class="eyebrow" data-reveal="down"><i>NEW</i> Nexora 3.0 — AI insights are here ${icon('arrowRight')}</span>
        <h1 data-split>The operating system for <span class="rotator" id="rotator"><span class="grad-text on">studios</span><span class="grad-text">freelancers</span><span class="grad-text">agencies</span><span class="grad-text">founders</span></span><br/><span class="outline">that ship</span> beautiful work.</h1>
        <p class="lead" data-reveal="blur" style="--d:500ms">Projects, clients, invoices, portfolio and analytics — one obsessively animated workspace. Built end-to-end by <b>Mohamed Mohsen</b>.</p>
        <div class="hero-ctas" data-reveal="up" style="--d:700ms">
          <a href="#/signup" class="btn btn-primary btn-lg" data-magnetic>${icon('rocket')} Launch live demo</a>
          <a href="#/" data-scroll="work" class="btn btn-outline btn-lg" data-magnetic>${icon('eye')} See the work</a>
        </div>
        <div class="hero-proof" data-reveal="up" style="--d:850ms">
          <div class="avatar-stack">${['Olivia Carter', 'Faisal Al Harbi', 'Lukas Becker', 'Layla Al Mansoori', 'Omar Hassan'].map((n) => avatar(n, 32)).join('')}</div>
          <span><span class="stars">★★★★★</span> 4.9/5 from 120+ clients worldwide</span>
        </div>
      </div>
      <div class="container mock-wrap" data-reveal="flip" style="--d:600ms">
        <div class="mock" id="hero-mock">
          <div class="mock-screen">
            <div class="mock-side">
              <div class="logo" style="font-size:15px;padding:4px 6px 14px"><span class="logo-mark" style="width:26px;height:26px">${LOGO_SVG('ml')}</span>Nexora</div>
              ${['Overview', 'Projects', 'Portfolio', 'Clients', 'Invoices', 'Messages', 'Analytics'].map((l, i) => `<div class="ms ${i === 0 ? 'on' : ''}"><i></i>${l}</div>`).join('')}
            </div>
            <div class="mock-main">
              <div class="row between"><b style="font-family:var(--font-display);font-size:18px">Good evening, Mohamed 👋</b><span class="badge badge-success">Live</span></div>
              <div class="mock-kpis">
                ${[['Revenue', 248930, '$', '+18.2%'], ['Active projects', 24, '', '+4'], ['Clients', 86, '', '+12'], ['Win rate', 72, '', '+6%']].map(([l, v, p, d]) => `<div class="mock-kpi"><small>${l}</small><b data-count="${v}" data-prefix="${p}" ${l === 'Win rate' ? 'data-suffix="%"' : ''}>0</b><em>${d}</em></div>`).join('')}
              </div>
              <div class="mock-row">
                <div class="mock-card"><div class="row between" style="margin-bottom:6px"><small class="dim">Revenue · last 12 months</small><small class="mono" style="color:var(--success)">▲ 18.2%</small></div><div id="mock-chart"></div></div>
                <div class="mock-card" style="display:grid;gap:10px;align-content:start">
                  <small class="dim">Live activity</small>
                  ${s.activity.slice(0, 4).map((a) => `<div class="row" style="gap:8px;font-size:12px">${avatar(a.who, 24)}<span style="line-height:1.3"><b>${esc(a.who.split(' ')[0])}</b> <span class="dim">${esc(a.what)}</span></span></div>`).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mock-float f1"><span class="avatar sq" style="--s:40px;background:linear-gradient(135deg,#2ee59d,#00c8ff)">${icon('wallet')}</span><div><b>+$12,400</b><span class="dim">Northwind paid invoice</span></div></div>
        <div class="mock-float f2"><span class="avatar sq" style="--s:40px;background:var(--grad)">${icon('rocket')}</span><div><b>Build #48 shipped</b><span class="dim">Kairo Wallet · iOS</span></div></div>
        <div class="mock-float f3"><span class="stars">★★★★★</span><div><b>“Absolutely stunning.”</b><span class="dim">— Solace Health</span></div></div>
      </div>
    </section>

    <section class="marquee-sec">
      <p>Trusted by ambitious teams across MENA, the US &amp; Europe</p>
      ${[0, 1].map((row) => `<div class="marquee ${row ? 'rev' : ''}"><div class="marquee-track">${[...Array(2)].map(() => clientNames.slice(row * 12, row * 12 + 12).map((n, i) => `<div class="logo-pill"><svg viewBox="0 0 24 24" fill="none" stroke="url(#mqg)" stroke-width="2">${LOGO_GLYPHS[(i + row * 3) % LOGO_GLYPHS.length]}</svg>${esc(n)}</div>`).join('')).join('')}</div></div>`).join('')}
      <svg width="0" height="0" style="position:absolute"><defs><linearGradient id="mqg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--accent-2)"/></linearGradient></defs></svg>
    </section>

    <section class="section" style="padding-top:80px">
      <div class="container">
        <div class="stats">
          ${[[180, '+', 'Projects delivered'], [120, '+', 'Happy clients'], [14, '', 'Countries served'], [99, '%', 'On-time delivery']].map(([v, suf, l], i) => `<div class="stat" data-reveal="up" style="--d:${i * 120}ms"><b class="grad-text" data-count="${v}" data-suffix="${suf}">0</b><span>${l}</span></div>`).join('')}
        </div>
      </div>
    </section>

    <section class="section" id="features">
      <div class="container">
        <div class="sec-head">
          <span class="eyebrow" data-reveal="down">${icon('sparkles')} Everything in one place</span>
          <h2 data-split>Run your entire studio from <span class="grad-text">one tab.</span></h2>
          <p data-reveal="blur">From the first lead to the final invoice — Nexora keeps every project, conversation and dollar in perfect sync.</p>
        </div>
        <div class="bento">
          <div class="card spotlight glow-border b1" data-reveal="zoom">
            <div class="feat-ico">${icon('layers')}</div>
            <h3>A command center that feels alive</h3>
            <p>Real-time KPIs, revenue forecasting and team utilization — beautifully animated and instantly understandable.</p>
            <div class="b-visual orbit">
              <div class="ring r3"><span class="sat">${avatar('Sara Nabil', 36)}</span></div>
              <div class="ring r2"><span class="sat">${avatar('Karim Fathy', 36)}</span></div>
              <div class="ring r1"><span class="sat">${avatar('Hana Mostafa', 36)}</span></div>
              <div class="core">${icon('zap')}</div>
            </div>
          </div>
          <div class="card spotlight b2" data-reveal="up" style="--d:100ms"><div class="feat-ico">${icon('kanban')}</div><h3>Drag-and-drop boards</h3><p>Kanban with buttery physics, priorities and live progress.</p></div>
          <div class="card spotlight b3" data-reveal="up" style="--d:200ms"><div class="feat-ico">${icon('receipt')}</div><h3>Invoices that get paid</h3><p>Branded invoices, reminders and a stamp that hits different.</p></div>
          <div class="card spotlight b4" data-reveal="up" style="--d:100ms"><div class="feat-ico">${icon('chart')}</div><h3>Analytics</h3><p>Traffic, leads and revenue trends at a glance.</p><div class="b-visual mini-bars">${[40, 65, 50, 82, 60, 95, 74, 100].map((h, i) => `<span style="height:${h}%;--i:${i}"></span>`).join('')}</div></div>
          <div class="card spotlight b5" data-reveal="up" style="--d:200ms"><div class="feat-ico">${icon('command')}</div><h3>⌘K everything</h3><p>Jump anywhere, create anything — keyboard first.</p><div class="b-visual"><div class="type-line" id="typer"></div></div></div>
          <div class="card spotlight b6" data-reveal="up" style="--d:300ms"><div class="feat-ico">${icon('image')}</div><h3>Portfolio built-in</h3><p>Publish case studies straight from finished projects.</p><div class="b-visual row" style="gap:8px">${featured.slice(0, 3).map((p) => `<div style="flex:1;aspect-ratio:1;border-radius:12px;overflow:hidden;position:relative">${coverArt(p, { tag: false })}</div>`).join('')}</div></div>
        </div>
      </div>
    </section>

    <section class="hscroll" id="work">
      <div class="hscroll-sticky">
        <div class="container hscroll-head">
          <div><span class="eyebrow" style="margin-bottom:16px">${icon('award')} Selected work</span><h2 style="margin-top:16px">Case studies<br/><span class="grad-text">that perform.</span></h2></div>
          <div style="display:grid;gap:10px;justify-items:end"><span class="dim mono" id="hs-count">01 / ${String(featured.length).padStart(2, '0')}</span><div class="hs-progress"><span id="hs-bar"></span></div></div>
        </div>
        <div class="hscroll-track" id="hs-track">
          ${featured.map((p) => { const c = s.clients.find((x) => x.id === p.clientId); return `
            <a class="case" href="#/case/${p.slug}">
              <div class="case-cover" data-tilt="8">${coverArt(p)}<div class="glare"></div><div class="view">${icon('arrowUpRight')}</div></div>
              <div class="case-meta"><div><h3>${esc(p.title)}</h3><p>${esc(c.name)} · ${esc(c.country)}</p></div><span class="badge badge-accent no-dot">${esc(p.results[0][0])} ${esc(p.results[0][1].toLowerCase())}</span></div>
            </a>`; }).join('')}
          <div style="flex:none;width:30vw"></div>
        </div>
      </div>
    </section>

    <section class="section" id="services">
      <div class="container">
        <div class="sec-head" style="justify-items:start;text-align:left">
          <span class="eyebrow" data-reveal="down">${icon('briefcase')} Services</span>
          <h2 data-split>From first sketch to <span class="grad-text">shipped product.</span></h2>
        </div>
        <div class="services">
          ${SERVICES.map(([t, tags, pi], i) => `<div class="service" data-reveal="up" data-pi="${pi}" style="--d:${i * 70}ms"><span class="num">0${i + 1}</span><h3>${esc(t)}</h3><div class="tags">${tags.map((x) => `<span>${esc(x)}</span>`).join('')}</div></div>`).join('')}
        </div>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="sec-head">
          <span class="eyebrow" data-reveal="down">${icon('target')} Process</span>
          <h2 data-split>A process built for <span class="grad-text">momentum.</span></h2>
        </div>
        <div class="process">
          <div class="process-line"><span></span></div>
          ${[['Discover', 'Workshops, research and a crystal-clear scope with fixed milestones.'], ['Design', 'Brand, UX flows and high-fidelity UI with motion prototypes.'], ['Develop', 'Clean, tested code shipped in weekly sprints with live previews.'], ['Launch & grow', 'Deployment, analytics, SEO and ongoing optimization.']].map(([h, p], i) => `<div class="step" style="--i:${i}"><div class="n">0${i + 1}</div><h4>${h}</h4><p>${p}</p></div>`).join('')}
        </div>
      </div>
    </section>

    <section class="section" id="pricing">
      <div class="container">
        <div class="sec-head">
          <span class="eyebrow" data-reveal="down">${icon('wallet')} Pricing</span>
          <h2 data-split>Simple pricing. <span class="grad-text">Serious power.</span></h2>
          <div class="seg" id="bill-seg" data-reveal="up"><span class="seg-ind"></span><button class="active" data-bill="m">Monthly</button><button data-bill="y">Yearly <span class="badge badge-success no-dot" style="height:20px;margin-left:4px">-20%</span></button></div>
        </div>
        <div class="pricing">
          ${[['Solo', 19, 'For freelancers getting organized.', ['5 active projects', 'Unlimited invoices', 'Client portal', 'Basic analytics']], ['Studio', 49, 'For growing studios and small teams.', ['Unlimited projects', 'Team of 10', 'Kanban & calendar', 'Advanced analytics', 'Custom branding']], ['Agency', 129, 'For agencies that run at scale.', ['Everything in Studio', 'Unlimited seats', 'SSO & audit logs', 'API access', 'Dedicated success manager']]].map(([n, p, d, fs], i) => `
          <div class="card plan spotlight ${i === 1 ? 'featured glow-border' : ''}" data-reveal="up" style="--d:${i * 120}ms">
            <div class="row between"><h3 style="font-size:22px">${n}</h3>${i === 1 ? '<span class="badge badge-accent no-dot">Most popular</span>' : ''}</div>
            <p class="muted">${d}</p>
            <div class="price"><b>$<span class="pv" data-m="${p}" data-y="${Math.round(p * .8)}">${p}</span></b><span class="dim">/ month</span></div>
            <a href="#/signup" class="btn ${i === 1 ? 'btn-primary' : 'btn-ghost'}" data-magnetic>Get started</a>
            <ul>${fs.map((f) => `<li>${icon('checkCircle')}${f}</li>`).join('')}</ul>
          </div>`).join('')}
        </div>
      </div>
    </section>

    <section class="section" style="padding-inline:0">
      <div class="container sec-head">
        <span class="eyebrow" data-reveal="down">${icon('heart')} Loved by clients</span>
        <h2 data-split>Words from people <span class="grad-text">we built for.</span></h2>
      </div>
      <div class="testi-wrap"><div class="testi-track">
        ${[...TESTIMONIALS, ...TESTIMONIALS].map(([n, r, q]) => `<div class="card testi spotlight"><span class="stars">★★★★★</span><q>${esc(q)}</q><div class="who">${avatar(n, 42)}<div><b>${esc(n)}</b><span>${esc(r)}</span></div></div></div>`).join('')}
      </div></div>
    </section>

    <section class="section" id="faq">
      <div class="container">
        <div class="sec-head"><span class="eyebrow" data-reveal="down">${icon('chat')} FAQ</span><h2 data-split>Questions? <span class="grad-text">Answered.</span></h2></div>
        <div class="faq">${FAQ.map(([q, a], i) => `<div class="faq-item ${i === 0 ? 'open' : ''}" data-reveal="up" style="--d:${i * 80}ms"><button class="faq-q">${esc(q)}<span class="plus"></span></button><div class="faq-a"><div><p>${esc(a)}</p></div></div></div>`).join('')}</div>
      </div>
    </section>

    <section class="section" style="padding-top:40px">
      <div class="container">
        <div class="cta-box" data-reveal="zoom">
          <div class="aurora"><span class="a1"></span><span class="a2"></span><span class="a3"></span></div>
          <h2 data-split>Ready to build something <span style="font-style:italic">unforgettable?</span></h2>
          <p>Jump into the live demo or start a project with Mohamed today.</p>
          <div class="hero-ctas">
            <a href="#/signup" class="btn btn-primary btn-lg" data-magnetic style="background:#fff;color:#0b0b14;animation:none">${icon('rocket')} Try the demo</a>
            <button class="btn btn-outline btn-lg" data-magnetic id="contact-btn" style="color:#fff;border-color:rgba(255,255,255,.35)">${icon('mail')} Start a project</button>
          </div>
        </div>
      </div>
    </section>
    ${footerHTML()}
  </div>`;

  bindNav();
  scanReveal(root);
  if (!reduced()) particles($('#hero-canvas'), { count: 110 });
  typewriter($('#typer'), ['> create invoice for Northwind…', '> open project Kairo Wallet', '> show revenue this quarter', '> invite Sara to Atlas Fleet']);

  // mock chart
  const rev = [42, 48, 46, 58, 63, 61, 72, 78, 74, 88, 96, 108];
  lineChart($('#mock-chart'), { labels: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'], series: [{ name: 'Revenue', data: rev, color: 'var(--accent)' }, { name: 'Forecast', data: rev.map((v) => v * .82 + 6), color: 'var(--accent-2)', dashed: true }], height: 170, fmt: (v) => '$' + Math.round(v) + 'k', yTicks: 3 });

  // rotator
  const rot = $$('#rotator > span'); let ri = 0;
  const rotT = setInterval(() => { rot[ri].classList.remove('on'); rot[ri].classList.add('off'); const prev = rot[ri]; setTimeout(() => prev.classList.remove('off'), 900); ri = (ri + 1) % rot.length; rot[ri].classList.add('on'); }, 2400);
  onCleanup(() => clearInterval(rotT));

  // scroll-linked: mock flatten + horizontal showcase
  const mock = $('#hero-mock');
  const hs = $('.hscroll'), track = $('#hs-track'), bar = $('#hs-bar'), cnt = $('#hs-count');
  const sizeHS = () => { const extra = track.scrollWidth - innerWidth; hs.style.height = innerHeight + Math.max(0, extra) + 'px'; };
  sizeHS(); addEventListener('resize', sizeHS);
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      const k = clamp(scrollY / (innerHeight * .8), 0, 1);
      mock.style.setProperty('--rx', (24 - 24 * k) + 'deg'); mock.style.setProperty('--sc', .9 + .1 * k);
      const r = hs.getBoundingClientRect(); const total = hs.offsetHeight - innerHeight;
      const p = clamp(-r.top / total, 0, 1);
      track.style.transform = `translate3d(${-p * (track.scrollWidth - innerWidth)}px,0,0)`;
      bar.style.transform = `scaleX(${p})`;
      cnt.textContent = String(Math.min(featured.length, Math.floor(p * featured.length) + 1)).padStart(2, '0') + ' / ' + String(featured.length).padStart(2, '0');
    });
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  onCleanup(() => { removeEventListener('scroll', onScroll); removeEventListener('resize', sizeHS); });

  // services hover preview
  const prev = $('#svc-preview');
  $$('.service').forEach((el) => {
    el.addEventListener('mouseenter', () => { prev.innerHTML = coverArt(s.projects[+el.dataset.pi] || s.projects[0], { tag: false }); prev.classList.add('show'); });
    el.addEventListener('mouseleave', () => prev.classList.remove('show'));
    el.addEventListener('mousemove', (e) => { prev.style.left = e.clientX + 'px'; prev.style.top = e.clientY + 'px'; });
    el.addEventListener('click', () => navigate('/signup'));
  });

  // pricing toggle w/ number tween
  const seg = $('#bill-seg'); const ind = seg.querySelector('.seg-ind');
  const place = () => { const a = seg.querySelector('button.active'); ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft - 4}px)`; };
  requestAnimationFrame(place);
  seg.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    seg.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b)); place();
    $$('.pv').forEach((pv) => {
      const from = +pv.textContent, to = +pv.dataset[b.dataset.bill]; const t0 = performance.now();
      const st = (t) => { const k = clamp((t - t0) / 700, 0, 1); pv.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(st); };
      requestAnimationFrame(st);
      pv.closest('.price').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: 500, easing: 'cubic-bezier(.34,1.56,.64,1)' });
    });
  });

  // faq
  $$('.faq-q').forEach((q) => q.addEventListener('click', () => { const it = q.parentElement; const open = it.classList.contains('open'); $$('.faq-item').forEach((x) => x.classList.remove('open')); if (!open) it.classList.add('open'); }));

  $('#contact-btn').onclick = () => toast('Message queued ✉️', 'Mohamed will reply within 24 hours.', 'success');
}
