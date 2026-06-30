import { Card, CardContent } from '@/components/ui/shadcn/card';
import Sparkline from '@/components/dashboard/Sparkline';
import type { MetricReading } from '@/hooks/useLiveMonitoring';
import { getMetricRenderKind } from '@/lib/metricVocabulary';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import relativeTime from 'dayjs/plugin/relativeTime';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

dayjs.extend(utc);
dayjs.extend(relativeTime);

const fmt = (v: number): string => (Number.isInteger(v) ? String(v) : v.toFixed(1));

/**
 * Live-monitoring tile, rendered BY METRIC TYPE (getMetricRenderKind):
 *  - fault      → status chip (0 = green OK, else red "Code N")
 *  - counter    → running total + Δ over the window
 *  - bounded    → 0–100% level bar + tiny sparkline
 *  - continuous → value + sparkline
 *  - secondary  → compact, muted (diagnostic ratios)
 * No gauges — we have no limit/range to honestly draw one.
 *
 * `interactive` adds a click affordance (hover border + bg, fade-in chevron) for
 * the Monitoring grid where a widget drills into its time-series.
 */
export default function MetricWidget({
  metric,
  interactive = false,
}: {
  metric: MetricReading;
  interactive?: boolean;
}) {
  const { t } = useTranslation();
  const kind = getMetricRenderKind(metric.metricName);
  const updated = dayjs.utc(metric.timeUtc).local().fromNow();
  const spark = metric.series.map((p) => p.value);

  const Label = (
    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
      {metric.label}
    </div>
  );
  const Updated = (
    <div className="text-[10px] text-muted-foreground">
      {t('common.lastUpdated')}: {updated}
    </div>
  );
  const Value = ({ muted = false }: { muted?: boolean }) => (
    <div className="flex items-baseline gap-1">
      <span className={`text-2xl font-light tabular-nums leading-none ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>
        {fmt(metric.value)}
      </span>
      {metric.unit && <span className="text-xs font-medium text-muted-foreground">{metric.unit}</span>}
    </div>
  );

  // ── Per-kind body + card class ───────────────────────────────────────────
  let cardCls = 'gap-2 py-3';
  let contentCls = 'px-3 space-y-2';
  let body: React.ReactNode;

  if (kind === 'fault') {
    const ok = metric.value === 0;
    const color = ok ? 'var(--st-done)' : 'var(--st-overdue)';
    body = (
      <>
        {Label}
        <span
          className="inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-sm font-semibold"
          style={{ color, borderColor: color }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
          {ok ? t('common.ok', 'OK') : `Code ${fmt(metric.value)}`}
        </span>
        {Updated}
      </>
    );
  } else if (kind === 'counter') {
    const delta = spark.length >= 2 ? spark[spark.length - 1] - spark[0] : null;
    body = (
      <>
        {Label}
        <Value />
        {delta !== null && delta !== 0 && (
          <div className="text-[11px] font-medium text-muted-foreground">
            <span style={{ color: 'var(--st-progress)' }}>
              {delta > 0 ? '+' : ''}{fmt(delta)}
            </span>{' '}
            <span className="text-muted-foreground/70">(24h)</span>
          </div>
        )}
        {Updated}
      </>
    );
  } else if (kind === 'bounded') {
    const pct = Math.max(0, Math.min(100, metric.value));
    body = (
      <>
        {Label}
        <Value />
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
        </div>
        <Sparkline values={spark} height={20} />
        {Updated}
      </>
    );
  } else if (kind === 'secondary') {
    cardCls = 'gap-1 py-2 bg-muted/30';
    contentCls = 'px-3 space-y-1';
    body = (
      <>
        {Label}
        <Value muted />
      </>
    );
  } else {
    // continuous
    body = (
      <>
        {Label}
        <Value />
        <Sparkline values={spark} />
        {Updated}
      </>
    );
  }

  return (
    <Card
      className={cn(
        cardCls,
        interactive && 'relative group cursor-pointer transition-colors hover:border-primary/40 hover:bg-primary/[0.02]',
      )}
    >
      {interactive && (
        <ChevronRight className="pointer-events-none absolute top-2 right-2 h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      )}
      <CardContent className={contentCls}>{body}</CardContent>
    </Card>
  );
}
