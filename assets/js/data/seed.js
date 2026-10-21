import { mulberry32 } from '../lib/util.js';

const DAY = 864e5;

const CLIENTS = [
  ['Northwind Labs', 'SaaS', 'United States', 'Olivia Carter'],
  ['Quantum Pixel', 'Gaming', 'Germany', 'Lukas Becker'],
  ['Bluepeak Ventures', 'Finance', 'United Kingdom', 'James Whitmore'],
  ['Solace Health', 'Healthcare', 'United Arab Emirates', 'Layla Al Mansoori'],
  ['Atlas Freight', 'Logistics', 'Saudi Arabia', 'Faisal Al Harbi'],
  ['Verdant Foods', 'Food & Beverage', 'Netherlands', 'Sanne de Vries'],
  ['Nimbus Cloud', 'Cloud Infrastructure', 'United States', 'Ethan Brooks'],
  ['Kairo Fintech', 'Fintech', 'Egypt', 'Omar Hassan'],
  ['Helix Bio', 'Biotech', 'Switzerland', 'Anna Keller'],
  ['Orion Motors', 'Automotive', 'Italy', 'Marco Bianchi'],
  ['Lumen Realty', 'Real Estate', 'Qatar', 'Noor Al Thani'],
  ['Zephyr Travel', 'Travel', 'Spain', 'Lucía Fernández'],
  ['Cobalt Media', 'Media', 'France', 'Camille Laurent'],
  ['Sable & Co', 'Fashion', 'United Kingdom', 'Charlotte Hayes'],
  ['Ember Coffee', 'Retail', 'Kuwait', 'Yousef Al Sabah'],
  ['Pulse Fitness', 'Fitness', 'United States', 'Mia Thompson'],
  ['Arcadia Games', 'Gaming', 'Sweden', 'Erik Lindqvist'],
  ['Vantage Legal', 'Legal', 'Canada', 'Daniel Moreau'],
  ['Monarch Hotels', 'Hospitality', 'United Arab Emirates', 'Hamdan Al Falasi'],
  ['Tidal Energy', 'Energy', 'Norway', 'Ingrid Hansen'],
  ['Crimson Retail', 'E-commerce', 'Egypt', 'Mariam Adel'],
  ['Saffron Kitchens', 'Restaurants', 'Jordan', 'Rami Haddad'],
  ['Polar Logistics', 'Logistics', 'Finland', 'Aino Virtanen'],
  ['Ivory Studio', 'Architecture', 'Morocco', 'Salma Benali'],
];

const TEAM = [
  ['Mohamed Mohsen', 'Founder · Full-Stack Lead', ['React', 'Node', 'Flutter'], 'Cairo'],
  ['Sara Nabil', 'Product Designer', ['Figma', 'UX Research', 'Motion'], 'Alexandria'],
  ['Youssef Tarek', 'Mobile Engineer', ['Flutter', 'Swift', 'Kotlin'], 'Cairo'],
  ['Hana Mostafa', 'Brand Designer', ['Branding', 'Illustrator', 'Type'], 'Giza'],
  ['Karim Fathy', 'Backend Engineer', ['Laravel', 'Postgres', 'AWS'], 'Remote'],
  ['Nour Ehab', 'Shopify & WordPress Dev', ['Liquid', 'WooCommerce', 'PHP'], 'Mansoura'],
  ['Adam Khaled', 'Odoo Consultant', ['Odoo', 'Python', 'ERP'], 'Dubai'],
  ['Laila Samir', 'Video Editor', ['Premiere', 'After Effects', 'Color'], 'Remote'],
];

