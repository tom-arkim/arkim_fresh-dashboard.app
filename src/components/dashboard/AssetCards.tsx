import { AssetCard } from '@/components/dashboard/AssetCard';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { ReadingMetrics } from '@/config/enum';
import { cn } from '@/lib/utils';
import { PumpOverviewState } from '@/types/dashboard/dashboard';
import AssetDetails from '@/types/equipment/AssetDetails';
import { SensorReading } from '@/types/readings/SensorReading';
import { ChevronsDown, ChevronsUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSidebar } from '../ui/shadcn/sidebar';
import { useSidePanelChat } from '../contexts/SidePanelChat';

type Props = {
  equipments: Record<string, AssetDetails>;
  readings: Record<string, SensorReading[]>;
  loading: boolean;
  error: string | null;
};

function AssetCards({ equipments, readings, loading, error }: Props) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [cardsPerRow, setCardsPerRow] = useState(4);
  const { state } = useSidebar();
  const { openSidePanelChat } = useSidePanelChat();

  const pumpCards = useMemo(() => {
    const pumpCardsMetrics = [
      ReadingMetrics.Power,
      ReadingMetrics.FaultCode,
      ReadingMetrics.Torque,
      ReadingMetrics.RunHours,
      ReadingMetrics.Voltage,
      ReadingMetrics.Frequency,
      ReadingMetrics.MotorCurrent,
      ReadingMetrics.DriveTemperature,
      ReadingMetrics.NumberOfStarts,
    ];

    const cards = Object.entries(readings)
      .map(([assetId, assetReadings]) => {
        // Check Readings has this metrics or not
        const hasAllMetrics = pumpCardsMetrics.every((metric) => {
          return assetReadings.some((reading) => reading.metricName === metric);
        });
        if (!hasAllMetrics) return null;

        const asset = equipments[assetId];
        if (!asset) return null;

        const pumpCardReadings = assetReadings.reduce(
          (acc, reading) => {
            acc[reading.metricName] = reading.value;
            return acc;
          },
          {} as Record<string, number>
        );

        const lastUpdate = assetReadings.reduce(
          (latest, r) => {
            return !latest || new Date(r.timeUtc) > new Date(latest)
              ? r.timeUtc
              : latest;
          },
          null as string | null
        );

        return {
          asset,
          lastUpdate: lastUpdate,
          ...pumpCardReadings,
        } as unknown as PumpOverviewState;
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (!a || !b) {
          return 0;
        }
        return a.asset.name.localeCompare(b.asset.name);
      }) as PumpOverviewState[];

    return cards;
  }, [readings, equipments]);

  // Calculate how many cards to show per row based on screen size
  const visibleAssets = isExpanded
    ? pumpCards
    : pumpCards.slice(0, cardsPerRow);
  const hasMoreAssets = pumpCards.length > cardsPerRow;

  const scrollToAssetCards = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExpandClick = () => {
    setIsExpanded(true);
    scrollToAssetCards('asset-cards');
  };

  const handleCollapseClick = () => {
    setIsExpanded(false);
    scrollToAssetCards('asset-cards');
  };

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setCardsPerRow(4);
      } else if (window.innerWidth >= 1024) {
        setCardsPerRow(3);
      } else if (window.innerWidth >= 768) {
        setCardsPerRow(2);
      } else {
        setCardsPerRow(1);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isExpanded]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.pumpsOverview.title')}</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card id="asset-cards">
        <CardHeader>
          <CardTitle>{t('dashboard.pumpsOverview.title')}</CardTitle>
          <CardDescription>
            {t('dashboard.pumpsOverview.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6",
            state === 'collapsed' && openSidePanelChat && "2xl:grid-cols-3",
            state === 'expanded' && openSidePanelChat && "2xl:grid-cols-2"
          )}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card
                key={i}
                className="gap-2 py-2"
              >
                <CardHeader className="pb-2 pt-3">
                  <div className="flex justify-between items-start overflow-hidden gap-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-2.5 h-2.5 rounded-full" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Skeleton className="h-6 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <div className="space-y-1 text-right">
                        <Skeleton className="h-6 w-24 ml-auto" />
                        <Skeleton className="h-3 w-20 ml-auto" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <div key={j} className="space-y-1">
                          <Skeleton className="h-3 w-8" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!visibleAssets || visibleAssets.length === 0) {
    return (
      <Card id="asset-cards">
        <CardHeader>
          <CardTitle>{t('dashboard.pumpsOverview.title')}</CardTitle>
          <CardDescription>
            {t('dashboard.pumpsOverview.noPumps')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  return (
    <Card id="asset-cards">
      <CardHeader>
        <CardTitle>{t('dashboard.pumpsOverview.title')}</CardTitle>
        <CardDescription>
          {t('dashboard.pumpsOverview.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 relative">
          {/* Asset Cards Grid */}
          <div className={cn(
            "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6",
            state === 'collapsed' && openSidePanelChat && "2xl:grid-cols-3",
            state === 'expanded' && openSidePanelChat && "2xl:grid-cols-2"
          )}>
            {visibleAssets.map((asset) => {
              return <AssetCard key={asset.asset.id} asset={asset} />;
            })}
          </div>

          {/* Show More Button */}
          {hasMoreAssets && !isExpanded && (
            <div className="flex justify-center">
              <Button variant="ghost" size="lg" onClick={handleExpandClick}>
                <span>
                  {t('common.showMore')} (
                  {t('common.hiddenCount', {
                    count: pumpCards.length - visibleAssets.length,
                  })}
                  )
                </span>
                <ChevronsDown className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Show Less Button */}
          {isExpanded && (
            <div className="flex justify-center">
              <Button variant="ghost" size="lg" onClick={handleCollapseClick}>
                <span>{t('common.showLess')}</span>
                <ChevronsUp className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default AssetCards;
