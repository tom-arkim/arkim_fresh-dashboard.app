import CompactLoader from '@/components/ui/CompactLoader';
import { Badge } from '@/components/ui/shadcn/badge';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';
import { Label } from '@/components/ui/shadcn/label';
import { formatDateOnly } from '@/lib/dayjs-utils';
import dayjs from 'dayjs';
import maintenanceTaskService from '@/services/api/maintenanceTaskService';
import MessengerService from '@/services/ui/messengerService';
import useSiteStore from '@/store/siteStore';
import useDataStore from '@/store/dataStore';
import { MaintenanceTask } from '@/types/maintenance/MaintenanceTask';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarCheck,
  Edit,
  FileDown,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Trash2,
  Power,
  PowerOff,
  Loader2,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import Can from '@/components/auth/Can';
import { MODULES } from '@/config/constant';
import { usePermission } from '@/hooks/usePermission';
import TaskDetailsModal from '@/components/maintenance/TaskDetailsModal';
import ImportTasksModal from '@/components/maintenance/ImportTasksModal';
import { Switch } from '@/components/ui/shadcn/switch';
import Pagination, { SizeType } from '@/components/ui/Pagination';
import { useMaintenanceTaskBroadcast } from '@/hooks/broadcasts/use-maintenance-task-broadcast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcn/popover';
import { Separator } from '@/components/ui/shadcn/separator';

/** Format an RRULE string into a human-readable label for the table. */
function formatRRule(rrule: string, t: (key: string) => string): string {
  const presets: Record<string, string> = {
    'FREQ=DAILY;INTERVAL=1': t('maintenanceTasks.recurrence.daily'),
    'FREQ=WEEKLY;INTERVAL=1': t('maintenanceTasks.recurrence.weekly'),
    'FREQ=WEEKLY;INTERVAL=2': t('maintenanceTasks.recurrence.biWeekly'),
    'FREQ=MONTHLY;INTERVAL=1': t('maintenanceTasks.recurrence.monthly'),
    'FREQ=MONTHLY;INTERVAL=3': t('maintenanceTasks.recurrence.quaterly'),
    'FREQ=YEARLY;INTERVAL=1': t('maintenanceTasks.recurrence.yearly'),
    'FREQ=YEARLY;INTERVAL=2': t('maintenanceTasks.recurrence.biAnnually'),
  };
  if (presets[rrule]) return presets[rrule];

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
    DAILY: ['day', 'days'],
    WEEKLY: ['week', 'weeks'],
    MONTHLY: ['month', 'months'],
    YEARLY: ['year', 'years'],
  };
  const dayNames: Record<string, string> = {
    MO: t('maintenanceTasks.recurrence.days.mo'),
    TU: t('maintenanceTasks.recurrence.days.tu'),
    WE: t('maintenanceTasks.recurrence.days.we'),
    TH: t('maintenanceTasks.recurrence.days.th'),
    FR: t('maintenanceTasks.recurrence.days.fr'),
    SA: t('maintenanceTasks.recurrence.days.sa'),
    SU: t('maintenanceTasks.recurrence.days.su'),
  };

  const [singular, plural] = unitMap[freq] || ['?', '?'];
  const unit = interval === 1 ? singular : plural;
  let label = interval === 1 ? `Every ${unit}` : `Every ${interval} ${unit}`;

  if (byDay.length > 0) {
    const dayLabels = byDay.map((d) => dayNames[d.toUpperCase()] || d).join(', ');
    label += ` on ${dayLabels}`;
  }

  return label;
}

// All known preset rrule values — used to build the frequency filter options.
const FREQUENCY_OPTIONS = [
  { value: 'FREQ=DAILY;INTERVAL=1', labelKey: 'maintenanceTasks.recurrence.daily' },
  { value: 'FREQ=WEEKLY;INTERVAL=1', labelKey: 'maintenanceTasks.recurrence.weekly' },
  { value: 'FREQ=WEEKLY;INTERVAL=2', labelKey: 'maintenanceTasks.recurrence.biWeekly' },
  { value: 'FREQ=MONTHLY;INTERVAL=1', labelKey: 'maintenanceTasks.recurrence.monthly' },
  { value: 'FREQ=MONTHLY;INTERVAL=3', labelKey: 'maintenanceTasks.recurrence.quaterly' },
  { value: 'FREQ=YEARLY;INTERVAL=1', labelKey: 'maintenanceTasks.recurrence.yearly' },
  { value: 'FREQ=YEARLY;INTERVAL=2', labelKey: 'maintenanceTasks.recurrence.biAnnually' },
] as const;

