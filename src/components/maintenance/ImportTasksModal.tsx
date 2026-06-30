import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { Calendar, CheckCircle2, ChevronRight, ChevronDown, User, Box, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/shadcn/dialog';
import { Button } from '@/components/ui/shadcn/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/shadcn/collapsible';
import { ScrollArea } from '@/components/ui/shadcn/scroll-area';
import { Checkbox } from '@/components/ui/shadcn/checkbox';
import { DatePicker } from '@/components/ui/shadcn/datepicker';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Badge } from '@/components/ui/shadcn/badge';
import { cn } from '@/lib/utils';
import AssetDetails from '@/types/equipment/AssetDetails';
import UserBase from '@/types/user/UserBase';
import maintenanceRecommendationService from '@/services/api/maintenanceRecommendationService';
import maintenanceTaskService from '@/services/api/maintenanceTaskService';
import type {
  MaintenanceRecommendation,
  RecommendationsForAssetsResponse,
  RecommendationImportItem,
} from '@/types/maintenance/MaintenanceRecommendation';
import { logger } from '@/lib/logger';
import MessengerService from '@/services/ui/messengerService';

const WEEKDAY_OPTIONS = [
  { day: 0, labelKey: 'maintenanceTasks.recurrence.days.su' },
  { day: 1, labelKey: 'maintenanceTasks.recurrence.days.mo' },
  { day: 2, labelKey: 'maintenanceTasks.recurrence.days.tu' },
  { day: 3, labelKey: 'maintenanceTasks.recurrence.days.we' },
  { day: 4, labelKey: 'maintenanceTasks.recurrence.days.th' },
  { day: 5, labelKey: 'maintenanceTasks.recurrence.days.fr' },
  { day: 6, labelKey: 'maintenanceTasks.recurrence.days.sa' },
] as const;

/** Short human-readable label for an RRULE (e.g. "Monthly", "Every 2 weeks on Mo, We"). */
function formatRRuleShort(rrule: string): string {
  const parts = rrule.replace(/^RRULE:/, '').split(';');
  let freq = '';
  let interval = 1;
  let byDay: string[] = [];
  for (const part of parts) {
    const [key, val] = part.split('=');
    if (!key || !val) continue;
    switch (key.toUpperCase()) {
      case 'FREQ': freq = val.toUpperCase(); break;
      case 'INTERVAL': interval = parseInt(val, 10) || 1; break;
      case 'BYDAY': byDay = val.split(',').map((d) => d.trim()); break;
    }
  }
  const unitMap: Record<string, [string, string]> = {
    DAILY: ['day', 'days'], WEEKLY: ['week', 'weeks'],
    MONTHLY: ['month', 'months'], YEARLY: ['year', 'years'],
  };
  const [singular, plural] = unitMap[freq] || ['?', '?'];
  const unit = interval === 1 ? singular : plural;
  let label = interval === 1 ? `Every ${unit}` : `Every ${interval} ${unit}`;
  if (byDay.length > 0) {
    const dayNames: Record<string, string> = {
      MO: 'Mo', TU: 'Tu', WE: 'We', TH: 'Th', FR: 'Fr', SA: 'Sa', SU: 'Su',
    };
    label += ` on ${byDay.map((d) => dayNames[d.toUpperCase()] || d).join(', ')}`;
  }
  return label;
}

export interface ImportTasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
  siteId: string;
  assets: AssetDetails[];
  availableUsers: UserBase[];
  isLoading?: boolean;
}

type Step = 'choose' | 'recommendations' | 'schedule';

