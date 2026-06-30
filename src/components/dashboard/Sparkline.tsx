interface Props {
  values: number[];
  height?: number;
  stroke?: string;
  className?: string;
}

/**
 * Lightweight SVG polyline sparkline — value-only, no axes/grid/limits.
 * Renders null for < 2 points (can't draw a line). Stretches to container width.
 */
export default function Sparkline({
  values,
  height = 32,
  stroke = 'var(--primary)',
  className,
}: Props) {
  if (!values || values.length < 2) return null;

  const w = 100;
  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = height - pad - ((v - min) / range) * (height - pad * 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      width="100%"
      height={height}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
