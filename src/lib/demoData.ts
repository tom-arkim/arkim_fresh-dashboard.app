/* ────────────────────────────────────────────────────────────────────────
 * DEV-ONLY DEMO DATA — remove before shipping.
 *
 * Synthesises a realistic demo facility so the v1 facility-health
 * dashboard can be viewed standalone with NO backend. Active only when
 * VITE_DEMO_MODE === 'true'. Wired in via apiClient.ts (axios mock adapter)
 * and the /demo route (DemoDashboard.tsx).
 * ──────────────────────────────────────────────────────────────────────── */
import dayjs from 'dayjs';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { STORAGE_KEYS } from '@/config/constant';

// Gated on DEV so a production `vite build` (import.meta.env.DEV === false)
// statically dead-codes every demo branch and tree-shakes this module out —
// demo data can NEVER reach a real facility, even if VITE_DEMO_MODE leaked in.
export const DEMO_MODE =
  import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true';

const today = dayjs();
const iso = (d: dayjs.Dayjs) => d.toISOString();
const day = (d: dayjs.Dayjs) => d.format('YYYY-MM-DD');

// ── Site + users ──────────────────────────────────────────────────────────
export const DEMO_SITE = {
  id: 'demo-site',
  name: 'North Plant',
  companyId: 'demo-co',
  useMetricSystem: false,
  configuration: {},
};

export const DEMO_USERS = [
  { email: 'alex.morgan@example.com', firstName: 'Alex', lastName: 'Morgan' },
  { email: 'jordan.lee@example.com', firstName: 'Jordan', lastName: 'Lee' },
  { email: 'priya.nair@example.com', firstName: 'Priya', lastName: 'Nair' },
];

// Fake authenticated admin context so the real app shell (sidebar, top bar,
// Ask Arkim, site selector) renders and /dashboard is reachable with no backend.
export const DEMO_CONTEXT = {
  user: {
    userName: 'casey.stone',
    firstName: 'Casey',
    lastName: 'Stone',
    email: 'casey.stone@example.com',
    isAdmin: true,
    isMonitoring: false,
    isTechnician: false,
    isActive: true,
    theme: 'dark',
    language: 'en',
    defaultSite: DEMO_SITE.id,
    assignedSites: [DEMO_SITE.id],
  },
  companyName: 'Acme Manufacturing',
  defaultLanguage: 'en',
  defaultTheme: 'dark',
  useMetricSystem: false,
};

/** Seeds a fake session so OidcProtectedRoute lets the app render. */
export function initDemoSession() {
  if (!DEMO_MODE) return;
  try {
    localStorage.setItem(STORAGE_KEYS.ID_TOKEN, 'demo-token');
    localStorage.setItem(STORAGE_KEYS.SELECTED_COMPANY_ID, DEMO_SITE.companyId);
  } catch {
    /* ignore */
  }
}

// ── Assets ─────────────────────────────────────────────────────────────────
interface DemoAsset {
  id: string;
  name: string;
  type: string;
  hasActivePM: boolean;
}
const ASSETS: DemoAsset[] = [
  { id: 'a-compressor', name: 'Main Compressor', type: 'Compressor', hasActivePM: true },
  { id: 'a-hwp1', name: 'HWP1', type: 'Pump', hasActivePM: true },
  { id: 'a-boiler', name: 'Main Boiler', type: 'Boiler', hasActivePM: true },
  { id: 'a-ahu1', name: 'AHU-1', type: 'Air Handler', hasActivePM: true },
  { id: 'a-aircompb', name: 'Air Compressor B', type: 'Compressor', hasActivePM: true },
  { id: 'a-biflow', name: 'Bi-Flow Table', type: 'Accumulation', hasActivePM: true },
  { id: 'a-encap', name: 'Softgel Encapsulator', type: 'Encapsulator', hasActivePM: true },
  { id: 'a-vmek', name: 'VMek', type: 'Inspection', hasActivePM: true },
  { id: 'a-coolingd', name: 'Cooling Tower D', type: 'Cooling System', hasActivePM: false },
  { id: 'a-conveyorc', name: 'Conveyor Belt C', type: 'Conveyor', hasActivePM: false },
  { id: 'a-chiller2', name: 'Chiller 2', type: 'Chiller', hasActivePM: false },
];

export const DEMO_ASSETS = ASSETS.map((a) => ({
  id: a.id,
  name: a.name,
  type: a.type,
  description: '',
  siteId: DEMO_SITE.id,
  manufacturer: 'Acme',
  model: 'MDL-100',
  status: 1,
  location: 'Plant · West',
  archived: false,
  archivedAt: null,
  archivedBy: null,
  monitors: [],
  sensors: [],
  isVdfAvailable: false,
  vdfMacId: null,
  lastMaintenance: null,
  nextMaintenance: null,
}));

