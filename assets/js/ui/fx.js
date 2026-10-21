// ===== Nexora motion engine =====
import { $$, clamp, lerp } from '../lib/util.js';

let cleanups = [];
export const onCleanup = (fn) => cleanups.push(fn);
export function runCleanups() { cleanups.forEach((f) => { try { f(); } catch (e) { /* noop */ } }); cleanups = []; }
export const reduced = () => document.documentElement.classList.contains('reduce-motion') || matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- preloader ---------- */
export function runPreloader() {
  const el = document.getElementById('preloader');
  if (!el) return Promise.resolve();
  const bar = el.querySelector('.pl-bar span');
  const cnt = el.querySelector('.pl-count');
  return new Promise((resolve) => {
    let p = 0;
    const total = reduced() ? 200 : 1500;
    const t0 = performance.now();
    const tick = (t) => {
      const k = clamp((t - t0) / total, 0, 1);
      p = Math.round((1 - Math.pow(1 - k, 3)) * 100);
      bar.style.width = p + '%'; cnt.textContent = p + '%';
      if (k < 1) requestAnimationFrame(tick);
      else {
        el.classList.add('done');
        setTimeout(resolve, 450);
        setTimeout(() => { el.classList.add('gone'); setTimeout(() => el.remove(), 400); }, 1100);
      }
    };
    requestAnimationFrame(tick);
  });
}

/* ---------- custom cursor ---------- */
export function initCursor() {
  if (matchMedia('(pointer: coarse)').matches) return;
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  let x = innerWidth / 2, y = innerHeight / 2, rx = x, ry = y;
  addEventListener('mousemove', (e) => {
    x = e.clientX; y = e.clientY;
    if (document.body.dataset.cursor !== 'off') document.body.classList.add('has-cursor');
    const t = e.target.closest('a, button, [data-hover], .card-hover, .case, .port-card, .k-card, input, select, textarea');
    document.body.classList.toggle('cursor-hover', !!t);
  }, { passive: true });
  addEventListener('mousedown', () => document.body.classList.add('cursor-down'));
  addEventListener('mouseup', () => document.body.classList.remove('cursor-down'));
  document.addEventListener('mouseleave', () => document.body.classList.remove('has-cursor'));
  const loop = () => {
    rx = lerp(rx, x, .18); ry = lerp(ry, y, .18);
    dot.style.transform = `translate(${x}px,${y}px)`;
    ring.style.transform = `translate(${rx}px,${ry}px)`;
    requestAnimationFrame(loop);
  };
  loop();
}

