export interface UtilizationRow {
  userId: string;
  name: string;
  email: string;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  completionRate: number;
}
