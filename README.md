# Arkim Dashboard

Web dashboard for an industrial equipment-monitoring and maintenance platform — an
**exception-first** operations view that surfaces what needs attention across a
facility's assets, work orders, and live sensor data.

> Portfolio project. This is the React/TypeScript **frontend** (single-page app) of
> a larger system; the backend services it integrates with are separate and are not
> included in this repository.

## The problem

Maintenance and reliability teams at manufacturing and processing facilities juggle
hundreds of assets, a constant backlog of work orders, recurring preventive-
maintenance schedules, and streams of live sensor data. Most tooling buries the few
things that actually need action under everything else — so teams stay reactive,
overdue work slips, and sensor data goes unwatched until something fails.

This dashboard is built around an **exception-first** principle: lead with *what
needs attention* — assets with faults or overdue work, sensors that have gone
offline, maintenance coverage gaps — and demote everything else. A maintenance lead
should see the day's real problems at a glance instead of assembling them by hand.

## What it does

**Facility health (Dashboard)**
- A ranked **"needs attention"** view computed from real work-order and maintenance
  data: per-asset Critical / Warning, total overdue work orders, and "blind spots"
  (assets with no active maintenance coverage), via a tunable severity + ranking model.
- A live-monitoring **exception strip**: device faults and offline/stale sensors
  only — collapsed to one row per asset — so genuine problems aren't lost in noise.
- **Fleet analytics** (work orders per asset, status/source breakdowns, assignee
  workload) kept available but demoted behind a disclosure, so the glance stays clean.

**Live sensor monitoring (Monitoring)**
- A **widget grid** of every streaming asset, each metric rendered *by type* —
  sparkline for continuous signals, a 0–100% bar for bounded ones, a counter with
  rate for cumulative ones, a status chip for fault codes (no fake gauges where
  there's no defined limit).
- Click an asset or metric to **drill into time-series**: zoomable line charts for
  continuous metrics, plus type-specific views — a **fault-event history** (gap-aware,
  distinguishing active from stale) and **rate bars** for counters — instead of
  forcing every metric through a line chart.
- An analyst path (asset/metric multiselect, hour/day/month range) coexists with the
  friendly default.

**Maintenance & work management**
- Work orders: list, detail, create, work logs, attachments, status tracking, and
  overdue derivation.
- Recurring maintenance tasks (recurrence rules), a maintenance calendar/scheduler,
  and task occurrences.
- Equipment management: assets, sensors, monitoring/alarm parameters, and documents.

**Platform**
- Multi-tenant: authenticated per **company**, with **site** (facility) switching
  that cleanly re-scopes all data.
- Light/dark theming, English + Spanish (i18n), and an in-app assistant side panel.
- A built-in **demo mode** that serves seeded data so the UI can be run and explored
  without any backend.

## Architecture & stack

A single-page React application that talks to several backend microservices over HTTP.

**Frontend**
- **React 19** + **TypeScript**, built with **Vite**
- **React Router 7** for routing
- **Tailwind CSS** + **shadcn/ui** (Radix UI primitives) for the UI system
- **Recharts** for data visualization
- **Zustand** + React Context for state (current company/site, assets, auth, theme)
- **React Hook Form** + **Zod** for forms and validation
- **i18next** (English/Spanish), **dayjs**, **lucide-react**

**Integration & auth**
- Integrates with four backend services via separate, environment-configured base
  URLs — **core** (assets, work orders, maintenance, sites, users), **monitoring**
  (sensor metrics/readings), **messaging**, and **onboarding**.
- **AWS Cognito (OIDC)** authentication via `oidc-client-ts`; a shared axios client
  attaches the JWT and tenant (`X-Arkim-CompanyId`) headers and refreshes the token
  on 401.
- The backend services are **not** part of this repository.

**How the pieces fit**
- A layout shell (sidebar + top bar + side panel) wraps routed pages, behind an OIDC
  auth gate.
- On login the app resolves the user's company and sites; switching sites re-fetches
  and re-scopes assets, work orders, and live monitoring.
- The Dashboard's facility-health rollups are derived **client-side** from the core
  work-order/maintenance APIs; live monitoring reads from the metrics service. The
  design deliberately visualizes only what the backend can support honestly (current
  value + recent history), avoiding invented thresholds or predictions.

```
src/
  pages/         Dashboard, Monitoring, WorkOrders, Maintenance*, EquipmentManagement, settings/…
  components/    dashboard widgets, layout shell, work-order & maintenance UI, shadcn/ui
  services/api/  axios clients per backend (core / monitoring / messaging / onboarding)
  store/         Zustand stores (site, data)
  hooks/         useFacilityHealth, useLiveMonitoring, …
  lib/           theming, metric vocabulary, helpers
  i18n/          English / Spanish resources
```

## Running it locally

```bash
npm install
cp .env.template .env    # set API base URLs + Cognito config
npm run dev
```

To explore the UI without standing up the backends, the repo includes a **demo mode**
(`VITE_DEMO_MODE=true`) that intercepts API calls and serves seeded data.

## How it was built

I built this hands-on, end to end — the product direction, UX, and implementation.
AI-assisted development tools were part of my workflow for scaffolding, refactoring,
and iteration; the architecture decisions, the exception-first product framing, and
the review of what shipped were mine.

## Status

A **working prototype / portfolio project** — the web client of a larger industrial-
monitoring system. It runs and is functional against the backend services (or in demo
mode), but it is not production-hardened: expect rough edges, minimal automated tests,
and some features wired for the UI ahead of full backend integration.
