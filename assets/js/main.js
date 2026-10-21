import { route, startRouter, setGuard, navigate, render } from './router.js';
import { store } from './store.js';
import { applySettings, toggleTheme } from './theme.js';
import { runPreloader, initCursor, initGlobalFx } from './ui/fx.js';
import { renderLanding } from './pages/landing.js';
import { renderCase, renderAuth } from './pages/public.js';
import { mountShell, setActive, openCommand } from './app/shell.js';
import { renderOverview } from './app/overview.js';
import { renderProjects, renderProject } from './app/projects.js';
import { renderPortfolio } from './app/portfolio.js';
import { renderClients, renderClient } from './app/clients.js';
import { renderInvoices, renderInvoice } from './app/invoices.js';
import { renderMessages, renderCalendar, renderAnalytics, renderTeam, renderSettings } from './app/more.js';

const root = document.getElementById('root');

applySettings();
initGlobalFx();
initCursor();

// public
route('/', () => renderLanding(root));
route('/case/:slug', (p) => renderCase(root, p));
route('/login', () => renderAuth(root, 'login'));
route('/signup', () => renderAuth(root, 'signup'));

// app (shared shell stays mounted between app routes)
const app = (fn) => async (params, { keepShell }) => {
  if (!keepShell || !document.getElementById('view')) mountShell(root);
  setActive();
  const view = document.getElementById('view');
  view.classList.remove('route-enter'); void view.offsetWidth;
  await fn(view, params);
  window.scrollTo({ top: 0 });
};
const A = { shell: 'app', auth: true };
route('/app', app(renderOverview), A);
route('/app/projects', app(renderProjects), A);
route('/app/projects/:id', app(renderProject), A);
route('/app/portfolio', app(renderPortfolio), A);
route('/app/clients', app(renderClients), A);
route('/app/clients/:id', app(renderClient), A);
route('/app/invoices', app(renderInvoices), A);
route('/app/invoices/:id', app(renderInvoice), A);
route('/app/messages', app(renderMessages), A);
route('/app/calendar', app(renderCalendar), A);
route('/app/analytics', app(renderAnalytics), A);
route('/app/team', app(renderTeam), A);
route('/app/settings', app(renderSettings), A);

setGuard((r) => {
  const authed = !!store.get().user;
  if (r.auth && !authed) return '/login';
  return null;
});

// global delegation
document.addEventListener('click', (e) => {
  const tt = e.target.closest('[data-theme-toggle]');
  if (tt) { toggleTheme(e); return; }
  const row = e.target.closest('[data-href]');
  if (row && !e.target.closest('a,button,input,select')) navigate(row.dataset.href);
});
addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (store.get().user) { if (!location.hash.startsWith('#/app')) navigate('/app'); setTimeout(openCommand, location.hash.startsWith('#/app') ? 0 : 400); }
    else navigate('/login');
  }
});
// drop the entry-animation class once done so fixed children (nav, grain) stay viewport-fixed
document.addEventListener('animationend', (e) => { if (e.animationName === 'routeIn') e.target.classList.remove('route-enter'); });
addEventListener('nexora:remount', () => { mountShell(root); render(); });

runPreloader().then(startRouter);
