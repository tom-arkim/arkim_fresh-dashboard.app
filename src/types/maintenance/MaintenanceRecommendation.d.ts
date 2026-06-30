export interface RecommendationsForAssetsRequest {
  assetModelIdToAssetIds: Record<string, string[]>;
}

export interface MaintenanceRecommendationBase {
  title?: string;
  description?: string;
  rRule?: string;
  [key: string]: unknown;
}

export interface MaintenanceRecommendation extends MaintenanceRecommendationBase {
  id: string;
  createdBy: string;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export type RecommendationsForAssetsResponse = Record<
  string,
  MaintenanceRecommendation[]
>;

export interface RecommendationImportItem {
  recommendationId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string | null;
  assignedUserEmails: string[];
}

export interface BatchCreateTasksFromRecommendationsRequest {
  assetIdToItems: Record<string, RecommendationImportItem[]>;
}
