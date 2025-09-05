import api from './api';

class TaskService {
  // Listar tasks de um objetivo
  async getTasks(planId: string, weekId: string, goalId: string) {
    try {
      const response = await api.get(`/tasks/plans/${planId}/weeks/${weekId}/goals/${goalId}`);
      if (response.data.success) {
        return { success: true, data: response.data.data.tasks || [] };
      }
      return { success: false, message: response.data.message };
    } catch (error: unknown) {
      return { success: false, error: this.handleError(error) };
    }
  }

  // Obter uma task específica
  async getTask(planId: string, weekId: string, goalId: string, taskId: string) {
    try {
      const response = await api.get(`/tasks/plans/${planId}/weeks/${weekId}/goals/${goalId}/${taskId}`);
      if (response.data.success) {
        return { success: true, data: response.data.data.task };
      }
      return { success: false, message: response.data.message };
    } catch (error: unknown) {
      return { success: false, error: this.handleError(error) };
    }
  }

  // Criar nova task
  async createTask(planId: string, weekId: string, goalId: string, taskData: Record<string, unknown>) {
    try {
      const response = await api.post(`/tasks/plans/${planId}/weeks/${weekId}/goals/${goalId}`, taskData);
      if (response.data.success) {
        return { success: true, data: response.data.data.task };
      }
      return { success: false, message: response.data.message };
    } catch (error: unknown) {
      return { success: false, error: this.handleError(error) };
    }
  }

  // Atualizar task
  async updateTask(planId: string, weekId: string, goalId: string, taskId: string, taskData: Record<string, unknown>) {
    try {
      const response = await api.put(`/tasks/plans/${planId}/weeks/${weekId}/goals/${goalId}/${taskId}`, taskData);
      if (response.data.success) {
        return { success: true, data: response.data.data.task };
      }
      return { success: false, message: response.data.message };
    } catch (error: unknown) {
      return { success: false, error: this.handleError(error) };
    }
  }

  // Deletar task
  async deleteTask(planId: string, weekId: string, goalId: string, taskId: string) {
    try {
      const response = await api.delete(`/tasks/plans/${planId}/weeks/${weekId}/goals/${goalId}/${taskId}`);
      if (response.data.success) {
        return { success: true, message: response.data.message };
      }
      return { success: false, message: response.data.message };
    } catch (error: unknown) {
      return { success: false, error: this.handleError(error) };
    }
  }

  // Marcar task como completa
  async completeTask(planId: string, weekId: string, goalId: string, taskId: string) {
    try {
      const response = await api.put(`/tasks/plans/${planId}/weeks/${weekId}/goals/${goalId}/${taskId}/complete`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

  // Desmarcar task como completa
  async uncompleteTask(planId: string, weekId: string, goalId: string, taskId: string) {
    try {
      const response = await api.put(`/tasks/plans/${planId}/weeks/${weekId}/goals/${goalId}/${taskId}/uncomplete`);
      return response.data;
    } catch (error: unknown) {
      throw this.handleError(error);
    }
  }

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
          return new Error('Task não encontrada');
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
      return new Error('Erro desconhecido');
    }
  }
}

export const taskService = new TaskService();
