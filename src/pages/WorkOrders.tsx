import CompactLoader from '@/components/ui/CompactLoader';
import { Button } from '@/components/ui/shadcn/button';
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
import { formatWithUserSettings, formatDateOnly } from '@/lib/dayjs-utils';
import workOrderService from '@/services/api/workOrderService';
import MessengerService from '@/services/ui/messengerService';
import useSiteStore from '@/store/siteStore';
import useDataStore from '@/store/dataStore';
import { WorkOrder } from '@/types/maintenance/WorkOrder';
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
  ClipboardList,
  FileText,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import WorkOrderFormModal from '@/components/workOrders/WorkOrderFormModal';
import { WorkOrderStatus } from '@/config/enum';
import { getWorkOrderStatusLabel, getWorkOrderStatusVariant } from '@/lib/colors';
import { Badge } from '@/components/ui/shadcn/badge';
import Pagination, { SizeType } from '@/components/ui/Pagination';
import { useWorkOrderBroadcast } from '@/hooks/broadcasts/use-workorder-broadcast';
import { DatePicker } from '@/components/ui/shadcn/datepicker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcn/popover';
import { Separator } from '@/components/ui/shadcn/separator';

const DEFAULT_FILTERS = {
  assetId: 'all',
  status: 'all',
  dueDate: '',
};

