import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type Props = {
  loadingMessage?: string;
}

function CompactLoader({ loadingMessage }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
      {/* Enhanced loader with subtle background and glow effect */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-sm animate-pulse"></div>
        <Loader2 className="relative h-6 w-6 animate-spin text-primary/80 drop-shadow-sm" />
      </div>

      {/* Animated loading text */}
      <div className="flex gap-1 items-center">
        <span className="text-sm text-muted-foreground font-medium tracking-wide">
          {loadingMessage || t('common.loading')}
        </span>
        {/* <div className="flex gap-1">
          <div className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1 h-1 bg-muted-foreground/40 rounded-full animate-bounce"></div>
        </div> */}
      </div>
    </div>
  );
}

export default CompactLoader;