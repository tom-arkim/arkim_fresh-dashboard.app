import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import equipmentService from '@/services/api/equipmentService';
import maintenanceTaskService from '@/services/api/maintenanceTaskService';
import workOrderService from '@/services/api/workOrderService';
import useSiteStore from '@/store/siteStore';
import { logger } from '@/lib/logger';
import { WorkLogOutcome, WorkOrderSourceType, WorkOrderStatus } from '@/config/enum';
import { WorkOrder } from '@/types/maintenance/WorkOrder';
import { TaskOccurrence } from '@/types/maintenance/MaintenanceTask';
import AssetDetails from '@/types/equipment/AssetDetails';
import {
  AssetHealth,
  AttentionReason,
  FacilityHealthModel,
} from '@/types/dashboard/facilityHealth';

// ── Tunable v1 thresholds / weights ──────────────────────────────────────
// These are defaults to calibrate against real data, NOT validated values.
const STUCK_DAYS = 14;       // an open WO older than this is "stuck"
const PM_SOON_DAYS = 7;      // PM occurrence within this window is "due soon"
const HIGH_LOAD = 3;         // open + in-progress count that flags an asset
const PM_LOOKBACK_DAYS = 90; // backward occurrences window (catch overdue PM)
const PM_LOOKAHEAD_DAYS = 14;

const SCORE_WEIGHTS = {
  overdueWO: 100,
  openAgeDay: 10,
  openLoad: 5,
  badOutcome: 20,
  pmDueSoon: 3,
  badSourceWO: 8,
};

const isOpenStatus = (wo: WorkOrder) =>
  wo.status === WorkOrderStatus.Open || wo.status === WorkOrderStatus.ThreadOpened;

const BAD_OUTCOMES: WorkLogOutcome[] = [
  WorkLogOutcome.NotFixed,
  WorkLogOutcome.PartiallyFixed,
];

const BAD_SOURCES: WorkOrderSourceType[] = [
  WorkOrderSourceType.Chat,
  WorkOrderSourceType.Integration,
  WorkOrderSourceType.Manual,
];

interface Accum {
  assetId: string;
  assetName: string;
  overdueOpenWOs: number;
  openCount: number;
  inProgressCount: number;
  maxOpenAgeDays: number;
  oldestOpenCreatedAt: string | null;
  overduePM: number;
  duePMSoon: number;
  nextDuePMDate: string | null;
  badSourceOpenCount: number;
  lastBadOutcome: boolean;
  lastCompletedAt: string | null; // for choosing the most-recent completed WO
  hasActiveTask: boolean;
}

/**
 * Picks the highest-weighted reason an asset needs attention, plus the
 * timestamp most relevant to that reason (for the row's "x ago" / due line).
 */
function pickDominantReason(
  a: Accum,
  now: dayjs.Dayjs
): { reason: AttentionReason | null; timestamp: string | null } {
  if (a.overdueOpenWOs > 0) {
    return {
      reason: { code: 'overdue_wo', count: a.overdueOpenWOs },
      timestamp: a.oldestOpenCreatedAt,
    };
  }
  if (a.maxOpenAgeDays > STUCK_DAYS) {
    return {
      reason: { code: 'stuck_wo', count: a.maxOpenAgeDays },
      timestamp: a.oldestOpenCreatedAt,
    };
  }
  if (a.lastBadOutcome) {
    return {
      reason: { code: 'bad_outcome', count: 1 },
      timestamp: a.lastCompletedAt,
    };
  }
  if (a.overduePM > 0) {
    return { reason: { code: 'pm_overdue', count: a.overduePM }, timestamp: null };
  }
  if (a.duePMSoon > 0) {
    const days = a.nextDuePMDate
      ? Math.max(0, dayjs(a.nextDuePMDate).startOf('day').diff(now.startOf('day'), 'day'))
      : 0;
    return {
      reason: { code: 'pm_due_soon', count: days },
      timestamp: a.nextDuePMDate,
    };
  }
  if (a.openCount + a.inProgressCount >= HIGH_LOAD) {
    return {
      reason: { code: 'high_load', count: a.openCount + a.inProgressCount },
      timestamp: a.oldestOpenCreatedAt,
    };
  }
  return { reason: null, timestamp: null };
}

