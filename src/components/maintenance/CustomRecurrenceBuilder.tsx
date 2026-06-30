import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/shadcn/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { cn } from '@/lib/utils';

// Day codes matching RFC 5545 BYDAY
const WEEKDAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;
type WeekDay = (typeof WEEKDAYS)[number];

// Month keys matching i18n monthNames
const MONTH_KEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'] as const;

type FrequencyUnit = 'day' | 'week' | 'month' | 'year';
type PeriodicMode = 'byDay' | 'byWeekday'; // used for both monthly and yearly

interface CustomRecurrenceBuilderProps {
  value: string; // current RRULE string
  onChange: (rrule: string) => void;
  startDate?: string; // YYYY-MM-DD — used for monthly/yearly sub-options
}

interface ParsedRRule {
  freq: FrequencyUnit;
  interval: number;
  byDay: WeekDay[];
  periodicMode: PeriodicMode;
}

/** Compute date parts needed for monthly/yearly sub-options. */
function getDateInfo(startDate: string): {
  dayOfMonth: number;
  monthNumber: number; // 1-12
  monthKey: string;    // 'jan'..'dec'
  nthWeekday: number;  // -1 means "last"
  weekdayCode: WeekDay;
} {
  const d = new Date(startDate + 'T12:00:00');
  const dayOfMonth = d.getDate();
  const monthNumber = d.getMonth() + 1; // 1-based
  const monthKey = MONTH_KEYS[d.getMonth()];
  const weekdayCode = WEEKDAYS[d.getDay()];
  const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const isLast = dayOfMonth + 7 > daysInMonth;
  const nthWeekday = isLast ? -1 : Math.ceil(dayOfMonth / 7);
  return { dayOfMonth, monthNumber, monthKey, nthWeekday, weekdayCode };
}

/** Parse an RRULE string into component parts for the UI. */
function parseRRule(rrule: string): ParsedRRule {
  const parts = rrule.replace(/^RRULE:/, '').split(';');
  let freq: FrequencyUnit = 'week';
  let interval = 1;
  let byDay: WeekDay[] = [];
  let periodicMode: PeriodicMode = 'byDay';

  for (const part of parts) {
    const [key, val] = part.split('=');
    if (!key || !val) continue;
    switch (key.toUpperCase()) {
      case 'FREQ':
        switch (val.toUpperCase()) {
          case 'DAILY':   freq = 'day';   break;
          case 'WEEKLY':  freq = 'week';  break;
          case 'MONTHLY': freq = 'month'; break;
          case 'YEARLY':  freq = 'year';  break;
        }
        break;
      case 'INTERVAL':
        interval = Math.max(1, parseInt(val, 10) || 1);
        break;
      case 'BYDAY':
        // Nth-weekday pattern like "2SU" or "-1FR" → byWeekday
        if (/^-?\d+[A-Z]{2}$/.test(val.trim())) {
          periodicMode = 'byWeekday';
        } else {
          byDay = val
            .split(',')
            .map((d) => d.trim().toUpperCase())
            .filter((d): d is WeekDay => WEEKDAYS.includes(d as WeekDay));
        }
        break;
      case 'BYMONTHDAY':
        periodicMode = 'byDay';
        break;
    }
  }

  return { freq, interval, byDay, periodicMode };
}

/** Build an RRULE string from UI state. */
function buildRRule(
  freq: FrequencyUnit,
  interval: number,
  byDay: WeekDay[],
  periodicMode: PeriodicMode,
  startDate: string | undefined
): string {
  const freqMap: Record<FrequencyUnit, string> = {
    day: 'DAILY',
    week: 'WEEKLY',
    month: 'MONTHLY',
    year: 'YEARLY',
  };
  const parts = [`FREQ=${freqMap[freq]}`, `INTERVAL=${interval}`];

  if (freq === 'week' && byDay.length > 0) {
    parts.push(`BYDAY=${byDay.join(',')}`);
  }

  if ((freq === 'month' || freq === 'year') && startDate) {
    const { dayOfMonth, monthNumber, nthWeekday, weekdayCode } = getDateInfo(startDate);

    if (freq === 'year') {
      parts.push(`BYMONTH=${monthNumber}`);
    }

    if (periodicMode === 'byDay') {
      parts.push(`BYMONTHDAY=${dayOfMonth}`);
    } else {
      parts.push(`BYDAY=${nthWeekday}${weekdayCode}`);
    }
  }

  return parts.join(';');
}

