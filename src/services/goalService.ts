import api from './api';

const goalService = {
  // Listar objetivos de uma semana
  async getGoals(planId: string, weekId: string) {
    try {
      const response = await api.get(`/goals/plans/${planId}/weeks/${weekId}`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  },

  // Obter objetivo específico
  async getGoal(planId: string, weekId: string, goalId: string) {
    try {
      const response = await api.get(`/goals/plans/${planId}/weeks/${weekId}/${goalId}`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  },

  // Criar novo objetivo
  async createGoal(planId: string, weekId: string, goalData: Record<string, unknown>) {
    try {
      const response = await api.post(`/goals/plans/${planId}/weeks/${weekId}`, goalData);
      // A API retorna { success: true, data: { goal: {...} } }
      if (response.data.success) {
        return { success: true, data: response.data.data.goal };
      }
      return { success: false, message: response.data.message };
    } catch (error: unknown) {
      return { success: false, error: this.handleError(error) };
    }
  },

  // Atualizar objetivo
  async updateGoal(planId: string, weekId: string, goalId: string, goalData: Record<string, unknown>) {
    try {
      console.log('🔄 goalService.updateGoal: Enviando requisição:', {
        planId,
        weekId,
        goalId,
        goalData
      });
      
      const response = await api.put(`/goals/plans/${planId}/weeks/${weekId}/${goalId}`, goalData);
      
      console.log('📊 goalService.updateGoal: Resposta da API:', response.data);
      console.log('📊 goalService.updateGoal: Estrutura da resposta:', {
        hasData: !!response.data.data,
        hasGoal: !!response.data.data?.goal,
        goalCompleted: response.data.data?.goal?.completed,
        fullResponse: response.data
      });
      
      // A API retorna { success: true, data: { goal: {...} } }
      if (response.data.success) {
        const goalData = response.data.data.goal;
        console.log('📊 goalService.updateGoal: Goal retornado:', goalData);
        return { success: true, data: goalData };
      }
      return { success: false, message: response.data.message };
    } catch (error: unknown) {
      console.error('❌ goalService.updateGoal: Erro:', error);
      return { success: false, error: this.handleError(error) };
    }
  },

  // Deletar objetivo
  async deleteGoal(planId: string, weekId: string, goalId: string) {
    try {
      const response = await api.delete(`/goals/plans/${planId}/weeks/${weekId}/${goalId}`);
      // A API retorna { success: true, message: "Objetivo deletado com sucesso" }
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error: unknown) {
      return { success: false, error: this.handleError(error) };
    }
  },

  // Marcar objetivo como completo
  async completeGoal(planId: string, weekId: string, goalId: string) {
    try {
      const response = await api.put(`/goals/plans/${planId}/weeks/${weekId}/${goalId}/complete`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  },

  // Desmarcar objetivo como completo
  async uncompleteGoal(planId: string, weekId: string, goalId: string) {
    try {
      const response = await api.put(`/goals/plans/${planId}/weeks/${weekId}/${goalId}/uncomplete`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  },

  // Listar todos os objetivos do usuário
  async getAllGoals() {
    try {
      const response = await api.get('/goals');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  },

  // Tratar erros da API
  handleError(error: unknown) {
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error as { response: { status: number; data: { message?: string } } };
      const { status, data } = apiError.response;
      
      switch (status) {
        case 400:
          return new Error(data?.message || 'Dados inválidos');
        case 401:
          return new Error('Não autorizado');
        case 403:
          return new Error('Acesso negado');
        case 404:
          return new Error('Objetivo não encontrado');
        case 429:
          return new Error('Muitas requisições. Tente novamente em alguns minutos.');
        case 500:
          return new Error('Erro interno do servidor');
        default:
          return new Error(data?.message || 'Erro desconhecido');
      }
    } else if (error && typeof error === 'object' && 'request' in error) {
      return new Error('Erro de conexão. Verifique sua internet.');
    } else if (error instanceof Error) {
      return error;
    } else {
      return new Error('Erro inesperado');
    }
  }
};

export { goalService };
