import { useEffect, useMemo, useState } from 'react';
import readingService from '@/services/api/readingService';
import useDataStore from '@/store/dataStore';
import { logger } from '@/lib/logger';
import { ReadingDownSample } from '@/config/enum';
import { SensorReading } from '@/types/readings/SensorReading';
import AssetDetails from '@/types/equipment/AssetDetails';
import { getMetricLabel, getMetricUnit, compareMetricNames } from '@/lib/metricVocabulary';

// ── Tunables ────────────────────────────────────────────────────────────────
const LATEST_DAYS = 30;      // window for "most recent reading per asset/metric"
const SERIES_HOURS = 24;     // sparkline window
const PAGE_SIZE = 1000;      // time-series page size
const MAX_PAGES = 10;        // pagination safety cap

// ── Public model ─────────────────────────────────────────────────────────────
export interface SeriesPoint {
  timeUtc: string;
  value: number;
}

export interface MetricReading {
  metricName: string;   // opaque, case-sensitive
  label: string;
  value: number;
  unit: string;
  timeUtc: string;
  series: SeriesPoint[]; // sorted oldest → newest
}

export interface AssetMonitoringGroup {
  assetId: string;
  assetName: string;
  metrics: MetricReading[];
}

interface UseLiveMonitoringResult {
  groups: AssetMonitoringGroup[];
  loading: boolean;
  error: boolean;
}

// ── Time-series fetch with nextToken pagination ──────────────────────────────
async function fetchAllSeries(assetIds: string[]): Promise<SensorReading[]> {
  const all: SensorReading[] = [];
  let nextToken: string | undefined;
  const tzOffset = new Date().getTimezoneOffset() / -60;

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await readingService.getReadings({
      asset_ids: assetIds,
      hours: SERIES_HOURS,
      down_sample: ReadingDownSample.Hour,
      page_size: PAGE_SIZE,
      nextToken,
      metrics: null,
      timezone_offset_hours: tzOffset,
    });
    const rows = res.rows ?? [];
    all.push(...rows);
    // Page again ONLY if this page was full AND there's a token.
    if (rows.length < PAGE_SIZE || !res.nextToken) break;
    nextToken = res.nextToken;
  }
  return all;
}

// ── Grouping: latest → by asset; series → by (asset, metric) ─────────────────
function buildGroups(
  latestRows: SensorReading[],
  seriesRows: SensorReading[],
  assetMap: Record<string, AssetDetails>,
): AssetMonitoringGroup[] {
  // Latest: keep the newest row per (assetId, metricName).
  const latestByKey = new Map<string, SensorReading>();
  for (const r of latestRows) {
    if (!r.assetId || !r.metricName) continue;
    const key = `${r.assetId}::${r.metricName}`;
    const existing = latestByKey.get(key);
    if (!existing || new Date(r.timeUtc).getTime() > new Date(existing.timeUtc).getTime()) {
      latestByKey.set(key, r);
    }
  }

  // Series: bucket points by (assetId, metricName), then sort ascending by time.
  const seriesByKey = new Map<string, SeriesPoint[]>();
  for (const r of seriesRows) {
    if (!r.assetId || !r.metricName) continue;
    const key = `${r.assetId}::${r.metricName}`;
    let arr = seriesByKey.get(key);
    if (!arr) { arr = []; seriesByKey.set(key, arr); }
    arr.push({ timeUtc: r.timeUtc, value: r.value });
  }
  for (const arr of seriesByKey.values()) {
    arr.sort((a, b) => new Date(a.timeUtc).getTime() - new Date(b.timeUtc).getTime());
  }

  // Build widget model — a widget exists ONLY for a (asset, metric) latest row.
  const byAsset = new Map<string, MetricReading[]>();
  for (const [key, r] of latestByKey) {
    const metric: MetricReading = {
      metricName: r.metricName,
      label: getMetricLabel(r.metricName),
      value: r.value,
      unit: getMetricUnit(r.metricName, r.unit),
      timeUtc: r.timeUtc,
      series: seriesByKey.get(key) ?? [],
    };
    let arr = byAsset.get(r.assetId);
    if (!arr) { arr = []; byAsset.set(r.assetId, arr); }
    arr.push(metric);
  }

  return [...byAsset.entries()]
    .map(([assetId, metrics]) => ({
      assetId,
      assetName: assetMap[assetId]?.name ?? assetId.slice(0, 8),
      metrics: metrics.sort((a, b) => compareMetricNames(a.metricName, b.metricName)),
    }))
    .sort((a, b) => a.assetName.localeCompare(b.assetName));
}

/**
 * Loads live monitoring readings for the current site's assets and groups them
 * by asset → metric. Asset IDs come from the core-backed data store (the
 * monitoring backend has no siteId). Widgets are driven purely by latest rows:
 * no row → no widget; no rows at all → empty groups → section collapses.
 */
export function useLiveMonitoring(reloadKey: number = 0): UseLiveMonitoringResult {
  const { assets, assetMap } = useDataStore();
  const assetIds = useMemo(
    () => assets.map((a) => a.id).filter((id): id is string => !!id),
    [assets],
  );

  const [groups, setGroups] = useState<AssetMonitoringGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (assetIds.length === 0) {
        setGroups([]);
        setLoading(false);
        setError(false);
        return;
      }
      setLoading(true);
      setError(false);
      try {
        // One latest call + one (paginated) series call for the whole site.
        const [latest, series] = await Promise.all([
          readingService.getLatestReadings({ asset_ids: assetIds, days: LATEST_DAYS, metrics: null }),
          fetchAllSeries(assetIds),
        ]);
        if (cancelled) return;
        setGroups(buildGroups(latest, series, assetMap));
      } catch (err) {
        if (cancelled) return;
        // 403 (no MONITORING role) / network / empty service → collapse, don't error-spam.
        logger.warn('useLiveMonitoring: failed to load monitoring readings', err);
        setGroups([]);
        setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => { cancelled = true; };
  }, [assetIds, assetMap, reloadKey]);

  return { groups, loading, error };
}

export default useLiveMonitoring;
