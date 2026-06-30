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
import { TimeFormat } from '@/config/enum';

interface TimeFormatSwitcherProps {
  timeFormat?: string;
  disabled?: boolean;
  onChange: (format: string) => void;
}

const TimeFormatSwitcher: React.FC<TimeFormatSwitcherProps> = ({
  timeFormat,
  disabled,
  onChange,
}) => {
  const { t } = useTranslation();

  const formats = [
    { value: TimeFormat.TWELVE_HOURS, label: '12-hour (AM/PM)' },
    { value: TimeFormat.TWENTY_FOUR_HOURS, label: '24-hour' },
  ];

  return (
    <div className="w-full space-y-2">
      <Select
        disabled={disabled}
        value={timeFormat}
        onValueChange={(value) => onChange(value)}
      >
        <SelectTrigger id="time-format" className="w-full">
          <SelectValue
            placeholder={t(
              'settings.general.systemConfig.form.timeFormat.placeholder'
            )}
          />
        </SelectTrigger>
        <SelectContent>
          {formats.map((fmt) => (
            <SelectItem key={fmt.value} value={fmt.value}>
              {fmt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default TimeFormatSwitcher;
