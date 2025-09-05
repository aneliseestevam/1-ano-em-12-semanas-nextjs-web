import api from './api';

class PlanService {
  // Cache local para evitar requisições desnecessárias
  static cache = new Map();
  static CACHE_DURATION = 15 * 60 * 1000; // 15 minutos (aumentado para melhor performance)

  // Função para verificar cache
  static getFromCache(key: string) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  // Função para salvar no cache
  static setCache(key: string, data: unknown) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Função para limpar cache
  static clearCache() {
    this.cache.clear();
  }

  // Obter todos os planos do usuário - ULTRA OTIMIZADO PARA DASHBOARD
  async getPlans() {
    try {
      console.log('🚀 getPlans: Iniciando carregamento ULTRA otimizado para dashboard');
      
      // Verificar cache
      const cachedPlans = PlanService.getFromCache('all_plans');
      if (cachedPlans) {
        console.log('📦 getPlans: Usando cache');
        return { success: true, data: cachedPlans };
      }

      // Buscar apenas planos básicos primeiro (sem detalhes)
      const response = await api.get('/plans');
      const plans = response.data.success ? response.data.data.plans : [];
      
      if (plans.length === 0) {
        console.log('📭 getPlans: Nenhum plano encontrado');
        return { success: true, data: [] };
      }

      console.log(`📋 getPlans: ${plans.length} planos encontrados, carregando dados essenciais...`);
      console.log('🔍 getPlans: Primeiro plano (exemplo):', {
        title: plans[0]?.title,
        totalGoals: plans[0]?.totalGoals,
        completedGoals: plans[0]?.completedGoals,
        totalTasks: plans[0]?.totalTasks,
        completedTasks: plans[0]?.completedTasks,
        status: plans[0]?.status
      });
      
      // Para o dashboard, carregar apenas dados básicos dos planos (SEM buscar estatísticas individuais)
      const plansWithBasicInfo = plans.map((plan: Record<string, unknown>) => ({
        ...plan,
        id: plan._id || plan.id,
        weeks: [], // Inicialmente vazio, será carregado sob demanda
        // Dados básicos que já vêm do endpoint /plans
        title: plan.title,
        description: plan.description,
        status: plan.status || 'draft',
        startDate: plan.startDate,
        endDate: plan.endDate,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
        year: plan.year || new Date((plan.startDate as string) || new Date()).getFullYear(),
        tags: plan.tags || [],
        completionRate: plan.completionRate || 0,
        totalGoals: plan.totalGoals || 0,
        completedGoals: plan.completedGoals || 0,
        totalTasks: plan.totalTasks || 0,
        completedTasks: plan.completedTasks || 0
      }));

      // Salvar no cache
      PlanService.setCache('all_plans', plansWithBasicInfo);
      console.log(`✅ getPlans: ${plansWithBasicInfo.length} planos carregados com sucesso (dados básicos)`);
      
      return { success: true, data: plansWithBasicInfo };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('❌ getPlans: Erro ao carregar planos:', errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Obter plano específico com detalhes completos (para páginas de detalhes)
  async getPlan(planId: string) {
    try {
      console.log(`🚀 getPlan: Carregando plano ${planId} com detalhes completos`);
      
      // Verificar cache
      const cacheKey = `plan_${planId}`;
      const cachedPlan = PlanService.getFromCache(cacheKey);
      if (cachedPlan) {
        console.log(`📦 getPlan: Usando cache para plano ${planId}`);
        return { success: true, data: cachedPlan };
      }

      // Buscar plano com semanas
      const planResponse = await api.get(`/plans/${planId}`);
      if (!planResponse.data.success) {
        return { success: false, error: 'Plano não encontrado' };
      }

      const planData = planResponse.data.data.plan;
      const weeks = planResponse.data.data.weeks || [];
      
      if (weeks.length === 0) {
        const basicPlan = {
          ...planData,
          id: planData._id || planData.id,
          weeks: []
        };
        PlanService.setCache(cacheKey, basicPlan);
        return { success: true, data: basicPlan };
      }

      // Carregar objetivos para cada semana (com timeout otimizado)
      const weeksWithGoals = await Promise.all(
        weeks.map(async (week: Record<string, unknown>) => {
          try {
            const goalsResponse = await Promise.race([
              api.get(`/goals/plans/${planId}/weeks/${week._id}`),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 3000) // Timeout reduzido para 3s
              )
            ]);
            
            const goals = (goalsResponse as { data: { success: boolean; data: { goals: unknown[] } } }).data.success ? (goalsResponse as { data: { success: boolean; data: { goals: unknown[] } } }).data.data.goals || [] : [];
            
            if (goals.length === 0) {
              return { ...week, goals: [] };
            }

            // Para páginas de detalhes, carregar tasks básicas (apenas contagem e status)
            const goalsWithTasks = (goals as Record<string, unknown>[]).map((goal: Record<string, unknown>) => ({
              ...goal,
              id: goal._id || goal.id,
              tasks: goal.tasks ? (goal.tasks as Record<string, unknown>[]).map((task: Record<string, unknown>) => ({
                id: task._id || task.id,
                title: task.title,
                description: task.description,
                completed: task.completed,
                dueDate: task.dueDate,
                createdAt: task.createdAt,
                updatedAt: task.updatedAt,
                completedAt: task.completedAt
              })) : []
            }));
            
            return {
              ...week,
              id: week._id || week.id,
              goals: goalsWithTasks
            };
          } catch (goalsError: unknown) {
            const errorMessage = goalsError instanceof Error ? goalsError.message : 'Erro desconhecido';
            console.warn(`⚠️ Erro ao buscar objetivos da semana ${week._id}:`, errorMessage);
            return { ...week, goals: [] };
          }
        })
      );

      const completePlan = {
        ...planData,
        id: planData._id || planData.id,
        weeks: weeksWithGoals
      };

      // Salvar no cache
      PlanService.setCache(cacheKey, completePlan);
      console.log(`✅ getPlan: Plano ${planId} carregado com sucesso (${weeksWithGoals.length} semanas)`);
      
      return { success: true, data: completePlan };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`❌ getPlan: Erro ao carregar plano ${planId}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Obter dados básicos de um plano (para dashboard)
  async getPlanBasic(planId: string) {
    try {
      const cacheKey = `plan_basic_${planId}`;
      const cachedPlan = PlanService.getFromCache(cacheKey);
      if (cachedPlan) {
        return { success: true, data: cachedPlan };
      }

      const response = await api.get(`/plans/${planId}`);
      if (!response.data.success) {
        return { success: false, error: 'Plano não encontrado' };
      }

      const planData = response.data.data.plan;
      const basicPlan = {
        ...planData,
        id: planData._id || planData.id,
        weeks: [] // Sem detalhes para dashboard
      };

      PlanService.setCache(cacheKey, basicPlan);
      return { success: true, data: basicPlan };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }

  // Criar novo plano
  async createPlan(planData: Record<string, unknown>) {
    try {
      const response = await api.post('/plans', planData);
      
      if (response.data.success) {
        // Limpar cache de planos
        PlanService.cache.delete('all_plans');
        return { success: true, data: response.data.data.plan };
      } else {
        return { success: false, error: response.data.message || 'Erro ao criar plano' };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }

  // Atualizar plano
  async updatePlan(planId: string, updateData: Record<string, unknown>) {
    try {
      const response = await api.put(`/plans/${planId}`, updateData);
      
      if (response.data.success) {
        // Limpar caches relacionados
        PlanService.cache.delete('all_plans');
        PlanService.cache.delete(`plan_${planId}`);
        PlanService.cache.delete(`plan_basic_${planId}`);
        
        return { success: true, data: response.data.data.plan };
      } else {
        return { success: false, error: response.data.message || 'Erro ao atualizar plano' };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }

  // Deletar plano
  async deletePlan(planId: string) {
    try {
      const response = await api.delete(`/plans/${planId}`);
      
      if (response.data.success) {
        // Limpar caches relacionados
        PlanService.cache.delete('all_plans');
        PlanService.cache.delete(`plan_${planId}`);
        PlanService.cache.delete(`plan_basic_${planId}`);
        
        return { success: true, message: 'Plano deletado com sucesso' };
      } else {
        return { success: false, error: response.data.message || 'Erro ao deletar plano' };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }

  // Buscar planos por status (otimizado)
  async getPlansByStatus(status: string) {
    try {
      const cacheKey = `plans_status_${status}`;
      const cachedPlans = PlanService.getFromCache(cacheKey);
      if (cachedPlans) {
        return { success: true, data: cachedPlans };
      }

      const response = await api.get(`/plans?status=${status}`);
      const plans = response.data.success ? response.data.data.plans : [];
      
      const basicPlans = plans.map((plan: Record<string, unknown>) => ({
        ...plan,
        id: plan._id || plan.id,
        weeks: []
      }));

      PlanService.setCache(cacheKey, basicPlans);
      return { success: true, data: basicPlans };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }

  // Buscar planos por ano (otimizado)
  async getPlansByYear(year: number) {
    try {
      const cacheKey = `plans_year_${year}`;
      const cachedPlans = PlanService.getFromCache(cacheKey);
      if (cachedPlans) {
        return { success: true, data: cachedPlans };
      }

      const response = await api.get(`/plans?year=${year}`);
      const plans = response.data.success ? response.data.data.plans : [];
      
      const basicPlans = plans.map((plan: Record<string, unknown>) => ({
        ...plan,
        id: plan._id || plan.id,
        weeks: []
      }));

      PlanService.setCache(cacheKey, basicPlans);
      return { success: true, data: basicPlans };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }

  // Buscar estatísticas de todos os planos (para dashboard)
  async getAllPlansStats() {
    try {
      const cacheKey = 'all_plans_stats';
      const cachedStats = PlanService.getFromCache(cacheKey);
      if (cachedStats) {
        console.log('📦 getAllPlansStats: Usando cache');
        return { success: true, data: cachedStats };
      }

      console.log('🚀 getAllPlansStats: Buscando estatísticas da API...');
      const response = await api.get('/plans/stats');
      
      if (response.data.success) {
        const stats = response.data.data;
        PlanService.setCache(cacheKey, stats);
        console.log('✅ getAllPlansStats: Estatísticas carregadas da API:', {
          overview: stats.overview,
          summary: stats.summary,
          totalPlans: stats.overview?.plans?.totalPlans || 0,
          activePlans: stats.overview?.plans?.activePlans || 0,
          totalGoals: stats.overview?.goals?.totalGoals || 0,
          completedGoals: stats.overview?.goals?.completedGoals || 0
        });
        return { success: true, data: stats };
      } else {
        console.warn('⚠️ getAllPlansStats: API retornou erro:', response.data.message);
        return { success: false, error: response.data.message || 'Erro ao buscar estatísticas' };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`❌ getAllPlansStats: Erro ao buscar estatísticas:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Buscar estatísticas de um plano
  async getPlanStats(planId: string) {
    try {
      const cacheKey = `plan_stats_${planId}`;
      const cachedStats = PlanService.getFromCache(cacheKey);
      if (cachedStats) {
        return { success: true, data: cachedStats };
      }

      const response = await api.get(`/plans/${planId}/stats`);
      
      if (response.data.success) {
        const stats = response.data.data;
        PlanService.setCache(cacheKey, stats);
        return { success: true, data: stats };
      } else {
        return { success: false, error: response.data.message || 'Erro ao buscar estatísticas' };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`❌ getPlanStats: Erro ao buscar estatísticas do plano ${planId}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  // Ativar plano (mudar de rascunho para ativo)
  async activatePlan(planId: string) {
    try {
      console.log(`🚀 activatePlan: Ativando plano ${planId}`);
      
      const response = await api.post(`/plans/${planId}/activate`);
      
      if (response.data.success) {
        // Limpar caches relacionados
        PlanService.cache.delete('all_plans');
        PlanService.cache.delete(`plan_${planId}`);
        PlanService.cache.delete(`plan_basic_${planId}`);
        PlanService.cache.delete(`plan_stats_${planId}`);
        
        console.log(`✅ activatePlan: Plano ${planId} ativado com sucesso`);
        return { success: true, data: response.data.data.plan };
      } else {
        return { success: false, error: response.data.message || 'Erro ao ativar plano' };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`❌ activatePlan: Erro ao ativar plano ${planId}:`, errorMessage);
      return { success: false, error: errorMessage };
    }
  }
}

export const planService = new PlanService();
export default planService;
