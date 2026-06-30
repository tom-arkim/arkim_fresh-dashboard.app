import { WorkOrderStatus } from '@/config/enum';
import { apiClientCore as apiClient } from './apiClient';
import {
  WorkOrder,
  WorkOrderNew,
  ResolvedWorkOrderRequest,
  PatchWorkOrderRequest,
  WorkLogBase,
  CancelWorkOrderRequest,
  WorkOrderAttachment,
} from '@/types/maintenance/WorkOrder';

const workOrderService = {
  // List all work orders per site or asset with optional filters
  list: async (
    siteId?: string,
    assetId?: string,
    status?: WorkOrderStatus,
    startDate?: string,
    endDate?: string
  ): Promise<WorkOrder[]> => {
    const response = await apiClient.get<WorkOrder[]>(
      `/work-orders/list/all`, {
      params: {
        siteId,
        assetId,
        status,
        startDate,
        endDate,
      },
    }
    );
    return response.data;
  },

  // Get full work order details
  getById: async (workOrderId: string): Promise<WorkOrder> => {
    const response = await apiClient.get<WorkOrder>(
      `/work-orders/${encodeURIComponent(workOrderId)}`
    );
    return response.data;
  },

  // Create new work order
  create: async (workOrder: WorkOrderNew): Promise<WorkOrder> => {
    const response = await apiClient.post<WorkOrder>('/work-orders', workOrder);
    return response.data;
  },

  // Create resolved work order (log event)
  createResolved: async (
    request: ResolvedWorkOrderRequest
  ): Promise<WorkOrder> => {
    const response = await apiClient.post<WorkOrder>(
      '/work-orders/resolved',
      request
    );
    return response.data;
  },

  // Update work order fields
  update: async (
    workOrderId: string,
    updates: PatchWorkOrderRequest
  ): Promise<WorkOrder> => {
    const response = await apiClient.patch<WorkOrder>(
      `/work-orders/${encodeURIComponent(workOrderId)}`,
      updates
    );
    return response.data;
  },

  // Resolve work order
  resolve: async (
    workOrderId: string,
    resolution?: WorkLogBase
  ): Promise<WorkOrder> => {
    const response = await apiClient.post<WorkOrder>(
      `/work-orders/${encodeURIComponent(workOrderId)}/resolve`,
      resolution
    );
    return response.data;
  },

  // Add work log entry to work order
  addWorkLog: async (
    workOrderId: string,
    workLog: WorkLogBase
  ): Promise<WorkOrder> => {
    const response = await apiClient.post<WorkOrder>(
      `/work-orders/${encodeURIComponent(workOrderId)}/work-log`,
      workLog
    );
    return response.data;
  },

  // Cancel work order with comments
  cancel: async (
    workOrderId: string,
    request: CancelWorkOrderRequest
  ): Promise<WorkOrder> => {
    const response = await apiClient.post<WorkOrder>(
      `/work-orders/${encodeURIComponent(workOrderId)}/cancel`,
      request
    );
    return response.data;
  },

  // Upload a photo attachment
  uploadAttachment: async (workOrderId: string, file: File): Promise<WorkOrderAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<WorkOrderAttachment>(
      `/work-orders/${encodeURIComponent(workOrderId)}/attachments`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  // Delete a photo attachment
  deleteAttachment: async (workOrderId: string, attachmentId: string): Promise<void> => {
    await apiClient.delete(
      `/work-orders/${encodeURIComponent(workOrderId)}/attachments/${encodeURIComponent(attachmentId)}`
    );
  },
};

export default workOrderService;
