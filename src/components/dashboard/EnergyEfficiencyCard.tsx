import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/shadcn/card';
import { Badge } from '@/components/ui/shadcn/badge';
import { Zap } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
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
        costPerCycle: number;
        baselineEnergy: number;
        recoveryCycles: number;
        recoveryTime?: number;
        baselineRecovery?: number;
        doorEvents?: number;
        baselineAmps?: number;
        idleAmps?: number;
        runningAmps?: number;
    };
};

export default function EnergyEfficiencyCard({ data }: Props) {
    const { t } = useTranslation();

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center">
                        <Zap className="mr-2 h-5 w-5 text-yellow-500" />
                        <CardTitle className="text-base">
                            {t('dashboard.assetSensorInsights.energyEfficiency.title')}
                        </CardTitle>
                    </div>
                    <Badge className={getBadgeColor(data.score)}>
                        {t('dashboard.assetSensorInsights.score')}: {data.score}
                    </Badge>
                </div>
                <CardDescription>
                    {t('dashboard.assetSensorInsights.energyEfficiency.description')}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.assetSensorInsights.energyEfficiency.averageEnergy')}
                            </p>
                            <p className="text-lg font-semibold">
                                {data.average?.toFixed(3)} kWh
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.assetSensorInsights.energyEfficiency.costPerCycle')}
                            </p>
                            <p className="text-lg font-semibold">
                                {formatCurrency(data.costPerCycle)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.assetSensorInsights.energyEfficiency.baselineEnergy')}
                            </p>
                            <p className="text-lg font-semibold">
                                {data.baselineEnergy?.toFixed(3)} kWh
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                {t('dashboard.assetSensorInsights.energyEfficiency.recoveryCycles')}
                            </p>
                            <p className="text-lg font-semibold">
                                {Math.floor(data.recoveryCycles)}
                            </p>
                        </div>
                    </div>

                    <ProgressSection score={data.score} />

                    {/* Explanation */}
                    {getPerformanceAnalysis('energyEfficiency', data)}
                </div>
            </CardContent>
        </Card>
    );
}
