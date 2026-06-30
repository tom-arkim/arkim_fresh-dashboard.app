import {
  AssetsAlertsStatus,
  AssetsEquipmentStatus,
  DashboardSensorInsightTypes,
  Metric,
  RateTiers,
} from '@/config/enum';
import AssetConfiguration, {
  EquipmentAssetDetails,
  SensorAssetDetails,
} from './AssetConfiguration';
import AssetBase from '@/types/equipment/AssetBase';
import SensorDetails from '@/types/equipment/SensorDetails';

export default interface AssetStatus {
  asset: SensorAssetDetails;
  label?: string;
  lastRegisteredTempC: number;
  lastRegisteredTempTimeUtc: Date;
  lastRegisteredHumidityPercent: number;
  lastRegisteredHumidityTimeUtc: Date;
  lastRegisteredPowerTimeUtc: Date;
  lastRegisteredPowerUsage: number;
  recentTemperatureReadings: Record<string, number>;
  recentHumidityReadings: Record<string, number>;
  recentPowerReadings: Record<string, number>;
  issues: Record<number, number>;
}

export interface AssetEquipmentState {
  asset: EquipmentAssetDetails;
  status: AssetsEquipmentStatus;
  lastMaintenance: Date | null;
  nextMaintenance: Date | null;
}

export interface Readings {
  category: RateTiers;
  cost: number;
  companyId: string | null;
  assetId: string;
  sensorId: string | null;
  metricName: Metric;
  timeUtc: string;
  value: number;
}

export interface AssetEnergyUsageState {
  asset: EquipmentAssetDetails;
  readings: Readings[];
}

export interface AssetSensorState {
  asset: SensorAssetDetails;
  temperature: {
    score: number;
    average: number;
    recoveryTime: number;
    baselineRecovery: number;
    doorEvents: number;
  };
  energyEfficiency: {
    score: number;
    average: number;
    costPerCycle: number;
    baselineEnergy: number;
    recoveryCycles: number;
  };
  mechanicalHealth: {
    score: number;
    runningAmps: number;
    baselineAmps: number;
    idleAmps: number;
    compressorRuntime: number;
  };
}

export interface AssetsAlertsCard {
  status: AssetsAlertsStatus;
  description: string;
  duration: string;
  startTime: string;
  acknowledged: boolean;
}

export interface AssetsAlertsState {
  asset: AssetBase;
  alerts: AssetsAlertsCard[];
}
