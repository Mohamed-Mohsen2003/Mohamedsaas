import { icon, LOGO_SVG } from '../lib/icons.js';
import { esc, avatar, fmtDate, money, $ } from '../lib/util.js';
import { store, sel } from '../store.js';
import { scanReveal, particles, reduced } from '../ui/fx.js';
import { coverArt } from '../ui/cover.js';
import { toast } from '../ui/overlay.js';
import { navigate } from '../router.js';
import { navHTML, bindNav, footerHTML } from './landing.js';

export function renderCase(root, { slug }) {
  const p = sel.project(slug);
  if (!p) return navigate('/');
  const c = sel.client(p.clientId);
  const s = store.get();
  const more = s.projects.filter((x) => x.featured && x.id !== p.id).slice(0, 3);
  root.innerHTML = `
  ${navHTML()}
  <div class="landing route-enter">
    <section class="case-page">
      <div class="container">
        <a href="#/" class="btn btn-ghost btn-sm" data-reveal="left">${icon('arrowLeft')} Back home</a>
        <div style="margin-top:40px;display:grid;gap:22px">
          <span class="eyebrow" data-reveal="down"><i>${esc(p.type)}</i> ${esc(c.name)} · ${esc(c.country)}</span>
          <h1 data-split style="font-size:clamp(44px,7vw,104px);font-weight:800;letter-spacing:-.045em">${esc(p.title)}</h1>
          <p class="muted" data-reveal="blur" style="font-size:19px;max-width:720px">${esc(p.summary)}</p>
        </div>
        <div class="case-hero-cover" data-reveal="zoom" data-tilt="4">${coverArt(p)}<div class="glare"></div></div>
        <div class="case-facts">
          ${[['Client', c.name], ['Timeline', fmtDate(p.start, { month: 'short', year: 'numeric' }) + ' → ' + fmtDate(p.due, { month: 'short', year: 'numeric' })], ['Services', p.type], ['Stack', p.stack.slice(0, 3).join(', ')]].map(([k, v], i) => `<div data-reveal="up" style="--d:${i * 80}ms"><small>${k}</small><b>${esc(v)}</b></div>`).join('')}
        </div>
        <div class="stats" style="margin-bottom:80px">
          ${p.results.map(([v, l], i) => { const n = parseFloat(v); const suf = v.replace(/[\d.]/g, ''); return `<div class="stat" data-reveal="up" style="--d:${i * 100}ms"><b class="grad-text" data-count="${n}" data-dec="${v.includes('.') ? 1 : 0}" data-suffix="${esc(suf)}">0</b><span>${esc(l)}</span></div>`; }).join('')}
        </div>
        <div class="case-body">
          <h3 data-reveal="left">The challenge</h3>
          <div data-reveal="up"><p>${esc(c.name)} needed a ${esc(p.type.toLowerCase())} that could keep up with rapid growth in ${esc(c.industry.toLowerCase())}. Their legacy experience was slow, inconsistent across devices and impossible for the internal team to maintain.</p><p>We set three goals: cut load time in half, unify the brand across every touchpoint, and give the team tools they actually enjoy using.</p></div>
          <h3 data-reveal="left">The solution</h3>
          <div data-reveal="up"><p>We ran a two-week discovery sprint, rebuilt the information architecture and designed a modular system in Figma. Development used ${esc(p.stack.join(', '))} with automated testing and performance budgets on every pull request.</p><p>Motion was treated as a first-class citizen: micro-interactions guide attention, transitions explain state, and every animation respects reduced-motion preferences.</p></div>
        </div>
        <div class="case-gallery">${[0, 1, 2].map((k) => `<div data-reveal="${k ? 'up' : 'zoom'}" style="--d:${k * 120}ms" data-tilt="5">${coverArt({ ...p, seed: p.seed + k * 3 + 1, type: k === 2 ? 'Mobile App' : p.type }, { tag: false })}<div class="glare"></div></div>`).join('')}</div>
        <div class="card card-pad" style="margin-top:80px;display:flex;gap:20px;align-items:center;flex-wrap:wrap" data-reveal="up">
          ${avatar(c.contact, 64)}
          <div style="flex:1;min-width:240px"><p style="font-size:20px;font-family:var(--font-display);line-height:1.35">“Working with Mohamed felt like having an entire product team. The result exceeded every expectation.”</p><p class="dim" style="margin-top:8px">${esc(c.contact)} — ${esc(c.name)}</p></div>
        </div>
        <h2 style="font-size:40px;margin:100px 0 30px" data-reveal="left">More work</h2>
        <div class="port-grid">${more.map((m, i) => `<a href="#/case/${m.slug}" class="port-card pop" style="--i:${i}"><div class="pc-cover">${coverArt(m)}</div><div class="pc-body"><div><b>${esc(m.title)}</b><small>${esc(sel.client(m.clientId).name)}</small></div>${icon('arrowUpRight')}</div></a>`).join('')}</div>
      </div>
    </section>
    ${footerHTML()}
  </div>`;
  bindNav(); scanReveal(root);
}

