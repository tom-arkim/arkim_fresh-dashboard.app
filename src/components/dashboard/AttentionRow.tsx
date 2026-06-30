import { Badge } from '@/components/ui/shadcn/badge';
import type { AssetHealth } from '@/types/dashboard/facilityHealth';
import { cn } from '@/lib/utils';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import relativeTime from 'dayjs/plugin/relativeTime';
import { AlertTriangle, AlertCircle, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

dayjs.extend(utc);
dayjs.extend(relativeTime);

interface Props {
  asset: AssetHealth;
  onSelect: (asset: AssetHealth) => void;
}

function useReasonLabel() {
  const { t } = useTranslation();
  return (asset: AssetHealth): string => {
    const r = asset.dominantReason;
    if (!r) return t('dashboard.health.reasons.needsReview');
    switch (r.code) {
      case 'overdue_wo':
        return t('dashboard.health.reasons.overdueWo', { count: r.count });
      case 'stuck_wo':
        return t('dashboard.health.reasons.stuckWo', { count: r.count });
      case 'bad_outcome':
        return t('dashboard.health.reasons.badOutcome');
      case 'pm_overdue':
        return t('dashboard.health.reasons.pmOverdue', { count: r.count });
      case 'pm_due_soon':
        return r.count <= 0
          ? t('dashboard.health.reasons.pmDueToday')
          : t('dashboard.health.reasons.pmDueSoon', { count: r.count });
      case 'high_load':
        return t('dashboard.health.reasons.highLoad', { count: r.count });
      default:
        return t('dashboard.health.reasons.needsReview');
    }
  };
}

/**
 * Single exception card in the "Needs attention" 2-column grid.
 * Styled after the .na-card pattern from the design source:
 *   - square icon (rounded-md, not circle)
 *   - asset name + severity chip on the same row
 *   - reason + timestamp below
 *   - "View work orders" CTA at bottom-right
 */
export default function AttentionRow({ asset, onSelect }: Props) {
  const { t } = useTranslation();
  const getReasonLabel = useReasonLabel();
  const isCritical = asset.severity === 'critical';
  const Icon = isCritical ? AlertTriangle : AlertCircle;

  return (
    <button
      type="button"
      onClick={() => onSelect(asset)}
      className={cn(
        // Base card — plain div shape, NOT shadcn Card (wrong padding/gap)
        'w-full text-left rounded-xl border bg-card shadow-sm p-4',
        'flex flex-col transition-colors',
        'hover:border-primary/40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
        // Critical cards get a stronger left-border accent (.na-card.na-down equivalent)
        isCritical
          ? 'border-l-[3px] border-l-destructive border-destructive/40'
          : 'border-border',
      )}
    >
      {/* ── Header row: icon + name + chip ──────────────────────────── */}
      <div className="flex items-start gap-3">
        {/* Icon square — .nac-ic (square, var(--r) radius, 34px) */}
        <div className={cn(
          'flex-none w-8 h-8 rounded-md flex items-center justify-center',
          isCritical ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning',
        )}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Name + severity chip */}
        <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
          <span className={cn(
            'text-sm font-semibold leading-snug',
            isCritical ? 'text-destructive' : 'text-foreground',
          )}>
            {asset.assetName}
          </span>
          {/* .nac-eta chip — Badge fits the design pill exactly */}
          <Badge
            variant={isCritical ? 'destructive' : 'warning'}
            className="flex-none text-[11px] font-bold"
          >
            {isCritical
              ? t('dashboard.health.severity.critical')
              : t('dashboard.health.severity.warning')}
          </Badge>
        </div>
      </div>

      {/* ── Reason + timestamp ────────────────────────────────────────── */}
      {/* .nac-sub — indent to align with name (icon 32px + gap 12px = 44px) */}
      <p className="text-xs text-muted-foreground mt-2 pl-11 leading-tight">
        {getReasonLabel(asset)}
        {asset.reasonTimestamp && (
          <span className="text-muted-foreground/60">
            {' · '}
            {dayjs.utc(asset.reasonTimestamp).local().fromNow()}
          </span>
        )}
      </p>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <div className="flex justify-end mt-3 pt-2 border-t border-border/40">
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-link">
          {t('dashboard.health.viewWorkOrders')}
          <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}
