import api from './api';
import { TwelveWeekPlan, DashboardStats, PlanAnalytics } from '../types/dashboard';

class DashboardService {
  // Obter todos os planos
  async getPlans(): Promise<{ success: boolean; data?: TwelveWeekPlan[]; message: string }> {
    try {
      console.log('🔍 DashboardService: Fazendo chamada para /plans');
      const response = await api.get('/plans');
      console.log('🔍 DashboardService: Resposta da API /plans:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Planos carregados com sucesso'
        };
      } else {
        console.warn('⚠️ DashboardService: Resposta inesperada da API /plans:', response.data);
        return {
          success: false,
          message: response.data.message || 'Formato de resposta inesperado'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar planos';
      console.error('❌ DashboardService: Erro ao buscar planos:', error);
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // Obter um plano específico
  async getPlan(planId: string): Promise<{ success: boolean; data?: TwelveWeekPlan; message: string }> {
    try {
      const response = await api.get(`/plans/${planId}`);
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Plano carregado com sucesso'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Erro ao carregar plano'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar plano';
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // Criar novo plano
  async createPlan(planData: Record<string, unknown>): Promise<{ success: boolean; data?: TwelveWeekPlan; message: string }> {
    try {
      const response = await api.post('/plans', planData);
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Plano criado com sucesso'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Erro ao criar plano'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar plano';
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // Atualizar plano
  async updatePlan(planId: string, updates: Record<string, unknown>): Promise<{ success: boolean; data?: TwelveWeekPlan; message: string }> {
    try {
      const response = await api.put(`/plans/${planId}`, updates);
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Plano atualizado com sucesso'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Erro ao atualizar plano'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar plano';
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // Deletar plano
  async deletePlan(planId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete(`/plans/${planId}`);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Plano deletado com sucesso'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Erro ao deletar plano'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar plano';
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // Obter estatísticas do dashboard
  async getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; message: string }> {
    try {
      console.log('🔍 DashboardService: Fazendo chamada para /analytics/dashboard');
      const response = await api.get('/analytics/dashboard');
      console.log('🔍 DashboardService: Resposta da API /analytics/dashboard:', response.data);
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Estatísticas carregadas com sucesso'
        };
      } else {
        console.warn('⚠️ DashboardService: Resposta inesperada da API /analytics/dashboard:', response.data);
        return {
          success: false,
          message: response.data.message || 'Formato de resposta inesperado'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar estatísticas';
      console.error('❌ DashboardService: Erro ao buscar estatísticas:', error);
      return {
        success: false,
        message: errorMessage
      };
    }
  }

  // Obter analytics de um plano específico
  async getPlanAnalytics(planId: string): Promise<{ success: boolean; data?: PlanAnalytics; message: string }> {
    try {
      const response = await api.get(`/analytics/plans/${planId}`);
      
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || 'Analytics carregados com sucesso'
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Erro ao carregar analytics'
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar analytics';
      return {
        success: false,
        message: errorMessage
      };
    }
  }
}

export const dashboardService = new DashboardService();