const TYPES = ['Web App', 'Mobile App', 'Branding', 'Shopify Store', 'WordPress', 'Odoo ERP', 'UI/UX', 'Desktop App', 'Video'];
const TYPE_STACK = {
  'Web App': ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'Tailwind'],
  'Mobile App': ['Flutter', 'Firebase', 'Dart', 'Stripe'],
  'Branding': ['Illustrator', 'Figma', 'Brand Guidelines'],
  'Shopify Store': ['Shopify', 'Liquid', 'Klaviyo', 'Hydrogen'],
  'WordPress': ['WordPress', 'WooCommerce', 'Elementor', 'PHP'],
  'Odoo ERP': ['Odoo 17', 'Python', 'PostgreSQL', 'XML-RPC'],
  'UI/UX': ['Figma', 'Prototyping', 'Design System', 'User Testing'],
  'Desktop App': ['Electron', 'Tauri', 'SQLite', 'React'],
  'Video': ['Premiere Pro', 'After Effects', 'DaVinci Resolve'],
};
const PROJECT_TITLES = [
  ['Northwind Analytics Platform', 'Web App'], ['Quantum Arena Mobile', 'Mobile App'], ['Bluepeak Investor Portal', 'Web App'],
  ['Solace Patient App', 'Mobile App'], ['Atlas Fleet Dashboard', 'Web App'], ['Verdant Rebrand 2026', 'Branding'],
  ['Nimbus Console Redesign', 'UI/UX'], ['Kairo Wallet', 'Mobile App'], ['Helix Lab LIMS', 'Desktop App'],
  ['Orion Configurator 3D', 'Web App'], ['Lumen Property Finder', 'Web App'], ['Zephyr Booking Engine', 'Web App'],
  ['Cobalt Launch Film', 'Video'], ['Sable & Co Store', 'Shopify Store'], ['Ember Loyalty App', 'Mobile App'],
  ['Pulse Coach', 'Mobile App'], ['Arcadia Studio Identity', 'Branding'], ['Vantage Client Hub', 'WordPress'],
  ['Monarch Hotels ERP', 'Odoo ERP'], ['Tidal Energy Monitor', 'Desktop App'], ['Crimson Marketplace', 'Shopify Store'],
  ['Saffron Online Ordering', 'WordPress'], ['Polar Warehouse WMS', 'Odoo ERP'], ['Ivory Portfolio Site', 'WordPress'],
  ['Northwind Design System', 'UI/UX'], ['Kairo Brand Motion', 'Video'], ['Atlas Driver App', 'Mobile App'],
  ['Solace Telehealth Web', 'Web App'], ['Quantum Esports Branding', 'Branding'], ['Monarch Guest App', 'Mobile App'],
  ['Crimson Social Campaign', 'Video'], ['Lumen CRM on Odoo', 'Odoo ERP'], ['Zephyr Travel Rebrand', 'Branding'],
  ['Helix Investor Deck Site', 'UI/UX'],
];
const STATUSES = ['backlog', 'in_progress', 'review', 'done'];
const TASKS = ['Kickoff & discovery workshop', 'Competitor & UX audit', 'Information architecture', 'Wireframes', 'High-fidelity UI', 'Design system tokens', 'Frontend build', 'API integration', 'Auth & roles', 'Payment gateway', 'Performance & SEO pass', 'QA & device testing', 'Client review round', 'Launch & handoff', 'Analytics setup', 'Content migration'];
const EVENT_TYPES = [['Client call', '#7b61ff'], ['Design review', '#ff3d9a'], ['Sprint planning', '#00c8ff'], ['Launch', '#2ee59d'], ['Deadline', '#ff5470'], ['Workshop', '#ffb547']];
const MSG_SNIPPETS = {
  them: ['Hey Mohamed! Quick question about the latest build 👀', 'The new dashboard looks incredible, the team loved it.', 'Can we move the review call to Thursday?', 'We need the invoice for this milestone, please.', 'Is the mobile version ready for TestFlight?', 'The animations are 🔥 — can we add one to the pricing page too?', 'Our CEO wants to see the case study before launch.', 'Payment sent ✅ please confirm.', 'Can you share the Figma link again?', 'Love the new color palette!'],
  me: ['Sure! Sending it over in a few minutes.', 'Absolutely — I just pushed the update to staging.', 'Thursday 2 PM works perfectly for me.', 'Invoice is generated, you should have it in your inbox.', 'Yes, build #48 is on TestFlight now 🚀', 'On it. I will prepare two motion options for you.', 'Received, thank you! Starting the next milestone today.', 'Here you go — the link has edit access for your team.'],
};

