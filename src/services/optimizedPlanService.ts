import api from './api';

class OptimizedPlanService {
  // Cache local para evitar requisições desnecessárias
  static cache = new Map();
  static CACHE_DURATION = 5 * 60 * 1000; // 5 minutos para dados mais dinâmicos
  
  // Controle de concorrência para evitar múltiplas requisições simultâneas
  static pendingRequests = new Map();

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

  // Função para controlar requisições pendentes
  static async getOrCreateRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Se já existe uma requisição pendente para esta chave, aguardar ela
    if (this.pendingRequests.has(key)) {
      console.log(`⏳ OptimizedPlanService: Aguardando requisição pendente para ${key}`);
      return this.pendingRequests.get(key);
    }

    // Criar nova requisição
    const requestPromise = requestFn().finally(() => {
      // Remover da lista de pendentes quando terminar
      this.pendingRequests.delete(key);
    });

    // Adicionar à lista de pendentes
    this.pendingRequests.set(key, requestPromise);
    
    return requestPromise;
  }

  // Obter apenas planos básicos (sem semanas/objetivos) - MUITO RÁPIDO
  async getPlansBasic(page = 1, limit = 10) {
    const cacheKey = `plans_basic_${page}_${limit}`;
    
    return OptimizedPlanService.getOrCreateRequest(cacheKey, async () => {
      try {
        const cached = OptimizedPlanService.getFromCache(cacheKey);
        if (cached) {
          console.log('📦 getPlansBasic: Usando cache');
          return { success: true, data: cached.data, pagination: cached.pagination };
        }

        console.log('🚀 getPlansBasic: Carregando planos básicos...');
      
      // Tentar endpoint otimizado primeiro, se falhar usar fallback
      let response;
      try {
        console.log('🔄 getPlansBasic: Tentando endpoint /plans/basic...');
        response = await api.get(`/plans/basic?page=${page}&limit=${limit}`);
        console.log('✅ getPlansBasic: Endpoint otimizado funcionando:', {
          status: response.status,
          hasData: !!response.data,
          success: response.data?.success
        });
      } catch (basicError) {
        console.warn('⚠️ getPlansBasic: Endpoint /plans/basic falhou, usando fallback /plans:', basicError);
        // Fallback para endpoint que sabemos que funciona
        try {
          console.log('🔄 getPlansBasic: Tentando fallback /plans...');
          response = await api.get('/plans');
          console.log('✅ getPlansBasic: Fallback funcionando:', {
            status: response.status,
            hasData: !!response.data,
            success: response.data?.success
          });
        } catch (fallbackError) {
          console.error('❌ getPlansBasic: Fallback também falhou, usando dados mock:', fallbackError);
          // Se ambos os endpoints falharem, retornar dados mock para não quebrar a UI
          return {
            success: true,
            data: [{
              id: 'mock-plan-1',
              _id: 'mock-plan-1',
              title: 'Plano Demo',
              description: 'Plano de demonstração (API offline)',
              status: 'active',
              startDate: new Date().toISOString(),
              endDate: new Date(Date.now() + 12 * 7 * 24 * 60 * 60 * 1000).toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              totalGoals: 0,
              completedGoals: 0,
              totalTasks: 0,
              completedTasks: 0,
              weeks: []
            }],
            pagination: { page, limit, total: 1 }
          };
        }
      }
      
      if (response.data.success) {
        let plans, pagination;
        
        console.log('🔍 getPlansBasic: Processando resposta:', {
          hasData: !!response.data.data,
          dataType: typeof response.data.data,
          isArray: Array.isArray(response.data.data),
          dataKeys: response.data.data ? Object.keys(response.data.data) : 'no data'
        });
        
        // Verificar se é o endpoint otimizado ou fallback
        if (response.data.data && Array.isArray(response.data.data)) {
          // Endpoint otimizado retorna { data: plans, pagination }
          plans = response.data.data;
          pagination = response.data.pagination || { page, limit, total: plans.length };
          console.log('📊 getPlansBasic: Usando formato otimizado');
        } else {
          // Fallback retorna array direto
          plans = response.data.data || [];
          pagination = { page, limit, total: plans.length };
          console.log('📊 getPlansBasic: Usando formato fallback');
        }
        
        console.log('🔍 getPlansBasic: Dados processados:', {
          plansLength: plans.length,
          pagination: pagination,
          firstPlan: plans[0] ? { id: plans[0].id || plans[0]._id, title: plans[0].title, status: plans[0].status } : 'no plans'
        });
        
        const cacheData = { data: plans, pagination };
        OptimizedPlanService.setCache(cacheKey, cacheData);
        console.log('✅ getPlansBasic: Planos carregados:', plans.length);
        return { success: true, data: plans, pagination };
      } else {
        console.error('❌ getPlansBasic: Resposta não bem-sucedida:', {
          success: response.data.success,
          message: response.data.message,
          data: response.data.data
        });
        return { success: false, error: response.data.message || 'Erro ao carregar planos básicos' };
      }
      } catch (error) {
        console.error('❌ getPlansBasic: Erro:', error);
        return { success: false, error };
      }
    });
  }

  // Obter semanas de um plano específico - RÁPIDO
  async getPlanWeeks(planId: string) {
    try {
      const cacheKey = `plan_weeks_${planId}`;
      const cached = OptimizedPlanService.getFromCache(cacheKey);
      if (cached) {
        console.log(`📦 getPlanWeeks: Usando cache para plano ${planId}`);
        return { success: true, data: cached };
      }

      console.log(`🚀 getPlanWeeks: Carregando semanas do plano ${planId}...`);
      
      // Tentar endpoint otimizado primeiro, se falhar usar fallback
      let response;
      try {
        response = await api.get(`/plans/${planId}/weeks`);
        console.log('✅ getPlanWeeks: Endpoint otimizado funcionando');
      } catch (weeksError) {
        console.warn(`⚠️ getPlanWeeks: Endpoint /plans/${planId}/weeks falhou, usando fallback /plans/${planId}:`, weeksError);
        // Fallback para endpoint que sabemos que funciona
        response = await api.get(`/plans/${planId}`);
      }
      
      if (response.data.success) {
        let weeks;
        
        // Verificar se é o endpoint otimizado ou fallback
        if (response.data.data && Array.isArray(response.data.data)) {
          // Endpoint otimizado retorna array de semanas diretamente
          weeks = response.data.data;
        } else if (response.data.data && response.data.data.weeks) {
          // Endpoint retorna { plan: {...}, weeks: [...] }
          weeks = response.data.data.weeks || [];
        } else {
          weeks = [];
        }
        
        OptimizedPlanService.setCache(cacheKey, { weeks });
        console.log(`✅ getPlanWeeks: Semanas carregadas:`, weeks.length);
        return { success: true, data: { weeks } };
      }
      
      return { success: false, error: 'Erro ao carregar semanas' };
    } catch (error) {
      console.error(`❌ getPlanWeeks: Erro para plano ${planId}:`, error);
      return { success: false, error };
    }
  }

  // Obter objetivos de uma semana específica - RÁPIDO
  async getWeekGoals(planId: string, weekId: string) {
    try {
      const cacheKey = `week_goals_${planId}_${weekId}`;
      const cached = OptimizedPlanService.getFromCache(cacheKey);
      if (cached) {
        console.log(`📦 getWeekGoals: Usando cache para semana ${weekId}`);
        return { success: true, data: cached };
      }

      console.log(`🚀 getWeekGoals: Carregando objetivos da semana ${weekId}...`);
      const response = await api.get(`/goals/plans/${planId}/weeks/${weekId}`);
      
      if (response.data.success) {
        const goals = response.data.data;
        OptimizedPlanService.setCache(cacheKey, goals);
        console.log(`✅ getWeekGoals: Objetivos carregados:`, goals.length);
        return { success: true, data: goals };
      }
      
      return { success: false, error: 'Erro ao carregar objetivos' };
    } catch (error) {
      console.error(`❌ getWeekGoals: Erro para semana ${weekId}:`, error);
      return { success: false, error };
    }
  }

  // Obter dados completos de uma semana específica - OTIMIZADO
  async getWeekData(planId: string, weekNumber: number) {
    try {
      const cacheKey = `week_data_${planId}_${weekNumber}`;
      const cached = OptimizedPlanService.getFromCache(cacheKey);
      if (cached) {
        console.log(`📦 getWeekData: Usando cache para semana ${weekNumber}`);
        return { success: true, data: cached };
      }

      console.log(`🚀 getWeekData: Carregando dados da semana ${weekNumber}...`);
      
      // Fazer chamadas paralelas para otimizar
      const [weeksResponse, goalsResponse] = await Promise.all([
        this.getPlanWeeks(planId),
        api.get(`/goals/plans/${planId}/weeks/${weekNumber}`) // Endpoint otimizado
      ]);

      if (weeksResponse.success && goalsResponse.data.success) {
        const week = weeksResponse.data.find((w: { weekNumber: number }) => w.weekNumber === weekNumber);
        const goals = goalsResponse.data.data;
        
        const weekData = {
          week,
          goals,
          planId,
          weekNumber
        };

        OptimizedPlanService.setCache(cacheKey, weekData);
        console.log(`✅ getWeekData: Dados da semana ${weekNumber} carregados`);
        return { success: true, data: weekData };
      }
      
      return { success: false, error: 'Erro ao carregar dados da semana' };
    } catch (error) {
      console.error(`❌ getWeekData: Erro para semana ${weekNumber}:`, error);
      return { success: false, error };
    }
  }

  // Obter estatísticas gerais - OTIMIZADO
  async getStats() {
    try {
      const cacheKey = 'stats_general';
      const cached = OptimizedPlanService.getFromCache(cacheKey);
      if (cached) {
        console.log('📦 getStats: Usando cache');
        return { success: true, data: cached };
      }

      console.log('🚀 getStats: Carregando estatísticas...');
      const response = await api.get('/stats/general'); // Endpoint otimizado no backend
      
      if (response.data.success) {
        const stats = response.data.data;
        OptimizedPlanService.setCache(cacheKey, stats);
        console.log('✅ getStats: Estatísticas carregadas');
        return { success: true, data: stats };
      }
      
      return { success: false, error: 'Erro ao carregar estatísticas' };
    } catch (error) {
      console.error('❌ getStats: Erro:', error);
      return { success: false, error };
    }
  }
}

const optimizedPlanService = new OptimizedPlanService();
export default optimizedPlanService;
