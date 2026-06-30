import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { STORAGE_KEYS } from '@/config/constant';

import english from './resources/english/common.json';
import spanish from './resources/spanish/common.json';

export const defaultNS = 'common';

const resources = {
  en: {
    [defaultNS]: english,
  },
  es: {
    [defaultNS]: spanish,
  },
};

i18n
  .use(LanguageDetector) // Add language detector before initialization
  .use(initReactI18next)
  .init({
    resources,
    ns: [defaultNS],
    defaultNS,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    returnNull: false,
    detection: {
      order: [
        'navigator',
        'querystring',
        'cookie',
        'localStorage',
        'sessionStorage',
        'htmlTag',
      ],
      lookupQuerystring: 'lng',
      lookupCookie: 'i18next',
      lookupLocalStorage: STORAGE_KEYS.I18NEXT_LNG,
      caches: ['localStorage', 'cookie'],
    },
  });

export default i18n;
