export interface SensorReading {
  companyId: string;
  assetId: string;
  sensorId: string;
  metricName: string;
  timeUtc: string;
  value: number;
  /** Unit from the monitoring backend; may be null → fall back to the frontend unit map. */
  unit?: string | null;
}

export interface SensorReadingsBrowserReportParameters {
  asset_ids: string[];
  hours: number;
  metrics?: string[] | null;
  nextToken?: string;
  timezone_offset_hours?: number;
  filter?: string;
  down_sample?: string;
  page_size?: number;
}

export interface SensorReadingConfigurationParameters {
  asset_ids: string[];
  days: number;
}

export interface SensorReadingsFilter {
  assetId: string;
  assetName: string;
  assetDescription: string;
  sensorId: string;
  sensorType: string;
  sensorDescription: string;
  label: string;
  color: string;
}

export interface SensorReadingsLatestParameters {
  asset_ids: string[];
  days: number;
  metrics: string[] | null;
}