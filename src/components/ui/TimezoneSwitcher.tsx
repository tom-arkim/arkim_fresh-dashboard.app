'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { useTranslation } from 'react-i18next';
import { TimeZones } from '@/config/enum';

interface TimezoneSwitcherProps {
  timezone?: string;
  disabled?: boolean;
  onChange: (timezone: string) => void;
}

const TimezoneSwitcher: React.FC<TimezoneSwitcherProps> = ({
  timezone,
  disabled,
  onChange,
}) => {
  const { t } = useTranslation();

  const timezones = [
    { value: TimeZones.PST, label: 'UTC-8 (Pacific Time)' },
    { value: TimeZones.UTC, label: 'UTC (Coordinated Universal Time)' },
  ];

  return (
    <div className="w-full space-y-2 overflow-auto">
      <Select
        disabled={disabled}
        value={timezone}
        onValueChange={(value) => onChange(value)}
      >
        <SelectTrigger id="timezone" className="w-full overflow-hidden truncate">
          <SelectValue
            placeholder={t(
              'settings.general.systemConfig.form.timezone.placeholder'
            )}
            className="truncate"
          />
        </SelectTrigger>
        <SelectContent className='truncate'>
          {timezones.map((tz) => (
            <SelectItem key={tz.value} value={tz.value} className="truncate">
              {tz.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TimezoneSwitcher;
