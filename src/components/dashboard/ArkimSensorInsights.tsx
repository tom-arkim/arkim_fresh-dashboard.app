import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/shadcn/card';
import { Badge } from '@/components/ui/shadcn/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/shadcn/select';
import { cn, isApiError } from '@/lib/utils';
import CompactLoader from '@/components/ui/CompactLoader';
import { OldSensorInsightsOverview } from '@/types/dashboard/dashboard';
import { AssetSensorState } from '@/types/equipment/AssetStatus';
import useSiteStore from '@/store/siteStore';
import dashboardService from '@/services/api/dashboardService';
import { useTranslation } from 'react-i18next';
import TemperatureInsightCard from './TemperatureInsightCard';
import EnergyEfficiencyCard from './EnergyEfficiencyCard';
import MechanicalHealthCard from './MechanicalHealthCard';
import OverallPerformanceCard from './OverallPerformanceCard';
import { getBadgeColor } from './SensorInsightsHelpers';

type ProcessedAssetData = {
    id: string;
    name: string;
    type: string;
    description: string | null;
    temperature: {
        score: number;
        average: number;
        recoveryTime: number;
        baselineRecovery: number;
        doorEvents: number;
    };
    energyEfficiency: {
        score: number;
        average: number;
        costPerCycle: number;
        baselineEnergy: number;
        recoveryCycles: number;
    };
    mechanicalHealth: {
        score: number;
        runningAmps: number;
        baselineAmps: number;
        idleAmps: number;
        compressorRuntime: number;
    };
    overallScore: number;
};

type Props = {
    refetch: number;
    setRefreshing: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function ArkimSensorInsights({ refetch, setRefreshing }: Props) {
    const { currentSite } = useSiteStore();
    const { t } = useTranslation();
    const [sensorInsight, setSensorInsight] = useState<OldSensorInsightsOverview>();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
    const initialized = useRef(false);

    const fetchData = useCallback(async () => {
        if (!currentSite?.id) return;
        try {
            setLoading(true);
            setRefreshing(true);
            const response = await dashboardService.getSensorInsight(
                currentSite.id
            );
            setSensorInsight(response);
        } catch (error: any) {
            if (isApiError(error)) {
                setError(error?.message ?? 'Failed to load sensor insights.');
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [currentSite, setRefreshing]);

    useEffect(() => {
        fetchData();
    }, [fetchData, refetch]);

    const processedData = useMemo(() => {
        if (!sensorInsight?.assets) return;
        const grouped = new Map<string, ProcessedAssetData>();
        sensorInsight.assets.forEach((item: AssetSensorState) => {
            const id = item.asset.id!;

            if (!grouped.has(id)) {
                grouped.set(id, {
                    id,
                    name: item.asset.name,
                    type: item.asset.type!,
                    description: item.asset.description ?? null,
                    energyEfficiency: item.energyEfficiency,
                    mechanicalHealth: item.mechanicalHealth,
                    temperature: item.temperature,
                    overallScore: 0,
                });
            }

            const asset = grouped.get(id)!;

            const scores = [
                asset.temperature.score,
                asset.energyEfficiency.score,
                asset.mechanicalHealth.score,
            ];

            const total = scores.reduce((sum, s) => sum + s, 0);
            const overallScore = Math.round(total / scores.length);
            asset.overallScore = isNaN(overallScore) ? 0 : overallScore;
        });

        return Array.from(grouped.values());
    }, [sensorInsight]);

    const selectedAssetData = useMemo(
        () => processedData?.find((a) => a.id === selectedAsset),
        [processedData, selectedAsset]
    );

    useEffect(() => {
        if (processedData && !initialized.current) {
            initialized.current = true;
            setSelectedAsset(processedData[0]?.id);
        }
    }, [processedData]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('dashboard.assetSensorInsights.title')}</CardTitle>
                    <CardDescription>
                        {t('dashboard.assetSensorInsights.loadingData')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CompactLoader />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('dashboard.assetSensorInsights.title')}</CardTitle>
                    <CardDescription>{error}</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (!processedData?.length) {
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
                    value={selectedAsset || processedData[0]?.id}
                    onValueChange={setSelectedAsset}
                >
                    <SelectTrigger className="w-[250px]">
                        <SelectValue
                            placeholder={t('dashboard.assetSensorInsights.selectAsset')}
                        />
                    </SelectTrigger>
                    <SelectContent>
                        {processedData.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                                <div className="flex items-center justify-between w-full">
                                    <span>{asset.name}</span>
                                    <Badge
                                        className={cn('ml-2', getBadgeColor(asset.overallScore))}
                                    >
                                        {asset.overallScore}
                                    </Badge>
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
                ) : (
                    <div className="space-y-4">
                        {/* Metric Cards */}
                        <div className="grid grid-cols-1 gap-2 2xl:grid-cols-3 lg:grid-cols-2">
                            <TemperatureInsightCard data={selectedAssetData.temperature} />
                            <EnergyEfficiencyCard data={selectedAssetData.energyEfficiency} />
                            <MechanicalHealthCard data={selectedAssetData.mechanicalHealth} />
                        </div>

                        {/* Overall Summary */}
                        <OverallPerformanceCard data={selectedAssetData} />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
