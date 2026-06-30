import { Button } from '@/components/ui/shadcn/button';
import { RefreshCw, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import NeedsAttention from '@/components/dashboard/NeedsAttention';
import LiveMonitoring from '@/components/dashboard/LiveMonitoring';
import Analytics from '@/components/dashboard/Analytics';
import { ArkimLoader } from '@/components/ui/ArkimLoader';
import useDataStore from '@/store/dataStore';
import useSiteStore from '@/store/siteStore';

function Dashboard() {
  const { t } = useTranslation();
  const [refetch, setRefetch] = useState(0);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const { isLoadingAssets } = useDataStore();
  const { currentSite } = useSiteStore();

  const handleRefresh = () => setRefetch((n) => n + 1);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="page-header truncate">{t('dashboard.title')}</h1>
          <p className="page-subTitle italic">{t('dashboard.healthSubTitle')}</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} className="shrink-0 gap-2">
          <RefreshCw className="h-4 w-4" />
          {t('common.refresh')}
        </Button>
      </section>

      {/* Facility-switch transition: clear old data → branded loader → new
          facility's data. Keyed on currentSite so each switch re-runs it. */}
      {isLoadingAssets ? (
        <div key={currentSite?.id} className="flex items-center justify-center py-24">
          <ArkimLoader
            size={56}
            label={t('dashboard.loadingFacility', { site: currentSite?.name ?? '' })}
          />
        </div>
      ) : (
        <>
      {/* ── Exception-first facility health (real WO + PM data) ─────────── */}
      <NeedsAttention reloadKey={refetch} />

      {/* ── Live monitoring (value + sparkline per streamed metric) ─────────
          Conditionally rendered — collapses entirely when no asset streams
          data. Scope is value + sparkline only (no thresholds/baseline/trend,
          which the backend doesn't provide). */}
      <LiveMonitoring reloadKey={refetch} />

      {/* ── Fleet analytics — progressive disclosure, collapsed by default ── */}
      <section className="border-t border-border/60 pt-4">
        <button
          type="button"
          onClick={() => setAnalyticsOpen(v => !v)}
          className="flex items-center gap-2 w-full text-left group"
        >
          <ChevronRight
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              analyticsOpen && 'rotate-90',
            )}
          />
          <span className="text-[14px] font-semibold text-foreground">
            {t('dashboard.health.fleetAnalyticsLabel')}
          </span>
          <span className="text-[12px] text-muted-foreground">·</span>
          <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
            {analyticsOpen ? t('common.hide') : t('common.show')}
          </span>
          <div className="h-px flex-1 bg-border ml-1" />
        </button>

        {analyticsOpen && (
          <div className="mt-4">
            <Analytics reloadKey={refetch} />
          </div>
        )}
      </section>
        </>
      )}
    </div>
  );
}

export default Dashboard;