// Converts a Date to YYYY-MM-DD using LOCAL time, not UTC.
// Without this, new Date("2026-03-26") is parsed as UTC midnight and
// toISOString() shifts it back a day in timezones east of UTC (e.g. IST = UTC+5:30).
const toLocalDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Parses a YYYY-MM-DD string as a LOCAL date so the picker highlights the correct day.
// new Date("2026-03-26") would give UTC midnight → wrong day in local timezones.
const fromLocalDateString = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const WorkOrders: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([]);
  const { users, assets, userMap, assetMap } = useDataStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const { currentSite } = useSiteStore();

  // ─── Clear filters when site changes (synchronous, before effects run) ────
  const prevSiteId = useRef(currentSite?.id);
  if (prevSiteId.current !== currentSite?.id) {
    prevSiteId.current = currentSite?.id;
    setFilters(DEFAULT_FILTERS);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setSorting([]);
    setWorkOrders([]);
    setFilteredWorkOrders([]);
  }
  // ─────────────────────────────────────────────────────────────────────────

  const loadWorkOrders = useCallback(async () => {
    if (!currentSite?.id) return;

    setLoading(true);
    try {
      const data = await workOrderService.list(
        currentSite.id,
        filters.assetId === 'all' ? undefined : filters.assetId,
        filters.status === 'all'
          ? undefined
          : (filters.status as WorkOrderStatus),
        undefined,
        filters.dueDate || undefined,
      );
      setWorkOrders(data);
    } catch (error) {
      MessengerService.error('Failed to load work orders');
    } finally {
      setLoading(false);
    }
  }, [currentSite, filters.assetId, filters.status, filters.dueDate]);

  const { requestWorkOrderListRefresh } = useWorkOrderBroadcast(async (event) => {
    if (event.type === 'WORK_ORDER_LIST_REFRESH') {
      if (event.siteId === currentSite?.id) {
        await loadWorkOrders();
      }
    }
  });

  const handleCreateWorkOrder = () => {
    setIsFormOpen(true);
  };

  const handleRowClick = (workOrder: WorkOrder) => {
    navigate(`/work-orders/${workOrder.id}`);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
  };

  const handleWorkOrderCreated = () => {
    loadWorkOrders();
    requestWorkOrderListRefresh(currentSite?.id!);
  };

  const columns: ColumnDef<WorkOrder>[] = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex flex-row items-center gap-1"
          >
            {t('workOrders.table.title')}
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
        header: t('workOrders.table.asset'),
        cell: ({ row }) => {
          const assetName = row.getValue('assetName') as string;
          return assetName || <span className="text-muted-foreground">-</span>;
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex flex-row items-center gap-1"
          >
            {t('workOrders.table.status')}
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
          const status = row.getValue('status') as WorkOrderStatus;
          return (
            <Badge
              variant={getWorkOrderStatusVariant(status)}
              className="font-medium text-xs tracking-wider"
            >
              {getWorkOrderStatusLabel(status)}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'dueDate',
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="flex flex-row items-center gap-1"
          >
            {t('workOrders.table.dueDate')}
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
          const dueDate = row.getValue('dueDate') as string;
          return dueDate ? (
            formatDateOnly(dueDate, currentSite?.configuration?.dateFormat)
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: 'createdAtUtc',
        header: t('workOrders.table.createdAt'),
        cell: ({ row }) => {
          const createdAt = row.getValue('createdAtUtc') as string;
          return createdAt ? (
            formatWithUserSettings(createdAt, { includeTime: true })
          ) : (
            <span className="text-muted-foreground">-</span>
          );
        },
      },
      {
        accessorKey: 'assignedUserEmails',
        header: t('workOrders.table.assignedTo'),
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
                          {!isUserNameEmpty
                            ? userName
                            : assignedEmails[0]}
                        </div>
                      </TooltipTrigger>

                      <TooltipContent>
                        <div className="flex flex-col gap-1">
                          <div className="font-medium">
                            {!isUserNameEmpty
                              ? userName
                              : assignedEmails[0]}
                          </div>
                          <div className="text-xs text-accent">
                            {assignedEmails[0]}
                          </div>
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
                                <span className="font-medium">
                                  {!isUserNameEmpty ? userName : email}
                                </span>
                                <span className="text-xs text-accent">
                                  {email}
                                </span>
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
    ],
    [
      t,
      currentSite?.configuration?.dateFormat,
      userMap,
    ]
  );

  const table = useReactTable({
    data: filteredWorkOrders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    state: {
      sorting,
      pagination
    },
  });

  const handleClearFilters = () => {
    setFilters(DEFAULT_FILTERS);
  }

  const activeFilterCount = () => {
    let counter = 0;
    if (filters.assetId != DEFAULT_FILTERS.assetId) {
      counter += 1;
    }
    if (filters.dueDate != DEFAULT_FILTERS.dueDate) {
      counter += 1;
    }
    if (filters.status != DEFAULT_FILTERS.status) {
      counter += 1;
    }

    return counter;
  }

  useEffect(() => {
    loadWorkOrders();
  }, [loadWorkOrders]);

  useEffect(() => {
    let filtered = [...workOrders];

    // Filter by asset
    if (filters.assetId !== 'all') {
      filtered = filtered.filter((wo) => wo.assetId === filters.assetId);
    }

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter((wo) => wo.status === filters.status);
    }

    // Filter by due date
    if (filters.dueDate) {
      filtered = filtered.filter((wo) => wo.dueDate === filters.dueDate);
    }

    setFilteredWorkOrders(filtered);
  }, [workOrders, filters]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 sticky top-0 z-20 pt-4 pb-2" style={{
        backgroundImage: "var(--background-gradient)",
        backgroundAttachment: "fixed",
        backgroundSize: "cover"
      }}>
        <div className="min-w-0">
          <h1 className="page-header truncate">{t('workOrders.title')}</h1>
          <p className="page-subTitle">{t('workOrders.subTitle')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Button onClick={handleCreateWorkOrder} className="sm:w-auto sm:flex-none flex-1">
            <Plus className="h-4 w-4 mr-2" />
            <span>{t('workOrders.form.createNewWorkOrder')}</span>
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  requestWorkOrderListRefresh(currentSite?.id!);
                  loadWorkOrders();
                }}
                disabled={loading}
                className="shrink-0"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.refresh')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* List */}
      <div className='px-2'>
        <Card>
          <CardHeader className="space-y-4">
            {/* Title with Filters */}
            <div className="flex flex-wrap items-center gap-4 justify-between">
              {/* Title with icon */}
              <CardTitle className="m-0 flex items-center gap-2 shrink-0">
                <ClipboardList className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                <span>
                  {t('workOrders.allWorkOrders')}
                </span>
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
                    {/* Asset */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Asset</label>
                      <Select
                        value={filters.assetId}
                        disabled={loading}
                        onValueChange={(value: string) =>
                          setFilters((pre) => ({ ...pre, assetId: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t('workOrders.filters.selectAsset')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t('workOrders.filters.allAssets')}
                          </SelectItem>
                          {assets.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id!}>
                              {asset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Status */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Status</label>
                      <Select
                        value={filters.status}
                        disabled={loading}
                        onValueChange={(value: string) =>
                          setFilters((pre) => ({ ...pre, status: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue
                            placeholder={t('workOrders.filters.selectStatus')}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">
                            {t('workOrders.filters.allStatuses')}
                          </SelectItem>
                          <SelectItem value={WorkOrderStatus.Open}>
                            {t('workOrders.status.open')}
                          </SelectItem>
                          <SelectItem value={WorkOrderStatus.ThreadOpened}>
                            {t('workOrders.status.threadOpened')}
                          </SelectItem>
                          <SelectItem value={WorkOrderStatus.Completed}>
                            {t('workOrders.status.completed')}
                          </SelectItem>
                          <SelectItem value={WorkOrderStatus.Cancelled}>
                            {t('workOrders.status.cancelled')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Separator />

                    {/* Due date */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Due Date</label>
                      <DatePicker
                        disabled={loading}
                        selected={filters.dueDate ? fromLocalDateString(filters.dueDate) : undefined}
                        onSelect={(date?: Date) =>
                          setFilters((prev) => ({
                            ...prev,
                            dueDate: date ? toLocalDateString(date) : '',
                          }))
                        }
                        placeholder={t('workOrders.filters.selectDueDate')}
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <div className="hidden lg:grid grid-cols-1 sm:grid-cols-3 gap-3 w-auto">
                {/* Asset Filter */}
                <Select
                  value={filters.assetId}
                  onValueChange={(value: string) =>
                    setFilters((pre) => ({ ...pre, assetId: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t('workOrders.filters.selectAsset')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t('workOrders.filters.allAssets')}
                    </SelectItem>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id!}>
                        {asset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <Select
                  value={filters.status}
                  onValueChange={(value: string) =>
                    setFilters((pre) => ({ ...pre, status: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t('workOrders.filters.selectStatus')}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t('workOrders.filters.allStatuses')}
                    </SelectItem>
                    <SelectItem value={WorkOrderStatus.Open}>
                      {t('workOrders.status.open')}
                    </SelectItem>
                    <SelectItem value={WorkOrderStatus.ThreadOpened}>
                      {t('workOrders.status.threadOpened')}
                    </SelectItem>
                    <SelectItem value={WorkOrderStatus.Completed}>
                      {t('workOrders.status.completed')}
                    </SelectItem>
                    <SelectItem value={WorkOrderStatus.Cancelled}>
                      {t('workOrders.status.cancelled')}
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Due Date Filter */}
                <DatePicker
                  selected={filters.dueDate ? fromLocalDateString(filters.dueDate) : undefined}
                  onSelect={(date?: Date) =>
                    setFilters((prev) => ({
                      ...prev,
                      dueDate: date ? toLocalDateString(date) : '',
                    }))
                  }
                  placeholder={t('workOrders.filters.selectDueDate')}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className='bg-card sticky top-0 z-1'>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {loading || dataLoading ? (
                  <TableRow>
                    <TableCell colSpan={columns.length}>
                      <div className="flex justify-center items-center py-12">
                        <CompactLoader />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : table.getPaginationRowModel().rows?.length ? (
                  table.getPaginationRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(row.original)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24">
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                          {t('workOrders.messages.noWorkOrdersAvailable')}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t(
                            'workOrders.messages.noWorkOrdersAvailableDescription'
                          )}
                        </p>
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
              onPageChange={(page) => {
                table.setPageIndex(page - 1);
              }}
              onSizeChange={(size) => {
                table.setPageSize(Number(size));
                table.setPageIndex(0);
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Work Order Form Modal */}
      <WorkOrderFormModal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onWorkOrderCreated={handleWorkOrderCreated}
        availableUsers={users}
        availableAssets={assets}
        loading={loading || dataLoading}
      />
    </div>
  );
};

export default WorkOrders;