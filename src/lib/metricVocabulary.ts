/**
 * Frontend metric vocabulary for live monitoring widgets.
 *
 * Source of truth: the `ReadingMetrics` enum (src/config/enum.ts) — the exact,
 * case-sensitive `metricName` strings the monitoring backend streams. The casing
 * is intentionally mixed (camelCase for the older VFD/pump metrics, snake_case
 * for the newer vibration/valve metrics) — keys are OPAQUE, do not normalise.
 *
 * `humidity`, `pressure`, and `surface_temperature` are added defensively: they
 * exist elsewhere in the product vocabulary but aren't in ReadingMetrics, so the
 * ingester may emit them. Anything still unmapped falls back to prettify().
 */

// metricName (exact, case-sensitive) → human label
export const METRIC_LABELS: Record<string, string> = {
  // ── ReadingMetrics (the 15 confirmed stream metrics) ──
  power: 'Power',
  faultCode: 'Fault Code',
  torque: 'Torque',
  runHours: 'Run Hours',
  voltage: 'Voltage',
  frequency: 'Frequency',
  motorCurrent: 'Motor Current',
  driveTemperature: 'Drive Temperature',
  numberOfStarts: 'Number of Starts',
  speed: 'Speed',
  temperature: 'Temperature',
  valve_position: 'Valve Position',
  vibration_rms: 'Vibration (RMS)',
  vibration_kurtosis: 'Vibration Kurtosis',
  vibration_crest_factor: 'Vibration Crest Factor',
  // ── Defensive additions (not in ReadingMetrics, but may be streamed) ──
  surface_temperature: 'Surface Temperature',
  humidity: 'Humidity',
  pressure: 'Pressure',
};

// metricName → unit. Used ONLY when the reading's own `unit` field is null/empty.
export const METRIC_UNIT_FALLBACK: Record<string, string> = {
  power: 'kW',
  faultCode: '', // numeric code, unitless
  torque: 'Nm',
  runHours: 'h',
  voltage: 'V',
  frequency: 'Hz',
  motorCurrent: 'A',
  driveTemperature: '°F',
  numberOfStarts: '', // count, unitless
  speed: 'rpm',
  temperature: '°F',
  valve_position: '%',
  vibration_rms: 'mm/s',
  vibration_kurtosis: '', // ratio, unitless
  vibration_crest_factor: '', // ratio, unitless
  surface_temperature: '°F',
  humidity: '%',
  pressure: 'psi',
};

// Display priority within an asset group (lower = earlier). Unknown → after these.
const METRIC_ORDER: string[] = [
  'temperature', 'surface_temperature', 'driveTemperature', 'humidity', 'pressure',
  'vibration_rms', 'vibration_crest_factor', 'vibration_kurtosis',
  'motorCurrent', 'voltage', 'power', 'frequency', 'speed', 'torque',
  'valve_position', 'runHours', 'numberOfStarts', 'faultCode',
];

/** camelCase / snake_case → Title Case, for any metric not in METRIC_LABELS. */
export function prettify(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(' ');
}

/** Human label for a metricName — exact map first, prettify() fallback. */
export function getMetricLabel(metricName: string): string {
  return METRIC_LABELS[metricName] ?? prettify(metricName);
}

/** Resolve unit: the reading's own unit wins; fall back to the map; else ''. */
export function getMetricUnit(metricName: string, unit?: string | null): string {
  if (unit && unit.trim()) return unit;
  return METRIC_UNIT_FALLBACK[metricName] ?? '';
}

/** Sort comparator for metrics within an asset group (priority, then label). */
export function compareMetricNames(a: string, b: string): number {
  const ia = METRIC_ORDER.indexOf(a);
  const ib = METRIC_ORDER.indexOf(b);
  const ra = ia === -1 ? Number.MAX_SAFE_INTEGER : ia;
  const rb = ib === -1 ? Number.MAX_SAFE_INTEGER : ib;
  if (ra !== rb) return ra - rb;
  return getMetricLabel(a).localeCompare(getMetricLabel(b));
}

/**
 * How a metric tile should render (used by MetricWidget + the strip's fault row):
 *  - fault      → status chip (0 = OK, non-zero = fault code). NO sparkline.
 *  - counter    → running total, value only (no sparkline; runHours formatted h).
 *  - bounded    → 0–100% level bar + tiny spark (valve, humidity).
 *  - continuous → value + sparkline (temp, vibration_rms, current, freq, …).
 *  - secondary  → diagnostic detail, hidden behind an expander (kurtosis, crest).
 * No 'gauge' — we have no limit/range to honestly draw one.
 */
export type MetricRenderKind =
  | 'fault'
  | 'counter'
  | 'bounded'
  | 'continuous'
  | 'secondary';

const RENDER_KIND: Record<string, MetricRenderKind> = {
  faultCode: 'fault',
  numberOfStarts: 'counter',
  runHours: 'counter',
  valve_position: 'bounded',
  humidity: 'bounded',
  vibration_kurtosis: 'secondary',
  vibration_crest_factor: 'secondary',
  // everything else (temperature, driveTemperature, surface_temperature,
  // vibration_rms, motorCurrent, voltage, power, frequency, speed, torque,
  // pressure, unknown) → 'continuous'
};

export function getMetricRenderKind(metricName: string): MetricRenderKind {
  return RENDER_KIND[metricName] ?? 'continuous';
}

export function isSecondaryMetric(metricName: string): boolean {
  return getMetricRenderKind(metricName) === 'secondary';
}
