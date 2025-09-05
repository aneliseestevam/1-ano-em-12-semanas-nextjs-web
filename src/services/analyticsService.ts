import api from './api';
import { PlanAnalytics, AnalyticsFilters } from '../types/dashboard';

export class AnalyticsService {
  async getPlanAnalytics(planId: string): Promise<{ success: boolean; data?: PlanAnalytics; message: string }> {
    try {
      const response = await api.get(`/analytics/plans/${planId}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Analytics carregados com sucesso'
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar estatísticas';
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  async getDashboardAnalytics(filters?: AnalyticsFilters): Promise<{ success: boolean; data?: Record<string, unknown>; message: string }> {
    try {
      const response = await api.get('/analytics/dashboard', { params: filters });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Estatísticas do dashboard carregadas com sucesso'
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar estatísticas do dashboard';
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // Adicionar método getDashboardStats para compatibilidade
  async getDashboardStats(): Promise<{ success: boolean; data?: Record<string, unknown>; message: string }> {
    return this.getDashboardAnalytics();
  }
}

export const analyticsService = new AnalyticsService();
