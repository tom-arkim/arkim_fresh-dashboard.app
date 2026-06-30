import { useState } from 'react';
import type { AssetMonitoringGroup } from '@/hooks/useLiveMonitoring';
import MetricWidget from '@/components/dashboard/MetricWidget';
import { isSecondaryMetric } from '@/lib/metricVocabulary';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  groups: AssetMonitoringGroup[];
  loading: boolean;
  error: boolean;
  /** When set, show only this asset's metrics. Omit = all assets. */
  assetId?: string;
  /**
   * Click → drill into time-series. Asset-header click passes the asset's
   * highest-priority metric (group.metrics is pre-sorted by METRIC_ORDER);
   * a widget click passes that specific metric.
   */
  onSelect?: (assetId: string, metricName: string) => void;
}

// Up to this many total metrics, advanced (secondary) tiles render inline
// (de-emphasized) rather than hiding behind a disclosure — they fit a desktop
// grid row, and we shouldn't hide content there's space to show.
const INLINE_ALL_MAX = 4;

/** One asset's tiles. */
function AssetGroup({
  group,
  onSelect,
}: {
  group: AssetMonitoringGroup;
  onSelect?: (assetId: string, metricName: string) => void;
}) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const primary = group.metrics.filter((m) => !isSecondaryMetric(m.metricName));
  const secondary = group.metrics.filter((m) => isSecondaryMetric(m.metricName));
  const selectable = !!onSelect;
  const priorityMetric = group.metrics[0]?.metricName; // pre-sorted by METRIC_ORDER

  // Show advanced inline when everything fits a row; only collapse when it'd wrap.
  const inlineSecondary = group.metrics.length <= INLINE_ALL_MAX;

  const Widget = (metric: AssetMonitoringGroup['metrics'][number]) =>
    selectable ? (
      <button
        key={metric.metricName}
        type="button"
        onClick={() => onSelect!(group.assetId, metric.metricName)}
        className="block w-full text-left rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`${group.assetName} ${metric.label} — open chart`}
      >
        <MetricWidget metric={metric} interactive />
      </button>
    ) : (
      <MetricWidget key={metric.metricName} metric={metric} />
    );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {selectable && priorityMetric ? (
          <button
            type="button"
            onClick={() => onSelect!(group.assetId, priorityMetric)}
            className="group inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary"
          >
            {group.assetName}
            <ChevronRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ) : (
          <h3 className="text-sm font-semibold text-foreground">{group.assetName}</h3>
        )}
        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
          {group.metrics.length}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {primary.map(Widget)}
        {inlineSecondary && secondary.map(Widget)}
      </div>

      {/* Disclosure only when there isn't room to show advanced inline. */}
      {!inlineSecondary && secondary.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            {showAdvanced ? 'Hide' : 'Show'} advanced ({secondary.length})
          </button>
          {showAdvanced && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {secondary.map(Widget)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Full per-asset metric grid (value + sparkline per streamed metric, rendered by
 * type). Presentational — the caller supplies `groups` (so Monitoring can share
 * its useLiveMonitoring data for instant drill-down instead of re-fetching).
 */
export default function AssetLiveGrid({ groups, loading, error, assetId, onSelect }: Props) {
  if (loading || error) return null;
  const shown = assetId ? groups.filter((g) => g.assetId === assetId) : groups;
  if (shown.length === 0) return null;

  return (
    <div className="space-y-4">
      {shown.map((group) => (
        <AssetGroup key={group.assetId} group={group} onSelect={onSelect} />
      ))}
    </div>
  );
}