export function createSeed() {
  const r = mulberry32(20261021);
  const pick = (a) => a[Math.floor(r() * a.length)];
  const between = (a, b) => a + r() * (b - a);
  const int = (a, b) => Math.floor(between(a, b + 1));
  const now = Date.now();
  const iso = (offsetDays) => new Date(now + offsetDays * DAY).toISOString();

  const team = TEAM.map(([name, role, skills, city], i) => ({
    id: 'm' + (i + 1), name, role, skills, city, email: name.toLowerCase().replace(/\s+/g, '.') + '@nexora.studio',
    utilization: int(55, 98), online: r() > .35, projects: 0, joined: iso(-int(120, 1400)),
  }));

  const clients = CLIENTS.map(([name, industry, country, contact], i) => {
    const status = i < 16 ? 'Active' : pick(['Lead', 'Paused', 'Active', 'Churned', 'Lead']);
    return {
      id: 'c' + (i + 1), name, industry, country, contact,
      email: contact.split(' ')[0].toLowerCase() + '@' + name.toLowerCase().replace(/[^a-z]/g, '') + '.com',
      phone: '+' + int(1, 98) + ' ' + int(100, 999) + ' ' + int(100, 999) + ' ' + int(1000, 9999),
      status, since: iso(-int(40, 1100)), rating: +(between(4.2, 5)).toFixed(1),
      website: 'www.' + name.toLowerCase().replace(/[^a-z]/g, '') + '.com', notes: '',
    };
  });

  const projects = PROJECT_TITLES.map(([title, type], i) => {
    const client = clients[i % clients.length];
    const status = i < 6 ? 'in_progress' : STATUSES[int(0, 3)];
    const dur = int(30, 140);
    const start = status === 'done' ? -int(dur + 10, 320) : int(7, 95) - dur;
    const progress = status === 'done' ? 100 : status === 'review' ? int(80, 96) : status === 'in_progress' ? int(20, 78) : int(0, 12);
    const budget = Math.round(between(4, 85)) * 1000;
    const members = [...team].sort(() => r() - .5).slice(0, int(2, 4)).map((m) => m.id);
    members.forEach((id) => team.find((m) => m.id === id).projects++);
    const nTasks = int(6, 11);
    const tasks = TASKS.slice(0, nTasks).map((t, k) => ({ id: 't' + i + '_' + k, title: t, done: k / nTasks < progress / 100, assignee: pick(members) }));
    return {
      id: 'p' + (i + 1), slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'), title, type, clientId: client.id,
      status, priority: pick(['Low', 'Medium', 'High', 'High', 'Urgent']), budget, spent: Math.round(budget * (progress / 100) * between(.7, 1.1)),
      progress, start: iso(start), due: iso(start + dur), members, tasks,
      stack: TYPE_STACK[type], featured: status === 'done' || r() > .55,
      likes: int(120, 4800), views: int(2000, 98000), seed: i * 7 + 3,
      summary: `A ${type.toLowerCase()} crafted for ${client.name} — focused on speed, clarity and a premium feel that converts.`,
      results: [
        [int(28, 240) + '%', pick(['Conversion lift', 'More sign-ups', 'Revenue growth', 'Faster checkout'])],
        [(between(0.6, 1.6)).toFixed(1) + 's', 'Largest contentful paint'],
        [int(92, 100) + '', 'Lighthouse score'],
        [int(10, 400) + 'k', pick(['Monthly users', 'App installs', 'Impressions', 'Orders processed'])],
      ],
    };
  });

  let invNo = 1;
  const invoices = [];
  for (let i = 0; i < 68; i++) {
    const p = projects[int(0, projects.length - 1)];
    const issue = -int(0, 360);
    const items = Array.from({ length: int(1, 4) }, () => {
      const d = pick(['Design milestone', 'Frontend development', 'Backend & API', 'Mobile build (iOS/Android)', 'Brand identity package', 'Shopify theme customization', 'Odoo module setup', 'Motion & video edit', 'Maintenance retainer', 'SEO & performance']);
      return { desc: d, qty: int(1, 4), rate: Math.round(between(3, 26)) * 100 };
    });
    const due = issue + pick([7, 14, 30]);
    let status = due < -2 ? (r() > .14 ? 'paid' : 'overdue') : r() > .8 ? 'draft' : r() > .45 ? 'pending' : 'paid';
    invoices.push({
      id: 'i' + i, number: 'INV-2026-' + String(invNo++).padStart(4, '0'), clientId: p.clientId, projectId: p.id,
      issue: iso(issue), due: iso(due), items, tax: pick([0, 5, 14]), currency: 'USD', status,
      paidAt: status === 'paid' ? iso(Math.min(0, due - int(0, 6))) : null,
    });
  }
  invoices.sort((a, b) => new Date(b.issue) - new Date(a.issue));

  const threads = clients.slice(0, 11).map((c, i) => {
    const msgs = [];
    let t = now - int(1, 9) * DAY;
    const n = int(4, 10);
    for (let k = 0; k < n; k++) {
      const me = k % 2 === 1;
      msgs.push({ id: 'msg' + i + k, me, text: pick(me ? MSG_SNIPPETS.me : MSG_SNIPPETS.them), at: new Date(t).toISOString() });
      t += int(3, 300) * 60000;
    }
    return { id: 'th' + i, clientId: c.id, unread: i < 4 ? int(1, 3) : 0, messages: msgs };
  });
  threads.sort((a, b) => new Date(b.messages.at(-1).at) - new Date(a.messages.at(-1).at));

  const events = [];
  for (let i = 0; i < 46; i++) {
    const [type, color] = pick(EVENT_TYPES);
    const p = pick(projects);
    const d = new Date(now + int(-35, 50) * DAY);
    d.setHours(int(9, 17), pick([0, 30]), 0, 0);
    events.push({ id: 'e' + i, title: `${type} · ${p.title.split(' ').slice(0, 2).join(' ')}`, type, color, at: d.toISOString(), projectId: p.id, duration: pick([30, 45, 60, 90]) });
  }

  const notifications = [
    ['Payment received', 'Northwind Labs paid INV-2026-0003 · $12,400', 'wallet', '#2ee59d', 0.2],
    ['New comment', 'Olivia left feedback on “Dashboard v3”', 'chat', '#7b61ff', 1.1],
    ['Deadline approaching', 'Kairo Wallet milestone is due in 2 days', 'clock', '#ffb547', 3],
    ['New lead', 'Polar Logistics requested a proposal', 'sparkles', '#ff3d9a', 5],
    ['Invoice overdue', 'Crimson Retail invoice is 4 days overdue', 'receipt', '#ff5470', 9],
    ['Build deployed', 'Atlas Fleet Dashboard v2.4 is live 🚀', 'rocket', '#00c8ff', 20],
    ['5-star review', 'Solace Health rated the project 5.0 ★', 'star', '#ffb547', 30],
    ['Team update', 'Sara joined “Zephyr Booking Engine”', 'users', '#7b61ff', 48],
  ].map(([title, body, ic, color, h], i) => ({ id: 'n' + i, title, body, icon: ic, color, at: new Date(now - h * 3600e3).toISOString(), read: i > 3 }));

  const activity = [
    ['Sara Nabil', 'uploaded 12 new screens to', 'Northwind Analytics Platform', '#ff3d9a'],
    ['Youssef Tarek', 'shipped build #48 of', 'Kairo Wallet', '#00c8ff'],
    ['Mohamed Mohsen', 'sent invoice INV-2026-0004 to', 'Bluepeak Ventures', '#2ee59d'],
    ['Karim Fathy', 'merged 7 pull requests in', 'Atlas Fleet Dashboard', '#7b61ff'],
    ['Hana Mostafa', 'delivered brand guidelines for', 'Verdant Rebrand 2026', '#ffb547'],
    ['Adam Khaled', 'configured inventory module for', 'Monarch Hotels ERP', '#ff6b5b'],
    ['Laila Samir', 'exported final cut of', 'Cobalt Launch Film', '#c86bff'],
  ].map(([who, what, target, color], i) => ({ id: 'a' + i, who, what, target, color, at: new Date(now - (i * 2.3 + .3) * 3600e3).toISOString() }));

  // analytics
  const traffic = Array.from({ length: 90 }, (_, i) => {
    const base = 1800 + i * 22 + Math.sin(i / 4) * 340 + (i % 7 === 5 || i % 7 === 6 ? -380 : 0);
    return { d: iso(i - 89), visitors: Math.round(base + between(-160, 220)), leads: Math.round(base / 95 + between(-3, 6)) };
  });
  const analytics = {
    traffic,
    sources: [['Organic search', 38], ['Direct', 22], ['Referral', 14], ['Social', 17], ['Email', 9]],
    countries: [['United States', 28], ['Saudi Arabia', 16], ['UAE', 14], ['Egypt', 12], ['Germany', 9], ['United Kingdom', 8], ['Others', 13]],
    devices: [['Desktop', 58], ['Mobile', 36], ['Tablet', 6]],
    pages: [['/work/northwind-analytics', 18420, 3.2], ['/services/web-apps', 12210, 2.6], ['/pricing', 9870, 4.1], ['/work/kairo-wallet', 8640, 2.9], ['/about', 5210, 1.8], ['/contact', 4120, 6.4]],
  };

  return {
    version: 4,
    user: null,
    profile: { name: 'Mohamed Mohsen', email: 'demo@nexora.app', role: 'Founder & Lead Engineer', company: 'Nexora Studio', location: 'Cairo, Egypt', bio: 'Full-stack developer & designer building fast, beautiful products for clients across MENA, the US and Europe.' },
    settings: { theme: 'dark', accent: 'violet', cursor: true, reduceMotion: false, collapsed: false, emailNotif: true, pushNotif: true, weekly: false, currency: 'USD', twofa: true },
    clients, team, projects, invoices, threads, events, notifications, activity, analytics,
  };
}
