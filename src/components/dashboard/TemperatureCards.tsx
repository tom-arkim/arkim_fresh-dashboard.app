import { TemperatureCard } from '@/components/dashboard/TemperatureCard';
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
import { TemperatureOverviewState } from '@/types/dashboard/dashboard';
import AssetDetails from '@/types/equipment/AssetDetails';
import { SensorReading } from '@/types/readings/SensorReading';
import { ChevronsDown, ChevronsUp, Thermometer } from 'lucide-react';
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

function TemperatureCards({ equipments, readings, loading, error }: Props) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [cardsPerRow, setCardsPerRow] = useState(4);
  const { state } = useSidebar();
  const { openSidePanelChat } = useSidePanelChat();

  const temperatureCards = useMemo(() => {
    const requiredMetrics = [
      ReadingMetrics.Temperature,
      ReadingMetrics.ValvePosition,
    ];
    const cards = Object.entries(readings)
      .map(([assetId, assetReadings]) => {
        // Check if readings has both metrics
        const hasAll = requiredMetrics.every((m) =>
          assetReadings.some((r) => r.metricName === m)
        );
        if (!hasAll) return null;

        const asset = equipments[assetId];
        if (!asset) return null;

        const values = assetReadings.reduce((acc, r) => {
          // Map 'temp' to 'temperature', 'valve_position' to 'valvePosition'
          if (r.metricName === ReadingMetrics.Temperature)
            acc.temperature = r.value;
          if (r.metricName === ReadingMetrics.ValvePosition)
            acc.valvePosition = r.value;
          return acc;
        }, {} as any);

        const lastUpdate = assetReadings.reduce(
          (latest, r) => {
            return !latest || new Date(r.timeUtc) > new Date(latest)
              ? r.timeUtc
              : latest;
          },
          null as string | null
        );

        return {
          assetId,
          assetName: asset.name,
          temperature: values.temperature,
          valvePosition: values.valvePosition,
          assetType: asset.type,
          lastUpdate: lastUpdate,
        } as TemperatureOverviewState;
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (!a || !b) {
          return 0;
        }
        return a.assetName.localeCompare(b.assetName);
      }) as TemperatureOverviewState[];

    return cards;
  }, [readings, equipments]);

  // Calculate how many cards to show per row based on screen size
  const visibleTemperatures = isExpanded
    ? temperatureCards
    : temperatureCards.slice(0, cardsPerRow);

  const hasMoreTemperatures = temperatureCards.length > cardsPerRow;

  const scrollToTemperatureCards = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleExpandClick = () => {
    setIsExpanded(true);
    scrollToTemperatureCards('temperature-cards');
  };

  const handleCollapseClick = () => {
    setIsExpanded(false);
    scrollToTemperatureCards('temperature-cards');
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
          <CardTitle className="flex items-center gap-2">
            {t('dashboard.temperatureOverview.title')}
          </CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card id="temperature-cards">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('dashboard.temperatureOverview.title')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.temperatureOverview.description')}
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
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-4">
                    <Skeleton className="h-32 w-32 rounded-full" />
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3 mx-auto" />
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

  if (!visibleTemperatures || visibleTemperatures.length === 0) {
    return (
      <Card id="temperature-cards">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {t('dashboard.temperatureOverview.title')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.temperatureOverview.noData')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card id="temperature-cards">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {t('dashboard.temperatureOverview.title')}
        </CardTitle>
        <CardDescription>
          {t('dashboard.temperatureOverview.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 relative">
          {/* Temperature Cards Grid */}
          <div className={cn(
            "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6",
            state === 'collapsed' && openSidePanelChat && "2xl:grid-cols-3",
            state === 'expanded' && openSidePanelChat && "2xl:grid-cols-2"
          )}>
            {visibleTemperatures.map((asset) => (
              <TemperatureCard
                assetId={asset.assetId}
                assetName={asset.assetName}
                temperature={asset.temperature}
                valvePosition={asset.valvePosition}
                lastUpdate={asset.lastUpdate}
                assetType={asset.assetType}
              />
            ))}
          </div>

          {/* Show More Button */}
          {hasMoreTemperatures && !isExpanded && (
            <div className="flex justify-center">
              <Button variant="ghost" size="lg" onClick={handleExpandClick}>
                <span>
                  {t('common.showMore')} (
                  {t('common.hiddenCount', {
                    count: temperatureCards.length - visibleTemperatures.length,
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

export default TemperatureCards;