// ── Work orders ─────────────────────────────────────────────────────────────
type WoStatus = 'open' | 'thread_opened' | 'completed' | 'cancelled';
let woSeq = 0;
const mkWo = (opts: {
  assetId: string;
  assetName: string;
  status: WoStatus;
  dueOffsetDays: number;     // relative to today
  createdOffsetDays: number; // negative = in the past
  source?: 'maintenance_task' | 'manual' | 'chat' | 'integration';
  outcome?: 'fixed' | 'not_fixed' | 'partially_fixed';
  assignee?: string;
}) => {
  woSeq += 1;
  const created = today.add(opts.createdOffsetDays, 'day');
  return {
    id: `wo-${woSeq}`,
    companyId: DEMO_SITE.companyId,
    siteId: DEMO_SITE.id,
    assetId: opts.assetId,
    assetName: opts.assetName,
    title: `${opts.assetName} service #${woSeq}`,
    description: 'Auto-generated demo work order.',
    dueDate: day(today.add(opts.dueOffsetDays, 'day')),
    status: opts.status,
    sourceType: opts.source ?? 'maintenance_task',
    createdAtUtc: iso(created),
    threadOpenedAtUtc:
      opts.status === 'thread_opened' ? iso(created.add(1, 'day')) : undefined,
    assignedUserEmails: opts.assignee ? [opts.assignee] : [],
    isArchived: false,
    downtimeMinutes: 0,
    workLogs: opts.outcome
      ? [{ outcome: opts.outcome, performedAtUtc: iso(created.add(2, 'day')) }]
      : [],
  };
};

const WORK_ORDERS: ReturnType<typeof mkWo>[] = [];

// Main Compressor → CRITICAL via multiple overdue open WOs.
for (let i = 0; i < 4; i++) {
  WORK_ORDERS.push(
    mkWo({
      assetId: 'a-compressor',
      assetName: 'Main Compressor',
      status: i % 2 === 0 ? 'open' : 'thread_opened',
      dueOffsetDays: -(3 + i * 2),
      createdOffsetDays: -(8 + i * 2),
      source: i === 0 ? 'integration' : 'maintenance_task',
      assignee: DEMO_USERS[i % DEMO_USERS.length].email,
    })
  );
}

// HWP1 → CRITICAL via a stuck (very old) open WO.
WORK_ORDERS.push(
  mkWo({
    assetId: 'a-hwp1',
    assetName: 'HWP1',
    status: 'thread_opened',
    dueOffsetDays: 2,
    createdOffsetDays: -23,
    source: 'chat',
    assignee: DEMO_USERS[1].email,
  })
);

// Main Boiler → CRITICAL via last completed repair "not fixed" + 1 overdue.
WORK_ORDERS.push(
  mkWo({
    assetId: 'a-boiler',
    assetName: 'Main Boiler',
    status: 'completed',
    dueOffsetDays: -10,
    createdOffsetDays: -12,
    outcome: 'not_fixed',
    assignee: DEMO_USERS[0].email,
  })
);
WORK_ORDERS.push(
  mkWo({
    assetId: 'a-boiler',
    assetName: 'Main Boiler',
    status: 'open',
    dueOffsetDays: -1,
    createdOffsetDays: -4,
    assignee: DEMO_USERS[2].email,
  })
);

// AHU-1 → WARNING via high open load (3 open, none overdue).
for (let i = 0; i < 3; i++) {
  WORK_ORDERS.push(
    mkWo({
      assetId: 'a-ahu1',
      assetName: 'AHU-1',
      status: 'open',
      dueOffsetDays: 5 + i,
      createdOffsetDays: -(1 + i),
      source: 'manual',
      assignee: DEMO_USERS[i % DEMO_USERS.length].email,
    })
  );
}

// Air Compressor B → WARNING via a single open WO not overdue.
WORK_ORDERS.push(
  mkWo({
    assetId: 'a-aircompb',
    assetName: 'Air Compressor B',
    status: 'open',
    dueOffsetDays: 6,
    createdOffsetDays: -2,
    assignee: DEMO_USERS[0].email,
  })
);

