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
import { DateFormat } from '@/config/enum';

interface DateFormatSwitcherProps {
  dateFormat?: string;
  disabled?: boolean;
  onChange: (format: string) => void;
}

const DateFormatSwitcher: React.FC<DateFormatSwitcherProps> = ({
  dateFormat,
  disabled,
  onChange,
}) => {
  const { t } = useTranslation();

  const formats = [
    { value: DateFormat.MDY, label: 'MM/DD/YYYY' },
    { value: DateFormat.DMY, label: 'DD/MM/YYYY' },
    { value: DateFormat.YMD, label: 'YYYY/MM/DD' },
  ];

  return (
    <div className="w-full space-y-2">
      <Select
        disabled={disabled}
        value={dateFormat}
        onValueChange={(value) => onChange(value)}
      >
        <SelectTrigger id="date-format" className="w-full">
          <SelectValue
            placeholder={t(
              'settings.general.systemConfig.form.dateFormat.placeholder'
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

export default DateFormatSwitcher;
