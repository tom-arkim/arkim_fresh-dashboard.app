'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { RadioGroup, RadioGroupItem } from '@/components/ui/shadcn/radio-group';
import { Label } from '@/components/ui/shadcn/label';
import { ThemeMode } from '../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeSwitcherProps {
  themeMode: ThemeMode;
  disabled?: boolean;
  onThemeChange: (theme: ThemeMode) => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  themeMode,
  disabled,
  onThemeChange,
}) => {
  const { t } = useTranslation();

  return (
    <RadioGroup
      value={themeMode}
      onValueChange={(value) => onThemeChange(value as ThemeMode)}
      className="space-y-2"
    >
      <div className="flex items-center space-x-2">
        <RadioGroupItem className='cursor-pointer' value="light" id="light" disabled={disabled} />
        <Label htmlFor="light" className="flex items-center space-x-2  cursor-pointer">
          <Sun className="h-4 w-4" />
          <span>{t('layout.preferences.theme.light')}</span>
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <RadioGroupItem className='cursor-pointer' value="dark" id="dark" disabled={disabled} />
        <Label htmlFor="dark" className="flex items-center space-x-2 cursor-pointer">
          <Moon className="h-4 w-4" />
          <span>{t('layout.preferences.theme.dark')}</span>
        </Label>
      </div>
    </RadioGroup>
  );
};

export default ThemeSwitcher;
