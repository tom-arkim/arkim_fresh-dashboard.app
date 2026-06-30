import React from 'react';
import { useTranslation } from 'react-i18next';

interface MiniTrendProps {
  minBorder?: number;
  maxBorder?: number;
  dataRecords: Record<string, number>;
  successColor?: string;
}

const MiniTrend: React.FC<MiniTrendProps> = ({
  minBorder,
  maxBorder,
  dataRecords,
  successColor,
}) => {
  const { t } = useTranslation();

  // Check if data is empty or undefined
  if (
    !dataRecords ||
    typeof dataRecords !== 'object' ||
    !Object.keys(dataRecords).length
  ) {
    return (
      <svg width="60" height="20" style={{ marginLeft: 'auto' }}>
        <text x="30" y="12" fontSize="8" textAnchor="middle" fill="#9e9e9e">
          {t('common.noData')}
        </text>
      </svg>
    );
  }

  // Convert data to an array of numbers, sorted by keys
  const data = Object.entries(dataRecords)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
    .filter((value) => value !== null && value !== undefined)
    .map(([, value]) => value);

  // Find min and max for scaling
  const dataMin = Math.min(...data);
  const dataMax = Math.max(...data);
  // Use boundary values if provided, otherwise use data min/max
  const min = minBorder !== undefined ? Math.min(minBorder, dataMin) : dataMin;
  const max = maxBorder !== undefined ? Math.max(maxBorder, dataMax) : dataMax;

  // Ensure range is never zero - if min and max are the same, add a small buffer
  const range = max === min ? 1 : max - min;

  // Check if any data points are outside boundaries
  const isDataOutOfBounds =
    minBorder !== undefined || maxBorder !== undefined
      ? data.some(
          (value) =>
            (minBorder !== undefined && value < minBorder) ||
            (maxBorder !== undefined && value > maxBorder)
        )
      : false;

  // Default colors
  successColor = successColor ?? '#4caf50'; // green
  const errorColor = '#f44336'; // red

  // Determine the line color - use provided color or determine based on boundaries
  const lineColor = isDataOutOfBounds ? errorColor : successColor;

  // Determine boundary line colors based on data values
  const minBoundaryColor =
    minBorder !== undefined && data.some((value) => value < minBorder)
      ? errorColor
      : '#d3d3d3';
  const maxBoundaryColor =
    maxBorder !== undefined && data.some((value) => value > maxBorder)
      ? errorColor
      : '#d3d3d3';
  // Calculate points for the polyline
  const points =
    data.length === 1
      ? `0,${20 - ((data[0] - min) / range) * 20} 60,${20 - ((data[0] - min) / range) * 20}` // Draw horizontal line for single point
      : data
          .map((value, index) => {
            const x = (index / (data.length - 1)) * 60; // Scale to width 60
            const y = 20 - ((value - min) / range) * 20; // Scale to height 20 (inverted for SVG)
            return `${x},${y}`;
          })
          .join(' ');

  // Calculate y-position for boundary lines
  const minBoundaryY =
    minBorder !== undefined ? 20 - ((minBorder - min) / range) * 20 : null;
  const maxBoundaryY =
    maxBorder !== undefined ? 20 - ((maxBorder - min) / range) * 20 : null;
  return (
    <svg width="60" height="20" style={{ marginLeft: 'auto' }}>
      {/* Min boundary line */}
      {minBoundaryY !== null && (
        <line
          x1="0"
          y1={minBoundaryY}
          x2="60"
          y2={minBoundaryY}
          stroke={minBoundaryColor}
          strokeWidth="0.8"
          strokeDasharray="2,1"
        />
      )}

      {/* Max boundary line */}
      {maxBoundaryY !== null && (
        <line
          x1="0"
          y1={maxBoundaryY}
          x2="60"
          y2={maxBoundaryY}
          stroke={maxBoundaryColor}
          strokeWidth="0.8"
          strokeDasharray="2,1"
        />
      )}

      {/* Trend line */}
      <polyline
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
};

export default MiniTrend;
