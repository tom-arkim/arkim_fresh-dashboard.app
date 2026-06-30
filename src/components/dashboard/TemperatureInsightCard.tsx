import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/shadcn/card';
import { Badge } from '@/components/ui/shadcn/badge';
import { Thermometer } from 'lucide-react';
import { formatMinutes } from '@/lib/utils';
import {
    getBadgeColor,
    getPerformanceAnalysis,
    ProgressSection,
} from './SensorInsightsHelpers';
import { useTranslation } from 'react-i18next';

type Props = {
    data: {
        score: number;
        average: number;
        recoveryTime: number;
        baselineRecovery: number;
        doorEvents: number;
        baselineAmps?: number;
        idleAmps?: number;
        runningAmps?: number;
        costPerCycle?: number;
        baselineEnergy?: number;
        recoveryCycles?: number;
    };
};

export default function TemperatureInsightCard({ data }: Props) {
    const { t } = useTranslation();

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <Thermometer className="mr-2 h-5 w-5 text-blue-500" />
                        <CardTitle className="text-base">
                            {t('dashboard.assetSensorInsights.temperature.title')}
                        </CardTitle>
                    </div>
                    <Badge className={getBadgeColor(data.score)}>
                        {t('dashboard.assetSensorInsights.score')}: {data.score}
                    </Badge>
                </div>
                <CardDescription>
                    {t('dashboard.assetSensorInsights.temperature.description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.assetSensorInsights.temperature.averageTemperature')}
                            </p>
                            <p className="text-lg font-semibold">
                                {data.average?.toFixed(3)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.assetSensorInsights.temperature.recoveryTime')}
                            </p>
                            <p className="text-lg font-semibold">
                                {formatMinutes(data.recoveryTime)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.assetSensorInsights.temperature.baselineRecovery')}
                            </p>
                            <p className="text-lg font-semibold">
                                {formatMinutes(data.baselineRecovery)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.assetSensorInsights.temperature.doorEvents')}
                            </p>
                            <p className="text-lg font-semibold">
                                {Math.floor(data.doorEvents)}
                            </p>
                        </div>
                    </div>

                    <ProgressSection score={data.score} />

                    {/* Explanation */}
                    {getPerformanceAnalysis('temperature', data)}
                </div>
            </CardContent>
        </Card>
    );
}
