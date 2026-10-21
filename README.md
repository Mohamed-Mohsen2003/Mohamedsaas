# Nexora — The Operating System for Creative Studios

A complete, fully interactive SaaS showcase: landing page, auth, and a full studio workspace (projects, portfolio, clients, invoices, messages, calendar, analytics, team, settings) — built with **zero dependencies** in vanilla JavaScript, HTML and CSS.

**Live demo:** https://mohamed-mohsen2003.github.io/mohamedsaas/

> Demo login is pre-filled — just press **Sign in**. All companies, people and numbers are fictional demo data stored in your browser (Settings → Data → Reset to restore).

## Highlights

- **Motion everywhere** — preloader with curtain wipe, canvas particle constellation, aurora gradients, split-text reveals, magnetic buttons, 3D tilt cards with glare, custom cursor, scroll-linked hero mockup, pinned horizontal case-study scroller, number tickers, animated SVG charts, confetti, circular theme-switch reveal.
- **Real app behavior** — hash router with auth guard, persistent state store (localStorage), drag-and-drop Kanban, ⌘K command palette, create projects/clients/invoices/events, live invoice totals, mark-as-paid with stamp, chat with typing indicator, CSV / JSON export, print-ready invoices.
- **Design system** — dark & light themes, 5 switchable accent palettes, reduced-motion mode, fully responsive down to 360px.
- **Hand-rolled engines** — SVG line / bar / donut / sparkline charts with tooltips, generative cover art, motion library, toast / modal / dropdown system.

## Structure

```
index.html
assets/
  css/   tokens · base · components · landing · app
  js/
    main.js · router.js · store.js · theme.js
    data/seed.js          fake companies, projects, invoices, analytics
    lib/                  icons, utilities
    ui/                   fx (motion), charts, overlays, cover art
    pages/                landing, case study, auth
    app/                  shell + every dashboard screen
```

## Run locally

Any static server works:

```bash
npx serve .        # or: python3 -m http.server
```

---

Designed & engineered by **Mohamed Mohsen** — full-stack web, mobile & desktop developer, UI/UX and brand designer.