// A pile of completed WOs across assets (fleet analytics volume + history).
const completedSpread = [
  'a-compressor', 'a-hwp1', 'a-boiler', 'a-ahu1', 'a-aircompb',
  'a-biflow', 'a-encap', 'a-vmek',
];
completedSpread.forEach((assetId, idx) => {
  const name = ASSETS.find((a) => a.id === assetId)!.name;
  for (let i = 0; i < 3; i++) {
    WORK_ORDERS.push(
      mkWo({
        assetId,
        assetName: name,
        status: 'completed',
        dueOffsetDays: -(5 + i * 3),
        createdOffsetDays: -(6 + i * 3 + idx),
        outcome: 'fixed',
        source: i === 0 ? 'chat' : 'maintenance_task',
        assignee: DEMO_USERS[(idx + i) % DEMO_USERS.length].email,
      })
    );
  }
});

export const DEMO_WORK_ORDERS = WORK_ORDERS;

// ── Maintenance tasks (active-task coverage) ────────────────────────────────
let taskSeq = 0;
export const DEMO_TASKS = ASSETS.filter((a) => a.hasActivePM).map((a) => {
  taskSeq += 1;
  return {
    id: `task-${taskSeq}`,
    companyId: DEMO_SITE.companyId,
    siteId: DEMO_SITE.id,
    assetId: a.id,
    assetName: a.name,
    title: `Weekly Maintenance - ${a.name}`,
    description: 'Routine preventive maintenance.',
    assignedUserEmails: [DEMO_USERS[taskSeq % DEMO_USERS.length].email],
    startDate: day(today.subtract(60, 'day')),
    endDate: null,
    rRule: 'FREQ=WEEKLY',
    isActive: true,
    createdAtUtc: iso(today.subtract(60, 'day')),
  };
});

// ── Task occurrences (backward window: overdue + due-soon PM) ───────────────
let occSeq = 0;
const mkOcc = (assetId: string, title: string, offsetDays: number) => {
  occSeq += 1;
  return {
    taskId: `task-occ-${occSeq}`,
    assetId,
    title,
    description: '',
    assignedUserEmails: [],
    occurrenceDate: day(today.add(offsetDays, 'day')),
  };
};
export const DEMO_OCCURRENCES = [
  // Overdue PM
  mkOcc('a-encap', 'Weekly Maintenance - Softgel Encapsulator', -6),
  mkOcc('a-vmek', 'Weekly Maintenance - VMek', -3),
  // Due soon PM (within 7 days)
  mkOcc('a-biflow', 'Weekly Maintenance - Bi-Flow Table', 4),
  mkOcc('a-aircompb', 'Weekly Maintenance - Air Compressor B', 2),
  mkOcc('a-ahu1', 'Weekly Maintenance - AHU-1', 6),
];

// ── Live monitoring readings (realistic plant metrics) ──────────────────────
// Three streaming assets; metricName strings verbatim from ReadingMetrics
// (+ surface_temperature). Units shipped where the backend would set them;
// null unit on count/code/ratio metrics to exercise the frontend fallback map.
interface DemoMetricSpec { name: string; value: number; unit: string | null; amp: number; }
// `staleHours` shifts an asset's whole series back in time so its newest
// reading is N hours old → exercises the "stale/offline sensor" exception row.
const MONITORING_SPEC: { assetId: string; metrics: DemoMetricSpec[]; staleHours?: number }[] = [
  // Main Compressor — VFD set. faultCode != 0 → leads the exception strip (red).
  { assetId: 'a-compressor', metrics: [
    { name: 'frequency',      value: 58.4,  unit: 'Hz',   amp: 1.6 },
    { name: 'motorCurrent',   value: 47.2,  unit: 'A',    amp: 3.2 },
    { name: 'numberOfStarts', value: 1240,  unit: null,   amp: 0 },
    { name: 'faultCode',      value: 4302,  unit: null,   amp: 0 },
  ] },
  // AHU-1 — Kathabar (temperature + valve). Stale: newest reading ~6h old → offline.
  { assetId: 'a-ahu1', staleHours: 6, metrics: [
    { name: 'temperature',    value: 162.9, unit: '°F',   amp: 4.5 },
    { name: 'valve_position', value: 68,    unit: '%',    amp: 7 },
  ] },
  // HWP1 — motor (vibration + surface temp)
  { assetId: 'a-hwp1', metrics: [
    { name: 'vibration_rms',          value: 3.4,   unit: 'mm/s', amp: 0.5 },
    { name: 'vibration_crest_factor', value: 2.1,   unit: null,   amp: 0.25 },
    { name: 'vibration_kurtosis',     value: 3.2,   unit: null,   amp: 0.35 },
    { name: 'surface_temperature',    value: 118.5, unit: '°F',   amp: 3.2 },
  ] },
];

