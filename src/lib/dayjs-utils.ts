import dayjs from 'dayjs';
import { DateFormat, TimeFormat } from '@/config/enum';
import { TIME_FORMATS_MAPPINGS } from '@/lib/format-mappings';
import utc from 'dayjs/plugin/utc';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(utc);
dayjs.extend(relativeTime);

let userDateFormat: DateFormat = DateFormat.MDY;
let userTimeFormat: TimeFormat = TimeFormat.TWELVE_HOURS;

export function applyUserSettings({
  dateFormat,
  timeFormat,
}: {
  dateFormat?: DateFormat;
  timeFormat?: TimeFormat;
}) {
  if (dateFormat) {
    userDateFormat = dateFormat;
  }
  if (timeFormat) {
    userTimeFormat = timeFormat;
  }
}

export function formatWithUserSettings(
  date?: dayjs.ConfigType,
  opts?: {
    dateFormat?: DateFormat;
    timeFormat?: TimeFormat;
    includeTime?: boolean;
    onlyTime?: boolean;
  }
) {
  const baseDateFormat = opts?.dateFormat ?? userDateFormat;
  const timeFormat = TIME_FORMATS_MAPPINGS[opts?.timeFormat ?? userTimeFormat];

  const fullFormat = opts?.includeTime
    ? `${baseDateFormat} ${timeFormat}`
    : baseDateFormat;

  if (opts?.onlyTime) {
    return dayjs.utc(date).local().format(timeFormat);
  }

  return dayjs.utc(date).local().format(fullFormat);
}

/**
 * Format a date-only string (YYYY-MM-DD) to the user's preferred format
 * without any timezone conversion
 */
export function formatDateOnly(
  dateString: string,
  dateFormat?: DateFormat
): string {
  // Parse YYYY-MM-DD format
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;

  const year = parts[0];
  const month = parts[1];
  const day = parts[2];

  const format = dateFormat ?? userDateFormat;

  // Format based on user preference
  switch (format) {
    case DateFormat.MDY:
      return `${month}/${day}/${year}`;
    case DateFormat.DMY:
      return `${day}/${month}/${year}`;
    case DateFormat.YMD:
      return `${year}/${month}/${day}`;
    default:
      return dateString;
  }
}