export function renderAuth(root, mode = 'login') {
  const isLogin = mode === 'login';
  root.innerHTML = `
  <div class="auth route-enter">
    <div class="auth-visual">
      <div class="aurora"><span class="a1"></span><span class="a2"></span><span class="a3"></span></div>
      <canvas id="auth-canvas" style="position:absolute;inset:0;width:100%;height:100%;z-index:1"></canvas>
      <a href="#/" class="logo" style="color:#fff"><span class="logo-mark">${LOGO_SVG('al')}</span><span>Nexora</span></a>
      <div style="display:grid;gap:20px;max-width:520px">
        <h2 data-split>Your studio, beautifully <span style="font-style:italic">in control.</span></h2>
        <p style="color:rgba(255,255,255,.72);font-size:17px;--d:400ms" data-reveal="blur">Join 2,400+ studios managing $48M in client work with Nexora.</p>
        <div class="card" style="background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.12);padding:20px;color:#fff;backdrop-filter:blur(10px);--d:600ms" data-reveal="up">
          <span class="stars">★★★★★</span>
          <p style="margin:10px 0 14px">“We closed our books 4× faster the first month. It’s the prettiest tool our team has ever used.”</p>
          <div class="row">${avatar('Charlotte Hayes', 36)}<div><b style="font-size:14px">Charlotte Hayes</b><div style="font-size:12px;opacity:.6">CEO, Sable &amp; Co</div></div></div>
        </div>
      </div>
      <small style="opacity:.5">© Nexora Studio · Crafted by Mohamed Mohsen</small>
    </div>
    <div class="auth-form-side">
      <form class="auth-form" id="auth-form" novalidate>
        <a href="#/" class="btn btn-ghost btn-sm" style="justify-self:start">${icon('arrowLeft')} Home</a>
        <div data-reveal="up"><h1>${isLogin ? 'Welcome back' : 'Create your workspace'}</h1><p class="muted" style="margin-top:8px">${isLogin ? 'Sign in to continue to your dashboard.' : 'Start your 14-day free trial. No card required.'}</p></div>
        <div class="oauth" data-reveal="up" style="--d:100ms"><button type="button" class="btn btn-ghost" data-oauth="Google">${icon('google')} Google</button><button type="button" class="btn btn-ghost" data-oauth="GitHub">${icon('github')} GitHub</button></div>
        <div class="divider">or continue with email</div>
        ${isLogin ? '' : `<div class="field" data-reveal="up" style="--d:150ms"><label>Full name</label><div class="input-icon">${icon('user')}<input class="input" name="name" placeholder="Mohamed Mohsen" value="Mohamed Mohsen" required /></div></div>`}
        <div class="field" data-reveal="up" style="--d:200ms"><label>Email</label><div class="input-icon">${icon('mail')}<input class="input" type="email" name="email" placeholder="you@company.com" value="demo@nexora.app" required /></div></div>
        <div class="field" data-reveal="up" style="--d:250ms"><label class="row between">Password ${isLogin ? '<a href="#/login" class="dim" style="font-weight:500" id="forgot">Forgot?</a>' : ''}</label><div class="input-icon">${icon('lock')}<input class="input" type="password" name="password" placeholder="••••••••" value="nexora2026" required minlength="6" /></div></div>
        <div class="demo-hint" data-reveal="up" style="--d:300ms">✨ Demo credentials are pre-filled — just hit the button.</div>
        <button class="btn btn-primary btn-lg" type="submit" data-reveal="up" style="--d:350ms" id="auth-submit">${isLogin ? 'Sign in' : 'Create account'} ${icon('arrowRight')}</button>
        <p class="muted" style="text-align:center;font-size:14px">${isLogin ? 'New to Nexora? <a href="#/signup" class="grad-text" style="font-weight:700">Create an account</a>' : 'Already have an account? <a href="#/login" class="grad-text" style="font-weight:700">Sign in</a>'}</p>
      </form>
    </div>
  </div>`;
  scanReveal(root);
  if (!reduced()) particles($('#auth-canvas'), { count: 60, colors: ['#7b61ff', '#ff3d9a', '#ffb547'] });
  const form = $('#auth-form');
  const login = (name, email) => {
    const btn = $('#auth-submit');
    btn.innerHTML = '<span class="row" style="gap:8px"><span style="width:16px;height:16px;border:2px solid rgba(255,255,255,.4);border-top-color:#fff;border-radius:50%;animation:spin .7s linear infinite"></span>Signing in…</span>';
    btn.disabled = true;
    setTimeout(() => {
      store.set((s) => { s.user = { name: name || s.profile.name, email }; if (name) s.profile.name = name; s.profile.email = email; });
      toast(isLogin ? 'Welcome back 👋' : 'Workspace created 🎉', 'Loading your dashboard…', 'success');
      navigate('/app');
    }, 900);
  };
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const email = String(fd.get('email') || '').trim();
    const pw = String(fd.get('password') || '');
    if (!/^\S+@\S+\.\S+$/.test(email) || pw.length < 6) {
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
      toast('Check your details', 'Enter a valid email and a 6+ character password.', 'error');
      return;
    }
    login(fd.get('name'), email);
  });
  root.querySelectorAll('[data-oauth]').forEach((b) => b.addEventListener('click', () => login(null, 'demo@nexora.app')));
  const f = $('#forgot'); f && f.addEventListener('click', (e) => { e.preventDefault(); toast('Reset link sent', 'Check demo@nexora.app for instructions.', 'info'); });
}
