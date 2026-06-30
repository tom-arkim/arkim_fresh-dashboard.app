/**
 * Exception-first selection for the dashboard live-monitoring strip.
 *
 * The strip surfaces ONLY signals that are trustworthy without sensor baselines:
 *   1. fault — faultCode != 0 (a real device fault)              → red, first
 *   2. stale — newest reading older than STALE_HOURS (offline)    → grey, second
 *
 * Deliberately NO "top movers": without a per-asset baseline a % change is
 * noise (a 3% wiggle on kurtosis means nothing — we don't know this asset's
 * normal), and padding a fixed cap with tiny movers recreates "everything
 * emphasized = nothing emphasized." The strip is sized to however many genuine
 * exceptions exist — 0 is a good, reassuring state, not empty space to fill.
 * (When baselines land, movement-relative-to-baseline can return as a real
 * signal — gate it hard, e.g. > 20%, and never to fill a cap.)
 *
 * All per-asset metrics (movers included) live in the drill-down grid.
 * Rows are derived purely from streamed readings, never the onboarded parameter.
 */
import type { AssetMonitoringGroup, MetricReading } from '@/hooks/useLiveMonitoring';
import { ReadingMetrics } from '@/config/enum';

export const STALE_HOURS = 3; // newest reading older than this ⇒ offline/stale
export const STRIP_MAX = 12; // safety truncation for genuine exceptions (not padding)

export type ExceptionKind = 'fault' | 'stale';

export interface ExceptionRow {
  assetId: string;
  assetName: string;
  /** fault → the faulting metric; stale → the asset's newest reading (for the timestamp). */
  metric: MetricReading;
  kind: ExceptionKind;
  ageHours: number; // hours since the newest reading
  /** stale only → how many of the asset's metrics went dark together. */
  metricCount?: number;
}

export interface ExceptionResult {
  rows: ExceptionRow[]; // sorted, truncated to STRIP_MAX
  overflow: number; // genuine exceptions beyond STRIP_MAX
  faults: number;
  stale: number;
}

/** True for the device fault-code metric (exact, case-sensitive stream name). */
export function isFaultMetric(metricName: string): boolean {
  return metricName === ReadingMetrics.FaultCode; // 'faultCode'
}

/**
 * Select + rank genuine exceptions across asset→metric groups: faults first,
 * then offline sensors (oldest first). Nothing else, no padding.
 *
 * Offline is collapsed to ONE row per asset: when a sensor/gateway stops
 * reporting, all of that asset's metrics go dark together — that's a single
 * event, not N. We also treat offline as superseding faults for that asset:
 * its last readings are stale and can't be trusted as the current fault state.
 */
export function buildExceptions(
  groups: AssetMonitoringGroup[],
  opts: { staleHours?: number; max?: number; nowMs?: number } = {},
): ExceptionResult {
  const staleHours = opts.staleHours ?? STALE_HOURS;
  const max = opts.max ?? STRIP_MAX;
  const now = opts.nowMs ?? Date.now();

  const all: ExceptionRow[] = [];
  for (const g of groups) {
    if (g.metrics.length === 0) continue;

    // Freshest reading across the asset's metrics = its sensor/gateway liveness.
    let newest = g.metrics[0];
    for (const m of g.metrics) {
      if (new Date(m.timeUtc).getTime() > new Date(newest.timeUtc).getTime()) newest = m;
    }
    const newestAge = (now - new Date(newest.timeUtc).getTime()) / 3_600_000;

    if (newestAge > staleHours) {
      // Whole asset is offline → ONE row (count of metrics that went dark).
      all.push({
        assetId: g.assetId,
        assetName: g.assetName,
        metric: newest,
        kind: 'stale',
        ageHours: newestAge,
        metricCount: g.metrics.length,
      });
      continue; // offline supersedes — don't also surface stale "faults"
    }

    // Online asset → surface genuine device faults from current data.
    for (const m of g.metrics) {
      if (isFaultMetric(m.metricName) && m.value !== 0) {
        all.push({
          assetId: g.assetId,
          assetName: g.assetName,
          metric: m,
          kind: 'fault',
          ageHours: (now - new Date(m.timeUtc).getTime()) / 3_600_000,
        });
      }
    }
  }

  all.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'fault' ? -1 : 1; // faults before offline
    if (a.kind === 'stale') return b.ageHours - a.ageHours; // longest offline first
    return a.assetName.localeCompare(b.assetName); // faults: stable by asset
  });

  const faults = all.filter((r) => r.kind === 'fault').length;
  return {
    rows: all.slice(0, max),
    overflow: Math.max(0, all.length - max),
    faults,
    stale: all.length - faults, // offline assets
  };
}
