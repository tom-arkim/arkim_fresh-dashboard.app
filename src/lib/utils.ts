import { ApiError } from '@/lib/api-error';
import axios from 'axios';
import { clsx, type ClassValue } from 'clsx';
import dayjs from 'dayjs';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isApiError = (error: unknown) => error instanceof ApiError;
export const isCancelledError = (error: unknown) => axios.isCancel(error)

export const getAvailableThemeOptions = () => {
  const themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];
  return themeOptions;
};

export const getIssueDescription = (issue: string) => {
  const issueDescriptions: Record<string, string> = {
    '1': 'Temperature below operating range',
    '2': 'Temperature above operating range',
    '3': 'Temperature sensor not responding',
    '4': 'Humidity below operating range',
    '5': 'Humidity above operating range',
    '6': 'Humidity sensor not responding',
    '7': 'Power below operating range',
    '8': 'Power above operating range',
    '9': 'Power sensor not responding',
  };

  return issueDescriptions[issue] || `Unknown issue type ${issue}`;
};

export const celsiusToFahrenheit = (value: number) => {
  return (value * 9) / 5 + 32;
};

export const fahrenheitToCelsius = (value: number) => {
  return (value - 32) * 5 / 9;
};

export function createHashFromString(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
  }
  return hash;
}

export function formatCurrency(value: number | string) {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value === 'string') value = parseFloat(value);
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });
  return formatter.format(value);
}

export function formatMinutes(minutes: number) {
  const min = Math.floor(minutes);
  if (isNaN(min)) return 'N/A';
  const hours = Math.floor(min / 60);
  const remainingMinutes = min % 60;

  if (hours === 0) {
    return `${remainingMinutes}min`;
  }

  return `${hours}hour ${remainingMinutes}min`;
}

export const hashStringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const absHash = Math.abs(hash);

  // First tier: Highly distinct base colors
  const baseHues = [0, 30, 60, 120, 180, 210, 240, 270, 300, 330];

  // Second tier: Saturation variations for each hue
  const saturations = [75, 85, 90];

  // Third tier: Lightness variations
  const lightnesses = [45, 55, 65];

  // Use different parts of the hash for each parameter
  const hueIndex = absHash % baseHues.length;
  const satIndex = Math.floor(absHash / baseHues.length) % saturations.length;
  const lightIndex =
    Math.floor(absHash / (baseHues.length * saturations.length)) %
    lightnesses.length;

  const hue = baseHues[hueIndex];
  const saturation = saturations[satIndex];
  const lightness = lightnesses[lightIndex];

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export const getWeekOfMonth = (date: dayjs.Dayjs) => {
  const startOfMonth = date.startOf('month');
  // difference in days, then divide by 7
  return Math.floor(date.diff(startOfMonth, 'day') / 7) + 1;
};

export const formatMinutesAgo = (minutes: number) => {
  if (isNaN(minutes)) return 'N/A';

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) {
    return `${remainingMinutes} min ago`;
  }

  return `${hours} hour ${remainingMinutes} min ago`;

};


export const createArrayQueryParam = (arr: string[], key: string) => {
  if (arr.length === 0) return '';
  return arr.map((item) => `${key}=${encodeURIComponent(item)}`).join('&');
};