'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import { getAvailableLanguages, getUserLanguage } from '../../i18n/i18nUtils';

interface LanguageSwitcherProps {
  language?: string;
  disabled?: boolean;
  width?: string;
  onLanguageChange: (language: string) => void;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  language,
  disabled,
  onLanguageChange,
}) => {
  const languages = getAvailableLanguages();
  const userLanguage = getUserLanguage();

  return (
    <div className="w-full space-y-2">
      <Select
        disabled={disabled}
        value={language ?? userLanguage}
        onValueChange={(value) => onLanguageChange(value)}
      >
        <SelectTrigger id="language" className="w-full">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default LanguageSwitcher;
