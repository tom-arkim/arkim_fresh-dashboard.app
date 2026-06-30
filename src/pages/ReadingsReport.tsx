import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw, Filter, Search, Database } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Input } from '@/components/ui/shadcn/input';
import { Button } from '@/components/ui/shadcn/button';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { toast } from 'sonner';
import { SensorReading, SensorReadingConfigurationParameters, SensorReadingsBrowserReportParameters } from '@/types/readings/SensorReading';
import readingsService from '@/services/api/readingService';
import useDataStore from '@/store/dataStore';
import useSiteStore from '@/store/siteStore';
import { formatWithUserSettings } from '@/lib/dayjs-utils';
import {
  ColumnDef,
  ColumnSizingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/shadcn/table';
import { cn, isCancelledError } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';
import { logger } from '@/lib/logger';
import debounce from 'lodash/debounce';
import axios, { CancelTokenSource } from 'axios';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { useDatalogBroadcast } from '@/hooks/broadcasts/use-datalog-broadcast';

interface ReadingsFilters {
  asset_ids: string[];
  metrics: string[] | null;
  filter: string;
  hours: number;
  timezone_offset_hours: number;
  down_sample: string;
}

const DEFAULT_FILTERS: ReadingsFilters = {
  asset_ids: [],
  metrics: null,
  filter: '',
  hours: 24,
  timezone_offset_hours: new Date().getTimezoneOffset() / -60,
  down_sample: 'no',
};

const ReadingsManagement: React.FC = () => {
  const { t } = useTranslation();
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>(undefined);
  const [filterConfig, setFilterConfig] = useState<Array<string> | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const { assets: equipmentList, assetMap } = useDataStore();
  const { currentSite } = useSiteStore();
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({});
  const [columnVisibility, setColumnVisibility] = React.useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const tableContainerRef = useRef<HTMLTableElement | null>(null);

  const { requestDataLogRefresh } = useDatalogBroadcast((event) => {
    if (event.type === 'DATALOG_REFRESHED') {
      refetch();
    }
  });

  const [filters, setFilters] = useState<ReadingsFilters>(DEFAULT_FILTERS);

  // axios cancel token refs
  const readingsCancelTokenRef = useRef<CancelTokenSource>(null);
  const configCancelTokenRef = useRef<CancelTokenSource>(null);

  // ─── Clear filters when site changes (synchronous, before effects run) ────
  const prevSiteId = useRef(currentSite?.id);
  if (prevSiteId.current !== currentSite?.id) {
    prevSiteId.current = currentSite?.id;
    setFilters(DEFAULT_FILTERS);
    setReadings([]);
    setNextToken(undefined);
    setFilterConfig(null);
  }
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (equipmentList.length === 0) {
      setFilters((prevFilters) => ({ ...prevFilters, asset_ids: [] }));
      return;
    }
    if (equipmentList.length > 0 && filters.asset_ids.length === 0) {
      setFilters((prevFilters) => ({ ...prevFilters, asset_ids: [equipmentList[0].id!] }));
    }
  }, [equipmentList, filters.asset_ids.length]);

  const equipmentOptions = React.useMemo(() => {
    return equipmentList.map((eq) => ({ label: eq.name, value: eq.id! }));
  }, [equipmentList]);

  const metricOptions = React.useMemo(() => {
    if (!filterConfig) return [];
    return filterConfig.map((type) => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: type,
    }));
  }, [filterConfig]);

  const fetchFilterConfiguration = useCallback(async () => {
    setConfigLoading(true);
    try {
      if (filters.asset_ids.length === 0) {
        setFilterConfig(null);
        return;
      }

      if (configCancelTokenRef.current) {
        configCancelTokenRef.current.cancel('Operation canceled by the user.');
      }
      configCancelTokenRef.current = axios.CancelToken.source();

      const params: SensorReadingConfigurationParameters = {
        asset_ids: filters.asset_ids,
        days: Math.max(Math.round(filters.hours / 24), 1),
      };
      const config = await readingsService.getReadingsConfiguration(params, configCancelTokenRef.current.token);
      setFilterConfig(config);
    } catch (err) {
      if (isCancelledError(err)) {
        logger.info('Previous request canceled', err);
        return;
      }
      toast.error('Failed to load filter options. Please try again.');
      setFilterConfig(null);
    } finally {
      setConfigLoading(false);
    }
  }, [filters.asset_ids, filters.hours]);

  const fetchReadings = useCallback(
    async (isLoadMore = false, filters: ReadingsFilters, token?: string) => {
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      if (filters.asset_ids.length === 0) {
        setReadings([]);
        setNextToken(undefined);
        setIsLoading(false);
        if (isLoadMore) setIsLoadingMore(false);
        return;
      }
      try {
        if (readingsCancelTokenRef.current) {
          readingsCancelTokenRef.current.cancel('Operation canceled by the user.');
        }
        readingsCancelTokenRef.current = axios.CancelToken.source();

        const params: SensorReadingsBrowserReportParameters = {
          asset_ids: filters.asset_ids,
          hours: filters.hours,
          metrics: filters.metrics,
          nextToken: token,
          filter: filters.filter,
          timezone_offset_hours: filters.timezone_offset_hours,
          down_sample: filters.down_sample,
        };
        const reportData = await readingsService.getReadings(params, readingsCancelTokenRef.current.token);

        if (isLoadMore) {
          setReadings((prev) => [...prev, ...reportData.rows]);
        } else {
          setReadings(reportData.rows);
        }
        setNextToken(reportData.nextToken || undefined);
      } catch (err) {
        logger.error(err);
        if (isCancelledError(err)) {
          logger.info('Previous request canceled', err);
          return;
        }
        toast.error('Failed to load readings data. Please try again.');
        setReadings([]);
        setNextToken(undefined);
      } finally {
        if (isLoadMore) {
          setIsLoadingMore(false);
        } else {
          setIsLoading(false);
        }
      }
    },
    []
  );

  const resetFilters = () => {
    setFilters({
      ...DEFAULT_FILTERS,
      asset_ids: equipmentList.length > 0 ? [equipmentList[0].id!] : [],
    });
  };

  const loadMore = () => {
    if (nextToken && !isLoading) {
      fetchReadings(true, filters, nextToken);
    }
  };

  const refetch = () => {
    fetchReadings(false, filters);
  };

  useEffect(() => {
    fetchFilterConfiguration();
  }, [fetchFilterConfiguration]);

  const debouncedFetch = useMemo(() => debounce(fetchReadings, 500), [fetchReadings]);

  useEffect(() => {
    debouncedFetch(false, filters);
    return () => { debouncedFetch.cancel(); };
  }, [debouncedFetch, filters]);

  useEffect(() => {
    const container = document.getElementById('readings-table');
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.target.clientWidth);
    });
    setContainerWidth(container.clientWidth);
    observer.observe(container);
    return () => observer.disconnect();
  }, [readings]);

  const { columns } = useMemo(() => {
    const width = window.innerWidth;
    const isSmallScreen = width < 640;
    const isMediumScreen = width >= 640 && width < 1024;

    const cols: ColumnDef<SensorReading>[] = [
      {
        accessorKey: 'timeUtc',
        header: t('readings.table.timeStamp'),
        cell: ({ getValue }) => {
          const ts = getValue<string>();
          return (
            <div className="font-mono text-xs truncate" title={ts}>
              {formatWithUserSettings(ts)} <br />
              <span className="text-xs text-muted-foreground">
                {formatWithUserSettings(ts, { onlyTime: true })}
              </span>
            </div>
          );
        },
        meta: { priority: 'high' },
        enableSorting: true,
        sortingFn: 'datetime',
      },
      {
        accessorKey: 'sensorId',
        header: t('readings.table.deviceId'),
        cell: ({ getValue }) => (
          <div className="font-mono text-xs truncate" title={getValue<string>()}>
            {getValue<string>()}
          </div>
        ),
        meta: { priority: 'high' },
        enableSorting: true,
      },
      {
        id: 'equipmentName',
        header: t('readings.table.equipmentName'),
        cell: ({ row }) => {
          const equipmentId = row.original.assetId;
          const asset = assetMap[equipmentId!];
          const name = asset ? asset.name : equipmentId;
          return (
            <div className="text-xs sm:text-sm truncate" title={name}>{name}</div>
          );
        },
        meta: { priority: 'high' },
        enableSorting: true,
      },
      {
        accessorKey: 'metricName',
        header: t('readings.table.metricName'),
        cell: ({ getValue }) => (
          <div className="text-xs sm:text-sm truncate" title={getValue<string>()}>
            {getValue<string>()}
          </div>
        ),
        meta: { priority: 'high' },
      },
      {
        accessorFn: (row) => `${row.value.toFixed(2)}`,
        id: 'reading',
        header: t('readings.table.reading'),
        cell: ({ getValue }) => (
          <div className="font-mono text-xs sm:text-sm truncate" title={getValue<string>()}>
            {getValue<string>()}
          </div>
        ),
        meta: { priority: 'high' },
        sortingFn: (rowA, rowB) => {
          const a = rowA.original.value;
          const b = rowB.original.value;
          return a - b;
        },
      },
    ];

    const visibility: Record<string, boolean> = {};
    let visibleCount = 0;

    cols.forEach((col: any) => {
      const key = col.id ?? col.accessorKey!;
      const isVisible =
        col.meta?.priority === 'high'
          ? true
          : col.meta?.priority === 'medium'
            ? !isSmallScreen
            : !isSmallScreen && !isMediumScreen;

      visibility[key] = isVisible;
      if (isVisible) visibleCount++;
    });

    const minSize = containerWidth && visibleCount ? Math.floor(containerWidth / visibleCount) : 200;
    const sizing: ColumnSizingState = {};
    Object.keys(visibility).forEach((key) => { sizing[key] = minSize; });

    setColumnVisibility(visibility);
    setColumnSizing(sizing);

    if (isSmallScreen || isMediumScreen) {
      return { columns: cols };
    }

    const updatedCols = cols.map((col: any) => {
      const key = col.id ?? col.accessorKey!;
      return { ...col, size: sizing[key], minSize: minSize };
    });

    return { columns: updatedCols };
  }, [t, containerWidth, assetMap]);

  const table = useReactTable({
    data: readings,
    columns,
    state: { columnSizing, columnVisibility },
    onColumnSizingChange: setColumnSizing,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableColumnResizing: true,
    onColumnVisibilityChange: setColumnVisibility,
    columnResizeMode: 'onChange',
    defaultColumn: { minSize: 200, maxSize: 800, size: 150 },
  });

  const { rows } = table.getRowModel();

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualItems.length > 0 ? virtualItems?.[0]?.start || 0 : 0;
  const paddingBottom = virtualItems.length > 0 ? totalSize - (virtualItems?.[virtualItems.length - 1]?.end || 0) : 0;

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="page-header">{t('readings.title')}</h1>
          <p className="page-subTitle">{t('readings.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { requestDataLogRefresh(); refetch(); }}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('common.refresh')}</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="m-0 h-4 w-4 sm:h-5 sm:w-5" />
            <span>{t('readings.title')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Filters */}
          <div className="space-y-4 mb-6">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t('readings.searchPlaceholder')}
                value={filters.filter}
                onChange={(e) => setFilters((prev) => ({ ...prev, filter: e.target.value }))}
                className="pl-10 text-xs sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="w-full">
                  <MultiSelect
                    options={equipmentOptions}
                    selected={filters.asset_ids}
                    onChange={(selected) => setFilters((prev) => ({ ...prev, asset_ids: selected }))}
                    placeholder={equipmentList.length === 0 ? 'No assets available' : t('readings.filters.selectAssets')}
                    loading={configLoading}
                    className="w-full min-w-0"
                  />
                </div>

                <div className="w-full">
                  <MultiSelect
                    options={metricOptions}
                    selected={filters.metrics || []}
                    onChange={(selected) => setFilters((prev) => ({ ...prev, metrics: selected }))}
                    placeholder={filters.asset_ids.length === 0 ? t('readings.filters.selectedAssetsFirst') : t('readings.filters.selectMetricTypes')}
                    loading={configLoading}
                    className="w-full min-w-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="w-full">
                  <Select
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, hours: parseInt(value) }))}
                    value={filters.hours.toString()}
                  >
                    <SelectTrigger id="hours" className="w-full">
                      <SelectValue placeholder={t('readings.filters.selectHours')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">{t('common.last')} 6 {t('common.hours')}</SelectItem>
                      <SelectItem value="12">{t('common.last')} 12 {t('common.hours')}</SelectItem>
                      <SelectItem value="24">{t('common.last')} 24 {t('common.hours')}</SelectItem>
                      <SelectItem value={(24 * 30).toString()}>{t('common.last')} 30 {t('common.days')}</SelectItem>
                      <SelectItem value={(24 * 365).toString()}>{t('common.last')} 365 {t('common.days')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full">
                  <Select
                    onValueChange={(value) => setFilters((prev) => ({ ...prev, down_sample: value }))}
                    value={filters.down_sample}
                  >
                    <SelectTrigger id="hours" className="w-full">
                      <SelectValue placeholder={t('readings.filters.selectDownSample')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no">{t('readings.filters.noDownSample')}</SelectItem>
                      <SelectItem value="5min">5 {t('common.minutes')}</SelectItem>
                      <SelectItem value="hour">1 {t('common.hour')}</SelectItem>
                      <SelectItem value="6hour">6 {t('common.hours')}</SelectItem>
                      <SelectItem value="day">1 {t('common.day')}</SelectItem>
                      <SelectItem value="month">1 {t('common.month')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="text-xs sm:text-sm whitespace-nowrap flex-1 md:flex-none"
                    size="sm"
                  >
                    <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {t('common.clear')}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="overflow-auto rounded-md border w-full">
              <Table style={{ minWidth: table.getCenterTotalSize() }}>
                <TableHeader className='bg-card sticky top-0 z-1'>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="text-xs sm:text-sm relative" style={{ width: header.getSize() }}>
                          <Skeleton className="h-4 w-full" />
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {[...Array(10)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(8)].map((_, j) => (
                        <TableCell key={j} style={{ width: 'calc(100% / 8)' }}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : readings.length === 0 ? (
            <div className="overflow-auto rounded-md border w-full">
              <Table style={{ minWidth: table.getCenterTotalSize() }}>
                <TableHeader className="bg-background">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id} className="text-xs sm:text-sm relative" style={{ width: header.getSize() }}>
                          <div
                            className={cn('flex items-center', header.column.getCanSort() && 'cursor-pointer select-none')}
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{ asc: <span className="pl-2">↑</span>, desc: <span className="pl-2">↓</span> }[header.column.getIsSorted() as string] ??
                              (header.column.getCanSort() ? <span className="pl-2">↕</span> : null)}
                            {header.column.getCanResize() && (
                              <div
                                onMouseDown={header.getResizeHandler()}
                                onTouchStart={header.getResizeHandler()}
                                className="absolute right-0 top-0 h-full w-1 bg-primary cursor-col-resize select-none touch-none"
                              />
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center text-gray-500 text-sm">
                      {filters.asset_ids.length === 0 ? t('readings.filters.noAssetsSelected') : t('readings.noDataAvailable')}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <Table
              className="table-fixed"
              style={{ width: table.getCenterTotalSize() }}
              divProps={{
                ref: tableContainerRef,
                className: 'w-full h-[calc(100vh-25rem)] overflow-auto rounded-md border',
                id: 'readings-table',
              }}
            >
              <TableHeader className="sticky top-0 bg-background border-b z-20">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} className="text-xs sm:text-sm relative border-b-2" style={{ width: header.getSize() }}>
                        <div
                          className={cn('flex items-center', header.column.getCanSort() && 'cursor-pointer select-none')}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{ asc: <span className="pl-2">↑</span>, desc: <span className="pl-2">↓</span> }[header.column.getIsSorted() as string] ??
                            (header.column.getCanSort() ? <span className="pl-2">↕</span> : null)}
                          {header.column.getCanResize() && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className="absolute right-0 top-0 h-full w-1 bg-primary cursor-col-resize select-none touch-none"
                            />
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>

              <TableBody>
                {paddingTop > 0 && (
                  <tr><td colSpan={columns.length} style={{ height: `${paddingTop}px` }} /></tr>
                )}
                {virtualItems.map((virtualItem) => {
                  const row = rows[virtualItem.index];
                  return (
                    <TableRow key={row.id} style={{ height: `${virtualItem.size}px` }}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
                {paddingBottom > 0 && (
                  <tr><td colSpan={columns.length} style={{ height: `${paddingBottom}px` }} /></tr>
                )}
              </TableBody>
            </Table>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <div className="text-xs sm:text-sm text-muted-foreground">
              Showing {readings.length} records
              {filters.filter && <span> (filtered by search: "{filters.filter}")</span>}
            </div>
            {nextToken && (
              <Button variant="outline" onClick={loadMore} disabled={isLoadingMore} size="sm" className="text-xs sm:text-sm">
                {isLoadingMore ? 'Loading...' : 'Load More'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReadingsManagement;