import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Interface for the series data
interface SeriesData {
  seriesLabel: string;
  dataPoints: Record<string, number>; // timestamp string -> value
}

interface MultiLineChartProps {
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  data: SeriesData[];
}

const convertUtcStringToLocalDate = (timestamp: string): Date => {
  if (!timestamp.endsWith('Z') && !timestamp.endsWith('z')) {
    timestamp += 'Z';
  }
  return new Date(timestamp);
};

const MultiLineChart: React.FC<MultiLineChartProps> = ({
  title,
  xAxisLabel,
  yAxisLabel,
  data,
}) => {
  const { t } = useTranslation();

  // Default colors for the lines
  const colors = [
    '#2196f3',
    '#4caf50',
    '#ff9800',
    '#e91e63',
    '#9c27b0',
    '#00bcd4',
    '#3f51b5',
    '#f44336',
  ];

  // Step 1: Gather all unique timestamps from all series
  const allTimestamps = new Set<string>();
  data.forEach((series) => {
    Object.keys(series.dataPoints).forEach((timestamp) => {
      allTimestamps.add(timestamp);
    });
  });

  // Step 2: Sort timestamps chronologically
  const sortedTimestamps = Array.from(allTimestamps).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );

  // Step 3: Transform data into format for Recharts
  const chartData = sortedTimestamps.map((timestamp) => {
    // Dates in the DB are in UTC, make sure we enforce UTC parsing
    const dataPoint: Record<string, any> = {
      time: convertUtcStringToLocalDate(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    // Add data from each series
    data.forEach((series, index) => {
      if (series.dataPoints[timestamp] !== undefined) {
        dataPoint[series.seriesLabel] = series.dataPoints[timestamp];
      }
    });

    return dataPoint;
  });

  // Get the most recent timestamp for "last updated"
  const lastUpdated =
    sortedTimestamps.length > 0
      ? convertUtcStringToLocalDate(
          sortedTimestamps[sortedTimestamps.length - 1]
        ).toLocaleString()
      : '';

  // Format tooltip values
  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      return value?.toFixed(1);
    }
    return value;
  };

  return (
    <div className="w-full p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          {title}
        </h3>
        {lastUpdated && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('common.lastUpdated')}: {lastUpdated}
          </p>
        )}
      </div>

      {chartData.length === 0 || data.length === 0 ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('common.noData')}
          </p>
        </div>
      ) : (
        <div className="w-full h-64 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200 dark:stroke-gray-700"
              />

              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
                height={40}
                padding={{ left: 10, right: 10 }}
                label={{
                  value: xAxisLabel,
                  position: 'insideBottom',
                  offset: -10,
                  className: 'text-xs fill-gray-600 dark:fill-gray-400',
                }}
              />

              <YAxis
                tick={{ fontSize: 12 }}
                className="text-gray-600 dark:text-gray-400"
                width={60}
                label={{
                  value: yAxisLabel,
                  angle: -90,
                  position: 'insideLeft',
                  className: 'text-xs fill-gray-600 dark:fill-gray-400',
                }}
              />

              <Tooltip
                formatter={(value: any) => [formatValue(value), '']}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: '4px',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.15)',
                  color: '#333',
                }}
              />

              <Legend
                verticalAlign="bottom"
                height={36}
                wrapperStyle={{ paddingTop: 10 }}
              />

              {data.map((series, index) => (
                <Line
                  key={series.seriesLabel}
                  type="monotone"
                  dataKey={series.seriesLabel}
                  name={series.seriesLabel}
                  stroke={colors[index % colors.length]}
                  activeDot={{ r: 6 }}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default MultiLineChart;