function buildModel(
  assets: AssetDetails[],
  workOrders: WorkOrder[],
  occurrences: TaskOccurrence[],
  tasks: { assetId: string; isActive: boolean }[]
): FacilityHealthModel {
  const now = dayjs();
  const today = now.startOf('day');
  const soonCutoff = today.add(PM_SOON_DAYS, 'day').endOf('day');

  // Seed an accumulator for every active asset so coverage gaps surface even
  // for assets with no work orders at all.
  const acc: Record<string, Accum> = {};
  assets
    .filter((as) => !as.archived && as.id)
    .forEach((as) => {
      acc[as.id!] = {
        assetId: as.id!,
        assetName: as.name,
        overdueOpenWOs: 0,
        openCount: 0,
        inProgressCount: 0,
        maxOpenAgeDays: 0,
        oldestOpenCreatedAt: null,
        overduePM: 0,
        duePMSoon: 0,
        nextDuePMDate: null,
        badSourceOpenCount: 0,
        lastBadOutcome: false,
        lastCompletedAt: null,
        hasActiveTask: false,
      };
    });

  // Fallback: if a WO references an asset missing from the equipment list,
  // still track it under its assetName so nothing is silently dropped.
  const ensure = (assetId: string, assetName?: string): Accum => {
    if (!acc[assetId]) {
      acc[assetId] = {
        assetId,
        assetName: assetName || assetId.slice(0, 8),
        overdueOpenWOs: 0,
        openCount: 0,
        inProgressCount: 0,
        maxOpenAgeDays: 0,
        oldestOpenCreatedAt: null,
        overduePM: 0,
        duePMSoon: 0,
        nextDuePMDate: null,
        badSourceOpenCount: 0,
        lastBadOutcome: false,
        lastCompletedAt: null,
        hasActiveTask: false,
      };
    }
    return acc[assetId];
  };

  // ── Work orders ────────────────────────────────────────────────────────
  workOrders.forEach((wo) => {
    if (!wo.assetId) return;
    const a = ensure(wo.assetId, wo.assetName);

    if (isOpenStatus(wo)) {
      if (wo.status === WorkOrderStatus.Open) a.openCount++;
      else a.inProgressCount++;

      if (wo.dueDate && dayjs(wo.dueDate).isBefore(today, 'day')) {
        a.overdueOpenWOs++;
      }
      if (wo.sourceType && BAD_SOURCES.includes(wo.sourceType)) {
        a.badSourceOpenCount++;
      }
      if (wo.createdAtUtc) {
        const age = now.diff(dayjs(wo.createdAtUtc), 'day');
        if (age > a.maxOpenAgeDays) {
          a.maxOpenAgeDays = age;
          a.oldestOpenCreatedAt = wo.createdAtUtc;
        }
      }
    } else if (wo.status === WorkOrderStatus.Completed) {
      // Track the most-recent completed WO's latest work-log outcome. Prefer
      // the work log's performedAtUtc (actual repair time) over createdAtUtc.
      const latestLog = wo.workLogs?.[wo.workLogs.length - 1];
      const completedAt = latestLog?.performedAtUtc || wo.createdAtUtc || null;
      const isBad = !!latestLog?.outcome && BAD_OUTCOMES.includes(latestLog.outcome);
      if (
        !a.lastCompletedAt ||
        (completedAt && dayjs(completedAt).isAfter(dayjs(a.lastCompletedAt)))
      ) {
        a.lastCompletedAt = completedAt;
        a.lastBadOutcome = isBad;
      }
    }
  });

  // ── PM occurrences (backward window: self-correcting re: materialization) ─
  occurrences.forEach((occ) => {
    if (!occ.assetId || !occ.occurrenceDate) return;
    const a = ensure(occ.assetId);
    const d = dayjs(occ.occurrenceDate);
    if (d.isBefore(today, 'day')) {
      a.overduePM++;
    } else if (!d.isAfter(soonCutoff)) {
      a.duePMSoon++;
      if (!a.nextDuePMDate || d.isBefore(dayjs(a.nextDuePMDate))) {
        a.nextDuePMDate = occ.occurrenceDate;
      }
    }
  });

  // ── Active-task coverage ─────────────────────────────────────────────────
  tasks.forEach((tk) => {
    if (tk.assetId && tk.isActive && acc[tk.assetId]) {
      acc[tk.assetId].hasActiveTask = true;
    }
  });

  // ── Severity + score + reason ────────────────────────────────────────────
  const all: AssetHealth[] = Object.values(acc).map((a) => {
    const openLoad = a.openCount + a.inProgressCount;

    const critical =
      a.overdueOpenWOs >= 1 || a.maxOpenAgeDays > STUCK_DAYS || a.lastBadOutcome;
    const warning =
      !critical && (openLoad > 0 || a.duePMSoon > 0 || a.overduePM > 0 || openLoad >= HIGH_LOAD);

    const severity = critical ? 'critical' : warning ? 'warning' : 'normal';

    const score =
      SCORE_WEIGHTS.overdueWO * a.overdueOpenWOs +
      SCORE_WEIGHTS.openAgeDay * a.maxOpenAgeDays +
      SCORE_WEIGHTS.openLoad * openLoad +
      SCORE_WEIGHTS.badOutcome * (a.lastBadOutcome ? 1 : 0) +
      SCORE_WEIGHTS.pmDueSoon * a.duePMSoon +
      SCORE_WEIGHTS.badSourceWO * a.badSourceOpenCount;

    const { reason, timestamp } = pickDominantReason(a, now);

    return {
      assetId: a.assetId,
      assetName: a.assetName,
      overdueOpenWOs: a.overdueOpenWOs,
      openCount: a.openCount,
      inProgressCount: a.inProgressCount,
      maxOpenAgeDays: a.maxOpenAgeDays,
      overduePM: a.overduePM,
      duePMSoon: a.duePMSoon,
      badSourceOpenCount: a.badSourceOpenCount,
      lastBadOutcome: a.lastBadOutcome,
      hasActiveTask: a.hasActiveTask,
      severity,
      isBlindSpot: !a.hasActiveTask,
      score,
      dominantReason: reason,
      reasonTimestamp: timestamp,
    };
  });

  const exceptions = all
    .filter((a) => a.severity !== 'normal')
    .sort((a, b) => b.score - a.score);

  const blindSpots = all
    .filter((a) => a.isBlindSpot)
    .sort((a, b) => b.score - a.score);

  const overdueWoTotal = all.reduce((sum, a) => sum + a.overdueOpenWOs, 0);

  return {
    summary: {
      criticalCount: all.filter((a) => a.severity === 'critical').length,
      warningCount: all.filter((a) => a.severity === 'warning').length,
      overdueWoTotal,
      blindSpotCount: blindSpots.length,
      attentionCount: exceptions.length,
    },
    exceptions,
    blindSpots,
  };
}

