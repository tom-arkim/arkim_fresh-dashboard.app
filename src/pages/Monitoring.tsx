import { Button } from '@/components/ui/shadcn/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
} from '@/components/ui/shadcn/chart';
import { TimeFrame } from '@/config/enum';
import useDataStore from '@/store/dataStore';
import dayjs from 'dayjs';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  XAxis,
  YAxis,
} from 'recharts';
import {
  cn,
  getWeekOfMonth,
  hashStringToColor,
  isCancelledError,
} from '@/lib/utils';
import { AlertCircle, Minus, Plus } from 'lucide-react';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import { useTranslation } from 'react-i18next';
import { logger } from '@/lib/logger';
import axios, { CancelTokenSource } from 'axios';
import { toast } from 'sonner';
import readingsService from '@/services/api/readingService';
import {
  SensorReading,
  SensorReadingConfigurationParameters,
  SensorReadingsBrowserReportParameters,
} from '@/types/readings/SensorReading';
import { debounce, filter } from 'lodash';
import { MultiSelect } from '@/components/ui/MultiSelect';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { DEFAULT_PAST_DAYS } from '@/config/constant';
import useSiteStore from '@/store/siteStore';
import { useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { ArkimLoader } from '@/components/ui/ArkimLoader';
import AssetLiveGrid from '@/components/dashboard/AssetLiveGrid';
import FaultHistory, { FaultHistorySkeleton } from '@/components/dashboard/FaultHistory';
import RateBars, { RateBarsSkeleton } from '@/components/dashboard/RateBars';
import useLiveMonitoring from '@/hooks/useLiveMonitoring';
import { getMetricLabel, compareMetricNames, getMetricRenderKind } from '@/lib/metricVocabulary';
dayjs.extend(weekOfYear);

const DEFAULT_FILTERS: SensorReadingsBrowserReportParameters = {
  asset_ids: [],
  metrics: null,
  filter: '',
  hours: DEFAULT_PAST_DAYS * 24,
  timezone_offset_hours: new Date().getTimezoneOffset() / -60,
  down_sample: 'hour',
};

const MonitoringGraph = () => {
  const { t } = useTranslation();
  const timeFrameOptions = [
    { value: TimeFrame.Hour, label: t('common.hour') },
    { value: TimeFrame.Day, label: t('common.day') },
    { value: TimeFrame.Month, label: t('common.month') },
  ];

  const { currentSite } = useSiteStore();

  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>(
    TimeFrame.Hour
  );
  const [hoveredDataKey, setHoveredDataKey] = useState<string | null>(null);
  const [highLightDataKey, setHighLightDataKey] = useState<string | null>(null);
  const { assets: equipmentList, assetMap: assetsMap, isLoadingAssets } = useDataStore();
  const location = useLocation();
  const navAppliedRef = useRef(false);
  // Shared live readings (same data the widget grid draws) → instant drill-down.
  const live = useLiveMonitoring();

  // Zoom and pan states
  const [zoomState, setZoomState] = useState<{
    refAreaLeft?: string | number;
    refAreaRight?: string | number;
    left: string | number;
    right: string | number;
    top: string | number;
    bottom: string | number;
  }>({
    left: 'dataMin',
    right: 'dataMax',
    top: 'auto',
    bottom: 'auto',
    refAreaLeft: undefined,
    refAreaRight: undefined,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SensorReadingsBrowserReportParameters>(DEFAULT_FILTERS);
  const [metricConfig, setMetricConfig] = useState<Array<string> | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [readingsAvailableAssetsIds, setReadingsAvailableAssetsIds] = useState<
    string[]
  >([]);

  // ─── Clear filters when location changes (synchronous, before effects run) ─
  const prevSiteId = useRef(currentSite?.id);
  if (prevSiteId.current !== currentSite?.id) {
    prevSiteId.current = currentSite?.id;
    setFilters(DEFAULT_FILTERS);
    setSelectedTimeFrame(TimeFrame.Hour);
    setMetricConfig(null);
    setReadings([]);
    setReadingsAvailableAssetsIds([]);
    setHighLightDataKey(null);
    setZoomState({
      left: 'dataMin',
      right: 'dataMax',
      top: 'auto',
      bottom: 'auto',
      refAreaLeft: undefined,
      refAreaRight: undefined,
    });
  }
  // ─────────────────────────────────────────────────────────────────────────

  // axios cancel token ref
  const readingsCancelTokenRef = useRef<CancelTokenSource>(null);
  const configCancelTokenRef = useRef<CancelTokenSource>(null);


  // Create chart configuration for shadcn/ui chart components
  const chartConfig: ChartConfig = useMemo(() => {
    const configObj: ChartConfig = {};

    if (!equipmentList.length) return configObj;

    equipmentList.forEach((asset, index) => {
      if (asset.id) {
        configObj[asset.id] = {
          label: asset.name || `Asset ${index + 1}`,
          color: hashStringToColor(asset.id),
        };
      }
    });

    return configObj;
  }, [equipmentList]);

  // Available filter options
  const equipmentOptions = useMemo(() => {
    return equipmentList.map((eq) => ({
      label: eq.name,
      value: eq.id!,
    }));
  }, [equipmentList]);

  const metricOptions = useMemo(() => {
    if (!metricConfig) return [];
    return metricConfig.map((type) => ({
      label: getMetricLabel(type), // shared vocabulary (consistent w/ widgets)
      value: type,
    }));
  }, [metricConfig]);

  // Fetch filter configuration
  const fetchFilterConfiguration = useCallback(async () => {
    try {
      setConfigLoading(true);
      if (filters.asset_ids.length === 0) {
        setMetricConfig(null);
        return;
      }

      if (configCancelTokenRef.current) {
        configCancelTokenRef.current.cancel('Operation canceled by the user.');
      }
      configCancelTokenRef.current = axios.CancelToken.source();

      const params: SensorReadingConfigurationParameters = {
        asset_ids: filters.asset_ids,
        days: DEFAULT_PAST_DAYS,
      };
      const config = await readingsService.getReadingsConfiguration(
        params,
        configCancelTokenRef.current.token
      );
      setMetricConfig(config);
    } catch (err) {
      if (isCancelledError(err)) {
        logger.info('Previous request canceled', err);
        return;
      }
      toast.error('Failed to load filter options. Please try again.');
      setMetricConfig(null);
    } finally {
      setConfigLoading(false);
    }
  }, [filters.asset_ids, filters.hours]);

  // Initialize data
  useEffect(() => {
    fetchFilterConfiguration();
  }, [fetchFilterConfiguration]);

  // Fetch readings data with filters
  const fetchReadings = useCallback(
    async (filters: SensorReadingsBrowserReportParameters, token?: string) => {
      setIsLoading(true);

      if (filters.asset_ids.length === 0 || !filters.metrics?.length) {
        setReadings([]);
        setIsLoading(false);
        return;
      }
      try {
        if (readingsCancelTokenRef.current) {
          readingsCancelTokenRef.current.cancel(
            'Operation canceled by the user.'
          );
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
        const reportData = await readingsService.getReadings(
          params,
          readingsCancelTokenRef.current.token
        );

        setReadings(reportData.rows);
      } catch (err) {
        logger.error(err);
        if (isCancelledError(err)) {
          logger.info('Previous request canceled', err);
          return;
        }
        toast.error('Failed to load readings data. Please try again.');
        setReadings([]);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const debouncedFetch = useMemo(
    () => debounce(fetchReadings, 500),
    [fetchReadings]
  );

  const isDatasetLarge = readings.length > 300;

  useEffect(() => {
    setIsLoading(true);
    debouncedFetch(filters);
    return () => {
      debouncedFetch.cancel();
    };
  }, [debouncedFetch, filters]);

  const lineChartData = useMemo(() => {
    // Collect all timestamps
    if (!readings.length) {
      return [];
    }

    // Group data by timestamp to handle multiple assets
    const dataMap = new Map<number, Record<string, any>>();
    const assetsIds = new Set<string>();

    readings.forEach((reading) => {
      // Defensive: only chart the SELECTED assets, even if the backend
      // over-returns. Keeps the chart + legend scoped to filters.asset_ids.
      if (reading.assetId && !filters.asset_ids.includes(reading.assetId)) return;

      const ts = dayjs(reading.timeUtc).unix() * 1000;

      if (!dataMap.has(ts)) {
        dataMap.set(ts, {
          ts,
          fullTimestamp: reading.timeUtc,
        });
      }

      const entry = dataMap.get(ts)!;
      if (reading.assetId) {
        entry[reading.assetId] = reading.value;
        assetsIds.add(reading.assetId);
      }
    });

    setReadingsAvailableAssetsIds(Array.from(assetsIds));
    // Convert map to array and sort by timestamp
    return Array.from(dataMap.values()).sort((a, b) => a.ts - b.ts);
  }, [readings, filters.asset_ids]);

  const { left, right, refAreaLeft, refAreaRight } = zoomState;

  const visibleData = lineChartData;
  const chartStartTime =
    left === 'dataMin' ? lineChartData[0]?.ts || 0 : Number(left);
  const chartEndTime =
    right === 'dataMax'
      ? lineChartData[lineChartData.length - 1]?.ts || 0
      : Number(right);

  const xAxisTicks = useMemo((): number[] => {
    const start = dayjs(chartStartTime);
    const end = dayjs(chartEndTime);

    switch (selectedTimeFrame) {
      case TimeFrame.Hour: {
        const hours = end.diff(start, 'hour');
        // Limit to max ~24-48 ticks
        const interval = Math.max(1, Math.ceil(hours / 24));
        const ticks = [];
        for (let i = 0; i <= hours; i += interval) {
          ticks.push(start.add(i, 'hour').valueOf());
        }
        return ticks;
      }
      case TimeFrame.Day: {
        const days = end.diff(start, 'day');
        const interval = Math.max(1, Math.ceil(days / 30));
        const ticks = [];
        for (let i = 0; i <= days; i += interval) {
          ticks.push(start.add(i, 'day').valueOf());
        }
        return ticks;
      }
      case TimeFrame.Month: {
        // ticks every 1 week between start and end
        const weeks = end.diff(start, 'week');
        return Array.from({ length: weeks + 1 }, (_, i) =>
          start.add(i, 'week').startOf('week').valueOf()
        );
      }
      default:
        return [start.valueOf()];
    }
  }, [selectedTimeFrame, chartStartTime, chartEndTime]);

  const handleTimeFrameChange = (timeFrame: TimeFrame) => {
    setSelectedTimeFrame(timeFrame);

    let downSample = 'hour';
    let hours = DEFAULT_PAST_DAYS * 24;
    switch (timeFrame) {
      case TimeFrame.Hour:
        downSample = 'hour';
        hours = DEFAULT_PAST_DAYS * 24;
        break;
      case TimeFrame.Day:
        downSample = 'day';
        hours = 24 * 30;
        break;
      case TimeFrame.Month:
        downSample = 'month';
        hours = 24 * 365;
        break;
    }

    setFilters((pre) => ({
      ...pre,
      down_sample: downSample,
      hours: hours,
    }));
  };

  // Reset zoom when data changes
  useEffect(() => {
    setZoomState((prev) => ({
      ...prev,
      left: 'dataMin',
      right: 'dataMax',
      refAreaLeft: undefined,
      refAreaRight: undefined,
    }));
  }, [readings]); // Reset on data change

  const zoomOut = useCallback(() => {
    setZoomState((prev) => ({
      ...prev,
      left: 'dataMin',
      right: 'dataMax',
      refAreaLeft: undefined,
      refAreaRight: undefined,
    }));
  }, []);

  const onMouseDown = useCallback((e: any) => {
    if (e) {
      setZoomState((prev) => ({ ...prev, refAreaLeft: e.activeLabel }));
    }
  }, []);

  const onMouseMove = useCallback(
    (e: any) => {
      if (zoomState.refAreaLeft) {
        setZoomState((prev) => ({ ...prev, refAreaRight: e.activeLabel }));
      }
    },
    [zoomState.refAreaLeft]
  );

  const onMouseUp = useCallback(() => {
    setZoomState((prev) => {
      let { refAreaLeft, refAreaRight } = prev;

      if (refAreaLeft === refAreaRight || !refAreaRight) {
        return {
          ...prev,
          refAreaLeft: undefined,
          refAreaRight: undefined,
        };
      }

      if (
        typeof refAreaLeft === 'number' &&
        typeof refAreaRight === 'number' &&
        refAreaLeft > refAreaRight
      ) {
        [refAreaLeft, refAreaRight] = [refAreaRight, refAreaLeft];
      }

      return {
        ...prev,
        refAreaLeft: undefined,
        refAreaRight: undefined,
        left: refAreaLeft!,
        right: refAreaRight!,
      };
    });
  }, []);

  const chartTitle = useMemo(() => {
    if (!filters.metrics || filters.metrics?.length === 0) return '';
    return getMetricLabel(filters.metrics[0]); // shared vocabulary
  }, [filters.metrics]);

  // Per-type drill-down: the selected metric's render kind decides whether the
  // chart area is a line chart, a fault history, or rate bars.
  const renderKind = useMemo(
    () => (filters.metrics?.[0] ? getMetricRenderKind(filters.metrics[0]) : 'continuous'),
    [filters.metrics],
  );

  // Drill-down: select an asset (+ metric) → the time-series chart populates.
  // Seed `readings` from the already-fetched widget data so drilling into an
  // asset you can see is INSTANT (the debounced fetch then refreshes silently).
  const handleDrill = useCallback(
    (assetId: string, metricName: string) => {
      const metric = live.groups
        .find((g) => g.assetId === assetId)
        ?.metrics.find((m) => m.metricName === metricName);
      if (metric?.series.length) {
        setReadings(
          metric.series.map((p) => ({
            companyId: '',
            assetId,
            sensorId: '',
            metricName,
            timeUtc: p.timeUtc,
            value: p.value,
            unit: metric.unit,
          })),
        );
      }
      setFilters((prev) => ({ ...prev, asset_ids: [assetId], metrics: [metricName] }));
    },
    [live.groups],
  );
  // Narrow a multi-asset fault/rate view down to a single asset.
  const handleNarrow = useCallback((assetId: string) => {
    setFilters((prev) => ({ ...prev, asset_ids: [assetId] }));
  }, []);
  const backToGrid = useCallback(() => {
    setFilters((prev) => ({ ...prev, asset_ids: [], metrics: null }));
  }, []);

  // #2 — initial pre-filter from navigation (dashboard strip → Monitoring).
  // Applied once, and only for an asset that belongs to the CURRENT site
  // (guards against a stale link after a facility switch).
  useEffect(() => {
    if (navAppliedRef.current) return;
    const st = location.state as { assetId?: string; metricName?: string } | null;
    if (!st?.assetId) {
      navAppliedRef.current = true;
      return;
    }
    if (assetsMap[st.assetId]) {
      setFilters((prev) => ({
        ...prev,
        asset_ids: [st.assetId!],
        metrics: st.metricName ? [st.metricName] : prev.metrics,
      }));
      navAppliedRef.current = true;
    }
  }, [location.state, assetsMap]);

  // Auto-pick the priority metric (METRIC_ORDER) when an asset is selected
  // without one — friendly default + completes a nav pre-filter lacking a metric.
  useEffect(() => {
    if (filters.asset_ids.length > 0 && !filters.metrics && metricConfig?.length) {
      const top = [...metricConfig].sort(compareMetricNames)[0];
      setFilters((prev) => ({ ...prev, metrics: [top] }));
    }
  }, [filters.asset_ids, filters.metrics, metricConfig]);


  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between capitalize text-xl">
          {chartTitle} {t('monitoring.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Graph Controls - Responsive Layout */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-start">
          {/* Filter Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <div className="w-full">
              <MultiSelect
                options={equipmentOptions}
                selected={filters.asset_ids}
                onChange={(selected) => {
                  setFilters((prev) => ({ ...prev, asset_ids: selected }));
                  if (selected.length === 0) {
                    setFilters((prev) => ({ ...prev, metrics: null }));
                  }
                }}
                placeholder={
                  equipmentList.length === 0
                    ? 'No assets available'
                    : t('readings.filters.selectAssets')
                }
                loading={configLoading}
                className="w-full min-w-0"
              />
            </div>

            <div className="w-full">
              <Select
                value={filters.metrics?.[0] || ''}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, metrics: [value] }))
                }
                disabled={filters.asset_ids.length === 0}
              >
                <SelectTrigger className="w-full" disabled={configLoading}>
                  <SelectValue
                    placeholder={
                      configLoading
                        ? t('common.loading')
                        : filters.asset_ids.length === 0
                          ? t('readings.filters.selectedAssetsFirst')
                          : t('readings.filters.selectMetricTypes')
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {metricOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Timeframe Buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            {timeFrameOptions.map((option) => (
              <Button
                key={option.value}
                variant={
                  selectedTimeFrame === option.value ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => {
                  handleTimeFrameChange(option.value);
                }}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Body: facility-switch loader · default widget grid · drill-down chart */}
        {isLoadingAssets ? (
          <div className="flex items-center justify-center py-24">
            <ArkimLoader
              size={56}
              label={t('monitoring.loadingFacility', { site: currentSite?.name ?? '' })}
            />
          </div>
        ) : filters.asset_ids.length === 0 ? (
          /* Friendly default: every streaming asset as a clickable widget card */
          <AssetLiveGrid
            groups={live.groups}
            loading={live.loading}
            error={live.error}
            onSelect={handleDrill}
          />
        ) : (
        <>
        <div className="flex">
          <Button variant="ghost" size="sm" onClick={backToGrid} className="gap-1">
            <ChevronLeft className="h-4 w-4" /> {t('monitoring.allAssets')}
          </Button>
        </div>
        {/* Chart */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center justify-end">
              <div className="flex items-center gap-4">
                {left !== 'dataMin' && right !== 'dataMax' && (
                  <Button variant="outline" size="sm" onClick={zoomOut}>
                    {t('monitoring.resetZoom')}
                  </Button>
                )}
                {chartStartTime && chartEndTime ? (
                  <span
                    className={cn(
                      'text-sm text-muted-foreground',
                      isLoading && 'hidden'
                    )}
                  >
                    {dayjs(chartStartTime).format('DD MMM YYYY')} -{' '}
                    {dayjs(chartEndTime).format('DD MMM YYYY')}
                  </span>
                ) : null}
              </div>
            </CardTitle>
          </CardHeader>
          {isLoading && !readings.length ? (
            <CardContent className='px-0'>
              {renderKind === 'counter' ? (
                <RateBarsSkeleton />
              ) : renderKind === 'fault' ? (
                <FaultHistorySkeleton />
              ) : (
              <div className="h-120 w-full flex flex-col gap-2 p-4">
                <div className="flex flex-1 gap-4">
                  {/* Y-axis placeholder */}
                  <div className="flex flex-col justify-between py-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-4 w-8 rounded-md" />
                    ))}
                  </div>
                  {/* Chart area */}
                  <div className="flex-1 h-full relative">
                    <Skeleton className="h-full w-full rounded-xl opacity-50" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-muted-foreground font-medium animate-pulse">
                        {t('common.loading')}
                      </span>
                    </div>
                  </div>
                </div>
                {/* X-axis placeholder */}
                <div className="flex justify-between pl-12 pr-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Skeleton key={i} className="h-4 w-12 rounded-md" />
                  ))}
                </div>
              </div>
              )}
            </CardContent>
          ) : (
            <CardContent className='px-0'>
              {!lineChartData.length ? (
                <div className="flex flex-col items-center justify-center h-96 text-center space-y-4">
                  <div className="rounded-full bg-muted p-6">
                    <AlertCircle className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    {filters.asset_ids.length > 0 &&
                      (!filters.metrics || filters.metrics.length === 0) ? (
                      <>
                        <h3 className="text-lg font-semibold">
                          {t('readings.filters.selectMetricTypes')}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          Please select a metric type to view the data graph.
                        </p>
                      </>
                    ) : (
                      <>
                        <h3 className="text-lg font-semibold">
                          {t('monitoring.emptyState.title')}
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md">
                          {t('monitoring.emptyState.description')}
                        </p>
                        {readings.length === 0 &&
                          filters.asset_ids.length > 0 &&
                          filters.metrics?.length! > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Try selecting a different time range or metric.
                            </p>
                          )}
                      </>
                    )}
                  </div>
                </div>
              ) : renderKind === 'fault' ? (
                <FaultHistory
                  readings={readings}
                  assetIds={filters.asset_ids}
                  assetMap={assetsMap}
                  onSelectAsset={handleNarrow}
                />
              ) : renderKind === 'counter' ? (
                <RateBars
                  readings={readings}
                  assetIds={filters.asset_ids}
                  assetMap={assetsMap}
                  metricName={filters.metrics?.[0] ?? ''}
                  timeFrame={selectedTimeFrame}
                  onSelectAsset={handleNarrow}
                />
              ) : (
                <>
                  <div
                    className="h-120 w-full select-none"
                    style={{ userSelect: 'none' }}
                  >
                    <ChartContainer
                      config={chartConfig}
                      className="aspect-auto h-120 w-full"
                    >
                      <LineChart
                        accessibilityLayer
                        data={visibleData}
                        margin={{ top: 20, right: 20, left: 0, bottom: 40 }}
                        key={`${filters.metrics}-${selectedTimeFrame}`}
                        onMouseDown={onMouseDown}
                        onMouseMove={onMouseMove}
                        onMouseUp={onMouseUp}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="#e2e8f0"
                          vertical={true}
                          horizontal={true}
                        />
                        <XAxis
                          dataKey="ts"
                          type="number"
                          domain={[left, right]}
                          allowDataOverflow
                          scale="time"
                          ticks={xAxisTicks}
                          tick={(props) => {
                            const { x, y, payload } = props;
                            const date = dayjs(payload.value);

                            if (selectedTimeFrame === TimeFrame.Hour) {
                              // Two-line format for hours
                              return (
                                <text
                                  x={x}
                                  y={y + 10}
                                  textAnchor="middle"
                                  fill="#64748b"
                                  fontSize={12}
                                >
                                  <tspan x={x} dy="0">
                                    {date.format('HH:mm')}
                                  </tspan>
                                  <tspan x={x} dy="14">
                                    {date.format('DD-MMM')}
                                  </tspan>
                                </text>
                              );
                            }

                            // Single line for other frames
                            let label = '';
                            switch (selectedTimeFrame) {
                              case TimeFrame.Day:
                                label = date.format('DD-MMM');
                                break;
                              case TimeFrame.Month:
                                label = `W${getWeekOfMonth(date)}-${date.format('MMM')}`;
                                break;
                              default:
                                label = date.format('DD-MMM');
                            }

                            return (
                              <text
                                x={x}
                                y={y + 10}
                                textAnchor="middle"
                                fill="#64748b"
                                fontSize={12}
                              >
                                {label}
                              </text>
                            );
                          }}
                          stroke="#64748b"
                        />
                        <YAxis
                          fontSize={12}
                          stroke="#64748b"
                          // Bounded % metrics (valve_position, humidity) read
                          // correctly against a fixed 0–100 scale.
                          domain={renderKind === 'bounded' ? [0, 100] : undefined}
                          allowDataOverflow={renderKind === 'bounded'}
                          tickFormatter={(value) => `${value.toFixed(1)}`}
                        />

                        <ChartTooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              // Regular data tooltip
                              // Only pick the entry that matches hoveredDataKey
                              const activeEntry = payload.find(
                                (entry) => entry.dataKey === hoveredDataKey
                              );

                              if (!activeEntry) return null;

                              const data = activeEntry.payload;

                              return (
                                <div className="rounded-lg border bg-background p-3 shadow-md min-w-[250px]">
                                  {/* Time */}
                                  <div className="grid grid-cols-2 gap-2 mb-3">
                                    <div className="flex flex-col">
                                      <span className="text-[0.70rem] uppercase text-muted-foreground">
                                        {t('monitoring.tooltip.time')}
                                      </span>
                                      <span className="font-bold text-muted-foreground">
                                        {data?.fullTimestamp
                                          ? dayjs(data.fullTimestamp).format(
                                            'MMM DD, YYYY HH:mm'
                                          )
                                          : label}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Equipment data - only the matched entry */}
                                  <div className="space-y-1 mb-3">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="h-2 w-2 rounded-full"
                                        style={{
                                          backgroundColor: activeEntry.color,
                                        }}
                                      />
                                      <span className="text-sm">
                                        {chartConfig[
                                          activeEntry.dataKey as keyof typeof chartConfig
                                        ]?.label || activeEntry.name}
                                        :{' '}
                                        {(activeEntry.value as number)?.toFixed(
                                          2
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />

                        {/* Equipment lines */}
                        {filters.asset_ids.map((id) => {
                          const equipmentKey = id;
                          const isHighlighted = highLightDataKey === equipmentKey;

                          return [
                            <Line
                              key={`${equipmentKey}-solid`}
                              type="monotone"
                              dataKey={equipmentKey}
                              stroke={`var(--color-${equipmentKey})`}
                              strokeWidth={isHighlighted ? 4 : 2}
                              connectNulls={false}
                              strokeOpacity={isHighlighted ? 1 : 0.4}
                              isAnimationActive={!isDatasetLarge}
                              activeDot={(props: any) => {
                                const { cx, cy, stroke, fill } = props;
                                const dataKey = props.dataKey;
                                if (cx === null || cy === null) {
                                  return <></>;
                                }

                                return (
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={5}
                                    fill={fill}
                                    stroke={stroke}
                                    strokeWidth={1.5}
                                    onMouseEnter={() => {
                                      setHoveredDataKey(dataKey);
                                    }}
                                    onMouseLeave={() => {
                                      setHoveredDataKey(null);
                                    }}
                                  />
                                );
                              }}
                              dot={isDatasetLarge && !isHighlighted ? false : (props) => {
                                const { cx, cy, stroke } = props;
                                if (cx == null || cy == null) return <></>;

                                const dataKey = props.dataKey;
                                const isHovered = hoveredDataKey === dataKey;

                                return (
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={isHovered ? 4 : 2}
                                    fill={stroke || '#2563eb'}
                                    stroke="#fff"
                                    strokeWidth={1.5}
                                    strokeOpacity={
                                      isHovered ? 1 : (isHighlighted ? 0.6 : 0.1)
                                    }
                                  />
                                );
                              }}
                            />,
                            <Line
                              key={`${equipmentKey}-dashed`}
                              type="monotone"
                              dataKey={equipmentKey}
                              stroke={`var(--color-${equipmentKey})`}
                              strokeWidth={isHighlighted ? 4 : 2}
                              strokeDasharray={'5 5'}
                              connectNulls={true}
                              isAnimationActive={!isDatasetLarge}
                              strokeOpacity={isHighlighted ? 0.6 : 0.2}
                              legendType="none"
                              activeDot={false}
                              dot={false}
                              tooltipType="none"
                            />,
                          ];
                        })}
                        {refAreaLeft && refAreaRight ? (
                          <ReferenceArea
                            x1={refAreaLeft}
                            x2={refAreaRight}
                            strokeOpacity={0.3}
                          />
                        ) : null}
                      </LineChart>
                    </ChartContainer>
                  </div>

                  {/* Instructions */}
                  <div className="text-sm text-muted-foreground text-center mt-2">
                    Click and drag area to zoom in
                  </div>

                  {/* Legend */}
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {readingsAvailableAssetsIds.map((id) => {
                        const equipmentKey = id;
                        const asset = assetsMap[equipmentKey!];

                        return (
                          <div
                            key={equipmentKey}
                            onClick={() => {
                              if (equipmentKey === highLightDataKey) {
                                setHighLightDataKey('');
                              } else {
                                setHighLightDataKey(equipmentKey!);
                              }
                            }}
                          >
                            <Button
                              variant="ghost"
                              className={cn(
                                'flex w-full items-center justify-start gap-3 rounded-lg px-3 py-2',
                                highLightDataKey === equipmentKey && 'bg-accent'
                              )}
                            >
                              <div
                                className="h-4 w-4 rounded-full border border-border shadow-sm"
                                style={{
                                  backgroundColor: hashStringToColor(
                                    equipmentKey!
                                  ),
                                }}
                              />
                              <span
                                className={cn(
                                  'text-sm font-medium',
                                  highLightDataKey === equipmentKey &&
                                  'text-foreground'
                                )}
                              >
                                {asset?.name}
                              </span>
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          )}
        </Card>
        </>
        )}
      </CardContent>
    </Card>
  );
};

function Monitoring() {
  const { t } = useTranslation();
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="page-header">{t('monitoring.title')}</h1>
        <p className="page-subTitle">{t('monitoring.subTitle')}</p>
      </div>

      <MonitoringGraph />
    </div>
  );
}

export default Monitoring;