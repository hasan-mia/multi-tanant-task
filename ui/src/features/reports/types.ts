export interface UtilizationRow {
  userId: string;
  name: string;
  email: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
}

export interface UtilizationSummary {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
}

export interface UtilizationResponse {
  data: UtilizationRow[];
  summary: UtilizationSummary;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
