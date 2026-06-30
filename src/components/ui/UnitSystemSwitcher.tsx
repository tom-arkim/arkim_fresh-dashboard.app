'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { Ruler, Scale } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UnitSystemSwitcherProps {
  useMetricSystem: string;
  disabled?: boolean;
  onChange: (useMetric: string) => void;
  showHelperText?: boolean;
}

const UnitSystemSwitcher: React.FC<UnitSystemSwitcherProps> = ({
  useMetricSystem,
  disabled,
  onChange,
  showHelperText = true,
}) => {
  const { t } = useTranslation();

  return (
    <div className="w-full space-y-2">
      <Select
        disabled={disabled}
        value={useMetricSystem}
        onValueChange={onChange}
      >
        <SelectTrigger id="unit-system" className="w-full">
          <SelectValue placeholder={t('company.unitSystem')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="metric">
            <span className="flex items-center gap-2">
              <Scale />
              <span>{t('company.metric')}</span>
            </span>
          </SelectItem>
          <SelectItem value="imperial">
            <span className="flex items-center gap-2">
              <Ruler />
              <span>{t('company.imperial')}</span>
            </span>
          </SelectItem>
        </SelectContent>
      </Select>

      {showHelperText && (
        <p className="text-sm text-muted-foreground">
          {t('company.unitSystemDescription')}
        </p>
      )}
    </div>
  );
};

export default UnitSystemSwitcher;
