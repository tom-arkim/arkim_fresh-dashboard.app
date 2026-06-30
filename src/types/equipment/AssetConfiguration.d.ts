import SensorDetails from '@/types/equipment/SensorDetails';
import AssetBase from './AssetBase';
import dayjs from 'dayjs';

export interface EquipmentAssetDetails extends AssetBase {
  sensors: SensorDetails[];
  serialNumber: string | null;
  model: string | null;
  manufacturer: string | null;
  siteId: string | null;
}

export interface SensorAssetDetails extends AssetBase {
  sensors?: SensorDetails[];
}
