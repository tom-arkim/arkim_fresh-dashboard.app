import React from 'react';
import { Clock, VibrateIcon } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/shadcn/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { VibrationWidgetState } from '@/types/dashboard/dashboard';
import { ReadingMetrics } from '@/config/enum';
import dayjs from 'dayjs';
import { getWeekOfMonth } from '@/lib/utils';

interface TrendPoint {
  time: number;
  value: number;
  fullTime: string;
}


const VibrationSensorCard: React.FC<VibrationWidgetState> = (props) => {
  const currentVibration = props.vibrationRms;
  const crestFactor = props.vibrationCrestFactor;
  const kurtosis = props.vibrationKurtosis;
  const assetName = props.assetName;
  const readings = props.readings;
  const lastUpdate = props.lastUpdate;

  const { t } = useTranslation();

  const filteredReadings = useMemo(() => {
    return readings?.filter((r) => r.metricName === ReadingMetrics.VibrationRMS) || [];
  }, [readings]);

  const trendData: TrendPoint[] = useMemo(() => {
    if (!filteredReadings) return [];

    return filteredReadings.map((r) => {
      return {
        time: dayjs(r.timeUtc).valueOf(),
        value: r.value,
        fullTime: r.timeUtc,
      }
    });
  }, [filteredReadings]);

  const { chartStartTime, chartEndTime } = useMemo(() => {
    if (trendData.length === 0) {
      return {
        chartStartTime: 0,
        chartEndTime: 0,
      };
    }
    const start = trendData[0].time;
    const end = trendData[trendData.length - 1].time;

    return {
      chartStartTime: start,
      chartEndTime: end,
    };
  }, [trendData]);

  const xAxisTicks = useMemo((): number[] => {
    if (trendData.length === 0) return [];

    const start = dayjs(chartStartTime);
    const end = dayjs(chartEndTime);

    return Array.from({ length: end.diff(start, 'hour') + 1 }, (_, i) =>
      start.add(i, 'hour').valueOf()
    );
  }, [chartStartTime, chartEndTime]);

  const displayVibration = currentVibration.toFixed(2);
  const displayCrestFactor = crestFactor.toFixed(2);
  const displayKurtosis = kurtosis.toFixed(2);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3 sm:pb-4 pt-3 sm:pt-4 px-3 sm:px-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <VibrateIcon className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600 mt-1" />
            <div>
              <h2 className="text-base sm:text-lg font-semibold">{t('dashboard.assetSensorInsights.vibration')}</h2>
              <p className="text-sm text-muted-foreground">
                {assetName}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-3 sm:space-y-4 px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="flex justify-between sm:flex-row flex-col sm:items-end items-start gap-2">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl sm:text-5xl md:text-6xl font-bold">{displayVibration}</span>
              <span className="text-lg sm:text-xl text-muted-foreground">gRMS</span>
            </div>
          </div>
          <div className="sm:text-right text-xs sm:text-sm space-y-1">
            <p className="text-muted-foreground">
              {t('dashboard.assetSensorInsights.crestFactor')}:{' '}
              <span className="font-medium text-foreground">{displayCrestFactor}</span>
            </p>
            <p className="text-muted-foreground">
              {t('dashboard.assetSensorInsights.kurtosis')}:{' '}
              <span className="font-medium text-foreground">{displayKurtosis}</span>
            </p>
          </div>
        </div>
        <div className="flex-1" />
        <div className='space-y-1'>
          <div className="flex items-center justify-between sm:justify-start flex-wrap sm:flex-nowrap gap-2">
            <h3 className="text-sm font-medium">{t('dashboard.assetSensorInsights.vibrationTrend')}</h3>
            <p className="text-xs">
              {t('dashboard.assetSensorInsights.alarmCurrent')}: {displayVibration} gRMS
            </p>
          </div>

          <div className="relative bg-muted/50 rounded-lg p-2 sm:p-4 -mx-2">
            <ResponsiveContainer width="100%" height={100}>
              <LineChart
                data={trendData}
                margin={{ top: 15, right: 5, left: 5, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="time"
                  type="number"
                  domain={[chartStartTime, chartEndTime]}
                  scale="time"
                  ticks={xAxisTicks}
                  tick={(props) => {
                    const { x, y, payload } = props;
                    const date = dayjs(payload.value);

                    return (
                      <text
                        x={x}
                        y={y + 10}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize={10}
                      >
                        <tspan x={x} dy="0">
                          {date.format('HH:mm')}
                        </tspan>
                        <tspan x={x} dy="12">
                          {date.format('DD-MMM')}
                        </tspan>
                      </text>
                    );
                  }}
                  stroke="#64748b"
                />
                <YAxis
                  domain={['auto', 'auto']}
                  hide
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm text-xs border-border">
                          <div className="text-muted-foreground mb-1">
                            {dayjs(label).format('MMM DD, YYYY HH:mm')}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="font-medium">
                              Vibration:{' '}
                              {Number(payload[0].value).toFixed(2)} gRMS
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  className="stroke-primary"
                  strokeWidth={2}
                  dot={{
                    className: 'fill-primary stroke-background',
                    strokeWidth: 2,
                    r: 4,
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex justify-between items-center px-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="font-medium">
              {t('common.lastUpdated')}: {dayjs.utc(lastUpdate).local().fromNow()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VibrationSensorCard;
