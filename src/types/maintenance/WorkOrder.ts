import { WorkLogOutcome, WorkOrderSourceType, WorkOrderStatus } from "@/config/enum";

export interface MaintenancePart {
  manufacturer?: string;
  model?: string;
  partNumber?: string;
  quantity?: number;
  comments?: string;
}

export interface WorkLogBase {
  troubleshootingSteps?: string;
  parts?: MaintenancePart[];
  outcome?: WorkLogOutcome;
  comments?: string;
}

export interface WorkLogDetails extends WorkLogBase {
  performedBy?: string;
  performedAtUtc?: string; // ISO date-time string
}

export interface WorkOrderNew {
  assetId: string;
  dueDate: string; // ISO date string (YYYY-MM-DD)
  title: string;
  description: string;
  assignedUserEmails?: string[];
}

export interface WorkOrderBase extends WorkOrderNew {
  // Composite primary key fields
  companyId: string;
  id: string;

  // GSIs: site_id+due_date, asset_id+due_date
  siteId: string;
  dueDate: string; // ISO date string (YYYY-MM-DD)

  // WO details
  createdAtUtc?: string; // ISO date-time string
  createdBy?: string;
  assetName: string;
  status: WorkOrderStatus;
}

export interface WorkOrder extends WorkOrderBase {
  // Source details
  sourceType: WorkOrderSourceType;
  sourceTaskId?: string;

  // Chat interaction fields
  threadId?: string;
  threadOpenedBy?: string;
  threadOpenedAtUtc?: string; // ISO date-time string

  // Cancelled/Archived fields
  cancelledBy?: string;
  cancelledAtUtc?: string; // ISO date-time string
  cancellationReason?: string;

  isArchived: boolean;
  archivedAtUtc?: string; // ISO date-time string
  archivedBy?: string;

  // Work Log
  workLogs?: WorkLogDetails[];
  downtimeMinutes?: number;

  // Attachments
  attachments?: WorkOrderAttachment[];
}

export interface PatchWorkOrderRequest {
  title?: string;
  description?: string;
  dueDate?: string; // ISO date string (YYYY-MM-DD)
  assignedUserEmails?: string[];
}

export interface ResolvedWorkOrderRequest {
  workOrder: WorkOrderNew;
  resolution: WorkLogBase;
}

export interface OpenThreadRequest {
  threadId: string;
}

export interface CancelWorkOrderRequest {
  comments: string;
}

export interface ArchiveWorkOrdersRequest {
  archived: boolean;
}

export interface WorkOrderAttachment {
  attachmentId: string;
  url: string;
  fileName?: string;
  contentType?: string;
  uploadedBy?: string;
  uploadedAtUtc?: string;
}
