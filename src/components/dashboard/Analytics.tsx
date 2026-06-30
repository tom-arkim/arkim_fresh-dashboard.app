import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { Button } from '@/components/ui/shadcn/button';
import { WorkOrderStatus, WorkOrderSourceType } from '@/config/enum';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Box, ClipboardList, BookOpenText, CheckCircle2, ShieldCheck, Download } from 'lucide-react';
import useSiteStore from '@/store/siteStore';
import equipmentService from '@/services/api/equipmentService';
import maintenanceTaskService from '@/services/api/maintenanceTaskService';
import workOrderService from '@/services/api/workOrderService';
import MessengerService from '@/services/ui/messengerService';
import useDataStore from '@/store/dataStore';
import AssetDetails from '@/types/equipment/AssetDetails';
import { MaintenanceTask } from '@/types/maintenance/MaintenanceTask';
import { WorkOrder } from '@/types/maintenance/WorkOrder';

// ── Types ──────────────────────────────────────────────────────────────────
interface AnalyticsProps {
  /** Increment to trigger a manual reload (e.g. from the dashboard refresh button). */
  reloadKey?: number;
}

interface KpiTileProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'destructive' | 'info';
  loading?: boolean;
}

// ── Unified work-order status colours (same --st-* tokens as the rest of the app) ──
const STATUS_SERIES = [
  { key: 'open',       labelKey: 'workOrders.analytics.open',       color: 'var(--st-open)',     opacity: 1 },
  { key: 'inProgress', labelKey: 'workOrders.analytics.inProgress', color: 'var(--st-progress)', opacity: 1 },
  { key: 'completed',  labelKey: 'workOrders.analytics.completed',  color: 'var(--st-done)',     opacity: 1 },
  { key: 'cancelled',  labelKey: 'workOrders.analytics.cancelled',  color: 'var(--st-cancel)',   opacity: 1 },
] as const;

const WORKLOAD_SERIES = STATUS_SERIES.slice(0, 3); // open · in progress · completed

const SOURCE_SERIES = [
  { key: WorkOrderSourceType.MaintenanceTask, labelKey: 'workOrders.analytics.sourceTask',        color: 'var(--primary)',     opacity: 1 },
  { key: WorkOrderSourceType.Manual,          labelKey: 'workOrders.analytics.sourceManual',      color: 'var(--warning)',     opacity: 1 },
  { key: WorkOrderSourceType.Chat,            labelKey: 'workOrders.analytics.sourceChat',        color: 'var(--success)',     opacity: 1 },
  { key: WorkOrderSourceType.Integration,     labelKey: 'workOrders.analytics.sourceIntegration', color: 'var(--link)',        opacity: 1 },
] as const;

const TOOLTIP_STYLE = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 12,
} as const;

// ── KPI Tile ───────────────────────────────────────────────────────────────
const KpiTile: React.FC<KpiTileProps> = ({
  label, value, sub, icon, variant = 'default', loading = false,
}) => {
  const wrapCls: Record<string, string> = {
    default: 'bg-card border',
    warning: 'border border-warning bg-warning/10',
    success: 'border border-success bg-success/10',
    destructive: 'border border-destructive bg-destructive/10',
    info: 'border border-primary bg-primary/10',
  };
  const valCls: Record<string, string> = {
    default: 'text-foreground',
    warning: 'text-warning',
    success: 'text-success',
    destructive: 'text-destructive',
    info: 'text-primary',
  };
  const icoCls: Record<string, string> = {
    default: 'text-muted-foreground',
    warning: 'text-warning',
    success: 'text-success',
    destructive: 'text-destructive',
    info: 'text-primary',
  };

  return (
    <div className={`rounded-xl p-3 sm:p-4 flex flex-col gap-1.5 ${wrapCls[variant]}`}>
      <div className="flex items-start justify-between gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-tight">
          {label}
        </span>
        <span className={`${icoCls[variant]} shrink-0`}>{icon}</span>
      </div>
      {loading ? (
        <Skeleton className="h-7 w-12 mt-1" />
      ) : (
        <>
          <span className={`text-2xl sm:text-3xl font-bold leading-none tabular-nums ${valCls[variant]}`}>
            {value}
          </span>
          {sub && (
            <span className="text-[11px] text-muted-foreground leading-tight">{sub}</span>
          )}
        </>
      )}
    </div>
  );
};