const DEFAULT_FILTERS = {
  assetId: 'all',
  showAll: false,
  frequency: 'all',
};

const MaintenanceTasks: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<MaintenanceTask[]>([]);
  const { users: availableUsers, assets, userMap } = useDataStore();
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTask, setDialogTask] = useState<MaintenanceTask | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const { hasPermission } = usePermission();

  const { currentSite } = useSiteStore();

  // ─── Clear filters when site changes (synchronous, before effects run) ────
  const prevSiteId = useRef(currentSite?.id);
  if (prevSiteId.current !== currentSite?.id) {
    prevSiteId.current = currentSite?.id;
    setFilters(DEFAULT_FILTERS);
    setSorting([]);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setTasks([]);
    setFilteredTasks([]);
  }
  // ─────────────────────────────────────────────────────────────────────────

  const { requestMaintenanceTaskRefresh } = useMaintenanceTaskBroadcast((event) => {
    if (event.type === 'MAINTENANCE_TASK_REFRESHED') {
      loadTasks();
    }
  });

  const loadTasks = useCallback(async () => {
    if (!currentSite?.id) return;

    setLoading(true);
    try {
      const assetId = filters.assetId !== 'all' ? filters.assetId : undefined;
      const data = await maintenanceTaskService.list(currentSite.id, assetId);
      setTasks(data.sort((a, b) => a.title.localeCompare(b.title)));
    } catch (error) {
      logger.error('Failed to load maintenance tasks', error);
      MessengerService.error('Failed to load maintenance tasks');
    } finally {
      setLoading(false);
    }
  }, [currentSite?.id, filters.assetId]);

  const handleCreate = () => {
    setDialogTask(null);
    setDialogOpen(true);
  };

  const handleEdit = useCallback((task: MaintenanceTask) => {
    setDialogTask(task);
    setDialogOpen(true);
  }, []);

  const handleDialogClose = () => {
    setDialogOpen(false);
    setDialogTask(null);
  };

  const handleTaskCreatedOrUpdated = async () => {
    requestMaintenanceTaskRefresh();
    await loadTasks();
    setDialogOpen(false);
    setDialogTask(null);
  };

  const handleDelete = useCallback(
    async (task: MaintenanceTask) => {
      MessengerService.confirmDelete({
        itemName: task.title,
        itemType: 'Maintenance Task',
        onDelete: async () => {
          await maintenanceTaskService.delete(task.id);
        },
        onSuccess: async () => {
          requestMaintenanceTaskRefresh();
          await loadTasks();
        },
        onError: (error) => {
          MessengerService.error(`Failed to delete maintenance task: ${error.message}`);
        },
        undoTimeout: 5000,
      });
    },
    [loadTasks]
  );

  const handleToggleActive = useCallback(
    async (task: MaintenanceTask) => {
      try {
        setIsDeactivating(true);
        await maintenanceTaskService.activate(task.id, !task.isActive);
        MessengerService.success(`Task ${task.isActive ? 'deactivated' : 'activated'} successfully`);
        requestMaintenanceTaskRefresh();
        await loadTasks();
      } catch (error) {
        logger.error('Failed to toggle task status', error);
        MessengerService.error('Failed to update task status');
      } finally {
        setIsDeactivating(false);
      }
    },
    [loadTasks]
  );

  const columns: ColumnDef<MaintenanceTask>[] = useMemo(() => {
    const preColumns: ColumnDef<MaintenanceTask>[] = [
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex flex-row items-center gap-1"
          >
            {t('maintenanceTasks.table.title')}
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div className="font-medium">{row.getValue('title')}</div>
        ),
      },
      {
        accessorKey: 'assetName',
        header: t('maintenanceTasks.table.asset'),
        cell: ({ row }) => {
          const assetName = row.getValue('assetName') as string;
          return <div>{assetName}</div>;
        },
      },
      {
        accessorKey: 'description',
        header: t('maintenanceTasks.table.description'),
        cell: ({ row }) => {
          const description = row.getValue('description') as string;
          return (
            <div
              className="max-w-md"
              title={description}
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 4,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                wordBreak: 'break-word',
                whiteSpace: 'normal',
              }}
            >
              {description}
            </div>
          );
        },
      },
      {
        accessorKey: 'assignedUserEmails',
        header: t('maintenanceTasks.table.assignedTo'),
        cell: ({ row }) => {
          const assignedEmails = row.getValue('assignedUserEmails') as string[];
          if (assignedEmails && assignedEmails.length > 0) {
            const firstEmail = assignedEmails[0];
            const userName = (userMap[firstEmail]?.firstName ?? '') + ' ' + (userMap[firstEmail]?.lastName ?? '');
            const isUserNameEmpty = !userName || userName.trim() === '';
            return (
              <TooltipProvider>
                <div className="flex items-center gap-2">
                  {assignedEmails.length === 1 ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-pointer">
                          {!isUserNameEmpty ? userName : assignedEmails[0]}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="flex flex-col gap-1">
                          <div className="font-medium">{!isUserNameEmpty ? userName : assignedEmails[0]}</div>
                          <div className="text-xs text-accent">{assignedEmails[0]}</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-pointer">
                          {assignedEmails.length} {t("workOrders.table.users")}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="grid grid-cols-2 gap-2">
                          {assignedEmails.map((email) => {
                            const userName = (userMap[email]?.firstName ?? '') + ' ' + (userMap[email]?.lastName ?? '');
                            const isUserNameEmpty = !userName || userName.trim() === '';
                            return (
                              <div key={email} className="flex flex-col">
                                <span className="font-medium">{!isUserNameEmpty ? userName : email}</span>
                                <span className="text-xs text-accent">{email}</span>
                              </div>
                            );
                          })}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              </TooltipProvider>
            );
          }
          return <span className="text-muted-foreground">-</span>;
        },
      },
      {
        accessorKey: 'rRule',
        header: () => <p className='text-center'>{t('maintenanceTasks.table.recurrence')}</p>,
        cell: ({ row }) => {
          const rule = formatRRule(row.original.rRule, t);
          return <p className='text-center'>{rule}</p>;
        },
      },
      {
        accessorKey: 'startDate',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex flex-row items-center gap-1"
          >
            {t('maintenanceTasks.table.startDate')}
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </button>
        ),
        cell: ({ row }) => {
          const date = row.getValue('startDate') as string;
          return formatDateOnly(date);
        },
      },
      {
        accessorKey: 'endDate',
        header: t('maintenanceTasks.table.endDate'),
        cell: ({ row }) => {
          const date = row.getValue('endDate') as string | null;
          return date ? formatDateOnly(date) : <span className="text-muted-foreground">-</span>;
        },
      },
      {
        accessorKey: 'isActive',
        header: t('maintenanceTasks.table.status'),
        cell: ({ row }) => {
          const isActive = row.getValue('isActive') as boolean;
          return (
            <Badge variant={isActive ? 'default' : 'secondary'}>
              {isActive ? t('common.active') : t('common.inactive')}
            </Badge>
          );
        },
      },
    ];

    const canWrite = hasPermission(MODULES.MAINTENANCE.TAG, MODULES.MAINTENANCE.ACTIONS.WRITE);
    const canDelete = hasPermission(MODULES.MAINTENANCE.TAG, MODULES.MAINTENANCE.ACTIONS.DELETE);

    if (canWrite || canDelete) {
      preColumns.push({
        id: 'actions',
        header: t('maintenanceTasks.table.actions'),
        cell: ({ row }) => {
          const task = row.original;
          return (
            <div className="text-right" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{t('maintenanceTasks.table.actions')}</DropdownMenuLabel>
                  {canWrite && (
                    <>
                      <DropdownMenuItem onClick={() => handleEdit(task)}>
                        <Edit className="h-4 w-4 mr-2" />
                        {t('common.edit')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(task)} disabled={isDeactivating}>
                        {isDeactivating && <Loader2 className="mr-2 animate-spin" />}
                        {task.isActive ? (
                          <><PowerOff className="h-4 w-4 mr-2" />{t('maintenanceTasks.actions.deactivate')}</>
                        ) : (
                          <><Power className="h-4 w-4 mr-2" />{t('maintenanceTasks.actions.activate')}</>
                        )}
                      </DropdownMenuItem>
                    </>
                  )}
                  {canWrite && canDelete && <DropdownMenuSeparator />}
                  {canDelete && (
                    <DropdownMenuItem
                      onClick={() => handleDelete(task)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t('common.delete')}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      });
    }

    return preColumns;
  }, [t, hasPermission, handleEdit, handleDelete, handleToggleActive, isDeactivating, userMap]);

  const table = useReactTable({
    data: filteredTasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: { sorting, pagination },
  });


  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  }

  const activeFilterCount = () => {
    let counter = 0;
    if (filters.assetId != DEFAULT_FILTERS.assetId) {
      counter += 1;
    }
    if (filters.frequency != DEFAULT_FILTERS.frequency) {
      counter += 1;
    }
    if (filters.showAll != DEFAULT_FILTERS.showAll) {
      counter += 1;
    }

    return counter;
  }

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    let filtered = [...tasks];

    // Filter out inactive / expired tasks unless showAll is enabled
    if (!filters.showAll) {
      const today = dayjs().startOf('day');
      filtered = filtered.filter((task) => {
        if (!task.isActive) return false;
        if (task.endDate && dayjs(task.endDate).isBefore(today)) return false;
        return true;
      });
    }

    // Filter by frequency — match the raw rRule value exactly against the selected preset
    if (filters.frequency && filters.frequency != 'all') {
      filtered = filtered.filter((task) => task.rRule === filters.frequency);
    }

    setFilteredTasks(filtered);
  }, [tasks, filters.showAll, filters.frequency]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div className="min-w-0">
          <h1 className="page-header truncate">{t('maintenanceTasks.title')}</h1>
          <p className="page-subTitle">{t('maintenanceTasks.subTitle')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 sm:w-auto w-full">
          <Can tag={MODULES.MAINTENANCE.TAG} action={MODULES.MAINTENANCE.ACTIONS.WRITE}>
            <Button onClick={handleCreate} className="sm:flex-non flex-1">
              <Plus className="h-4 w-4 mr-2" />
              <span>{t('maintenanceTasks.createNew')}</span>
            </Button>
            <Button variant="outline" onClick={() => setImportModalOpen(true)} className="sm:flex-non flex-1">
              <FileDown className="h-4 w-4 mr-2" />
              <span>{t('maintenanceTasks.importTasks.button')}</span>
            </Button>
          </Can>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => { requestMaintenanceTaskRefresh(); loadTasks(); }}
                disabled={loading}
                className="shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.refresh')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* List */}
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center gap-4 justify-between">
            <CardTitle className="m-0 flex items-center gap-2 shrink-0">
              <CalendarCheck className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span>{t('maintenanceTasks.totalTasks')} ({tasks.length})</span>
            </CardTitle>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="relative gap-2 lg:hidden"
                  disabled={loading}
                >
                  <SlidersHorizontal className="size-4" />
                  Filters
                  {activeFilterCount() > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                      {activeFilterCount()}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="w-72 p-4"
                sideOffset={6}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold">Filters</p>
                  {activeFilterCount() > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground px-2"
                      onClick={handleClearFilters}
                      disabled={loading}
                    >
                      <X className="size-3" />
                      Clear all
                    </Button>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  {/* Show all */}
                  <div className="flex items-center gap-2">
                    <Switch
                      id="showAll"
                      checked={filters.showAll}
                      onCheckedChange={() => setFilters((pre) => ({ ...pre, showAll: !pre.showAll }))}
                      className="shrink-0 transition-all duration-300"
                    />
                    <Label htmlFor="showAll" className="cursor-pointer">
                      {t('maintenanceTasks.showInactiveTasks')}
                    </Label>
                  </div>

                  <Separator />

                  {/* Asset */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Asset</label>
                    <Select
                      value={filters.assetId}
                      onValueChange={(value: string) => setFilters((pre) => ({ ...pre, assetId: value }))}
                    >
                      <SelectTrigger className="w-50">
                        <SelectValue placeholder={t('maintenanceTasks.selectAsset')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.allAssets')}</SelectItem>
                        {assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Frequency */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Recurrence</label>
                    <Select
                      value={filters.frequency || 'all'}
                      onValueChange={(value: string) =>
                        setFilters((pre) => ({ ...pre, frequency: value === 'all' ? '' : value }))
                      }
                    >
                      <SelectTrigger className="w-50">
                        <SelectValue placeholder={t('maintenanceTasks.filters.selectFrequency')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('maintenanceTasks.filters.allFrequencies')}</SelectItem>
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {t(opt.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="hidden lg:flex items-center gap-3 flex-wrap">
              {/* Asset filter */}
              <Select
                value={filters.assetId}
                onValueChange={(value: string) => setFilters((pre) => ({ ...pre, assetId: value }))}
              >
                <SelectTrigger className="w-50">
                  <SelectValue placeholder={t('maintenanceTasks.selectAsset')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.allAssets')}</SelectItem>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>{asset.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Frequency filter */}
              <Select
                value={filters.frequency || 'all'}
                onValueChange={(value: string) =>
                  setFilters((pre) => ({ ...pre, frequency: value === 'all' ? '' : value }))
                }
              >
                <SelectTrigger className="w-50">
                  <SelectValue placeholder={t('maintenanceTasks.filters.selectFrequency')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('maintenanceTasks.filters.allFrequencies')}</SelectItem>
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {t(opt.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Show inactive toggle */}
              <div className="flex items-center gap-2">
                <Switch
                  id="showAll"
                  checked={filters.showAll}
                  onCheckedChange={() => setFilters((pre) => ({ ...pre, showAll: !pre.showAll }))}
                  className="shrink-0 transition-all duration-300"
                />
                <Label htmlFor="showAll" className="cursor-pointer">
                  {t('maintenanceTasks.showInactiveTasks')}
                </Label>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className='bg-card sticky top-0 z-1'>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className={header.id === 'actions' ? 'w-25 text-right' : ''}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading || dataLoading ? (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <div className="flex justify-center items-center py-12"><CompactLoader /></div>
                  </TableCell>
                </TableRow>
              ) : table.getPaginationRowModel().rows?.length ? (
                table.getPaginationRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="cursor-pointer"
                    onClick={() => {
                      if (hasPermission(MODULES.MAINTENANCE.TAG, MODULES.MAINTENANCE.ACTIONS.WRITE)) {
                        handleEdit(row.original);
                      }
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        style={cell.column.id === 'description' ? { whiteSpace: 'normal' } : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24">
                    <div className="text-center py-12">
                      <CalendarCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="text-lg font-medium text-muted-foreground mb-2">{t('maintenanceTasks.messages.noTasksAvailable')}</h3>
                      <p className="text-sm text-muted-foreground">{t('maintenanceTasks.messages.noTasksDescription')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Pagination
            isDataLoading={loading}
            className='mt-5'
            totalPages={table.getPageCount()}
            page={table.getState().pagination.pageIndex + 1}
            size={String(table.getState().pagination.pageSize) as SizeType}
            onPageChange={(page) => { table.setPageIndex(page - 1); }}
            onSizeChange={(size) => { table.setPageSize(Number(size)); table.setPageIndex(0); }}
          />
        </CardContent>
      </Card>

      <TaskDetailsModal
        isOpen={dialogOpen}
        onClose={handleDialogClose}
        onTaskCreated={handleTaskCreatedOrUpdated}
        availableUsers={availableUsers}
        availableAssets={assets}
        dataLoading={loading || dataLoading}
        editMode={dialogTask ? 'wholeSeries' : 'create'}
        editTask={dialogTask || undefined}
      />

      <ImportTasksModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImportSuccess={loadTasks}
        siteId={currentSite?.id ?? ''}
        assets={assets}
        availableUsers={availableUsers}
        isLoading={dataLoading}
      />
    </div>
  );
};

export default MaintenanceTasks;