/** Groups assets by model (asset_model); each group is expandable and shows asset names. */
export const ImportTasksModal: React.FC<ImportTasksModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
  siteId,
  assets,
  availableUsers,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>('choose');
  const [openModelIds, setOpenModelIds] = useState<Set<string>>(new Set());
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [recommendations, setRecommendations] = useState<RecommendationsForAssetsResponse | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [openAssetIds, setOpenAssetIds] = useState<Set<string>>(new Set());
  const [selectedRecommendationIds, setSelectedRecommendationIds] = useState<Set<string>>(new Set());
  // Per-recommendation start dates: recId → YYYY-MM-DD
  const [perRecStartDate, setPerRecStartDate] = useState<Record<string, string>>({});
  const [scheduleEndDate, setScheduleEndDate] = useState<string | undefined>(undefined);
  const [assignedUserEmails, setAssignedUserEmails] = useState<string[]>([]);
  // Preferred work days: 0=Sun, 1=Mon, ..., 6=Sat (JS getDay() convention)
  const [workDays, setWorkDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  const [importLoading, setImportLoading] = useState(false);
  const [existingTaskRecommendationIds, setExistingTaskRecommendationIds] = useState<Set<string>>(new Set());
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current && assets.length > 0) {
      setSelectedAssetIds(new Set(assets.map((a) => a.id)));
    }
    if (isOpen) wasOpenRef.current = true;
    else wasOpenRef.current = false;
  }, [isOpen, assets]);

  useEffect(() => {
    if (step === 'recommendations' && recommendations && Object.keys(recommendations).length > 0) {
      const allRecIds = new Set<string>();
      Object.values(recommendations).forEach((recs) => {
        recs.forEach((r) => allRecIds.add(r.id));
      });
      setSelectedRecommendationIds((prev) => (prev.size === 0 ? allRecIds : prev));
    }
  }, [step, recommendations]);

  useEffect(() => {
    if (step !== 'recommendations' || !recommendations || !siteId) return;
    let cancelled = false;
    maintenanceTaskService.list(siteId).then((tasks) => {
      if (cancelled) return;
      const ids = new Set(
        tasks
          .filter((t) => t.recommendationId)
          .map((t) => t.recommendationId as string)
      );
      setExistingTaskRecommendationIds(ids);
    }).catch((err) => {
      if (!cancelled) {
        logger.error('Failed to load existing tasks for recommendations', err);
      }
    });
    return () => { cancelled = true; };
  }, [step, recommendations, siteId]);

  const userOptions = useMemo(
    () =>
      availableUsers.map((user) => ({
        label: (
          <div className="flex flex-col items-start">
            <span>
              {user.firstName} {user.lastName}
            </span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
          </div>
        ),
        value: user.email,
        badgeLabel: `${user.firstName} ${user.lastName}`,
        badgeTooltip: user.email,
      })),
    [availableUsers]
  );

  const assetMap = useMemo(
    () => Object.fromEntries(assets.map((a) => [a.id, a])),
    [assets]
  );

  const buildRequest = useCallback(() => {
    const byModelId: Record<string, string[]> = {};
    assets.forEach((asset) => {
      if (!selectedAssetIds.has(asset.id)) return;
      const id = asset.assetModelId;
      if (!byModelId[id]) byModelId[id] = [];
      byModelId[id].push(asset.id);
    });
    return { assetModelIdToAssetIds: byModelId };
  }, [assets, selectedAssetIds]);

  const fetchRecommendations = useCallback(async () => {
    const body = buildRequest();
    if (Object.keys(body.assetModelIdToAssetIds).length === 0) {
      MessengerService.error(t('maintenanceTasks.importTasks.selectAtLeastOne'));
      return;
    }
    setRecommendationsLoading(true);
    try {
      const data = await maintenanceRecommendationService.getRecommendationsForAssets(body);
      setRecommendations(data);
      setStep('recommendations');
      setOpenAssetIds(new Set(Object.keys(data)));
      setSelectedRecommendationIds(new Set());
    } catch (error) {
      logger.error('Failed to fetch maintenance recommendations', error);
      MessengerService.error(t('maintenanceTasks.importTasks.fetchError'));
    } finally {
      setRecommendationsLoading(false);
    }
  }, [buildRequest, t]);

  const toggleAssetOpen = (assetId: string) => {
    setOpenAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  };

  const handleClose = useCallback(() => {
    setStep('choose');
    setRecommendations(null);
    setOpenAssetIds(new Set());
    setSelectedRecommendationIds(new Set());
    setPerRecStartDate({});
    setScheduleEndDate(undefined);
    setWorkDays(new Set([1, 2, 3, 4, 5]));
    setAssignedUserEmails([]);
    onClose();
  }, [onClose]);

  const toggleRecommendation = (recId: string) => {
    setSelectedRecommendationIds((prev) => {
      const next = new Set(prev);
      if (next.has(recId)) next.delete(recId);
      else next.add(recId);
      return next;
    });
  };

  const toggleAssetRecommendations = (list: MaintenanceRecommendation[]) => {
    const ids = list.map((r) => r.id);
    const allSelected = ids.every((id) => selectedRecommendationIds.has(id));
    setSelectedRecommendationIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const isAssetRecommendationsIndeterminate = (list: MaintenanceRecommendation[]) => {
    const selected = list.filter((r) => selectedRecommendationIds.has(r.id)).length;
    return selected > 0 && selected < list.length;
  };

  /** Flat list of all selected (non-imported) recommendations across all assets. */
  const selectedRecs = useMemo(() => {
    if (!recommendations) return [];
    const result: { assetId: string; rec: MaintenanceRecommendation }[] = [];
    Object.entries(recommendations).forEach(([assetId, recs]) => {
      recs.forEach((r) => {
        if (selectedRecommendationIds.has(r.id) && !existingTaskRecommendationIds.has(r.id)) {
          result.push({ assetId, rec: r });
        }
      });
    });
    return result;
  }, [recommendations, selectedRecommendationIds, existingTaskRecommendationIds]);

  /** Distribute start dates across preferred work days within one week.
   *  Groups recs by asset model so same-model tasks land on the same day. */
  const suggestSchedule = useCallback(() => {
    if (selectedRecs.length === 0 || workDays.size === 0) return;

    const sortedWorkDays = Array.from(workDays).sort((a, b) => a - b);

    // Find the next work day on or after a given date
    const nextWorkDay = (from: dayjs.Dayjs): dayjs.Dayjs => {
      let d = from;
      for (let i = 0; i < 14; i++) {
        if (sortedWorkDays.includes(d.day())) return d;
        d = d.add(1, 'day');
      }
      return from;
    };

    // Group recs by assetModelId so same-model recommendations share a day
    const byModel = new Map<string, { assetId: string; rec: MaintenanceRecommendation }[]>();
    for (const item of selectedRecs) {
      const modelId = assetMap[item.assetId]?.assetModelId ?? item.assetId;
      if (!byModel.has(modelId)) byModel.set(modelId, []);
      byModel.get(modelId)!.push(item);
    }
    const modelGroups = Array.from(byModel.values());

    // Collect all work-day dates within one week from start
    const startFrom = nextWorkDay(dayjs().add(1, 'day'));
    const availableDates: dayjs.Dayjs[] = [];
    for (let d = startFrom; d.diff(startFrom, 'day') < 7; d = d.add(1, 'day')) {
      if (sortedWorkDays.includes(d.day())) availableDates.push(d);
    }
    if (availableDates.length === 0) return;

    // Round-robin: assign each model group to the next available date
    const dates: Record<string, string> = {};
    modelGroups.forEach((group, i) => {
      const date = availableDates[i % availableDates.length];
      for (const { rec } of group) {
        dates[rec.id] = date.format('YYYY-MM-DD');
      }
    });

    setPerRecStartDate(dates);
  }, [selectedRecs, workDays, assetMap]);

  /** Auto-suggest when entering schedule step if no dates set yet. */
  useEffect(() => {
    if (step === 'schedule' && Object.keys(perRecStartDate).length === 0 && selectedRecs.length > 0) {
      suggestSchedule();
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildImportBody = useCallback((): Record<string, RecommendationImportItem[]> => {
    if (!recommendations) return {};
    const fallbackDate = dayjs().format('YYYY-MM-DD');
    const assetIdToItems: Record<string, RecommendationImportItem[]> = {};
    Object.entries(recommendations).forEach(([assetId, recs]) => {
      const selected = recs.filter(
        (r) =>
          selectedRecommendationIds.has(r.id) && !existingTaskRecommendationIds.has(r.id)
      );
      if (selected.length === 0) return;
      assetIdToItems[assetId] = selected.map((r) => ({
        recommendationId: r.id,
        startDate: perRecStartDate[r.id] ?? fallbackDate,
        endDate: scheduleEndDate ?? null,
        assignedUserEmails: [...assignedUserEmails],
      }));
    });
    return assetIdToItems;
  }, [
    recommendations,
    selectedRecommendationIds,
    existingTaskRecommendationIds,
    perRecStartDate,
    scheduleEndDate,
    assignedUserEmails,
  ]);

  const handleImport = useCallback(async () => {
    const assetIdToItems = buildImportBody();
    if (Object.keys(assetIdToItems).length === 0) {
      MessengerService.error(t('maintenanceTasks.importTasks.selectAtLeastOneRec'));
      return;
    }
    setImportLoading(true);
    try {
      await maintenanceTaskService.createFromRecommendationBatch({ assetIdToItems });
      MessengerService.success(t('maintenanceTasks.importTasks.importSuccess'));
      handleClose();
      onImportSuccess?.();
    } catch (error) {
      logger.error('Failed to create tasks from recommendations', error);
      MessengerService.error(t('maintenanceTasks.importTasks.importError'));
    } finally {
      setImportLoading(false);
    }
  }, [buildImportBody, t, handleClose, onImportSuccess]);

  const tree = useMemo(() => {
    const byModelId = new Map<string, AssetDetails[]>();
    for (const asset of assets) {
      const modelId = asset.assetModelId;
      if (!byModelId.has(modelId)) byModelId.set(modelId, []);
      byModelId.get(modelId)!.push(asset);
    }
    return Array.from(byModelId.entries()).map(([assetModelId, list]) => {
      const sorted = list.sort((a, b) => a.name.localeCompare(b.name));
      const displayName = sorted[0]?.model?.trim() || assetModelId;
      return { assetModelId, displayName, assets: sorted };
    });
  }, [assets, t]);

  const toggleModel = (assetModelId: string) => {
    setOpenModelIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetModelId)) next.delete(assetModelId);
      else next.add(assetModelId);
      return next;
    });
  };

  const toggleAsset = (assetId: string) => {
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (next.has(assetId)) next.delete(assetId);
      else next.add(assetId);
      return next;
    });
  };

  const toggleModelSelection = (modelAssets: AssetDetails[]) => {
    const ids = modelAssets.map((a) => a.id);
    const allSelected = ids.every((id) => selectedAssetIds.has(id));
    setSelectedAssetIds((prev) => {
      const next = new Set(prev);
      if (allSelected) ids.forEach((id) => next.delete(id));
      else ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const isModelIndeterminate = (modelAssets: AssetDetails[]) => {
    const selected = modelAssets.filter((a) => selectedAssetIds.has(a.id)).length;
    return selected > 0 && selected < modelAssets.length;
  };

  const recommendationsEntries = recommendations
    ? Object.entries(recommendations)
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className={cn('sm:max-w-md', step === 'schedule' && 'sm:max-w-lg')}
        showCloseButton
        onPointerDownOutside={handleClose}
      >
        <DialogHeader>
          <DialogTitle>
            {step === 'choose'
              ? t('maintenanceTasks.importTasks.title')
              : step === 'recommendations'
                ? t('maintenanceTasks.importTasks.recommendationsTitle')
                : t('maintenanceTasks.importTasks.scheduleTitle')}
          </DialogTitle>
        </DialogHeader>
        {step === 'schedule' ? (
          <div className="space-y-4 py-2">
            {/* Preferred work days */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('maintenanceTasks.importTasks.preferredWorkDays')}
              </h3>
              <div className="flex gap-1">
                {WEEKDAY_OPTIONS.map(({ day, labelKey }) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => {
                      setWorkDays((prev) => {
                        const next = new Set(prev);
                        if (next.has(day)) next.delete(day);
                        else next.add(day);
                        return next;
                      });
                    }}
                    className={cn(
                      'h-8 w-8 rounded-full text-xs font-medium transition-colors',
                      'border border-input hover:bg-accent hover:text-accent-foreground',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      workDays.has(day) &&
                        'bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground'
                    )}
                  >
                    {t(labelKey)}
                  </button>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={suggestSchedule}
                disabled={workDays.size === 0}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {t('maintenanceTasks.importTasks.suggestSchedule')}
              </Button>
            </div>

            {/* Per-recommendation schedule table */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">{t('maintenanceTasks.importTasks.taskSchedule')}</h3>
              <ScrollArea className="h-[min(40vh,16rem)] rounded-md border">
                <div className="p-2 space-y-1.5">
                  {selectedRecs.map(({ assetId, rec }) => {
                    const assetName = assetMap[assetId]?.name ?? assetId;
                    const recDate = perRecStartDate[rec.id];
                    return (
                      <div
                        key={rec.id}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/30"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">
                            {rec.title ?? rec.id}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {assetName}
                            {rec.rRule && (
                              <span className="ml-1.5 text-muted-foreground/70">
                                &middot; {formatRRuleShort(rec.rRule)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-0.5 shrink-0">
                          <span className="text-[11px] text-muted-foreground">
                            {t('maintenance.startDate')}
                          </span>
                          <DatePicker
                            selected={recDate ? dayjs(recDate).toDate() : dayjs().toDate()}
                            onSelect={(date) => {
                              if (date) {
                                setPerRecStartDate((prev) => ({
                                  ...prev,
                                  [rec.id]: dayjs(date).format('YYYY-MM-DD'),
                                }));
                              }
                            }}
                            fromDate={dayjs().startOf('day').toDate()}
                            placeholder={t('maintenance.selectStartDate')}
                          />
                        </div>
                      </div>
                    );
                  })}
                  {selectedRecs.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      {t('maintenanceTasks.importTasks.noRecommendations')}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* End date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t('maintenance.endDate')}
              </label>
              <DatePicker
                selected={
                  scheduleEndDate ? dayjs(scheduleEndDate).toDate() : undefined
                }
                onSelect={(date) =>
                  setScheduleEndDate(
                    date ? dayjs(date).format('YYYY-MM-DD') : undefined
                  )
                }
                fromDate={dayjs().startOf('day').toDate()}
                placeholder={t('maintenance.selectEndDate')}
              />
            </div>

            {/* Assign users */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{t('maintenance.assignUsers')}</span>
                {assignedUserEmails.length > 0 && (
                  <Badge variant="secondary">
                    {assignedUserEmails.length} {t('maintenance.selected')}
                  </Badge>
                )}
              </h3>
              <MultiSelect
                options={userOptions}
                selected={assignedUserEmails}
                onChange={setAssignedUserEmails}
                placeholder={t('maintenance.selectUsers')}
                className="w-full"
              />
            </div>
          </div>
        ) : step === 'recommendations' ? (
          recommendationsLoading ? (
            <div className="py-8 text-center text-muted-foreground">
              {t('common.loading')}
            </div>
          ) : (
            <ScrollArea className="h-[min(60vh,24rem)] rounded-md border">
              <div className="p-2">
                {recommendationsEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    {t('maintenanceTasks.importTasks.noRecommendations')}
                  </p>
                ) : (
                  recommendationsEntries.map(([assetId, list]: [string, MaintenanceRecommendation[]]) => {
                    const assetName = assetMap[assetId]?.name ?? assetId;
                    const isOpen = openAssetIds.has(assetId);
                    const selectableList = list.filter((r) => !existingTaskRecommendationIds.has(r.id));
                    const assetAllSelected =
                      selectableList.length > 0 &&
                      selectableList.every((r) => selectedRecommendationIds.has(r.id));
                    const assetIndeterminate = isAssetRecommendationsIndeterminate(selectableList);
                    return (
                      <Collapsible
                        key={assetId}
                        open={isOpen}
                        onOpenChange={() => toggleAssetOpen(assetId)}
                      >
                        <div className="flex items-center gap-2 rounded-md px-2 py-1">
                          <CollapsibleTrigger
                            className={cn(
                              'flex flex-1 min-w-0 items-center gap-2 rounded px-1 py-1.5 text-left text-sm font-medium',
                              'hover:bg-accent/50'
                            )}
                          >
                            {isOpen ? (
                              <ChevronDown className="h-4 w-4 shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 shrink-0" />
                            )}
                            <span className="truncate max-w-80">{assetName}</span>
                            <span className="text-muted-foreground shrink-0">
                              ({list.length})
                            </span>
                          </CollapsibleTrigger>
                          {selectableList.length > 0 && (
                            <Checkbox
                              checked={
                                assetIndeterminate ? 'indeterminate' : assetAllSelected
                              }
                              onCheckedChange={() => toggleAssetRecommendations(selectableList)}
                              onClick={(e) => e.stopPropagation()}
                              onPointerDown={(e) => e.stopPropagation()}
                              className="shrink-0"
                              aria-label={t('maintenanceTasks.importTasks.selectAllRecommendations')}
                            />
                          )}
                        </div>
                        <CollapsibleContent>
                          <ul className="ml-6 mt-1 space-y-0.5 pb-2">
                            {list.map((rec: MaintenanceRecommendation) => (
                              <RecommendationItem
                                key={rec.id}
                                recommendation={rec}
                                checked={selectedRecommendationIds.has(rec.id)}
                                onToggle={() => toggleRecommendation(rec.id)}
                                isAlreadyImported={existingTaskRecommendationIds.has(rec.id)}
                              />
                            ))}
                          </ul>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          )
        ) : isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : (
          <ScrollArea className="h-[min(60vh,24rem)] rounded-md border">
            <div className="p-2">
              {tree.length === 0 ? (
                <p className="flex flex-col items-center gap-2 text-base font-semibold text-muted-foreground py-4 text-center mt-24">
                  <Box className='size-12' strokeWidth={1} />
                  {t('maintenanceTasks.importTasks.noAssets')}
                </p>
              ) : (
                tree.map(({ assetModelId, displayName, assets: modelAssets }) => {
                  const modelAllSelected =
                    modelAssets.length > 0 &&
                    modelAssets.every((a) => selectedAssetIds.has(a.id));
                  const modelIndeterminate = isModelIndeterminate(modelAssets);
                  return (
                    <Collapsible
                      key={assetModelId}
                      open={openModelIds.has(assetModelId)}
                      onOpenChange={() => toggleModel(assetModelId)}
                    >
                      <div className="flex items-center gap-2 rounded-md px-2 py-1">
                        <CollapsibleTrigger
                          className={cn(
                            'flex flex-1 min-w-0 items-center gap-2 rounded px-1 py-1.5 text-left text-sm font-medium',
                            'hover:bg-accent/50'
                          )}
                        >
                          {openModelIds.has(assetModelId) ? (
                            <ChevronDown className="h-4 w-4 shrink-0" />
                          ) : (
                            <ChevronRight className="h-4 w-4 shrink-0" />
                          )}
                          <span className="truncate max-w-60">{displayName}</span>
                          <span className="text-muted-foreground shrink-0">
                            ({modelAssets.length})
                          </span>
                        </CollapsibleTrigger>
                        <Checkbox
                          checked={
                            modelIndeterminate
                              ? 'indeterminate'
                              : modelAllSelected
                          }
                          onCheckedChange={() => toggleModelSelection(modelAssets)}
                          onClick={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="shrink-0"
                          aria-label={t('maintenanceTasks.importTasks.selectModel')}
                        />
                      </div>
                      <CollapsibleContent>
                        <ul className="ml-6 mt-1 space-y-0.5 pb-2">
                          {modelAssets.map((asset) => (
                            <li
                              key={asset.id}
                              className={cn(
                                'flex items-center gap-2 rounded px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent/30 cursor-pointer',
                                selectedAssetIds.has(asset.id) && 'bg-accent/20'
                              )}
                              onClick={() => toggleAsset(asset.id)}
                            >
                              <Checkbox
                                checked={selectedAssetIds.has(asset.id)}
                                onCheckedChange={() => toggleAsset(asset.id)}
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                                className="shrink-0"
                                aria-label={asset.name}
                              />
                              <span className="truncate flex-1">{asset.name}</span>
                            </li>
                          ))}
                        </ul>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })
              )}
            </div>
          </ScrollArea>
        )}
        <DialogFooter className="flex justify-between sm:justify-between">
          <div>
            {step === 'recommendations' && (
              <Button type="button" variant="outline" onClick={() => setStep('choose')}>
                {t('maintenanceTasks.importTasks.back')}
              </Button>
            )}
            {step === 'schedule' && (
              <Button type="button" variant="outline" onClick={() => setStep('recommendations')}>
                {t('maintenanceTasks.importTasks.back')}
              </Button>
            )}
          </div>
          <div>
            {step === 'choose' && assets.length ? (
              <Button
                type="button"
                onClick={fetchRecommendations}
                disabled={recommendationsLoading || selectedAssetIds.size === 0}
              >
                {recommendationsLoading
                  ? t('common.loading')
                  : t('maintenanceTasks.importTasks.next')}
              </Button>
            ) : null}
            {step === 'recommendations' && (
              <Button type="button" onClick={() => setStep('schedule')}>
                {t('maintenanceTasks.importTasks.next')}
              </Button>
            )}
            {step === 'schedule' && (
              <Button
                type="button"
                onClick={handleImport}
                disabled={importLoading}
              >
                {importLoading ? t('common.loading') : t('maintenanceTasks.importTasks.import')}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

function RecommendationItem({
  recommendation,
  checked,
  onToggle,
  isAlreadyImported,
}: {
  recommendation: MaintenanceRecommendation;
  checked: boolean;
  onToggle: () => void;
  isAlreadyImported: boolean;
}) {
  return (
    <li
      className={cn(
        'flex items-start gap-2 rounded px-2 py-1.5 text-sm text-muted-foreground',
        !isAlreadyImported && 'hover:bg-accent/30 cursor-pointer',
        checked && 'bg-accent/20'
      )}
      onClick={!isAlreadyImported ? onToggle : undefined}
    >
      {isAlreadyImported ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-green-600 dark:text-green-500" aria-hidden />
      ) : (
        <Checkbox
          checked={checked}
          onCheckedChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="shrink-0 mt-0.5"
          aria-label={recommendation.title ?? recommendation.id}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="font-medium text-foreground">
          {recommendation.title ?? recommendation.id}
        </div>
        {recommendation.description != null && recommendation.description !== '' && (
          <div className="text-muted-foreground text-xs mt-0.5">
            {recommendation.description}
          </div>
        )}
      </div>
    </li>
  );
}

export default ImportTasksModal;