// ── Inline legend (colored dots) ────────────────────────────────────────────
const SeriesLegend: React.FC<{ items: { label: string; color: string; opacity: number }[] }> = ({ items }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
    {items.map((it) => (
      <span key={it.label} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: it.color, opacity: it.opacity }} />
        {it.label}
      </span>
    ))}
  </div>
);

// ── Chart Card ───────────────────────────────────────────────────────────────
const ChartCard: React.FC<{
  title: string;
  subtitle?: string;
  headerRight?: React.ReactNode;
  loading?: boolean;
  skeletonHeight?: number;
  children: React.ReactNode;
}> = ({ title, subtitle, headerRight, loading = false, skeletonHeight = 280, children }) => (
  <Card>
    <CardHeader>
      <CardTitle className="flex flex-wrap items-start justify-between gap-3 font-normal">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          {subtitle && <div className="text-xs text-muted-foreground mt-0.5 font-normal">{subtitle}</div>}
        </div>
        {headerRight && <div className="flex items-center gap-2 flex-wrap">{headerRight}</div>}
      </CardTitle>
    </CardHeader>
    <CardContent>
      {loading
        ? <Skeleton style={{ height: skeletonHeight }} className="w-full rounded-lg" />
        : children}
    </CardContent>
  </Card>
);

// ── Time range helpers ───────────────────────────────────────────────────────
type TimeRangeKey =
  | 'allTime' | 'thisWeek' | 'lastWeek'
  | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear';

const getRange = (range: TimeRangeKey) => {
  const now = new Date();
  const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);
  if (range === 'allTime') return { start: new Date(0), end: new Date(8640000000000000) };
  const isoDay = (now.getDay() + 6) % 7;
  switch (range) {
    case 'thisWeek': {
      const start = new Date(now); start.setDate(now.getDate() - isoDay); start.setHours(0, 0, 0, 0);
      return { start, end: todayEnd };
    }
    case 'lastWeek': {
      const end = new Date(now); end.setDate(now.getDate() - isoDay - 1); end.setHours(23, 59, 59, 999);
      const start = new Date(end); start.setDate(end.getDate() - 6); start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case 'thisMonth': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1); start.setHours(0, 0, 0, 0);
      return { start, end: todayEnd };
    }
    case 'lastMonth': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1); start.setHours(0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0); end.setHours(23, 59, 59, 999);
      return { start, end };
    }
    case 'thisYear': {
      const start = new Date(now.getFullYear(), 0, 1); start.setHours(0, 0, 0, 0);
      return { start, end: todayEnd };
    }
    case 'lastYear': {
      const start = new Date(now.getFullYear() - 1, 0, 1); start.setHours(0, 0, 0, 0);
      const end = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
  }
};

const inRange = (value: string | null | undefined, range: TimeRangeKey) => {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const { start, end } = getRange(range);
  return date >= start && date <= end;
};

const truncate = (s: string, n = 12) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

// ── CSV export ───────────────────────────────────────────────────────────────
const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const esc = (v: string | number) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
};

