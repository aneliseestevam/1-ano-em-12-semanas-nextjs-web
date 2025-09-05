// Tipos baseados na estrutura real da API: Plans → Weeks → Goals → Tasks

export interface User {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  category: 'saude' | 'carreira' | 'financas' | 'relacionamentos' | 'hobbies' | 'outros';
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  targetDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  tasks: Task[]; // Array de tasks
}

export interface Week {
  id: string;
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  goals: Goal[];
  notes: string;
  completed: boolean;
}

export interface TwelveWeekPlan {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  weeks: Week[];
  createdAt: Date;
  updatedAt: Date;
  // Novos campos para histórico e analytics
  status: 'active' | 'completed' | 'archived';
  year: number; // Ano do plano (ex: 2024, 2025)
  tags: string[]; // Tags para categorização
  archivedAt?: Date; // Data de arquivamento
  completionRate: number; // Taxa de conclusão geral
  totalGoals: number;
  completedGoals: number;
  totalTasks: number;
  completedTasks: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

// Novos tipos para Analytics
export interface PlanAnalytics {
  planId: string;
  planTitle: string;
  year: number;
  startDate: Date;
  endDate: Date;
  completionRate: number;
  totalGoals: number;
  completedGoals: number;
  totalTasks: number;
  completedTasks: number;
  categoryBreakdown: CategoryAnalytics[];
  weeklyProgress: WeeklyProgress[];
  averageTasksPerGoal: number;
  averageGoalsPerWeek: number;
  mostProductiveWeek: number;
  leastProductiveWeek: number;
}

export interface CategoryAnalytics {
  category: string;
  totalGoals: number;
  completedGoals: number;
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
}

export interface WeeklyProgress {
  weekNumber: number;
  goalsCompleted: number;
  tasksCompleted: number;
  totalGoals: number;
  totalTasks: number;
  completionRate: number;
}

export interface YearlyComparison {
  year: number;
  totalPlans: number;
  averageCompletionRate: number;
  totalGoals: number;
  completedGoals: number;
  totalTasks: number;
  completedTasks: number;
  categoryPerformance: CategoryAnalytics[];
  monthlyProgress: MonthlyProgress[];
}

export interface MonthlyProgress {
  month: number;
  monthName: string;
  goalsCompleted: number;
  tasksCompleted: number;
  plansActive: number;
}

export interface AnalyticsFilters {
  startYear?: number;
  endYear?: number;
  categories?: string[];
  status?: 'active' | 'completed' | 'archived' | 'all';
  tags?: string[];
}

export interface DashboardStats {
  totalPlans: number;
  activePlans: number;
  completedPlans: number;
  archivedPlans: number;
  overallCompletionRate: number;
  totalGoals: number;
  completedGoals: number;
  totalTasks: number;
  completedTasks: number;
  currentYearStats: YearlyComparison;
  yearlyComparisons: YearlyComparison[];
  topCategories: CategoryAnalytics[];
  recentActivity: RecentActivity[];
}

export interface RecentActivity {
  id: string;
  type: 'goal_completed' | 'task_completed' | 'plan_created' | 'plan_archived';
  title: string;
  description: string;
  timestamp: Date;
  planId?: string;
  planTitle?: string;
}

// Tipos para requisições da API
export interface CreatePlanRequest {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  year: number;
  tags?: string[];
}

export interface UpdatePlanRequest {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: TwelveWeekPlan['status'];
  tags?: string[];
}

export interface CreateGoalRequest {
  title: string;
  description?: string;
  category: Goal['category'];
  priority: Goal['priority'];
  targetDate?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  category?: Goal['category'];
  priority?: Goal['priority'];
  targetDate?: string;
  completed?: boolean;
  completedAt?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: Task['priority'];
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: Task['priority'];
  completed?: boolean;
  completedAt?: string;
  dueDate?: string;
}

// Tipos para respostas da API
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export type PlansResponse = ApiResponse<TwelveWeekPlan[]>;
export type PlanResponse = ApiResponse<TwelveWeekPlan>;
export type WeeksResponse = ApiResponse<Week[]>;
export type WeekResponse = ApiResponse<Week>;
export type GoalsResponse = ApiResponse<Goal[]>;
export type GoalResponse = ApiResponse<Goal>;
export type TasksResponse = ApiResponse<Task[]>;
export type TaskResponse = ApiResponse<Task>;
export type DashboardStatsResponse = ApiResponse<DashboardStats>;
export type PlanAnalyticsResponse = ApiResponse<PlanAnalytics>;
