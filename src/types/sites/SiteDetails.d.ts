import { DateFormat, TimeFormat, TimeZones } from '@/config/enum';
import SiteBase from '@/types/sites/SiteBase';

export interface SystemConfiguration {
  timezone: TimeZones;
  language: string;
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
}

export default interface SiteDetails extends SiteBase {
  useMetricSystem: boolean;
  email?: string;
  configuration?: SystemConfiguration;
}
