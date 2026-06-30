import AssetBase from '../equipment/AssetBase';
import UserBase from '../user/UserBase';

// Base maintenance task model - only user-provided fields
export interface MaintenanceTaskBase {
  assetId: string;
  title: string;
  description: string;
  assignedUserEmails: string[];
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate: string | null; // ISO date string (YYYY-MM-DD)
  rRule: string;
}

// New maintenance task (alias for creation)
export type MaintenanceTaskNew = MaintenanceTaskBase;

// Simplified maintenance task model for list view
export interface MaintenanceTask extends MaintenanceTaskBase {
  companyId: string;
  id: string;
  siteId: string;
  assetName: string;
  isActive: boolean;
  /** Set when task was created from a recommendation (import). */
  recommendationId?: string;
}

// Full maintenance task model with all details
export interface MaintenanceTaskDetails extends MaintenanceTask {
  isArchived: boolean;
  archivedBy: string | null;
  archivedAtUtc: string | null; // ISO date-time string
  createdBy: string;
  createdAtUtc: string; // ISO date-time string
  exceptionDates: string[]; // ISO date strings (YYYY-MM-DD)
}

// Single occurrence of a maintenance task
export interface TaskOccurrence {
  taskId: string;
  assetId: string;
  title: string;
  description: string;
  assignedUserEmails: string[];
  occurrenceDate: string; // ISO date string (YYYY-MM-DD)
}

// Task details modal props
export interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
  availableUsers: UserBase[];
  availableAssets: AssetBase[];
  dataLoading: boolean;
  // Edit mode props
  editMode?: 'create' | 'wholeSeries' | 'thisEvent' | 'futureEvents';
  editTask?: MaintenanceTask;
  editDate?: string; // The specific date being edited (for thisEvent and futureEvents)
  selectedAsset?: AssetBase; // Schedule Specific Asset Maintenance
}
