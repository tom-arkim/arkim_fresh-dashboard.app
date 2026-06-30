import { apiClientCore as apiClient } from './apiClient';
import {
  MaintenanceTask,
  MaintenanceTaskNew,
  MaintenanceTaskDetails,
  TaskOccurrence,
} from '@/types/maintenance/MaintenanceTask';
import type { BatchCreateTasksFromRecommendationsRequest } from '@/types/maintenance/MaintenanceRecommendation';
import { WorkOrder } from '@/types/maintenance/WorkOrder';

const maintenanceTaskService = {
  // Create a new maintenance task
  create: async (task: MaintenanceTaskNew): Promise<MaintenanceTaskDetails> => {
    const response = await apiClient.post<MaintenanceTaskDetails>(
      '/maintenance-tasks',
      task
    );
    return response.data;
  },

  // Update maintenance task fields
  update: async (
    taskId: string,
    updates: MaintenanceTaskNew
  ): Promise<MaintenanceTaskDetails> => {
    const response = await apiClient.patch<MaintenanceTaskDetails>(
      `/maintenance-tasks/${encodeURIComponent(taskId)}`,
      updates
    );
    return response.data;
  },

  // Delete maintenance task
  delete: async (taskId: string): Promise<void> => {
    await apiClient.delete(`/maintenance-tasks/${encodeURIComponent(taskId)}`);
  },

  // List all tasks for a site/asset
  list: async (
    siteId?: string,
    assetId?: string
  ): Promise<MaintenanceTask[]> => {
    const response = await apiClient.get<MaintenanceTask[]>(
      `/maintenance-tasks/list`, {
      params: {
        siteId,
        assetId,
      },
    }
    );
    return response.data;
  },

  // List occurrences for tasks in date range
  listOccurrences: async (
    startDate: string,
    endDate: string,
    siteId?: string,
    assetId?: string,
    taskId?: string
  ): Promise<TaskOccurrence[]> => {
    const response = await apiClient.get<TaskOccurrence[]>(
      `/maintenance-tasks/occurrences`, {
      params: {
        startDate,
        endDate,
        siteId,
        assetId,
        taskId,
      },
    }
    );
    return response.data;
  },

  // Get a single maintenance task
  getById: async (taskId: string): Promise<MaintenanceTaskDetails> => {
    const response = await apiClient.get<MaintenanceTaskDetails>(
      `/maintenance-tasks/${encodeURIComponent(taskId)}`
    );
    return response.data;
  },

  // Activate/Deactivate a maintenance task
  activate: async (taskId: string, active: boolean = true): Promise<void> => {
    const params = new URLSearchParams();
    params.append('active', String(active));

    await apiClient.post(
      `/maintenance-tasks/${encodeURIComponent(taskId)}/activate?${params.toString()}`
    );
  },

  // Convert task occurrence to work order
  convertToWorkOrder: async (
    taskId: string,
    occurrenceDate: string
  ): Promise<WorkOrder> => {
    const params = new URLSearchParams();
    params.append('occurrenceDate', occurrenceDate);

    const response = await apiClient.post<WorkOrder>(
      `/maintenance-tasks/${encodeURIComponent(taskId)}/convert-to-work-order?${params.toString()}`
    );
    return response.data;
  },

  // Create maintenance tasks from recommendation batch
  createFromRecommendationBatch: async (
    body: BatchCreateTasksFromRecommendationsRequest
  ): Promise<MaintenanceTaskDetails[]> => {
    const response = await apiClient.post<MaintenanceTaskDetails[]>(
      '/maintenance-tasks/from-recommendation',
      body
    );
    return response.data;
  },
};

export default maintenanceTaskService;