interface UseFacilityHealthResult extends FacilityHealthModel {
  loading: boolean;
  error: boolean;
  reload: () => void;
}

const EMPTY_MODEL: FacilityHealthModel = {
  summary: {
    criticalCount: 0,
    warningCount: 0,
    overdueWoTotal: 0,
    blindSpotCount: 0,
    attentionCount: 0,
  },
  exceptions: [],
  blindSpots: [],
};

/**
 * Loads the four real data sources for a site and aggregates them into the
 * facility-health model. Re-runs when the site changes or `reloadKey` ticks.
 */
export function useFacilityHealth(reloadKey: number = 0): UseFacilityHealthResult {
  const { currentSite } = useSiteStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [model, setModel] = useState<FacilityHealthModel>(EMPTY_MODEL);

  const load = useCallback(async () => {
    if (!currentSite?.id) return;
    setLoading(true);
    setError(false);
    try {
      const today = dayjs();
      const startDate = today.subtract(PM_LOOKBACK_DAYS, 'day').format('YYYY-MM-DD');
      const endDate = today.add(PM_LOOKAHEAD_DAYS, 'day').format('YYYY-MM-DD');

      const [assets, workOrders, occurrences, tasks] = await Promise.all([
        equipmentService.list('', currentSite.id),
        workOrderService.list(currentSite.id),
        maintenanceTaskService.listOccurrences(startDate, endDate, currentSite.id),
        maintenanceTaskService.list(currentSite.id),
      ]);

      setModel(buildModel(assets, workOrders, occurrences, tasks));
    } catch (err) {
      logger.error('useFacilityHealth: failed to load facility health data', err);
      setError(true);
      setModel(EMPTY_MODEL);
    } finally {
      setLoading(false);
    }
  }, [currentSite?.id]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  return useMemo(
    () => ({ ...model, loading, error, reload: load }),
    [model, loading, error, load]
  );
}

export default useFacilityHealth;
