import { SensorReading } from '@/types/readings/SensorReading';
import AssetDetails from '@/types/equipment/AssetDetails';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { AlertTriangle, CheckCircle2, ChevronRight, WifiOff } from 'lucide-react';

dayjs.extend(utc);

/** Type-matched loading placeholder (banner + history rows), not a line frame. */
export function FaultHistorySkeleton() {
  return (
    <div className="space-y-3 p-1">
      <Skeleton className="h-16 w-full rounded-md" />
      <Skeleton className="h-3 w-24" />
      <div className="rounded-md border divide-y divide-border/60">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="h-5 w-16 rounded-md" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-12 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  readings: SensorReading[];
  assetIds: string[];
  assetMap: Record<string, AssetDetails>;
  /** Narrow a multi-asset view down to one asset's full history. */
  onSelectAsset?: (assetId: string) => void;
}

interface Segment {
  code: number;
  start: number;
  end: number;
  /** True when this run ended because the sensor went dark (not a code change). */
  endedByGap: boolean;
}

interface FaultTimeline {
  segments: Segment[];        // chronological
  lastReadingT: number | null;
  gapThreshold: number;       // ms; gap larger than this = sensor offline
  isStale: boolean;           // newest reading older than gapThreshold
}

const HOUR = 3_600_000;

function humanizeDuration(ms: number): string {
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const rm = mins % 60;
  if (h < 24) return rm ? `${h}h ${rm}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const rh = h % 24;
  return rh ? `${d}d ${rh}h` : `${d}d`;
}

/**
 * Build the fault timeline for one asset. Consecutive equal codes are collapsed
 * into a segment ONLY while readings are continuous — a time gap larger than
 * ~2.5× the inferred sampling interval breaks the segment (the sensor was dark;
 * we don't assert the fault held across a period it wasn't reporting). Duration
 * is the actual reported coverage, never inflated across an offline gap.
 */
function buildFaultTimeline(readings: SensorReading[], assetId: string): FaultTimeline {
  const pts = readings
    .filter((r) => r.assetId === assetId)
    .map((r) => ({ t: dayjs.utc(r.timeUtc).valueOf(), v: r.value }))
    .sort((a, b) => a.t - b.t);

  if (!pts.length) return { segments: [], lastReadingT: null, gapThreshold: HOUR, isStale: false };

  // Infer the sampling interval from the median gap (robust to outliers).
  const gaps: number[] = [];
  for (let i = 1; i < pts.length; i++) gaps.push(pts[i].t - pts[i - 1].t);
  gaps.sort((a, b) => a - b);
  const median = gaps.length ? gaps[Math.floor(gaps.length / 2)] : HOUR;
  const gapThreshold = Math.max(median * 2.5, 5 * 60_000);

  const segments: Segment[] = [];
  let cur = { code: pts[0].v, start: pts[0].t, lastT: pts[0].t };
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i];
    const gap = p.t - cur.lastT;
    if (gap > gapThreshold) {
      // Sensor was dark → close at the LAST reading, not across the gap.
      segments.push({ code: cur.code, start: cur.start, end: cur.lastT, endedByGap: true });
      cur = { code: p.v, start: p.t, lastT: p.t };
    } else if (p.v !== cur.code) {
      segments.push({ code: cur.code, start: cur.start, end: p.t, endedByGap: false });
      cur = { code: p.v, start: p.t, lastT: p.t };
    } else {
      cur.lastT = p.t;
    }
  }
  segments.push({ code: cur.code, start: cur.start, end: cur.lastT, endedByGap: false });

  const lastReadingT = pts[pts.length - 1].t;
  const isStale = Date.now() - lastReadingT > gapThreshold;
  return { segments, lastReadingT, gapThreshold, isStale };
}

const FaultChip = ({ code }: { code: number }) => {
  const ok = code === 0;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums',
        ok ? 'text-st-done border-st-done/50 bg-st-done/10' : 'text-st-overdue border-st-overdue/50 bg-st-overdue/10',
      )}
    >
      {ok ? 'OK' : `Code ${code}`}
    </span>
  );
};

type TimelineItem =
  | { kind: 'seg'; seg: Segment }
  | { kind: 'gap'; start: number; end: number };

/** Interleave segments with the offline gaps that followed them (chronological). */
function timelineItems(tl: FaultTimeline): TimelineItem[] {
  const items: TimelineItem[] = [];
  tl.segments.forEach((seg, i) => {
    items.push({ kind: 'seg', seg });
    if (seg.endedByGap && i < tl.segments.length - 1) {
      items.push({ kind: 'gap', start: seg.end, end: tl.segments[i + 1].start });
    }
  });
  // Trailing offline gap when the sensor is currently stale.
  if (tl.isStale && tl.lastReadingT != null) {
    items.push({ kind: 'gap', start: tl.lastReadingT, end: Date.now() });
  }
  return items;
}

/** Single asset: current state banner + change/offline history (newest first). */
function AssetFaultHistory({ name, tl }: { name: string; tl: FaultTimeline }) {
  if (!tl.segments.length) {
    return <div className="text-sm text-muted-foreground py-6 text-center">No fault data.</div>;
  }
  const current = tl.segments[tl.segments.length - 1];
  const ok = current.code === 0;
  const sinceAgo = tl.lastReadingT != null ? Date.now() - tl.lastReadingT : 0;

  return (
    <div className="space-y-3">
      {/* Current state — distinguishes "active now" from "last reported Nh ago" */}
      <div
        className={cn(
          'flex items-center gap-3 rounded-md border p-3',
          tl.isStale
            ? 'border-border bg-muted/30'
            : ok
              ? 'border-st-done/40 bg-st-done/5'
              : 'border-st-overdue/40 bg-st-overdue/5',
        )}
      >
        {tl.isStale ? (
          <WifiOff className="h-5 w-5 shrink-0 text-muted-foreground" />
        ) : ok ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-st-done" />
        ) : (
          <AlertTriangle className="h-5 w-5 shrink-0 text-st-overdue" />
        )}
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{name}</div>
          <div
            className={cn(
              'text-2xl font-light tabular-nums leading-tight',
              tl.isStale ? 'text-muted-foreground' : ok ? 'text-st-done' : 'text-st-overdue',
            )}
          >
            {ok ? 'OK' : `Code ${current.code}`}
          </div>
        </div>
        <div className="ml-auto text-right text-xs text-muted-foreground">
          {tl.isStale
            ? `last reported ${humanizeDuration(sinceAgo)} ago`
            : `${ok ? 'clear' : 'active'} ${humanizeDuration(Date.now() - current.start)}`}
        </div>
      </div>

      {/* History */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Fault history
        </div>
        <div className="rounded-md border divide-y divide-border/60">
          {[...timelineItems(tl)].reverse().map((item, i) =>
            item.kind === 'gap' ? (
              <div key={i} className="flex items-center gap-3 px-3 py-2 bg-muted/20">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <WifiOff className="h-3.5 w-3.5" /> Sensor offline
                </span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {humanizeDuration(item.end - item.start)}
                </span>
              </div>
            ) : (
              <div key={i} className="flex items-center gap-3 px-3 py-2">
                <FaultChip code={item.seg.code} />
                <span className="text-xs text-muted-foreground tabular-nums">
                  {dayjs(item.seg.start).format('MMM D, HH:mm')}
                </span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {item.seg.endedByGap ? 'reported' : 'held'} {humanizeDuration(item.seg.end - item.seg.start)}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Drill-down for the faultCode metric — a fault-event history, NOT a line chart
 * (codes aren't ordinal). Single asset → current state + change/offline history.
 * Multiple assets → compact per-asset summary; click one for its full timeline.
 */
export default function FaultHistory({ readings, assetIds, assetMap, onSelectAsset }: Props) {
  const ids = assetIds.length ? assetIds : Array.from(new Set(readings.map((r) => r.assetId)));

  if (ids.length === 1) {
    const id = ids[0];
    return <AssetFaultHistory name={assetMap[id]?.name ?? id} tl={buildFaultTimeline(readings, id)} />;
  }

  // Multi-asset: compact summary rows (degrade), click → narrow to one asset.
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Select an asset for its full fault timeline.</p>
      <div className="rounded-md border divide-y divide-border/60">
        {ids.map((id) => {
          const tl = buildFaultTimeline(readings, id);
          const current = tl.segments[tl.segments.length - 1];
          const changes = Math.max(0, tl.segments.length - 1);
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
              {tl.isStale && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <WifiOff className="h-3 w-3" /> offline
                </span>
              )}
              {current ? <FaultChip code={current.code} /> : <span className="text-xs text-muted-foreground">—</span>}
              <span className="text-xs text-muted-foreground tabular-nums w-20 text-right">
                {changes} {changes === 1 ? 'change' : 'changes'}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
