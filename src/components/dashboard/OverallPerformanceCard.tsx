import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/shadcn/card';
import { Badge } from '@/components/ui/shadcn/badge';
import { Progress } from '@/components/ui/shadcn/progress';
import { cn } from '@/lib/utils';
import {
    getBadgeColor,
    getProgressColorClass,
    getScoreColor,
    getAssetStatus,
} from './SensorInsightsHelpers';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

type Props = {
    data: {
        overallScore: number;
        temperature: { score: number };
        energyEfficiency: { score: number };
        mechanicalHealth: { score: number };
    };
};

export default function OverallPerformanceCard({ data }: Props) {
    const { t } = useTranslation();

    const assetStatus = useMemo(() => {
        if (!data) return;
        const score = data?.overallScore;

        if (score >= 80) {
            return {
                icon: <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-500" />,
                title: 'Asset is performing excellently',
                message: 'All metrics within optimal parameters.',
                showRecommendations: false,
            };
        }

        if (score >= 60) {
            return {
                icon: <Info className="h-5 w-5 mr-2 mt-0.5 text-yellow-500" />,
                title: 'Asset is performing well',
                message: 'Minor fluctuations detected, mostly stable.',
                showRecommendations: true,
            };
        }

        if (score >= 40) {
            return {
                icon: <Info className="h-5 w-5 mr-2 mt-0.5 text-orange-500" />,
                title: 'Asset requires attention',
                message: 'Moderate issues detected. Maintenance recommended.',
                showRecommendations: true,
            };
        }

        return {
            icon: <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 text-red-500" />,
            title: 'Asset needs immediate maintenance',
            message: 'Critical issues detected. Immediate action required.',
            showRecommendations: true,
        };
    }, [data]);

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <CardTitle>
                        {t('dashboard.assetSensorInsights.overallPerformance.title')}
                    </CardTitle>
                    <Badge className={getBadgeColor(data.overallScore)}>
                        {t('dashboard.assetSensorInsights.score')}: {data.overallScore}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Overall Score */}
                    <div>
                        <div className="flex justify-between mb-1">
                            <span className="text-sm">
                                {t(
                                    'dashboard.assetSensorInsights.overallPerformance.performanceScore'
                                )}
                            </span>
                            <span
                                className={cn(
                                    'text-sm font-medium',
                                    getScoreColor(data.overallScore)
                                )}
                            >
                                {data.overallScore}%
                            </span>
                        </div>
                        <Progress
                            key={data.overallScore}
                            value={data.overallScore}
                            className={cn(
                                'h-3',
                                getProgressColorClass(data.overallScore)
                            )}
                        />
                    </div>

                    {/* Status & Recommendations */}
                    {assetStatus && (
                        <div className="bg-muted/30 p-3 rounded-lg flex items-start">
                            {assetStatus.icon}
                            <div>
                                <p className="font-medium">{assetStatus.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {assetStatus.message}
                                </p>

                                {assetStatus.showRecommendations && (
                                    <div className="mt-2">
                                        <p className="text-sm font-medium">
                                            {t(
                                                'dashboard.assetSensorInsights.statusRecommendations.recommendedActions'
                                            )}
                                        </p>
                                        <ul className="text-sm text-muted-foreground list-disc list-inside mt-1">
                                            {data.temperature.score < 80 && (
                                                <li>
                                                    {t(
                                                        'dashboard.assetSensorInsights.statusRecommendations.reviewTemperatureSensor'
                                                    )}
                                                </li>
                                            )}
                                            {data.energyEfficiency.score < 80 && (
                                                <li>
                                                    {t(
                                                        'dashboard.assetSensorInsights.statusRecommendations.reviewEnergyEfficiencySystems'
                                                    )}
                                                </li>
                                            )}
                                            {data.mechanicalHealth.score < 80 && (
                                                <li>
                                                    {t(
                                                        'dashboard.assetSensorInsights.statusRecommendations.reviewMechanicalHealthSystems'
                                                    )}
                                                </li>
                                            )}
                                            <li>
                                                {t(
                                                    'dashboard.assetSensorInsights.statusRecommendations.scheduleMaintenanceInspection'
                                                )}
                                            </li>
                                            <li>
                                                {t(
                                                    'dashboard.assetSensorInsights.statusRecommendations.increaseSensorMonitoring'
                                                )}
                                            </li>
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