// Deterministic pseudo-random so the demo is stable across reloads.
let _mseed = 987654321;
const mrnd = () => { _mseed = (_mseed * 1103515245 + 12345) & 0x7fffffff; return _mseed / 0x7fffffff; };

interface DemoReading {
  companyId: string; assetId: string; sensorId: string;
  metricName: string; timeUtc: string; value: number; unit: string | null;
}
const buildMonitoring = () => {
  const latest: DemoReading[] = [];
  const series: DemoReading[] = [];
  MONITORING_SPEC.forEach((spec) => {
    spec.metrics.forEach((m) => {
      const pts: DemoReading[] = [];
      for (let i = 23; i >= 0; i--) {
        // Demo: punch a ~4h sensor-offline gap into the compressor fault-code
        // series so FaultHistory shows an offline break (exercises the
        // gap-aware duration fix, not just a continuous run).
        if (m.name === 'faultCode' && i >= 10 && i <= 13) continue;
        const t = today.subtract(i + (spec.staleHours ?? 0), 'hour');
        let v: number;
        // faultCode: clear (0) for the older 18h, then faults to the code for the
        // most recent ~6h → FaultHistory shows an OK→fault transition + durations.
        if (m.name === 'faultCode') v = i <= 5 ? m.value : 0;
        // numberOfStarts: monotonic ↑ with a VARIED per-hour rate (so the rate
        // bars aren't a flat row of identical bars).
        else if (m.name === 'numberOfStarts') v = m.value - (i + Math.round(2 * Math.sin(i / 2)));
        else {
          const wobble = Math.sin((23 - i) / 3.5) * m.amp * 0.5 + (mrnd() - 0.5) * m.amp;
          v = Math.round((m.value + wobble) * 10) / 10;
        }
        pts.push({
          companyId: DEMO_SITE.companyId, assetId: spec.assetId,
          sensorId: `SIM-${m.name}`, metricName: m.name,
          timeUtc: iso(t), value: v, unit: m.unit,
        });
      }
      series.push(...pts);
      latest.push({ ...pts[pts.length - 1] }); // most recent point = latest reading
    });
  });
  return { latest, series };
};
const DEMO_MONITORING = buildMonitoring();
export const DEMO_MONITORING_LATEST = DEMO_MONITORING.latest;
export const DEMO_MONITORING_SERIES = DEMO_MONITORING.series;

// ── Axios mock adapter ──────────────────────────────────────────────────────
const ok = (config: InternalAxiosRequestConfig, data: unknown): AxiosResponse => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config,
});

// asset_ids[] and metrics[] live in the URL query (built via createArrayQueryParam);
// parse them so the demo backend filters like the real one (scopes by selection).
const parseSel = (url: string) => {
  const p = new URLSearchParams(url.split('?')[1] ?? '');
  return { assetIds: p.getAll('asset_ids'), metrics: p.getAll('metrics') };
};

/** Matches a request URL to demo data; returns [] for anything unmapped. */
export function demoAdapter(
  config: InternalAxiosRequestConfig
): Promise<AxiosResponse> {
  const url = config.url ?? '';
  const { assetIds, metrics } = parseSel(url);
  const bySel = (r: DemoReading) =>
    (assetIds.length === 0 || assetIds.includes(r.assetId)) &&
    (metrics.length === 0 || metrics.includes(r.metricName));

  let data: unknown = [];

  if (url.includes('/auth/context')) data = DEMO_CONTEXT;
  else if (url.includes('/sites/list/context')) data = [DEMO_SITE];
  else if (url.includes('/equipment/list')) data = DEMO_ASSETS;
  else if (url.includes('/work-orders/list/all')) data = DEMO_WORK_ORDERS;
  else if (url.includes('/maintenance-tasks/occurrences')) data = DEMO_OCCURRENCES;
  else if (url.includes('/maintenance-tasks/list')) data = DEMO_TASKS;
  else if (url.includes('/metrics/distinct')) {
    // distinct metric names for the requested assets (drives the metric dropdown)
    data = Array.from(
      new Set(
        DEMO_MONITORING_LATEST
          .filter((r) => assetIds.length === 0 || assetIds.includes(r.assetId))
          .map((r) => r.metricName),
      ),
    );
  } else if (url.includes('metrics/readings/latest')) {
    data = DEMO_MONITORING_LATEST.filter(bySel);
  } else if (url.includes('metrics/readings')) {
    data = { rows: DEMO_MONITORING_SERIES.filter(bySel) };
  }

  return Promise.resolve(ok(config, data));
}
