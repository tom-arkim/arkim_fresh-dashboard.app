'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/shadcn/card';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import dashboardService from '@/services/api/dashboardService';
import useSiteStore from '@/store/siteStore';
import { Zap, DollarSign } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { EnergyUsageOverview } from '@/types/dashboard/dashboard';
import { formatCurrency } from '@/lib/utils';
import dayjs from 'dayjs';
import { EnergyUnit, Metric, RateTiers, TimeFrame } from '@/config/enum';
import { Button } from '@/components/ui/shadcn/button';
import { Switch } from '@/components/ui/shadcn/switch';
import { Badge } from '@/components/ui/shadcn/badge';
import { Separator } from '@/components/ui/shadcn/separator';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useTranslation } from 'react-i18next';

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

type Props = {
  refetch: number;
  setRefreshing: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function EnergyUsageAnalysis({ refetch, setRefreshing }: Props) {
  const { currentSite } = useSiteStore();
  const { t } = useTranslation();
  const [energyUsage, setEnergyUsage] = useState<EnergyUsageOverview | null>(
    null
  );
  const [selectedAsset, setSelectedAsset] = useState('all');
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>(
    TimeFrame.Hour
  );
  const [selectedUnit, setSelectedUnit] = useState<EnergyUnit>(EnergyUnit.KWh);
  const [showPreviousData, setShowPreviousData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!currentSite) return;
    try {
      setLoading(true);
      setRefreshing(true);
      const response = await dashboardService.getEnergyUsageAnalysis(
        currentSite.id!,
        selectedTimeFrame
      );
      setEnergyUsage(response);
    } catch (err: any) {
      setError('Failed to load energy usage data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSite, selectedTimeFrame, refetch]);

  const assetsDetails = useMemo(() => {
    return energyUsage?.assets || [];
  }, [energyUsage]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Custom legend component
  const CustomLegend = ({ payload }: any) => {
    if (!payload) return null;

    return (
      <div className="flex flex-wrap gap-4 p-2 text-sm justify-center items-center">
        {selectedTimeFrame === TimeFrame.Hour && (
          <section>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 border" />
                <span>{`${dayjs().format('ddd D MMM')}`}</span>
              </div>
              {showPreviousData && (
                <div className="flex items-center gap-1">
                  <span className="w-4 h-4 border" />
                  <span>{`${dayjs().subtract(1, 'day').format('ddd D MMM')}`}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {payload.map((entry: any, index: number) => {
          let label = entry.value;

          // it will be null if the time frame is not hour handle it differently
          if (selectedTimeFrame === TimeFrame.Hour) {
            return null;
          } else if (selectedTimeFrame === TimeFrame.Day) {
            label = entry.dataKey.includes('previous')
              ? dayjs().subtract(1, 'month').format('MMM')
              : dayjs().format('MMM');

            return (
              <div key={index} className="flex items-center gap-1">
                <span
                  className="w-4 h-4"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{`${label}`}</span>
              </div>
            );
          } else if (selectedTimeFrame === TimeFrame.Month) {
            label = entry.dataKey.includes('previous')
              ? String(dayjs().year() - 1)
              : String(dayjs().year());

            return (
              <div key={index} className="flex items-center gap-1">
                <span
                  className="w-4 h-4"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{`${label}`}</span>
              </div>
            );
          }

          return null;
        })}
      </div>
    );
  };

  const chartData = useMemo(() => {
    const filteredAssets =
      selectedAsset === 'all'
        ? assetsDetails
        : assetsDetails.filter((a) => a.asset.id === selectedAsset);

    const now = dayjs();

    // creating time slots based on selected time frame
    let timeSlots: { key: string; label: string; sortOrder: number }[] = [];
    if (selectedTimeFrame === TimeFrame.Hour) {
      timeSlots = Array.from({ length: 24 }, (_, i) => ({
        key: String(i).padStart(2, '0'),
        label: `${String(i).padStart(2, '0')}:00`,
        sortOrder: i,
      }));
    } else if (selectedTimeFrame === TimeFrame.Day) {
      const daysInMonth = now.daysInMonth();
      timeSlots = Array.from({ length: daysInMonth }, (_, i) => ({
        key: String(i + 1).padStart(2, '0'),
        label: String(i + 1),
        sortOrder: i + 1,
      }));
    } else if (selectedTimeFrame === TimeFrame.Month) {
      timeSlots = Array.from({ length: 12 }, (_, i) => ({
        key: String(i + 1).padStart(2, '0'),
        label: dayjs().month(i).format('MMM'),
        sortOrder: i + 1,
      }));
    }

    const allowedCategories =
      selectedTimeFrame === TimeFrame.Hour
        ? [
          RateTiers.OnPeak,
          RateTiers.OffPeak,
          RateTiers.MidPeak,
          RateTiers.SuperOffPeak,
        ]
        : [];

    // Initialize chart data
    const chartDataMap: Record<string, any> = {};
    timeSlots.forEach(({ key, label, sortOrder }) => {
      const dataPoint: any = { timestamp: key, label, sortOrder };
      allowedCategories.forEach((category) => {
        dataPoint[`current_${category}`] = 0;
        if (showPreviousData) dataPoint[`previous_${category}`] = 0;
      });
      if (allowedCategories.length === 0) {
        dataPoint.current = 0;
        if (showPreviousData) dataPoint.previous = 0;
      }
      chartDataMap[key] = dataPoint;
    });

    // Populate actual readings
    filteredAssets.forEach((asset) => {
      asset.readings.forEach((reading) => {
        if (reading.metricName !== Metric.Power) return;
        const readingDate = dayjs(reading.timeUtc);
        let timeSlot: string;
        let isPrevious = false;

        if (selectedTimeFrame === TimeFrame.Hour) {
          timeSlot = readingDate.format('HH');
          const today = now.startOf('day');
          const yesterday = today.subtract(1, 'day');
          const readingDay = readingDate.startOf('day');
          if (readingDay.isSame(yesterday)) isPrevious = true;
          else if (readingDay.isSame(today)) isPrevious = false;
          else return;
        } else if (selectedTimeFrame === TimeFrame.Day) {
          timeSlot = readingDate.format('DD');
          const currentMonth = now.startOf('month');
          const lastMonth = currentMonth.subtract(1, 'month');
          const readingMonth = readingDate.startOf('month');
          if (readingMonth.isSame(lastMonth)) isPrevious = true;
          else if (readingMonth.isSame(currentMonth)) isPrevious = false;
          else return;
        } else if (selectedTimeFrame === TimeFrame.Month) {
          timeSlot = readingDate.format('MM');
          const currentYear = now.year();
          const readingYear = readingDate.year();
          if (readingYear === currentYear - 1) isPrevious = true;
          else if (readingYear === currentYear) isPrevious = false;
          else return;
        } else return;

        if (!chartDataMap[timeSlot]) return;

        const value =
          selectedUnit === EnergyUnit.KWh
            ? reading.value || 0
            : reading.cost || 0;

        const period = isPrevious ? 'previous' : 'current';

        if (reading.category && allowedCategories.includes(reading.category)) {
          chartDataMap[timeSlot][`${period}_${reading.category}`] =
            (chartDataMap[timeSlot][`${period}_${reading.category}`] || 0) +
            value;
        } else {
          chartDataMap[timeSlot][period] =
            (chartDataMap[timeSlot][period] || 0) + value;
        }
      });
    });

    return Object.values(chartDataMap).sort(
      (a: any, b: any) => a.sortOrder - b.sortOrder
    );
  }, [
    assetsDetails,
    selectedAsset,
    selectedTimeFrame,
    selectedUnit,
    showPreviousData,
  ]);

  const getBarColor = (category?: string) => {
    switch (category) {
      case RateTiers.OnPeak:
        return '#f97316';
      case RateTiers.OffPeak:
        return '#3b82f6';
      case RateTiers.MidPeak:
        return '#10b981';
      case RateTiers.SuperOffPeak:
        return '#8b5cf6';
      default:
        return '#373737';
    }
  };

  const generateBars = () => {
    const bars = [];
    const firstDataPoint = chartData[0];
    if (!firstDataPoint) return [];

    const categories = Object.keys(firstDataPoint)
      .filter((key) => key.includes('current_'))
      .map((key) => key.replace('current_', ''));

    if (categories.length > 0) {
      categories.forEach((category) => {
        if (showPreviousData) {
          bars.push(
            <Bar
              key={`previous_${category}`}
              dataKey={`previous_${category}`}
              name={`${category} (Previous)`}
              fill="transparent"
              stroke={getBarColor(category)}
              strokeWidth={2}
              fillOpacity={0.6}
              stackId="previous"
            />
          );
        }
        bars.push(
          <Bar
            key={`current_${category}`}
            dataKey={`current_${category}`}
            name={`${category} (Current)`}
            fill={getBarColor(category)}
            stackId="current"
          />
        );
      });
    } else {
      bars.push(
        <Bar
          key="current"
          dataKey="current"
          name="Current"
          fill="#373737"
          barSize={40}
        />
      );
      if (showPreviousData) {
        bars.push(
          <Bar
            key="previous"
            dataKey="previous"
            name="Previous"
            fill="transparent"
            stroke="var(--primary)"
            strokeWidth={2}
            barSize={40}
          />
        );
      }
    }

    return bars;
  };

  // Filtered assets based on selection
  const filteredAssets = useMemo(() => {
    return assetsDetails.filter(
      (a) => selectedAsset === 'all' || a.asset.id === selectedAsset
    );
  }, [assetsDetails, selectedAsset]);

  const sumReadings = (
    assets: typeof filteredAssets,
    period: 'current' | 'previous',
    selectedTimeFrame: TimeFrame
  ) => {
    const now = dayjs();

    return assets.reduce(
      (acc, asset) => {
        const cost = asset.readings
          .filter((r) => {
            const rd = dayjs(r.timeUtc);

            if (selectedTimeFrame === TimeFrame.Hour) {
              // Current = today, Previous = yesterday
              return period === 'current'
                ? rd.isSame(now, 'day')
                : rd.isSame(now.subtract(1, 'day'), 'day');
            }

            if (selectedTimeFrame === TimeFrame.Day) {
              // Current = current month, Previous = last month
              return period === 'current'
                ? rd.isSame(now, 'month')
                : rd.isSame(now.subtract(1, 'month'), 'month');
            }

            if (selectedTimeFrame === TimeFrame.Month) {
              // Current = current year, Previous = last year
              return period === 'current'
                ? rd.year() === now.year()
                : rd.year() === now.year() - 1;
            }

            return false;
          })
          .reduce((sum, r) => sum + (r.cost || 0), 0);

        const powerUsage = asset.readings
          .filter((r) => {
            const rd = dayjs(r.timeUtc);

            if (selectedTimeFrame === TimeFrame.Hour) {
              return period === 'current'
                ? rd.isSame(now, 'day')
                : rd.isSame(now.subtract(1, 'day'), 'day');
            }

            if (selectedTimeFrame === TimeFrame.Day) {
              return period === 'current'
                ? rd.isSame(now, 'month')
                : rd.isSame(now.subtract(1, 'month'), 'month');
            }

            if (selectedTimeFrame === TimeFrame.Month) {
              return period === 'current'
                ? rd.year() === now.year()
                : rd.year() === now.year() - 1;
            }

            return false;
          })
          .reduce((sum, r) => sum + (r.value || 0), 0);

        return {
          cost: acc.cost + cost,
          powerUsage: acc.powerUsage + powerUsage,
        };
      },
      { cost: 0, powerUsage: 0 }
    );
  };

  // Current totals
  const { cost: totalCostCurrent, powerUsage: totalPowerUsageCurrent } =
    useMemo(
      () => sumReadings(filteredAssets, 'current', selectedTimeFrame),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [filteredAssets, showPreviousData]
    );

  // Previous totals
  const { cost: totalCostPrevious, powerUsage: totalPowerUsagePrevious } =
    useMemo(
      () => sumReadings(filteredAssets, 'previous', selectedTimeFrame),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [filteredAssets, selectedTimeFrame]
    );

  // Averages
  const avgCostCurrent = useMemo(
    () => totalCostCurrent / filteredAssets.length,
    [totalCostCurrent, filteredAssets.length]
  );

  const avgPowerUsageCurrent = useMemo(
    () => totalPowerUsageCurrent / filteredAssets.length,
    [totalPowerUsageCurrent, filteredAssets.length]
  );

  const avgCostPrevious = useMemo(
    () => (showPreviousData ? totalCostPrevious / filteredAssets.length : 0),
    [totalCostPrevious, filteredAssets.length, showPreviousData]
  );

  const avgPowerUsagePrevious = useMemo(
    () =>
      showPreviousData ? totalPowerUsagePrevious / filteredAssets.length : 0,
    [totalPowerUsagePrevious, filteredAssets.length, showPreviousData]
  );

  // Assets-wise breakdown (current vs previous) — fixed to respect selectedTimeFrame
  const assetsCost = useMemo(() => {
    const now = dayjs();

    return filteredAssets.reduce(
      (acc, asset) => {
        const current = { cost: 0, powerUsage: 0 };
        const previous = { cost: 0, powerUsage: 0 };

        for (const r of asset.readings) {
          const rd = dayjs(r.timeUtc);

          // If previous toggle is ON -> separate by timeframe
          if (selectedTimeFrame === TimeFrame.Hour) {
            // Current = today, Previous = yesterday
            if (rd.isSame(now, 'day')) {
              current.cost += r.cost || 0;
              current.powerUsage += r.value || 0;
            } else if (rd.isSame(now.subtract(1, 'day'), 'day')) {
              previous.cost += r.cost || 0;
              previous.powerUsage += r.value || 0;
            } // else ignore
          } else if (selectedTimeFrame === TimeFrame.Day) {
            // Current = current month, Previous = last month
            if (rd.isSame(now, 'month')) {
              current.cost += r.cost || 0;
              current.powerUsage += r.value || 0;
            } else if (rd.isSame(now.subtract(1, 'month'), 'month')) {
              previous.cost += r.cost || 0;
              previous.powerUsage += r.value || 0;
            } // else ignore
          } else if (selectedTimeFrame === TimeFrame.Month) {
            // Current = current year, Previous = previous year
            if (rd.year() === now.year()) {
              current.cost += r.cost || 0;
              current.powerUsage += r.value || 0;
            } else if (rd.year() === now.year() - 1) {
              previous.cost += r.cost || 0;
              previous.powerUsage += r.value || 0;
            } // else ignore
          }
        }

        acc[asset.asset.id!] = { current, previous };
        return acc;
      },
      {} as Record<
        string,
        {
          current: { cost: number; powerUsage: number };
          previous: { cost: number; powerUsage: number };
        }
      >
    );
  }, [filteredAssets, selectedTimeFrame]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    return (
      <Card className="p-2 bg-background border shadow-md">
        <CardContent className="space-y-1 text-sm p-2">
          {selectedTimeFrame === TimeFrame.Hour && (
            <>
              <p className="font-semibold">{label} (Hour)</p>

              {/* Group payload by Rate Tier */}
              {(() => {
                const tierMap: Record<
                  string,
                  { current?: number; previous?: number; color?: string }
                > = {};

                payload
                  .filter((entry: any) => entry.value > 0)
                  .forEach((entry: any) => {
                    // Determine Rate Tier
                    let tier = '';
                    let tierKey = '';
                    if (entry.dataKey.includes('OnPeak')) {
                      tier = t('dashboard.engeryUsageAnalysis.onPeak');
                      tierKey = RateTiers.OnPeak;
                    } else if (entry.dataKey.includes('OffPeak')) {
                      tier = t('dashboard.engeryUsageAnalysis.offPeak');
                      tierKey = RateTiers.OffPeak;
                    } else if (entry.dataKey.includes('MidPeak')) {
                      tier = t('dashboard.engeryUsageAnalysis.midPeak');
                      tierKey = RateTiers.MidPeak;
                    } else if (entry.dataKey.includes('SuperOffPeak')) {
                      tier = t('dashboard.engeryUsageAnalysis.superOffPeak');
                      tierKey = RateTiers.SuperOffPeak;
                    }

                    // Determine period
                    const period = entry.dataKey.startsWith('previous')
                      ? 'previous'
                      : 'current';

                    // Store value
                    tierMap[tier] = {
                      ...tierMap[tier],
                      [period]: entry.value,
                      color: getBarColor(tierKey),
                    };
                  });

                // Render grouped tooltip
                return Object.entries(tierMap).map(([tier, data], index) => {
                  const dateCurrent = dayjs().format('ddd, MMM D');
                  const datePrevious = dayjs()
                    .subtract(1, 'day')
                    .format('ddd, MMM D');

                  return (
                    <div key={index} className="space-y-1">
                      <p style={{ color: data.color }}>
                        {t('dashboard.engeryUsageAnalysis.rateTier')}: {tier}
                      </p>
                      {data.current !== undefined && (
                        <p>
                          {dateCurrent}:{' '}
                          {selectedUnit === EnergyUnit.KWh
                            ? `${data.current.toFixed(3)} kWh`
                            : formatCurrency(data.current)}
                        </p>
                      )}
                      {data.previous !== undefined && (
                        <p>
                          {datePrevious}:{' '}
                          {selectedUnit === EnergyUnit.KWh
                            ? `${data.previous.toFixed(3)} kWh`
                            : formatCurrency(data.previous)}
                        </p>
                      )}
                    </div>
                  );
                });
              })()}
            </>
          )}

          {(selectedTimeFrame === TimeFrame.Day ||
            selectedTimeFrame === TimeFrame.Month) && (
              <>
                <p className="font-semibold">{label}</p>
                {payload.map((entry: any, index: number) => (
                  <p key={index}>
                    {entry.dataKey === 'previous' ? 'Previous' : 'Current'}{' '}
                    Preiod:{' '}
                    <span className="font-medium">
                      {selectedUnit === EnergyUnit.KWh
                        ? `${entry.value.toFixed(3)} kWh`
                        : formatCurrency(entry.value)}
                    </span>
                  </p>
                ))}
              </>
            )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="text-yellow-500" />{' '}
            {t('dashboard.engeryUsageAnalysis.title')}
          </CardTitle>
          <CardDescription>
            <div className="flex items-end justify-center gap-4 p-6 h-40">
              <Skeleton className="w-6 h-20 rounded-md" />
              <Skeleton className="w-6 h-28 rounded-md" />
              <Skeleton className="w-6 h-16 rounded-md" />
              <Skeleton className="w-6 h-24 rounded-md" />
              <Skeleton className="w-6 h-12 rounded-md" />
            </div>
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="text-yellow-500" />{' '}
            {t('dashboard.engeryUsageAnalysis.title')}
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!energyUsage) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="text-yellow-500" />{' '}
              {t('dashboard.engeryUsageAnalysis.title')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.engeryUsageAnalysis.description')}
            </CardDescription>
          </div>

          <section className="flex items-center gap-2 flex-wrap">
            <Select value={selectedAsset} onValueChange={setSelectedAsset}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select Asset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.allAssets')}</SelectItem>
                {assetsDetails.map((item) => (
                  <SelectItem key={item.asset.id} value={item.asset.id!}>
                    {item.asset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedTimeFrame}
              onValueChange={(value: TimeFrame) => setSelectedTimeFrame(value)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select Time Frame" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TimeFrame.Hour}>
                  {t('common.hour')}
                </SelectItem>
                <SelectItem value={TimeFrame.Day}>{t('common.day')}</SelectItem>
                <SelectItem value={TimeFrame.Month}>
                  {t('common.month')}
                </SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant={
                  selectedUnit === EnergyUnit.KWh ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => setSelectedUnit(EnergyUnit.KWh)}
              >
                kWh
              </Button>
              <Button
                variant={
                  selectedUnit === EnergyUnit.cost ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => setSelectedUnit(EnergyUnit.cost)}
              >
                <DollarSign />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={showPreviousData}
                onCheckedChange={(checked) => setShowPreviousData(checked)}
              />
              <span className="text-sm">
                {t('dashboard.engeryUsageAnalysis.showPreviousData')}
              </span>
            </div>
          </section>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {/* Total Usage Card */}
          <Card className="gap-2">
            <CardHeader>
              <CardTitle className="text-blue-400 font-semibold">
                {selectedTimeFrame === TimeFrame.Hour
                  ? t('dashboard.engeryUsageAnalysis.totalUsage.hourTotalUsage')
                  : selectedTimeFrame === TimeFrame.Day
                    ? t(
                      'dashboard.engeryUsageAnalysis.totalUsage.dailyTotalUsage'
                    )
                    : t(
                      'dashboard.engeryUsageAnalysis.totalUsage.monthlyTotalUsage'
                    )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('dashboard.engeryUsageAnalysis.totalUsage.totalPower')}
                </span>
                <span className="text-sm font-bold">
                  {totalPowerUsageCurrent.toFixed(3)} kWh
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('dashboard.engeryUsageAnalysis.totalUsage.totalCost')}
                </span>
                <span className="text-sm font-bold text-emerald-600">
                  {formatCurrency(totalCostCurrent)}
                </span>
              </div>
              {showPreviousData && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground">
                    {selectedTimeFrame === TimeFrame.Hour
                      ? t(
                        'dashboard.engeryUsageAnalysis.totalUsage.previousDay'
                      )
                      : selectedTimeFrame === TimeFrame.Day
                        ? t(
                          'dashboard.engeryUsageAnalysis.totalUsage.previousMonth'
                        )
                        : t(
                          'dashboard.engeryUsageAnalysis.totalUsage.previousYear'
                        )}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t('dashboard.engeryUsageAnalysis.totalUsage.totalPower')}
                    </span>
                    <span className="text-sm font-bold">
                      {totalPowerUsagePrevious.toFixed(3)} kWh
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t('dashboard.engeryUsageAnalysis.totalUsage.totalCost')}
                    </span>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatCurrency(totalCostPrevious)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Average Usage Card */}
          <Card className="gap-2">
            <CardHeader>
              <CardTitle className="text-emerald-600 font-semibold">
                {selectedTimeFrame === TimeFrame.Hour
                  ? t(
                    'dashboard.engeryUsageAnalysis.averageUsage.averageUsagePerHour'
                  )
                  : selectedTimeFrame === TimeFrame.Day
                    ? t(
                      'dashboard.engeryUsageAnalysis.averageUsage.averageUsagePerDay'
                    )
                    : t(
                      'dashboard.engeryUsageAnalysis.averageUsage.averageUsagePerMonth'
                    )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('dashboard.engeryUsageAnalysis.averageUsage.avgPower')}
                </span>
                <span className="text-sm font-bold">
                  {avgPowerUsageCurrent.toFixed(3)} kWh
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t('dashboard.engeryUsageAnalysis.averageUsage.avgCost')}
                </span>
                <span className="text-sm font-bold text-emerald-600">
                  {formatCurrency(avgCostCurrent)}
                </span>
              </div>

              {showPreviousData && (
                <>
                  <Separator />
                  <p className="text-sm text-muted-foreground">
                    {selectedTimeFrame === TimeFrame.Hour
                      ? t(
                        'dashboard.engeryUsageAnalysis.totalUsage.previousDay'
                      )
                      : selectedTimeFrame === TimeFrame.Day
                        ? t(
                          'dashboard.engeryUsageAnalysis.totalUsage.previousMonth'
                        )
                        : t(
                          'dashboard.engeryUsageAnalysis.totalUsage.previousYear'
                        )}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t('dashboard.engeryUsageAnalysis.averageUsage.avgPower')}
                    </span>
                    <span className="text-sm font-bold">
                      {avgPowerUsagePrevious.toFixed(3)} kWh
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {t('dashboard.engeryUsageAnalysis.averageUsage.avgCost')}
                    </span>
                    <span className="text-sm font-bold text-emerald-600">
                      {formatCurrency(avgCostPrevious)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              barCategoryGap="20%"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis
                label={{
                  value: selectedUnit === EnergyUnit.KWh ? 'kWh' : 'Cost ($)',
                  angle: -90,
                  position: 'insideLeft',
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
              {generateBars()}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SCE Rate Tiers */}
        <Card>
          <CardContent className="space-y-1">
            <h4 className="font-semibold text-lg">
              {t('dashboard.engeryUsageAnalysis.timeOfUseRateTiers.title')}
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4"
                  style={{
                    backgroundColor: getBarColor(RateTiers.OnPeak),
                  }}
                ></span>
                <div className="flex flex-col">
                  <span className="text-sm">
                    {t(
                      'dashboard.engeryUsageAnalysis.timeOfUseRateTiers.onPeak'
                    )}
                  </span>
                  <span className="text-sm">
                    {formatCurrency(energyUsage.timeOfUseRate?.onPeak)}/kWh
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4"
                  style={{
                    backgroundColor: getBarColor(RateTiers.MidPeak),
                  }}
                ></span>
                <div className="flex flex-col">
                  <span className="text-sm">
                    {t(
                      'dashboard.engeryUsageAnalysis.timeOfUseRateTiers.midPeak'
                    )}
                  </span>
                  <span className="text-sm">
                    {formatCurrency(energyUsage.timeOfUseRate?.midPeak)}/kWh
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4"
                  style={{
                    backgroundColor: getBarColor(RateTiers.SuperOffPeak),
                  }}
                ></span>
                <div className="flex flex-col">
                  <span className="text-sm">
                    {t(
                      'dashboard.engeryUsageAnalysis.timeOfUseRateTiers.superOffPeak'
                    )}
                  </span>
                  <span className="text-sm">
                    {formatCurrency(energyUsage.timeOfUseRate?.superOffPeak)}
                    /kWh
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="w-4 h-4"
                  style={{
                    backgroundColor: getBarColor(RateTiers.OffPeak),
                  }}
                ></span>
                <div className="flex flex-col">
                  <span className="text-sm">
                    {t(
                      'dashboard.engeryUsageAnalysis.timeOfUseRateTiers.offPeak'
                    )}
                  </span>
                  <span className="text-sm">
                    {formatCurrency(energyUsage.timeOfUseRate?.offPeak)}/Wh
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Asset Cost Section */}
        <section className="space-y-4">
          <h4 className="font-semibold text-lg">
            {t('dashboard.engeryUsageAnalysis.assetCost.energyCostBreakdown')}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAssets.length === 0 && (
              <p className="text-muted-foreground">
                {t('dashboard.engeryUsageAnalysis.assetCost.noAssetsFound')}
              </p>
            )}
            {filteredAssets.map((item) => {
              const assetData = assetsCost[item.asset.id!];
              const avgCost =
                assetData?.current?.cost / assetData?.current?.powerUsage;
              return (
                <Card key={item.asset.id} className="gap-1 py-2 px-0">
                  <CardHeader >
                    <CardTitle className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">
                        {item.asset.name}
                      </h4>
                      <Badge className="text-xs">
                        {formatCurrency(avgCost || 0) + '/kWh'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 pt-0">
                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">
                        {selectedTimeFrame === TimeFrame.Hour
                          ? t(
                            'dashboard.engeryUsageAnalysis.assetCost.hourlyUsage'
                          )
                          : selectedTimeFrame === TimeFrame.Day
                            ? t(
                              'dashboard.engeryUsageAnalysis.assetCost.dailyUsage'
                            )
                            : t(
                              'dashboard.engeryUsageAnalysis.assetCost.monthlyUsage'
                            )}
                      </span>
                      <span className="text-xs font-medium text-right">
                        {assetData?.current?.powerUsage.toFixed(3)} kWh
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span className="text-xs text-muted-foreground">
                        {t('dashboard.engeryUsageAnalysis.assetCost.cost')}
                      </span>
                      <span className="text-xs font-medium text-right">
                        {formatCurrency(assetData?.current?.cost || 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Total Cost */}
        {selectedAsset === 'all' && (
          <Card>
            <CardContent className="flex justify-between items-center">
              <span className="font-semibold">
                {t('dashboard.engeryUsageAnalysis.assetCost.totalCost')}
              </span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(totalCostCurrent)}
              </span>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}