/* ---------- global delegated micro-interactions ---------- */
export function initGlobalFx() {
  // ripple
  document.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('.btn');
    if (!b) return;
    const r = b.getBoundingClientRect();
    const s = Math.max(r.width, r.height);
    const sp = document.createElement('span');
    sp.className = 'ripple';
    sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    b.appendChild(sp);
    setTimeout(() => sp.remove(), 700);
  });
  // spotlight + magnetic + tilt
  document.addEventListener('pointermove', (e) => {
    const sp = e.target.closest('.spotlight');
    if (sp) { const r = sp.getBoundingClientRect(); sp.style.setProperty('--mx', e.clientX - r.left + 'px'); sp.style.setProperty('--my', e.clientY - r.top + 'px'); }
    const mg = e.target.closest('[data-magnetic]');
    if (mg && !reduced()) { const r = mg.getBoundingClientRect(); const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); mg.style.transform = `translate(${dx * .25}px,${dy * .35}px)`; }
    const tl = e.target.closest('[data-tilt]');
    if (tl && !reduced()) {
      const r = tl.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      const m = +tl.dataset.tilt || 10;
      tl.style.transform = `perspective(900px) rotateY(${(px - .5) * m}deg) rotateX(${(.5 - py) * m}deg) translateZ(0)`;
      tl.style.setProperty('--gx', px * 100 + '%'); tl.style.setProperty('--gy', py * 100 + '%');
    }
  }, { passive: true });
  document.addEventListener('pointerout', (e) => {
    const mg = e.target.closest('[data-magnetic]');
    if (mg && !mg.contains(e.relatedTarget)) mg.style.transform = '';
    const tl = e.target.closest('[data-tilt]');
    if (tl && !tl.contains(e.relatedTarget)) tl.style.transform = '';
  });
  // scroll progress
  const bar = document.getElementById('scroll-progress');
  const onScroll = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`; };
  addEventListener('scroll', onScroll, { passive: true });
}

/* ---------- split text ---------- */
export function splitText(el) {
  if (el.dataset.splitDone) return;
  el.dataset.splitDone = 1;
  let i = 0;
  const walk = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((w) => {
          if (!w) return;
          if (/^\s+$/.test(w)) { frag.appendChild(document.createTextNode(' ')); return; }
          const ws = document.createElement('span'); ws.className = 'split-word';
          [...w].forEach((ch) => { const c = document.createElement('span'); c.className = 'split-char'; c.style.setProperty('--i', i++); c.textContent = ch; ws.appendChild(c); });
          frag.appendChild(ws);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1 && (n.classList.contains('grad-text') || n.classList.contains('outline') || n.tagName === 'SPAN' && n.querySelector('*') === null && n.classList.length)) {
        // atomic: keep gradient / stroke text intact, reveal as one unit
        const ws = document.createElement('span'); ws.className = 'split-word';
        n.replaceWith(ws); ws.appendChild(n); n.classList.add('split-char'); n.style.setProperty('--i', i); i += 4;
      } else if (n.nodeType === 1 && n.tagName !== 'BR' && !n.classList.contains('rotator')) walk(n);
    });
  };
  walk(el);
}

/* ---------- count up ---------- */
export function countUp(el) {
  const to = parseFloat(el.dataset.count);
  const dec = +(el.dataset.dec || 0);
  const pre = el.dataset.prefix || '', suf = el.dataset.suffix || '';
  const dur = +(el.dataset.dur || 1800);
  const fmt = (v) => pre + v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
  if (reduced()) { el.textContent = fmt(to); return; }
  const t0 = performance.now();
  const step = (t) => {
    const k = clamp((t - t0) / dur, 0, 1);
    const e = 1 - Math.pow(1 - k, 4);
    el.textContent = fmt(to * e);
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- reveal observer ---------- */
let io;
export function scanReveal(root = document) {
  if (!io) {
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add('in');
        if (el.hasAttribute('data-split')) el.classList.add('split-in');
        if (el.hasAttribute('data-count')) countUp(el);
        if (el.dataset.w) el.style.width = el.dataset.w;
        if (el.dataset.dash) el.style.strokeDashoffset = el.dataset.dash;
        io.unobserve(el);
      });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  }
  $$('[data-split]', root).forEach(splitText);
  $$('[data-reveal],[data-split],[data-count],[data-w],[data-dash],.mini-bars,.process', root).forEach((el) => io.observe(el));
}

/* ---------- particle constellation ---------- */
export function particles(canvas, { count = 90, link = 130, mouse = true, colors } = {}) {
  const ctx = canvas.getContext('2d');
  let w, h, dpr, raf, pts = [];
  const m = { x: -9999, y: -9999 };
  const css = getComputedStyle(document.documentElement);
  const cols = colors || [css.getPropertyValue('--accent').trim() || '#7b61ff', css.getPropertyValue('--accent-2').trim() || '#ff3d9a', '#00e1ff'];
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 2);
    const r = canvas.getBoundingClientRect(); w = r.width; h = r.height;
    canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(count * Math.min(1, (w * h) / (1400 * 800)) + 20);
    pts = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: Math.random() * 1.8 + .6, c: cols[Math.floor(Math.random() * cols.length)] }));
  };
  const onMove = (e) => { const r = canvas.getBoundingClientRect(); m.x = e.clientX - r.left; m.y = e.clientY - r.top; };
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    const light = document.documentElement.dataset.theme === 'light';
    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      const dx = p.x - m.x, dy = p.y - m.y, d = Math.hypot(dx, dy);
      if (mouse && d < 160) { p.x += dx / d * 1.6; p.y += dy / d * 1.6; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fillStyle = p.c; ctx.globalAlpha = .85; ctx.fill();
    }
    ctx.lineWidth = .7;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < link) { ctx.globalAlpha = (1 - d / link) * (light ? .25 : .35); ctx.strokeStyle = a.c; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(draw);
  };
  resize(); draw();
  addEventListener('resize', resize); addEventListener('pointermove', onMove, { passive: true });
  const stop = () => { cancelAnimationFrame(raf); removeEventListener('resize', resize); removeEventListener('pointermove', onMove); };
  onCleanup(stop);
  return stop;
}

/* ---------- confetti ---------- */
export function confetti(n = 160) {
  if (reduced()) return;
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
  const ctx = c.getContext('2d'); const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.scale(dpr, dpr);
  const cols = ['#7b61ff', '#ff3d9a', '#ffb547', '#2ee59d', '#00e1ff', '#c6ff3d'];
  const ps = Array.from({ length: n }, () => ({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .55, vx: (Math.random() - .5) * 16, vy: -Math.random() * 18 - 6, s: Math.random() * 8 + 4, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[Math.floor(Math.random() * cols.length)] }));
  let f = 0;
  const loop = () => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ps.forEach((p) => { p.vy += .45; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.globalAlpha = Math.max(0, 1 - f / 160); ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
    if (++f < 170) requestAnimationFrame(loop); else c.remove();
  };
  loop();
}

/* ---------- typewriter ---------- */
export function typewriter(el, lines, speed = 34) {
  let li = 0, ci = 0, del = false, t;
  const run = () => {
    const s = lines[li];
    el.innerHTML = s.slice(0, ci) + '<span class="caret"></span>';
    if (!del && ci < s.length) { ci++; t = setTimeout(run, speed + Math.random() * 40); }
    else if (!del) { del = true; t = setTimeout(run, 1800); }
    else if (ci > 0) { ci -= 2; ci = Math.max(0, ci); t = setTimeout(run, 14); }
    else { del = false; li = (li + 1) % lines.length; t = setTimeout(run, 300); }
  };
  run();
  onCleanup(() => clearTimeout(t));
}

/* ---------- segmented control indicator ---------- */
export function initSeg(seg) {
  const ind = seg.querySelector('.seg-ind');
  const place = () => { const a = seg.querySelector('button.active'); if (!a || !ind) return; ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft}px)`; };
  requestAnimationFrame(place);
  seg.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; seg.querySelectorAll('button').forEach((x) => x.classList.toggle('active', x === b)); place(); });
  return place;
}