const CustomRecurrenceBuilder: React.FC<CustomRecurrenceBuilderProps> = ({
  value,
  onChange,
  startDate,
}) => {
  const { t } = useTranslation();

  const initial = useMemo(() => parseRRule(value || ''), []);
  const [freq, setFreq] = useState<FrequencyUnit>(initial.freq);
  const [interval, setInterval] = useState(initial.interval);
  const [intervalStr, setIntervalStr] = useState(String(initial.interval));
  const [selectedDays, setSelectedDays] = useState<WeekDay[]>(initial.byDay);
  const [periodicMode, setPeriodicMode] = useState<PeriodicMode>(initial.periodicMode);

  // Sync external value changes (e.g. when editing an existing task)
  useEffect(() => {
    if (!value) return;
    const parsed = parseRRule(value);
    setFreq(parsed.freq);
    setInterval(parsed.interval);
    setIntervalStr(String(parsed.interval));
    setSelectedDays(parsed.byDay);
    setPeriodicMode(parsed.periodicMode);
  }, [value]);

  const emitChange = useCallback(
    (f: FrequencyUnit, i: number, days: WeekDay[], mode: PeriodicMode) => {
      onChange(buildRRule(f, i, days, mode, startDate));
    },
    [onChange, startDate]
  );

  // On mount: if weekly with no days selected, pre-select startDate's weekday
  useEffect(() => {
    if (freq === 'week' && selectedDays.length === 0 && startDate) {
      const days: WeekDay[] = [WEEKDAYS[new Date(startDate + 'T12:00:00').getDay()]];
      setSelectedDays(days);
      onChange(buildRRule(freq, interval, days, periodicMode, startDate));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-emit when startDate changes so BYMONTHDAY / BYDAY / BYMONTH stays in sync
  useEffect(() => {
    if (!startDate) return;
    if (freq === 'week') {
      // If only one day is selected (auto-picked), swap it to match new startDate
      if (selectedDays.length <= 1) {
        const newDay: WeekDay = WEEKDAYS[new Date(startDate + 'T12:00:00').getDay()];
        const days: WeekDay[] = [newDay];
        setSelectedDays(days);
        emitChange(freq, interval, days, periodicMode);
      }
    } else if (freq === 'month' || freq === 'year') {
      emitChange(freq, interval, selectedDays, periodicMode);
    }
  }, [startDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFreqChange = (newFreq: FrequencyUnit) => {
    setFreq(newFreq);
    if (newFreq !== 'week') {
      setSelectedDays([]);
      emitChange(newFreq, interval, [], periodicMode);
    } else {
      // Pre-select startDate's weekday when switching to weekly
      const days =
        selectedDays.length > 0
          ? selectedDays
          : startDate
          ? [WEEKDAYS[new Date(startDate + 'T12:00:00').getDay()]]
          : [];
      setSelectedDays(days);
      emitChange(newFreq, interval, days, periodicMode);
    }
  };

  const handleIntervalChange = (raw: string) => {
    setIntervalStr(raw);
    const n = parseInt(raw, 10);
    if (n >= 1) {
      setInterval(n);
      emitChange(freq, n, selectedDays, periodicMode);
    }
  };

  const handleIntervalBlur = () => {
    const n = parseInt(intervalStr, 10);
    if (!n || n < 1) setIntervalStr(String(interval));
  };

  const handlePeriodicModeChange = (mode: PeriodicMode) => {
    setPeriodicMode(mode);
    emitChange(freq, interval, selectedDays, mode);
  };

  const toggleDay = (day: WeekDay) => {
    const next = selectedDays.includes(day)
      ? selectedDays.filter((d) => d !== day)
      : [...selectedDays, day];
    setSelectedDays(next);
    emitChange(freq, interval, next, periodicMode);
  };

  const dayLabels: Record<WeekDay, string> = useMemo(
    () => ({
      SU: t('maintenanceTasks.recurrence.days.su'),
      MO: t('maintenanceTasks.recurrence.days.mo'),
      TU: t('maintenanceTasks.recurrence.days.tu'),
      WE: t('maintenanceTasks.recurrence.days.we'),
      TH: t('maintenanceTasks.recurrence.days.th'),
      FR: t('maintenanceTasks.recurrence.days.fr'),
      SA: t('maintenanceTasks.recurrence.days.sa'),
    }),
    [t]
  );

  const freqLabel = (unit: FrequencyUnit) => {
    const key =
      interval === 1
        ? `maintenanceTasks.recurrence.units.${unit}`
        : `maintenanceTasks.recurrence.units.${unit}s`;
    return t(key);
  };

  // Sub-option labels for monthly and yearly, derived from startDate
  const periodicOptions = useMemo(() => {
    if (!startDate) return null;
    const { dayOfMonth, monthKey, nthWeekday, weekdayCode } = getDateInfo(startDate);
    const ordinalKey = nthWeekday === -1 ? 'last' : String(nthWeekday);
    const ordinal = t(`maintenanceTasks.recurrence.ordinals.${ordinalKey}`);
    const weekdayName = t(`maintenanceTasks.recurrence.weekdayNames.${weekdayCode.toLowerCase()}`);
    const monthName = t(`maintenanceTasks.recurrence.monthNames.${monthKey}`);

    return {
      monthly: {
        byDayLabel: t('maintenanceTasks.recurrence.monthlyByDay', { day: dayOfMonth }),
        byWeekdayLabel: t('maintenanceTasks.recurrence.monthlyByWeekday', {
          nth: ordinal,
          weekday: weekdayName,
        }),
      },
      yearly: {
        byDayLabel: t('maintenanceTasks.recurrence.yearlyByDay', {
          month: monthName,
          day: dayOfMonth,
        }),
        byWeekdayLabel: t('maintenanceTasks.recurrence.yearlyByWeekday', {
          nth: ordinal,
          weekday: weekdayName,
          month: monthName,
        }),
      },
    };
  }, [startDate, t]);

  const activeOptions =
    freq === 'month' ? periodicOptions?.monthly :
    freq === 'year'  ? periodicOptions?.yearly  : null;

  return (
    <div className="space-y-3">
      {/* Row 1: Repeat every [N] [unit] */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {t('maintenanceTasks.recurrence.repeatEvery')}
        </span>
        <Input
          type="number"
          min={1}
          max={99}
          value={intervalStr}
          onChange={(e) => handleIntervalChange(e.target.value)}
          onBlur={handleIntervalBlur}
          className="w-16 text-center"
        />
        <Select value={freq} onValueChange={(v) => handleFreqChange(v as FrequencyUnit)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(['day', 'week', 'month', 'year'] as FrequencyUnit[]).map((u) => (
              <SelectItem key={u} value={u}>
                {freqLabel(u)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Row 2: Repeat on [day buttons] — only for WEEKLY */}
      {freq === 'week' && (
        <div className="space-y-1.5">
          <span className="text-sm text-muted-foreground">
            {t('maintenanceTasks.recurrence.repeatOn')}
          </span>
          <div className="flex gap-1">
            {WEEKDAYS.map((day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
                className={cn(
                  'h-8 w-8 rounded-full text-xs font-medium transition-colors',
                  'border border-input hover:bg-accent hover:text-accent-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  selectedDays.includes(day) &&
                    'bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground'
                )}
              >
                {dayLabels[day]}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Row 2: Sub-options for MONTHLY and YEARLY */}
      {activeOptions && (
        <div className="space-y-1.5">
          <span className="text-sm text-muted-foreground">
            {t('maintenanceTasks.recurrence.repeatOn')}
          </span>
          <div className="flex flex-col gap-1.5">
            {(
              [
                { mode: 'byDay' as PeriodicMode, label: activeOptions.byDayLabel },
                { mode: 'byWeekday' as PeriodicMode, label: activeOptions.byWeekdayLabel },
              ] as const
            ).map(({ mode, label }) => (
              <label key={mode} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="periodicMode"
                  value={mode}
                  checked={periodicMode === mode}
                  onChange={() => handlePeriodicModeChange(mode)}
                  className="accent-primary"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomRecurrenceBuilder;
