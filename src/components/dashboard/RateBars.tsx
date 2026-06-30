import { SensorReading } from '@/types/readings/SensorReading';
import AssetDetails from '@/types/equipment/AssetDetails';
import { TimeFrame } from '@/config/enum';
import { getMetricLabel } from '@/lib/metricVocabulary';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { ChevronRight } from 'lucide-react';

dayjs.extend(utc);

/** Type-matched loading placeholder (header + bars), not a line-chart frame. */
export function RateBarsSkeleton() {
  const heights = [42, 68, 54, 80, 60, 88, 50, 74, 64, 84, 46, 70];
  return (
    <div className="space-y-3 p-4">
      <Skeleton className="h-6 w-56" />
      <div className="flex items-end gap-2 h-48 pt-2">
        {heights.map((h, i) => (
          <Skeleton key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

interface Props {
  readings: SensorReading[];
  assetIds: string[];
  assetMap: Record<string, AssetDetails>;
  metricName: string;
  timeFrame: TimeFrame;
  onSelectAsset?: (assetId: string) => void;
}

// Bucket granularity follows the visible Hour/Day/Month toggle.
// (Month → per-month: the backend's down_sample for Month is monthly; there's
// no weekly down_sample, so per-week would need a separate fetch — see note.)
const bucketUnit = (tf: TimeFrame): 'hour' | 'day' | 'month' =>
  tf === TimeFrame.Hour ? 'hour' : tf === TimeFrame.Month ? 'month' : 'day';

const labelFmt = (unit: 'hour' | 'day' | 'month') =>
  unit === 'hour' ? 'HH:mm' : unit === 'month' ? 'MMM' : 'MMM D';

interface RateBar {
  bucket: number;
  delta: number;
}

/** Cross-bucket deltas: the RATE per interval, not the cumulative total. */
function barsFor(readings: SensorReading[], assetId: string, unit: 'hour' | 'day' | 'month'): RateBar[] {
  const pts = readings
    .filter((r) => r.assetId === assetId)
    .map((r) => ({ t: dayjs.utc(r.timeUtc).valueOf(), v: r.value }))
    .sort((a, b) => a.t - b.t);
  if (pts.length < 2) return [];

  // Last reading per bucket (series is sorted asc, so last write wins).
  const byBucket = new Map<number, number>();
  for (const p of pts) byBucket.set(dayjs(p.t).startOf(unit).valueOf(), p.v);

  const buckets = Array.from(byBucket.keys()).sort((a, b) => a - b);
  const bars: RateBar[] = [];
  for (let i = 1; i < buckets.length; i++) {
    const delta = byBucket.get(buckets[i])! - byBucket.get(buckets[i - 1])!;
    bars.push({ bucket: buckets[i], delta: Math.max(0, delta) }); // ignore resets in v1
  }
  return bars;
}

function assetTotals(readings: SensorReading[], assetId: string) {
  const vals = readings
    .filter((r) => r.assetId === assetId)
    .map((r) => ({ t: dayjs.utc(r.timeUtc).valueOf(), v: r.value }))
    .sort((a, b) => a.t - b.t);
  if (!vals.length) return { current: 0, windowDelta: 0 };
  return { current: vals[vals.length - 1].v, windowDelta: vals[vals.length - 1].v - vals[0].v };
}

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/** One asset: current total + Δ over window header, then per-interval rate bars. */
function AssetRate({
  name,
  bars,
  totals,
  unit,
  metricLabel,
}: {
  name: string;
  bars: RateBar[];
  totals: { current: number; windowDelta: number };
  unit: 'hour' | 'day' | 'month';
  metricLabel: string;
}) {
  const intervalWord = unit === 'hour' ? '/hr' : unit === 'month' ? '/mo' : '/day';
  return (
    <div className="space-y-2">
      <div className="flex items-baseline gap-3">
        <span className="text-sm font-semibold text-foreground">{name}</span>
        <span className="text-2xl font-light tabular-nums text-foreground">{fmt(totals.current)}</span>
        <span className="text-xs text-muted-foreground">
          {metricLabel} · <span className="text-st-progress font-medium">+{fmt(totals.windowDelta)}</span> over window
        </span>
      </div>
      {bars.length === 0 ? (
        <div className="text-xs text-muted-foreground py-6 text-center">Not enough data for a rate.</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={bars} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <XAxis
              dataKey="bucket"
              tickFormatter={(v: number) => dayjs(v).format(labelFmt(unit))}
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
              itemStyle={{ color: 'var(--foreground)' }}
              labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
              labelFormatter={(v: number) => dayjs(v).format(unit === 'hour' ? 'MMM D, HH:mm' : 'MMM D')}
              formatter={(v: number) => [`+${fmt(v)} ${intervalWord}`, metricLabel]}
              cursor={{ fill: 'var(--muted-foreground)', fillOpacity: 0.1 }}
            />
            <Bar dataKey="delta" fill="var(--primary)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

/**
 * Drill-down for counter metrics (numberOfStarts, runHours) — the RATE per
 * interval as bars, NOT the ever-rising cumulative line. Bucket follows the
 * Hour/Day/Month toggle. Multiple assets → compact rows; click for full detail.
 */
export default function RateBars({ readings, assetIds, assetMap, metricName, timeFrame, onSelectAsset }: Props) {
  const unit = bucketUnit(timeFrame);
  const metricLabel = getMetricLabel(metricName);
  const ids = assetIds.length ? assetIds : Array.from(new Set(readings.map((r) => r.assetId)));

  if (ids.length === 1) {
    const id = ids[0];
    return (
      <AssetRate
        name={assetMap[id]?.name ?? id}
        bars={barsFor(readings, id, unit)}
        totals={assetTotals(readings, id)}
        unit={unit}
        metricLabel={metricLabel}
      />
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Select an asset for its rate detail.</p>
      <div className="rounded-md border divide-y divide-border/60">
        {ids.map((id) => {
          const totals = assetTotals(readings, id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectAsset?.(id)}
              className="w-full text-left flex items-center gap-3 px-3 py-2.5 hover:bg-accent/40 transition-colors"
            >
              <span className="text-sm font-medium text-foreground truncate flex-1">
                {assetMap[id]?.name ?? id}
              </span>
              <span className="text-sm tabular-nums text-foreground">{fmt(totals.current)}</span>
              <span className="text-xs text-st-progress font-medium tabular-nums w-16 text-right">
                +{fmt(totals.windowDelta)}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
