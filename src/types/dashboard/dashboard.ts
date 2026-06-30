import AssetDetails from '@/types/equipment/AssetDetails';
import {
  AssetEnergyUsageState,
  AssetEquipmentState,
  AssetsAlertsState,
  AssetSensorState
} from '@/types/equipment/AssetStatus';
import { SensorReading } from '@/types/readings/SensorReading';
import { SensorReadingsReport } from '@/types/reports/SensorReadingsBrowserReport';


export interface EquipmentStatusOverview {
  assets: AssetEquipmentState[];
}

export interface EnergyUsageOverview {
  assets: AssetEnergyUsageState[];
  timeOfUseRate: {
    onPeak: number;
    offPeak: number;
    midPeak: number;
    superOffPeak: number;
  };
}

export interface OldSensorInsightsOverview {
  assets: AssetSensorState[];
}

export interface PumpOverviewState {
  asset: AssetDetails;
  runHours: number | null;
  numberOfStarts: number | null;
  power: number | null;
  torque: number | null;
  driveTemperature: number | null;
  frequency: number | null;
  motorCurrent: number | null;
  voltage: number | null;
  faultCode: number | null;
  lastUpdate: string | null;
}

export interface TemperatureOverviewState {
  assetId: string;
  assetName: string;
  assetType: string;
  temperature: number | null;
  valvePosition: number | null;
  lastUpdate: string | null;
}

export interface AssetsAlerts {
  assets: AssetsAlertsState[];
}

export interface VibrationWidgetState {
  assetId: string;
  assetName: string;
  vibrationKurtosis: number;
  temperature: number;
  vibrationRms: number;
  vibrationCrestFactor: number;
  lastUpdate: string;
  readings: SensorReading[];
}

export interface SurfaceTemperatureWidgetState {
  assetId: string;
  assetName: string;
  temperature: number;
  lastUpdate: string;
  readings: SensorReading[];
}

export interface SensorInsightsOverview {
  assetId: string;
  assetName: string;
  vibrationKurtosis: number;
  temperature: number;
  vibrationRms: number;
  vibrationCrestFactor: number;
  lastUpdate: string;
}