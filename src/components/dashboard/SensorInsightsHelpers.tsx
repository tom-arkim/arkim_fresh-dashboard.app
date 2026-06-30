import { cn, formatCurrency, formatMinutes } from '@/lib/utils';
import i18n from '@/i18n/i18n';
import { Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/shadcn/progress';
import { useTranslation } from 'react-i18next';

export const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
};

export const getBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
};

export const getProgressColorClass = (score: number): string => {
    if (score >= 80) return '[&>div]:bg-green-500';
    if (score >= 60) return '[&>div]:bg-yellow-500';
    if (score >= 40) return '[&>div]:bg-orange-500';
    return '[&>div]:bg-red-500';
};

export const getPerformanceAnalysis = (
    type: 'temperature' | 'energyEfficiency' | 'mechanicalHealth',
    data: any
) => {
    const { score } = data;
    const t = i18n.t;
    let status = 'needs improvement';
    if (score >= 80) status = 'excellent';
    else if (score >= 60) status = 'good';
    else if (score >= 40) status = 'moderate';

    const performanceKey = `dashboard.assetSensorInsights.performanceAnalysis.${type}`;

    const statusText = t(`${performanceKey}.status`, {
        status: t(`status.${status}`),
        recoveryTime: formatMinutes(data.recoveryTime),
        baselineRecovery: formatMinutes(data.baselineRecovery),
        doorEvents: Math.floor(data.doorEvents),
        average: data.average?.toFixed(3),
        baselineEnergy: data.baselineEnergy?.toFixed(3),
        recoveryCycles: Math.floor(data.recoveryCycles),
        costPerCycle: formatCurrency(data.costPerCycle),
        runningAmps: data.runningAmps?.toFixed(3),
        baselineAmps: data.baselineAmps?.toFixed(3),
        idleAmps: data.idleAmps?.toFixed(3),
    });

    const descriptionText = t(`${performanceKey}.description`, {
        idleAmps: data.idleAmps?.toFixed(3),
    });

    return (
        <div className="text-sm space-y-1">
            <div className="flex items-center">
                <Info className="mr-1 w-5 h-5 text-muted-foreground" />
                {t(`${performanceKey}.title`)}:
            </div>
            <p>{statusText}</p>
            <p className="text-gray-400">{descriptionText}</p>
        </div>
    );
};

export const ProgressSection = ({ score }: { score: number }) => {
    const { t } = useTranslation();
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-sm">
                    {t('dashboard.assetSensorInsights.performanceScore')}
                </span>
                <span className={cn('text-sm font-medium', getScoreColor(score))}>
                    {Math.floor(score)}%
                </span>
            </div>
            <Progress
                value={Math.floor(score)}
                className={cn('h-3', getProgressColorClass(score))}
            />
        </div>
    );
};

export const getAssetStatus = (score: number) => {
    if (score >= 80) {
        return {
            icon: <CheckCircle className="h-5 w-5 mr-2 mt-0.5 text-green-500" />,
            titleKey: 'excellent',
            messageKey: 'optimal',
            showRecommendations: false,
        };
    }

    if (score >= 60) {
        return {
            icon: <Info className="h-5 w-5 mr-2 mt-0.5 text-yellow-500" />,
            titleKey: 'good',
            messageKey: 'stable',
            showRecommendations: true,
        };
    }

    if (score >= 40) {
        return {
            icon: <Info className="h-5 w-5 mr-2 mt-0.5 text-orange-500" />,
            titleKey: 'attention',
            messageKey: 'moderate',
            showRecommendations: true,
        };
    }

    return {
        icon: <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 text-red-500" />,
        titleKey: 'critical',
        messageKey: 'critical',
        showRecommendations: true,
    };
};
