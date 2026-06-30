import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/shadcn/card';
import { Badge } from '@/components/ui/shadcn/badge';
import { Gauge } from 'lucide-react';
import {
    getBadgeColor,
    getPerformanceAnalysis,
    ProgressSection,
} from './SensorInsightsHelpers';
import { useTranslation } from 'react-i18next';

type Props = {
    data: {
        score: number;
        runningAmps: number;
        baselineAmps: number;
        idleAmps: number;
        compressorRuntime: number;
        recoveryTime?: number;
        baselineRecovery?: number;
        doorEvents?: number;
        costPerCycle?: number;
        baselineEnergy?: number;
        recoveryCycles?: number;
        average?: number;
    };
};

export default function MechanicalHealthCard({ data }: Props) {
    const { t } = useTranslation();

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <Gauge className="mr-2 h-5 w-5 text-green-500" />
                        <CardTitle className="text-base">
                            {t('dashboard.assetSensorInsights.mechanicalHealth.title')}
                        </CardTitle>
                    </div>
                    <Badge className={getBadgeColor(data.score)}>
                        {t('dashboard.assetSensorInsights.score')}: {data.score}
                    </Badge>
                </div>
                <CardDescription>
                    {t('dashboard.assetSensorInsights.mechanicalHealth.description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.assetSensorInsights.mechanicalHealth.runningAmps')}
                            </p>
                            <p className="text-lg font-semibold">
                                {data.runningAmps?.toFixed(3)} A
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.assetSensorInsights.mechanicalHealth.baselineAmps')}
                            </p>
                            <p className="text-lg font-semibold">
                                {data.baselineAmps?.toFixed(3)} A
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.assetSensorInsights.mechanicalHealth.idleAmps')}
                            </p>
                            <p className="text-lg font-semibold">
                                {data.idleAmps?.toFixed(3)} A
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.assetSensorInsights.mechanicalHealth.compressorRuntime')}
                            </p>
                            <p className="text-lg font-semibold">
                                {data.compressorRuntime?.toFixed(2)} %
                            </p>
                        </div>
                    </div>

                    <ProgressSection score={data.score} />

                    {/* Explanation */}
                    {getPerformanceAnalysis('mechanicalHealth', data)}
                </div>
            </CardContent>
        </Card>
    );
}
