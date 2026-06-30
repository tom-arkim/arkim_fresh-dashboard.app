import { cn } from '@/lib/utils';

interface Props {
  /** Mark size in px (default 56). In-app: 22 inline, 40–56 section, 64 full. */
  size?: number;
  /** Optional italic caption beneath (or beside, when inline). */
  label?: string;
  /** Horizontal layout (mark + label on one line). */
  inline?: boolean;
  className?: string;
}

/**
 * Branded indeterminate loader built from the Arkim mark — the product's only
 * loader (never a generic spinner). A highlight band sweeps through the mark and
 * loops while it pulses. Honors prefers-reduced-motion (static dimmed mark).
 *
 * Repo-local implementation of the documented <ArkimLoader>; the canonical
 * accent-mark assets aren't in this repo, so it uses /arkim_logo.png. Animation
 * lives in index.css (.arkim-loader-*).
 */
export function ArkimLoader({ size = 56, label, inline = false, className }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label || 'Loading'}
      className={cn(
        inline ? 'inline-flex items-center gap-2' : 'flex flex-col items-center justify-center gap-3',
        className,
      )}
    >
      <span
        className="arkim-loader-mark relative inline-block overflow-hidden rounded-sm"
        style={{ width: size, height: size }}
      >
        <img src="/arkim_logo.png" alt="" className="w-full h-full object-contain select-none" draggable={false} />
        <span className="arkim-loader-sweep" aria-hidden="true" />
      </span>
      {label && <span className="text-sm italic text-muted-foreground">{label}</span>}
    </div>
  );
}

export default ArkimLoader;
