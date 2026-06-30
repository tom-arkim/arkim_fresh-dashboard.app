// Facility-health model for the "needs attention" exception view.
//
// Everything here is derived CLIENT-SIDE from real work-order and
// maintenance-task data. There is intentionally NO sensor/threshold/
// asset-status input: those have no backend support yet (see the gated
// "coming soon" strip on the dashboard).

export type Severity = 'critical' | 'warning' | 'normal';

/** Machine-readable reason codes, ranked by the scoring weights. */
export type AttentionReasonCode =
  | 'overdue_wo'
  | 'stuck_wo'
  | 'bad_outcome'
  | 'pm_overdue'
  | 'pm_due_soon'
  | 'high_load';

export interface AttentionReason {
  code: AttentionReasonCode;
  /** Numeric detail used to fill the localized string (count or days). */
  count: number;
}

export interface AssetHealth {
  assetId: string;
  assetName: string;

  // ── Raw per-asset signals ────────────────────────────────────────────
  overdueOpenWOs: number;
  openCount: number;        // status === open
  inProgressCount: number;  // status === thread_opened
  maxOpenAgeDays: number;   // oldest still-open WO, days since createdAtUtc
  overduePM: number;        // task occurrences with occurrenceDate < today
  duePMSoon: number;        // occurrences within [today, today + PM_SOON_DAYS]
  badSourceOpenCount: number; // open WOs from chat/integration/manual
  lastBadOutcome: boolean;  // most-recent completed WO ended not/partially fixed
  hasActiveTask: boolean;   // any isActive maintenance task → has PM coverage

  // ── Derived ──────────────────────────────────────────────────────────
  severity: Severity;
  isBlindSpot: boolean;     // no active PM task (tracked separately, not a fault)
  score: number;            // ranking weight (higher = more urgent)
  dominantReason: AttentionReason | null;
  /** Most relevant timestamp for the dominant reason (ISO), if any. */
  reasonTimestamp: string | null;
}

export interface FacilityHealthSummary {
  criticalCount: number;
  warningCount: number;
  overdueWoTotal: number;
  blindSpotCount: number;
  /** Assets in the exception list (critical + warning). */
  attentionCount: number;
}

export interface FacilityHealthModel {
  summary: FacilityHealthSummary;
  /** Critical + warning assets, sorted by score descending. */
  exceptions: AssetHealth[];
  /** Assets with no active PM task. Separate "blind spot" category. */
  blindSpots: AssetHealth[];
}
