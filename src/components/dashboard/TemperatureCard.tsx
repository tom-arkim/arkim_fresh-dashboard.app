import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { celsiusToFahrenheit } from '@/lib/utils';
import useSiteStore from '@/store/siteStore';
import { useTranslation } from 'react-i18next';
import { TemperatureOverviewState } from '@/types/dashboard/dashboard';
import { useMemo } from 'react';
import { Thermometer, Clock, Gauge } from 'lucide-react';
import GaugeComponent from 'react-gauge-component';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(relativeTime);
dayjs.extend(utc);

export const TemperatureCard: React.FC<TemperatureOverviewState> = ({
  assetId,
  assetName,
  assetType,
  temperature,
  valvePosition,
  lastUpdate,
}) => {
  const { t } = useTranslation();
  const { getUseMetricSystem } = useSiteStore();
  const useMetricSystem = getUseMetricSystem();

  const tempUnavailable = temperature === null || temperature === undefined;
  const valveUnavailable = valvePosition === null || valvePosition === undefined;

  const { tempColor, tempHex } = useMemo(() => {
    if (tempUnavailable) return { tempColor: 'text-muted-foreground', tempHex: '#aaaaaa' };
    return { tempColor: 'text-blue-500', tempHex: '#3b82f6' };
  }, [tempUnavailable]);

  const { displayTemp, displayUnit } = useMemo(() => {
    const temp = temperature ?? 0;
    if (useMetricSystem) {
      return { displayTemp: temp.toFixed(2), displayUnit: 'C' };
    } else {
      return { displayTemp: celsiusToFahrenheit(temp).toFixed(2), displayUnit: 'F' };
    }
  }, [temperature, useMetricSystem]);

  const valveValue = valvePosition ?? 0;
  const valveMax = 100;

  return (
    <Card className="shadow-md border overflow-hidden relative py-1 gap-0">
      <CardHeader className="pb-2 sm:pb-3 pt-3 sm:pt-4 relative px-2 sm:px-3">
        <div className="flex flex-col items-center justify-center">
          <CardTitle className="text-base sm:text-lg font-bold tracking-tight flex items-center justify-center gap-2">
            <Thermometer className={`w-4 h-4 sm:w-5 sm:h-5 ${tempColor}`} />
            <span className="text-center truncate">{assetName}</span>
            <div className="w-4 sm:w-5" aria-hidden="true" />
          </CardTitle>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium text-center">
            {assetType}
          </p>
        </div>
      </CardHeader>

      <CardContent className="pb-4 sm:pb-5 relative px-2 sm:px-3">
        <div className="relative">
          <div className={`flex flex-col items-center justify-center ${tempUnavailable ? 'opacity-20 grayscale select-none' : ''}`}>
            <div className="relative inline-flex items-baseline">
              <span className={`text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter ${tempColor}`}>
                {tempUnavailable ? '--' : temperature}
              </span>
              <span className={`text-3xl sm:text-3xl md:text-4xl font-bold ml-1 ${tempColor}`}>
                °F
              </span>
            </div>
          </div>
          {tempUnavailable && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest bg-background/50 px-2 py-0.5 rounded-full border border-border/50">
                {t('dashboard.temperatureOverview.unavailable')}
              </span>
            </div>
          )}
        </div>

        {/* Valve Gauge */}
        <div className="relative mt-2">
          <div className={`relative w-full flex flex-col items-center mb-2 ${valveUnavailable ? 'opacity-20 grayscale select-none' : ''}`}>
            <div className="w-full max-w-[220px] sm:max-w-[250px] md:max-w-[270px] relative">
              <GaugeComponent
                type="semicircle"
                arc={{
                  width: 0.2,
                  padding: 0,
                  cornerRadius: 0,
                  subArcs: [
                    {
                      length: valveValue,
                      color: tempHex,
                    },
                    {
                      length: valveMax - valveValue,
                      color: '#aaaaaa',
                    },
                  ],
                }}
                pointer={{
                  color: '#aaaaaa',
                  length: 0.6,
                  width: 10,
                  elastic: true,
                }}
                labels={{
                  valueLabel: {
                    hide: false,
                    formatTextValue: (value: number) => `${value}%`,
                    style: {
                      fontSize: window.innerWidth < 640 ? '28px' : '35px',
                      fill: valveUnavailable ? '#aaaaaa' : tempHex,
                      fontWeight: 'bold',
                    },
                  },
                  tickLabels: {
                    type: 'inner',
                    hideMinMax: true,
                  },
                }}
                value={valveValue}
                minValue={0}
                maxValue={valveMax}
              />
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 mt-[-8px] sm:mt-[-10px]">
                <Gauge className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-muted-foreground" />
                <div className="text-center text-[11px] sm:text-xs font-medium text-muted-foreground">
                  {t('dashboard.temperatureOverview.valvePosition')}
                </div>
              </div>
            </div>
          </div>
          {valveUnavailable && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-4">
              <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest bg-background/50 px-2 py-0.5 rounded-full border border-border/50">
                {t('dashboard.temperatureOverview.valveUnavailable')}
              </span>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center px-2 sm:px-3 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs text-muted-foreground">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span className="font-medium">
              {t('common.lastUpdated')}: {dayjs.utc(lastUpdate).local().fromNow()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};