export enum CompanyPermission {
  Admin = 'admin',
  Monitoring = 'monitoring',
  Technician = 'technician',
}

export enum Metric {
  Temperature = 'temperature',
  Humidity = 'humidity',
  Power = 'power',
}

export enum TemperatureUnit {
  C = 'C',
  F = 'F',
}

export enum TimeFrame {
  Hour = 'hour',
  Day = 'day',
  Month = 'month',
}

export enum AssetsEquipmentStatus {
  Operational = 1,
  Warning = 2,
  Maintenance = 3,
}

export enum EnergyUnit {
  KWh = 'kWh',
  cost = 'cost',
}

export enum RateTiers {
  OffPeak = 'OffPeak',
  MidPeak = 'MidPeak',
  OnPeak = 'OnPeak',
  SuperOffPeak = 'SuperOffPeak',
}

export enum TimeZones {
  PST = 'America/Los_Angeles',
  UTC = 'UTC',
}

export enum DateFormat {
  MDY = 'MM/DD/YYYY',
  DMY = 'DD/MM/YYYY',
  YMD = 'YYYY/MM/DD',
}

export enum TimeFormat {
  TWELVE_HOURS = '12h',
  TWENTY_FOUR_HOURS = '24h',
}

export enum AssetsTemperatureStatus {
  Normal = 'Normal',
  Warning = 'Warning',
  Critical = 'Critical',
}
export enum AssetsAlertsStatus {
  Normal = 'Normal',
  Warning = 'Warning',
  Critical = 'Critical',
}

export enum AlertPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export enum MetricParameter {
  Temperature = 'temperature',
  Vibration = 'vibration',
  Current = 'current',
  SurfaceTemperature = 'surface_temperature',
  Humidity = 'humidity',
  Power = 'power',
  Voltage = 'voltage',
}

export enum AlarmType {
  TrendBehavior = 'trend_behavior',
  Thresholds = 'thresholds',
  SignalDrop = 'signal_drop',
  Noise = 'noise',
  FaultCode = 'fault_code',
}

export enum NotificationType {
  InApp = 'in_app',
  Email = 'email',
}

export enum SensorType {
  Tasmota = 'tasmota',
  Ruuvi = 'ruuvi',
  PLC = 'plc',
}

export enum ReadingMetrics {
  Power = 'power',
  FaultCode = 'faultCode',
  Torque = 'torque',
  RunHours = 'runHours',
  Voltage = 'voltage',
  Frequency = 'frequency',
  MotorCurrent = 'motorCurrent',
  DriveTemperature = 'driveTemperature',
  NumberOfStarts = 'numberOfStarts',
  Speed = 'speed',
  Temperature = 'temperature',
  ValvePosition = 'valve_position',
  VibrationRMS = 'vibration_rms',
  VibrationKurtosis = 'vibration_kurtosis',
  VibrationCrestFactor = 'vibration_crest_factor',
}

export enum ReadingDownSample {
  No = 'no',
  FiveMinutes = '5min',
  Hour = 'hour',
  SixHour = '6hour',
  Day = 'day',
  Month = 'month',
}

export enum AssetIssueTypes {
  Temperature_Below = 1,
  Temperature_Above = 2,
  Temperature_NotReceived = 3,
  Humidity_Below = 4,
  Humidity_Above = 5,
  Humidity_NotReceived = 6,
}

export enum MaintenanceEventTypes {
  WorkOrder = 'work_order',
  TaskOccurrence = 'task_occurrence',
}

export enum WorkOrderStatus {
  Open = 'open',
  ThreadOpened = 'thread_opened',
  Cancelled = 'cancelled',
  Completed = 'completed',
}

export enum WorkOrderSourceType {
  MaintenanceTask = 'maintenance_task',
  Manual = 'manual',
  Chat = 'chat',
  Integration = 'integration',
}

export enum WorkLogOutcome {
  Fixed = 'fixed',
  NotFixed = 'not_fixed',
  PartiallyFixed = 'partially_fixed',
}