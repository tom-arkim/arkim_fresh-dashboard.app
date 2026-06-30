import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { useTranslation } from 'react-i18next';
import TemperatureSensorCard from '@/components/dashboard/TemperatureSensorCard';
import VibrationSensorCard from '@/components/dashboard/VibrationSensorCard';
import AssetDetails from '@/types/equipment/AssetDetails';
import { SensorReading } from '@/types/readings/SensorReading';
import { ReadingDownSample, ReadingMetrics } from '@/config/enum';
import { SensorInsightsOverview } from '@/types/dashboard/dashboard';
import readingService from '@/services/api/readingService';
import { logger } from '@/lib/logger';
import { cn, isCancelledError } from '@/lib/utils';
import axios, { CancelTokenSource } from 'axios';
import { DEFAULT_PAST_DAYS } from '@/config/constant';
import { useSidePanelChat } from '../contexts/SidePanelChat';
import { useSidebar } from '../ui/shadcn/sidebar';

type Props = {
  equipments: Record<string, AssetDetails>;
  latestReadings: Record<string, SensorReading[]>;
  refetch: number;
  setRefreshing: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  error: string | null;
};

export default function SensorInsights({
  equipments,
  latestReadings,
  refetch,
  setRefreshing,
  loading,
  error,
}: Props) {
  const { t } = useTranslation();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [last24HoursReadings, setLast24HoursReadings] = useState<
    SensorReading[] | null
  >(null);
  const [loadingLast24HoursReadings, setLoadingLast24HoursReadings] =
    useState(false);
  const axiosCancelTokenSource = useRef<CancelTokenSource | null>(null);

  const { state } = useSidebar();
  const { openSidePanelChat } = useSidePanelChat();

  const sensorInsightsOverview: SensorInsightsOverview[] = useMemo(() => {
    const requiredMetrics = [
      ReadingMetrics.VibrationRMS,
      ReadingMetrics.VibrationKurtosis,
      ReadingMetrics.VibrationCrestFactor,
      ReadingMetrics.Temperature,
    ];

    const cards: SensorInsightsOverview[] = Object.entries(latestReadings)
      .map(([assetId, assetReadings]) => {
        const hasRelevantMetrics = requiredMetrics.every((m) =>
          assetReadings.some((r) => r.metricName === m)
        );
        if (!hasRelevantMetrics) return null;

        const asset = equipments[assetId];
        if (!asset) return null;

        const values = assetReadings.reduce(
          (acc, r) => {
            if (r.metricName === ReadingMetrics.VibrationRMS)
              acc.vibrationRms = r.value;
            if (r.metricName === ReadingMetrics.VibrationKurtosis)
              acc.vibrationKurtosis = r.value;
            if (r.metricName === ReadingMetrics.VibrationCrestFactor)
              acc.vibrationCrestFactor = r.value;
            if (r.metricName === ReadingMetrics.Temperature)
              acc.temperature = r.value;
            return acc;
          },
          {
            vibrationRms: 0,
            vibrationKurtosis: 0,
            vibrationCrestFactor: 0,
            temperature: 0,
          } as any
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
          assetId,
          assetName: asset.name,
          vibrationKurtosis: values.vibrationKurtosis,
          temperature: values.temperature,
          vibrationRms: values.vibrationRms,
          vibrationCrestFactor: values.vibrationCrestFactor,
          lastUpdate: lastUpdate,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (!a || !b) return 0;
        return a.assetName.localeCompare(b.assetName);
      }) as SensorInsightsOverview[];

    return cards;
  }, [latestReadings, equipments]);

  const selectedAssetData = sensorInsightsOverview?.find(
    (card) => card.assetId === selectedAssetId
  );

  useEffect(() => {
    if (sensorInsightsOverview?.length && !selectedAssetId) {
      setSelectedAssetId(sensorInsightsOverview[0].assetId);
    }
  }, [sensorInsightsOverview, selectedAssetId]);

  const fetchLast24HoursReadings = useCallback(async () => {
    try {
      if (!selectedAssetId) return;
      setLoadingLast24HoursReadings(true);

      if (axiosCancelTokenSource.current) {
        axiosCancelTokenSource.current.cancel('Request cancelled');
      }
      axiosCancelTokenSource.current = axios.CancelToken.source();

      const response = await readingService.getReadings(
        {
          asset_ids: [selectedAssetId],
          metrics: [ReadingMetrics.Temperature, ReadingMetrics.VibrationRMS],
          hours: DEFAULT_PAST_DAYS * 24,
          down_sample: ReadingDownSample.SixHour,
          timezone_offset_hours: new Date().getTimezoneOffset() / -60,
        },
        axiosCancelTokenSource.current?.token
      );
      setLast24HoursReadings(response.rows);
    } catch (error) {
      logger.error('Failed to fetch last 24 hours readings', error);
      if (isCancelledError(error)) return;
      setLast24HoursReadings(null);
    } finally {
      setLoadingLast24HoursReadings(false);
    }
  }, [selectedAssetId]);

  useEffect(() => {
    fetchLast24HoursReadings();
  }, [fetchLast24HoursReadings]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.assetSensorInsights.title')}</CardTitle>
          <CardDescription className="text-red-500">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.assetSensorInsights.title')}</CardTitle>
          <CardDescription>
            {t('dashboard.assetSensorInsights.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 max-w-[250px] w-full" />
          <div className="grid grid-cols-1 gap-2 2xl:grid-cols-3 lg:grid-cols-2">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sensorInsightsOverview?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.assetSensorInsights.title')}</CardTitle>
          <CardDescription>
            {t('dashboard.assetSensorInsights.noDataAvailable')}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.assetSensorInsights.title')}</CardTitle>
        <CardDescription>
          {t('dashboard.assetSensorInsights.description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Asset Selector */}
        <Select
          value={selectedAssetId || sensorInsightsOverview[0]?.assetId}
          onValueChange={setSelectedAssetId}
        >
          <SelectTrigger className="max-w-[250px] w-full">
            <SelectValue
              placeholder={t('dashboard.assetSensorInsights.selectAsset')}
            />
          </SelectTrigger>
          <SelectContent>
            {sensorInsightsOverview
              .sort((a, b) => a.assetName.localeCompare(b.assetName))
              .map((card) => (
                <SelectItem key={card.assetId} value={card.assetId}>
                  <div className="flex items-center justify-between w-full">
                    <span>{card.assetName}</span>
                  </div>
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* Asset Metrics */}
        {!selectedAssetData ? (
          <p className="text-sm text-muted-foreground">
            {t('dashboard.assetSensorInsights.selectAssetToViewInsights')}
          </p>
        ) : loadingLast24HoursReadings ? (
          <div className={cn(
            "grid grid-cols-1 gap-2 2xl:grid-cols-3 lg:grid-cols-2",
            state === 'collapsed' && openSidePanelChat && "2xl:grid-cols-3",
            state === 'expanded' && openSidePanelChat && "2xl:grid-cols-2"
          )}>
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : (
          <div className={cn(
            "grid grid-cols-1 gap-2 2xl:grid-cols-3 lg:grid-cols-2",
            state === 'collapsed' && openSidePanelChat && "2xl:grid-cols-3",
            state === 'expanded' && openSidePanelChat && "2xl:grid-cols-2"
          )}>
            <TemperatureSensorCard
              assetId={selectedAssetData.assetId}
              assetName={selectedAssetData.assetName}
              temperature={selectedAssetData.temperature}
              lastUpdate={selectedAssetData.lastUpdate}
              readings={last24HoursReadings || []}
            />
            <VibrationSensorCard
              assetId={selectedAssetData.assetId}
              assetName={selectedAssetData.assetName}
              vibrationRms={selectedAssetData.vibrationRms}
              vibrationCrestFactor={selectedAssetData.vibrationCrestFactor}
              vibrationKurtosis={selectedAssetData.vibrationKurtosis}
              lastUpdate={selectedAssetData.lastUpdate}
              temperature={selectedAssetData.temperature}
              readings={last24HoursReadings || []}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
