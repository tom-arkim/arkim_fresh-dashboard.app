import { AssetsEquipmentStatus } from '@/config/enum';
import SensorDetails from './SensorDetails';
import AssetBase from '@/types/equipment/AssetBase';

interface MonitorParameters {
  id: string;
  parameter: string;
  alarmType: string;
  condition: string;
  value: number;
  priority: string;
}

export default interface AssetDetails extends AssetBase {
  siteId: string;
  manufacturer: string;
  /** Id of the asset model (for API requests). */
  assetModelId: string;
  model?: string;
  serialNumber?: string;
  sensors?: SensorDetails[];
  status: AssetsEquipmentStatus;
  location: string;
  lastMaintenance: string | null;
  nextMaintenance: string | null;
  monitors: MonitorParameters[];
  vdfMacId: string | null;
  isVdfAvailable: boolean;
  archived?: boolean;
  archivedAt: string | null;
  archivedBy: string | null;
  assetModelId?: string | null;
}

export type AssetDocumentStatus = 'pending'
  | 'ready_for_ingestion'
  | 'ingested'
  | 'completed'
  | 'failed';

export interface AssetDocument {
  documentId: string;
  assetMake: string;
  assetModel: string;
  assetModelId: string;
  documentCategory: string;
  assetId?: string | null;
  fileName: string;
  language: 'en';
  fileSizeKb: number;
  confidence: number;
  source: string;
  sourceUrl: string;
  previewUrl: string;
  pageCount?: number;
  processingStatus: AssetDocumentStatus;
}

export type AssetDocumentList = AssetDocument[];