// ── Donut (shared by WO Status + WO Source) ──────────────────────────────────
interface DonutDatum { name: string; value: number; color: string; opacity: number; }
const Donut: React.FC<{ data: DonutDatum[]; totalLabel: string }> = ({ data, totalLabel }) => {
  const shown = data.filter((d) => d.value > 0);
  const total = shown.reduce((a, d) => a + d.value, 0);
  if (total === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      {/* Donut + center label */}
      <div className="relative" style={{ width: 180, height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={shown}
              dataKey="value"
              nameKey="name"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {shown.map((d, i) => (
                <Cell key={i} fill={d.color} fillOpacity={d.opacity} />
              ))}
            </Pie>
            <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: 'var(--foreground)' }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-light tabular-nums text-foreground leading-none">{total}</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-1">
            {totalLabel}
          </span>
        </div>
      </div>

      {/* Legend list: dot · label · count · percentage */}
      <div className="flex-1 w-full flex flex-col gap-2.5 min-w-0">
        {shown.map((d) => (
          <div key={d.name} className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: d.color, opacity: d.opacity }} />
            <span className="text-[13px] text-foreground flex-1 truncate">{d.name}</span>
            <span className="text-[13px] font-semibold tabular-nums text-foreground">{d.value}</span>
            <span className="text-[11px] text-muted-foreground tabular-nums w-9 text-right">
              {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const NoData: React.FC<{ label: string }> = ({ label }) => (
  <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">{label}</div>
);

// ── Main Component ───────────────────────────────────────────────────────────
const Analytics: React.FC<AnalyticsProps> = ({ reloadKey = 0 }) => {
  const { t } = useTranslation();
  const { currentSite } = useSiteStore();
  const { userMap } = useDataStore();

  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<AssetDetails[]>([]);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);

  // Per-chart period — default to "This Year" so populated data is visible.
  const [woPerAssetRange, setWoPerAssetRange] = useState<TimeRangeKey>('thisYear');
  const [woStatusRange, setWoStatusRange] = useState<TimeRangeKey>('thisYear');
  const [assigneeRange, setAssigneeRange] = useState<TimeRangeKey>('thisYear');
  const [woSourceRange, setWoSourceRange] = useState<TimeRangeKey>('thisYear');

  const load = useCallback(async () => {
    if (!currentSite?.id) return;
    setLoading(true);
    try {
      const [a, tk, wo] = await Promise.all([
        equipmentService.list('', currentSite.id, true),
        maintenanceTaskService.list(currentSite.id),
        workOrderService.list(currentSite.id),
      ]);
      setAssets(a);
      setTasks(tk);
      setWorkOrders(wo);
    } catch {
      MessengerService.error(t('dashboard.errors.failedToLoadData'));
    } finally {
      setLoading(false);
    }
  }, [currentSite?.id, t]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (reloadKey) load(); }, [reloadKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const filterWO = useCallback(
    (range: TimeRangeKey) => workOrders.filter((wo) => inRange(wo.createdAtUtc || wo.dueDate, range)),
    [workOrders],
  );

  // ── KPI strip (global, unfiltered) ────────────────────────────────────────
  const kpis = useMemo(() => {
    const activeAssets = assets.filter((a) => !a.archived).length;
    const woOpen = workOrders.filter((w) => w.status === WorkOrderStatus.Open).length;
    const woCompleted = workOrders.filter((w) => w.status === WorkOrderStatus.Completed).length;
    const assetsWithActiveTask = new Set(
      tasks.filter((tk) => tk.isActive).map((tk) => tk.assetId).filter(Boolean),
    ).size;
    const coverage = activeAssets > 0 ? Math.round((assetsWithActiveTask / activeAssets) * 100) : 0;
    return {
      assets: assets.length,
      activeAssets,
      archived: assets.length - activeAssets,
      woTotal: workOrders.length,
      woOpen,
      woCompleted,
      coverage,
    };
  }, [assets, tasks, workOrders]);

  // ── Chart 1: WO per Asset (stacked vertical) ──────────────────────────────
  const woPerAsset = useMemo(() => {
    const map: Record<string, { name: string; open: number; inProgress: number; completed: number; cancelled: number }> = {};
    filterWO(woPerAssetRange).forEach((wo) => {
      if (!wo.assetId) return;
      map[wo.assetId] ??= { name: wo.assetName || wo.assetId.slice(0, 8), open: 0, inProgress: 0, completed: 0, cancelled: 0 };
      if (wo.status === WorkOrderStatus.Open) map[wo.assetId].open++;
      else if (wo.status === WorkOrderStatus.ThreadOpened) map[wo.assetId].inProgress++;
      else if (wo.status === WorkOrderStatus.Completed) map[wo.assetId].completed++;
      else if (wo.status === WorkOrderStatus.Cancelled) map[wo.assetId].cancelled++;
    });
    return Object.values(map)
      .sort((a, b) => (b.open + b.inProgress + b.completed + b.cancelled) - (a.open + a.inProgress + a.completed + a.cancelled))
      .slice(0, 8);
  }, [filterWO, woPerAssetRange]);

  // ── Chart 2: WO Status donut ──────────────────────────────────────────────
  const woStatusData: DonutDatum[] = useMemo(() => {
    const rows = filterWO(woStatusRange);
    const count = (s: WorkOrderStatus) => rows.filter((w) => w.status === s).length;
    return [
      { name: t('workOrders.analytics.open'),       value: count(WorkOrderStatus.Open),         color: 'var(--st-open)',     opacity: 1 },
      { name: t('workOrders.analytics.inProgress'), value: count(WorkOrderStatus.ThreadOpened), color: 'var(--st-progress)', opacity: 1 },
      { name: t('workOrders.analytics.completed'),  value: count(WorkOrderStatus.Completed),    color: 'var(--st-done)',     opacity: 1 },
      { name: t('workOrders.analytics.cancelled'),  value: count(WorkOrderStatus.Cancelled),    color: 'var(--st-cancel)',   opacity: 1 },
    ];
  }, [filterWO, woStatusRange, t]);

  // ── Chart 3: Workload per Assignee (horizontal stacked) ───────────────────
  const workload = useMemo(() => {
    const map: Record<string, { name: string; open: number; inProgress: number; completed: number }> = {};
    filterWO(assigneeRange).forEach((wo) => {
      wo.assignedUserEmails?.forEach((email) => {
        const user = userMap[email];
        const name = user ? (`${user.firstName} ${user.lastName}`.trim() || email.split('@')[0]) : email.split('@')[0];
        map[email] ??= { name, open: 0, inProgress: 0, completed: 0 };
        if (wo.status === WorkOrderStatus.Open) map[email].open++;
        else if (wo.status === WorkOrderStatus.ThreadOpened) map[email].inProgress++;
        else if (wo.status === WorkOrderStatus.Completed) map[email].completed++;
      });
    });
    return Object.values(map)
      .sort((a, b) => (b.open + b.inProgress) - (a.open + a.inProgress))
      .slice(0, 8)
      .map((r) => ({ ...r, name: truncate(r.name, 16) }));
  }, [filterWO, assigneeRange, userMap]);

  // ── Chart 4: WO Source donut ──────────────────────────────────────────────
  const woSourceData: DonutDatum[] = useMemo(() => {
    const rows = filterWO(woSourceRange);
    return SOURCE_SERIES.map((s) => ({
      name: t(s.labelKey),
      value: rows.filter((w) => (w.sourceType || WorkOrderSourceType.Manual) === s.key).length,
      color: s.color,
      opacity: s.opacity,
    }));
  }, [filterWO, woSourceRange, t]);

  // ── Range select ──────────────────────────────────────────────────────────
  const RangeSelect: React.FC<{ value: TimeRangeKey; onChange: (v: TimeRangeKey) => void }> = ({ value, onChange }) => (
    <Select value={value} onValueChange={(v) => onChange(v as TimeRangeKey)}>
      <SelectTrigger size="sm" className="w-36">
        <SelectValue placeholder={t('dashboard.analytics.selectRange')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="allTime">{t('dashboard.analytics.allTime')}</SelectItem>
        <SelectItem value="thisWeek">{t('dashboard.analytics.thisWeek')}</SelectItem>
        <SelectItem value="lastWeek">{t('dashboard.analytics.lastWeek')}</SelectItem>
        <SelectItem value="thisMonth">{t('dashboard.analytics.thisMonth')}</SelectItem>
        <SelectItem value="lastMonth">{t('dashboard.analytics.lastMonth')}</SelectItem>
        <SelectItem value="thisYear">{t('dashboard.analytics.thisYear')}</SelectItem>
        <SelectItem value="lastYear">{t('dashboard.analytics.lastYear')}</SelectItem>
      </SelectContent>
    </Select>
  );

  const axisTick = { fontSize: 11, fill: 'var(--muted-foreground)' };
  const cancelledFilledLast = (key: string) => key === 'cancelled';

  return (
    <div className="space-y-5">
      {/* ══ KPI STRIP ════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <KpiTile loading={loading} label={t('dashboard.analytics.kpiAssets')} value={kpis.assets}
          sub={`${kpis.activeAssets} ${t('common.active')} · ${kpis.archived} ${t('common.archived')}`}
          icon={<Box className="h-4 w-4" />} />
        <KpiTile loading={loading} label={t('dashboard.analytics.kpiWorkOrders')} value={kpis.woTotal}
          icon={<ClipboardList className="h-4 w-4" />} />
        <KpiTile loading={loading} label={t('dashboard.analytics.kpiOpen')} value={kpis.woOpen}
          sub={kpis.woTotal > 0 ? `${Math.round((kpis.woOpen / kpis.woTotal) * 100)}${t('dashboard.analytics.perOfTotal')}` : ''}
          icon={<BookOpenText className="h-4 w-4" />} variant="warning" />
        <KpiTile loading={loading} label={t('dashboard.analytics.kpiCompleted')} value={kpis.woCompleted}
          sub={kpis.woTotal > 0 ? `${Math.round((kpis.woCompleted / kpis.woTotal) * 100)}${t('dashboard.analytics.perOfTotal')}` : ''}
          icon={<CheckCircle2 className="h-4 w-4" />} variant="success" />
        <KpiTile loading={loading} label={t('dashboard.analytics.kpiCoverage')} value={`${kpis.coverage}%`}
          sub={t('dashboard.analytics.activeAssetWithTask')}
          icon={<ShieldCheck className="h-4 w-4" />}
          variant={kpis.coverage >= 70 ? 'success' : kpis.coverage >= 40 ? 'warning' : 'destructive'} />
      </div>

      {/* ══ ROW 1 ════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Chart 1 — WO per Asset (stacked vertical) */}
        <ChartCard
          loading={loading}
          title={t('equipment.analytics.woPerAsset')}
          subtitle={t('dashboard.analytics.woPerAssetSub')}
          headerRight={
            <>
              <SeriesLegend items={STATUS_SERIES.map((s) => ({ label: t(s.labelKey), color: s.color, opacity: s.opacity }))} />
              <Button
                variant="outline" size="sm" className="h-8 gap-1.5"
                onClick={() => exportCSV(
                  'work-orders-per-asset.csv',
                  ['Asset', 'Open', 'In Progress', 'Completed', 'Cancelled'],
                  woPerAsset.map((r) => [r.name, r.open, r.inProgress, r.completed, r.cancelled]),
                )}
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
              <RangeSelect value={woPerAssetRange} onChange={setWoPerAssetRange} />
            </>
          }
        >
          {woPerAsset.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={woPerAsset} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <XAxis dataKey="name" tick={axisTick} angle={0} interval={0} axisLine={false} tickLine={false}
                  tickFormatter={(v: string) => truncate(v, 12)} />
                <YAxis hide />
                <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: 'var(--foreground)' }}
                  labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                  cursor={{ fill: 'var(--muted-foreground)', fillOpacity: 0.1 }} />
                {STATUS_SERIES.map((s) => (
                  <Bar key={s.key} dataKey={s.key} name={t(s.labelKey)} stackId="a"
                    fill={s.color} fillOpacity={s.opacity}
                    radius={cancelledFilledLast(s.key) ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoData label={t('dashboard.analytics.noDataForRange')} />
          )}
        </ChartCard>

        {/* Chart 2 — WO Status donut */}
        <ChartCard
          loading={loading}
          title={t('workOrders.analytics.woStatus')}
          headerRight={<RangeSelect value={woStatusRange} onChange={setWoStatusRange} />}
        >
          {woStatusData.some((d) => d.value > 0) ? (
            <div className="py-3"><Donut data={woStatusData} totalLabel={t('workOrders.analytics.total')} /></div>
          ) : (
            <NoData label={t('dashboard.analytics.noDataForRange')} />
          )}
        </ChartCard>
      </div>

      {/* ══ ROW 2 ════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        {/* Chart 3 — Workload per Assignee (horizontal stacked) */}
        <ChartCard
          loading={loading}
          title={t('workOrders.analytics.assigneeWorkload')}
          headerRight={
            <>
              <SeriesLegend items={WORKLOAD_SERIES.map((s) => ({ label: t(s.labelKey), color: s.color, opacity: s.opacity }))} />
              <RangeSelect value={assigneeRange} onChange={setAssigneeRange} />
            </>
          }
        >
          {workload.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(220, workload.length * 32)}>
              <BarChart data={workload} layout="vertical" margin={{ top: 4, right: 12, left: 8, bottom: 4 }} barCategoryGap={8}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={120} tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={{ color: 'var(--foreground)' }}
                  labelStyle={{ color: 'var(--foreground)', fontWeight: 600 }}
                  cursor={{ fill: 'var(--muted-foreground)', fillOpacity: 0.1 }} />
                {WORKLOAD_SERIES.map((s, i) => (
                  <Bar key={s.key} dataKey={s.key} name={t(s.labelKey)} stackId="a"
                    fill={s.color} fillOpacity={s.opacity} barSize={24}
                    radius={i === WORKLOAD_SERIES.length - 1 ? [0, 3, 3, 0] : [0, 0, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <NoData label={t('dashboard.analytics.noDataForRange')} />
          )}
        </ChartCard>

        {/* Chart 4 — WO Source donut */}
        <ChartCard
          loading={loading}
          title={t('workOrders.analytics.woSource')}
          headerRight={<RangeSelect value={woSourceRange} onChange={setWoSourceRange} />}
        >
          {woSourceData.some((d) => d.value > 0) ? (
            <div className="py-3"><Donut data={woSourceData} totalLabel={t('workOrders.analytics.total')} /></div>
          ) : (
            <NoData label={t('dashboard.analytics.noDataForRange')} />
          )}
        </ChartCard>
      </div>
    </div>
  );
};

export default Analytics;
