import useLiveMonitoring from '@/hooks/useLiveMonitoring';
import { buildExceptions, type ExceptionRow } from '@/lib/liveExceptions';
import { Activity, CheckCircle2, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);
dayjs.extend(relativeTime);

interface Props {
  reloadKey?: number;
}

const fmt = (v: number) => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/** A single exception row: fault (red chip with code) or one offline asset. */
function Row({ row }: { row: ExceptionRow }) {
  const navigate = useNavigate();
  const m = row.metric;
  const ago = dayjs.utc(m.timeUtc).local().fromNow();
  const isFault = row.kind === 'fault';
  const count = row.metricCount ?? 0;

  // Click → Monitoring, pre-filtered to this asset (+ the faulting metric).
  const onClick = () =>
    navigate('/monitoring', {
      state: { assetId: row.assetId, metricName: isFault ? m.metricName : undefined },
    });

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 py-2.5 border-b border-border/50 last:border-b-0 hover:bg-accent/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
    >
      <span
        className="h-2 w-2 rounded-full shrink-0"
        style={{ background: isFault ? 'var(--st-overdue)' : 'var(--muted-foreground)' }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">{row.assetName}</span>
          <span className="text-xs text-muted-foreground truncate">
            {isFault ? m.label : 'Sensor offline'}
          </span>
        </div>
      </div>

      {isFault ? (
        <span
          className="shrink-0 inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums"
          style={{ color: 'var(--st-overdue)', borderColor: 'var(--st-overdue)' }}
        >
          {m.unit?.trim() ? `${fmt(m.value)} ${m.unit}` : `Code ${fmt(m.value)}`}
        </span>
      ) : (
        <span className="shrink-0 inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {count} {count === 1 ? 'metric' : 'metrics'}
        </span>
      )}

      <div className="w-20 shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
        {ago}
      </div>
    </button>
  );
}

/**
 * Dashboard live-monitoring section — an exception-first strip: device faults +
 * offline/stale sensors ONLY, sized to however many genuinely exist (no movers,
 * no cap-padding). Zero exceptions across streaming assets → a quiet "all
 * nominal" line. No streaming data at all → the section collapses (null). The
 * full per-asset metric grid lives in the drill-down (AssetLiveGrid).
 */
export default function LiveMonitoring({ reloadKey = 0 }: Props) {
  const { t } = useTranslation();
  const { groups, loading, error } = useLiveMonitoring(reloadKey);

  // No live data (or no MONITORING access) → collapse entirely.
  if (loading || error || groups.length === 0) return null;

  const { rows, overflow, faults, stale } = buildExceptions(groups);

  return (
    <section className="space-y-2">
      {/* Eyebrow + exception counts + drill-down link */}
      <div className="flex items-center gap-2">
        <Activity className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap">
          {t('dashboard.liveMonitoring.title')}
        </span>
        {faults > 0 && (
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--st-overdue)' }}
          >
            {faults} fault
          </span>
        )}
        {stale > 0 && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {stale} offline
          </span>
        )}
        <div className="h-px flex-1 bg-border" />
        <Link
          to="/monitoring"
          className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline whitespace-nowrap"
        >
          View all in Monitoring
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card px-3 sm:px-4">
        {rows.length === 0 ? (
          // Healthy glance — the goal state, not empty filler.
          <div className="flex items-center gap-2.5 py-3">
            <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: 'var(--st-done)' }} />
            <span className="text-sm font-medium text-foreground">All metrics nominal</span>
            <span className="text-xs text-muted-foreground">
              {groups.length} {groups.length === 1 ? 'asset' : 'assets'} streaming · no faults or
              offline sensors
            </span>
          </div>
        ) : (
          <>
            <div className="py-1">
              {rows.map((r) => (
                <Row key={`${r.assetId}:${r.metric.metricName}`} row={r} />
              ))}
            </div>
            {overflow > 0 && (
              <Link
                to="/monitoring"
                className="block py-2 text-xs font-medium text-primary hover:underline"
              >
                +{overflow} more in Monitoring →
              </Link>
            )}
          </>
        )}
      </div>
    </section>
  );
}
