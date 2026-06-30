import { Badge } from '@/components/ui/shadcn/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { AssetsEquipmentStatus } from '@/config/enum';
import { celsiusToFahrenheit } from '@/lib/utils';
import useSiteStore from '@/store/siteStore';
import { PumpOverviewState } from '@/types/dashboard/dashboard';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Activity, Clock, Gauge, Thermometer, Zap } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

dayjs.extend(utc);
dayjs.extend(relativeTime);

export const AssetCard: React.FC<{ asset: PumpOverviewState }> = ({
  asset,
}) => {
  const { t } = useTranslation();
  const statusConfig = useMemo(() => {
    return {
      [AssetsEquipmentStatus.Operational]: {
        color: 'bg-green-500',
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        label: 'Operational',
      },
      [AssetsEquipmentStatus.Warning]: {
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        label: 'Warning',
      },
      [AssetsEquipmentStatus.Maintenance]: {
        color: 'bg-red-500',
        textColor: 'text-red-700',
        bgColor: 'bg-red-50',
        label: 'Maintenance',
      },
    };
  }, []);

  const { getUseMetricSystem } = useSiteStore();
  const useMetricSystem = getUseMetricSystem();

  const { displayTemp, displayUnit } = useMemo(() => {
    const temp = asset.driveTemperature !== null ? asset.driveTemperature : 0;
    if (useMetricSystem) {
      return { displayTemp: temp.toFixed(1), displayUnit: 'C' };
    } else {
      return {
        displayTemp: celsiusToFahrenheit(temp).toFixed(1),
        displayUnit: 'F',
      };
    }
  }, [asset.driveTemperature, useMetricSystem]);

  const status = useMemo(() => {
    if (asset.faultCode === 0)
      return statusConfig[AssetsEquipmentStatus.Operational];
    return statusConfig[AssetsEquipmentStatus.Warning];
  }, [asset.faultCode, statusConfig]);

  return (
    <Card className="gap-2 py-1.5 sm:py-2">
      <CardHeader className="pb-2 pt-2 sm:pt-3">
        <div className="flex items-start justify-between overflow-hidden gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div
              className={`w-2.5 h-2.5 rounded-full ${status.color} animate-pulse`}
            />
            <CardTitle className="text-sm sm:text-base font-semibold truncate">
              {asset.asset.name}
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className={`${status.bgColor} ${status.textColor} border-0 font-semibold text-[10px] sm:text-xs`}
          >
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 pb-2 sm:pb-3">
        {/* Primary Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <div className="text-lg sm:text-xl font-bold">
              {asset.frequency ? asset.frequency.toFixed(1) : '-'}{' '}
              {asset.frequency ? 'Hz' : ''}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500">
              {t('dashboard.pumpsOverview.metrics.frequency')}
            </div>
          </div>
          <div className="space-y-0.5 text-right">
            <div className="text-xs sm:text-sm font-semibold whitespace-nowrap">
              {asset.motorCurrent
                ? `${asset.motorCurrent.toFixed(1)} A / ${asset.voltage} V`
                : '-'}
            </div>
            <div className="text-[10px] sm:text-xs text-gray-500 whitespace-nowrap">
              {t('dashboard.pumpsOverview.metrics.currentVoltage')}
            </div>
          </div>
        </div>

        {/* Metrics Grid - Combined */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 text-[10px] sm:text-xs pt-1 border-t">
          <div>
            <div className="text-gray-500 flex items-center gap-0.5">
              <Clock className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              {t('dashboard.pumpsOverview.metrics.runtime')}
            </div>
            <div className="font-semibold">{asset?.runHours ?? '-'}</div>
          </div>
          <div>
            <div className="text-gray-500 flex items-center gap-0.5">
              <Activity className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              {t('dashboard.pumpsOverview.metrics.starts')}
            </div>
            <div className="font-semibold">{asset?.numberOfStarts ?? '-'}</div>
          </div>
          <div>
            <div className="text-gray-500 flex items-center gap-0.5">
              <Zap className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              {t('dashboard.pumpsOverview.metrics.power')}
            </div>
            <div className="font-semibold">
              {asset.power ? `${asset.power.toFixed(1)} kW` : '-'}
            </div>
          </div>
          <div>
            <div className="text-gray-500 flex items-center gap-0.5">
              <Gauge className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              {t('dashboard.pumpsOverview.metrics.torque')}
            </div>
            <div className="font-semibold">
              {asset.torque ? `${asset.torque.toFixed(1)} Nm` : '-'}
            </div>
          </div>
          <div>
            <div className="text-gray-500 flex items-center gap-0.5">
              <Thermometer className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
              {t('dashboard.pumpsOverview.metrics.temp')}
            </div>
            <div className="font-semibold">
              {asset?.driveTemperature ? `${asset?.driveTemperature} °F` : '-'}
            </div>
          </div>
        </div>

        {/* Last Update */}
        <div className="text-[10px] sm:text-xs text-gray-400 flex justify-between pt-1 border-t">
          <span>
            {t('common.lastUpdated')}:{' '}
            {dayjs.utc(asset.lastUpdate).local().fromNow()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};
