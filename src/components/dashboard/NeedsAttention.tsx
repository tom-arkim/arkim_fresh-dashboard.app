import React, { useState } from 'react';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { cn } from '@/lib/utils';
import useFacilityHealth from '@/hooks/useFacilityHealth';
import useSiteStore from '@/store/siteStore';
import type { AssetHealth } from '@/types/dashboard/facilityHealth';
import AttentionRow from '@/components/dashboard/AttentionRow';
import { AlertCircle, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// ── Stat tile used in the facility health hero band ───────────────────────
// Matches .fh-stat / .fh-num / .fh-k from the design source.
const StatTile: React.FC<{
  label: string;
  value: number;
  tone?: 'critical' | 'warning' | null;
  first?: boolean;
}> = ({ label, value, tone, first }) => (
  <div className={cn(
    'px-4 sm:px-5 text-center',
    !first && 'border-l border-border/50',
  )}>
    {/* .fh-num: font-weight 200 = font-extralight; 36px ≈ text-3xl */}
    <div className={cn(
      'text-3xl font-extralight tabular-nums leading-none',
      tone === 'critical' ? 'text-destructive' :
      tone === 'warning'  ? 'text-warning' :
      'text-foreground',
    )}>
      {value}
    </div>
    {/* .fh-k */}
    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1.5 whitespace-nowrap">
      {label}
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────

interface Props {
  reloadKey?: number;
}

const BLIND_SPOT_PREVIEW = 5;

export default function NeedsAttention({ reloadKey = 0 }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentSite } = useSiteStore();
  const { summary, exceptions, blindSpots, loading, error } = useFacilityHealth(reloadKey);
  const [showAllBlindSpots, setShowAllBlindSpots] = useState(false);

  const handleSelect = (_asset: AssetHealth) => {
    navigate('/work-orders');
  };

  const hasAttention = summary.attentionCount > 0;
  const siteName = currentSite?.name ?? '';

  // ── Loading: skeleton mirrors the hero + 4 cards ──────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[90px] w-full rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[0, 1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[110px] w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 px-5 py-4">
        <AlertCircle className="h-5 w-5 text-destructive flex-none" />
        <div>
          <p className="text-sm font-semibold text-destructive">
            {t('dashboard.health.errorTitle')}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t('dashboard.health.errorBody')}
          </p>
        </div>
      </div>
    );
  }

  // ── Banner colour set ─────────────────────────────────────────────────
  const bannerBorder = hasAttention
    ? 'border-destructive/40 border-l-destructive'
    : 'border-success/40 border-l-success';
  const bannerBg = hasAttention ? 'bg-destructive/[0.03]' : 'bg-success/[0.03]';
  const dotColor  = hasAttention ? 'bg-destructive' : 'bg-success';
  const dotWrap   = hasAttention ? 'bg-destructive/15' : 'bg-success/15';
  const textColor = hasAttention ? 'text-destructive' : 'text-success';

  const verdictTitle   = hasAttention
    ? t('dashboard.health.bannerTitle')
    : t('dashboard.health.allClearTitle');
  const verdictSubtitle = siteName
    ? (hasAttention
        ? t('dashboard.health.bannerSubtitle',   { site: siteName })
        : t('dashboard.health.allClearSubtitle', { site: siteName }))
    : '';

  // ── Stats definition ──────────────────────────────────────────────────
  const stats = [
    {
      label: t('dashboard.health.summary.critical'),
      value: summary.criticalCount,
      tone: summary.criticalCount  > 0 ? 'critical' as const : null,
    },
    {
      label: t('dashboard.health.summary.warning'),
      value: summary.warningCount,
      tone: summary.warningCount   > 0 ? 'warning'  as const : null,
    },
    {
      label: t('dashboard.health.summary.overdueWos'),
      value: summary.overdueWoTotal,
      tone: summary.overdueWoTotal > 0 ? 'critical' as const : null,
    },
    {
      label: t('dashboard.health.summary.blindSpots'),
      value: summary.blindSpotCount,
      tone: null,
    },
  ];

  return (
    <div className="space-y-5">

      {/* ══════════════════════════════════════════════════════════════
          FACILITY HEALTH HERO — .fh
          Single card: left accent border · circle badge · verdict text
          · stat strip (thin numbers separated by vertical dividers)
      ═══════════════════════════════════════════════════════════════ */}
      <div className={cn(
        'rounded-xl border border-l-4 shadow-sm px-5 sm:px-6 py-5',
        bannerBorder,
        bannerBg,
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">

          {/* Left: circle badge + verdict ─────────────────────────── */}
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            {/* .fh-badge: circle with inner dot */}
            <div className={cn('flex-none w-11 h-11 rounded-full flex items-center justify-center', dotWrap)}>
              <div className={cn('w-3.5 h-3.5 rounded-full', dotColor)} />
            </div>
            <div className="min-w-0">
              {/* .fh-label: ~22px, font-weight 400 */}
              <div className={cn('text-[21px] font-normal leading-tight', textColor)}>
                {verdictTitle}
              </div>
              {/* .fh-serif: italic, muted */}
              <div className="text-sm italic text-muted-foreground mt-0.5 truncate">
                {verdictSubtitle}
              </div>
            </div>
          </div>

          {/* Right: stat strip ────────────────────────────────────── */}
          {/* Mobile: 4-col grid below the verdict.
              sm+: flex row with left-border divider from the verdict block */}
          <div className={cn(
            'grid grid-cols-4 sm:flex',
            'border-t sm:border-t-0 sm:border-l border-border/50',
            'pt-4 sm:pt-0',
          )}>
            {stats.map((s, i) => (
              <StatTile
                key={s.label}
                label={s.label}
                value={s.value}
                tone={s.tone}
                first={i === 0}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          NEEDS ATTENTION SECTION — .na-h + .na-grid
      ═══════════════════════════════════════════════════════════════ */}
      {hasAttention ? (
        <section>
          {/* .na-h: section label + count pill */}
          <div className="flex items-baseline gap-2.5 mb-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {t('dashboard.health.needsAttentionLabel')}
            </span>
            <span className="inline-flex items-center justify-center text-[11px] font-bold text-destructive bg-destructive/10 rounded-full px-2 py-0.5 leading-none">
              {summary.attentionCount}
            </span>
          </div>

          {/* .na-grid: 2-column responsive grid of exception cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {exceptions.map(asset => (
              <AttentionRow key={asset.assetId} asset={asset} onSelect={handleSelect} />
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 px-6 py-8 text-center">
          <p className="text-sm italic text-muted-foreground">
            {t('dashboard.health.allClearBody')}
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          BLIND SPOTS — monitoring gaps, not faults, styled muted
      ═══════════════════════════════════════════════════════════════ */}
      {blindSpots.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-1.5">
            <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
              {t('dashboard.health.blindSpotsLabel')}
            </span>
            <span className="inline-flex items-center justify-center text-[11px] font-bold text-muted-foreground bg-muted/40 rounded-full px-2 py-0.5 leading-none ml-0.5">
              {blindSpots.length}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mb-2.5">
            {t('dashboard.health.blindSpotsHint')}
          </p>
          <div className="flex flex-wrap gap-2">
            {(showAllBlindSpots ? blindSpots : blindSpots.slice(0, BLIND_SPOT_PREVIEW)).map(a => (
              <span
                key={a.assetId}
                className="inline-flex items-center rounded-md border border-border bg-card px-2.5 py-1 text-xs text-foreground"
              >
                {a.assetName}
              </span>
            ))}
            {blindSpots.length > BLIND_SPOT_PREVIEW && (
              <button
                type="button"
                onClick={() => setShowAllBlindSpots(v => !v)}
                className="inline-flex items-center rounded-md px-2.5 py-1 text-xs text-link hover:underline"
              >
                {showAllBlindSpots
                  ? t('common.showLess')
                  : t('dashboard.health.blindSpotsMore', {
                      count: blindSpots.length - BLIND_SPOT_PREVIEW,
                    })}
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
