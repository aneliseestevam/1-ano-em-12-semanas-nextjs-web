import api from './api';

interface Goal {
  _id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'not-started' | 'in-progress' | 'completed';
  completed: boolean;
  targetDate: string;
  completedAt: string | null;
  tasks: Array<{
    title: string;
    description: string;
    completed: boolean;
    completedAt: string | null;
  }>;
  createdAt: string;
}

interface Week {
  _id: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  completed: boolean;
  progress: number;
  notes: string;
  goals: Goal[];
}

interface Plan {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'archived';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  weeks: Week[];
  stats?: {
    totalWeeks: number;
    completedWeeks: number;
    totalGoals: number;
    completedGoals: number;
    weekProgress: number;
    goalProgress: number;
  };
}

interface PlansWithGoalsResponse {
  success: boolean;
  data: {
    plans: Plan[];
  };
  message: string;
}

interface PlanWithGoalsResponse {
  success: boolean;
  data: {
    plan: Plan;
  };
  message: string;
}

class PlansWithGoalsService {
  // Cache local para evitar requisições desnecessárias
  private static cache = new Map();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  // Função para verificar cache
  private static getFromCache(key: string) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  // Função para salvar no cache
  private static setCache(key: string, data: unknown) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Função para limpar cache
  static clearCache() {
    this.cache.clear();
  }

  /**
   * Obter todos os planos com objetivos organizados por semana
   * Uma única requisição que substitui múltiplas chamadas
   */
  async getAllPlansWithGoals(): Promise<PlansWithGoalsResponse> {
    const cacheKey = 'all_plans_with_goals';
    
    try {
      // Verificar cache
      const cached = PlansWithGoalsService.getFromCache(cacheKey);
      if (cached) {
        console.log('📦 PlansWithGoalsService: Usando cache para todos os planos');
        return { success: true, data: { plans: cached }, message: 'Dados do cache' };
      }

      console.log('🚀 PlansWithGoalsService: Carregando todos os planos com objetivos...');
      
      const response = await api.get('/plans/with-goals');
      
      if (response.data.success) {
        const plans = response.data.data.plans;
        
        // Salvar no cache
        PlansWithGoalsService.setCache(cacheKey, plans);
        
        console.log(`✅ PlansWithGoalsService: ${plans.length} planos carregados com sucesso`);
        return {
          success: true,
          data: { plans },
          message: response.data.message || 'Planos carregados com sucesso'
        };
      } else {
        console.error('❌ PlansWithGoalsService: Resposta não bem-sucedida:', response.data);
        return {
          success: false,
          data: { plans: [] },
          message: response.data.message || 'Erro ao carregar planos'
        };
      }
    } catch (error) {
      console.error('❌ PlansWithGoalsService: Erro ao carregar planos:', error);
      return {
        success: false,
        data: { plans: [] },
        message: error instanceof Error ? error.message : 'Erro ao carregar planos'
      };
    }
  }

  /**
   * Obter um plano específico com objetivos organizados por semana
   */
  async getPlanWithGoals(planId: string): Promise<PlanWithGoalsResponse> {
    const cacheKey = `plan_with_goals_${planId}`;
    
    try {
      // Verificar cache
      const cached = PlansWithGoalsService.getFromCache(cacheKey);
      if (cached) {
        console.log(`📦 PlansWithGoalsService: Usando cache para plano ${planId}`);
        return { success: true, data: { plan: cached }, message: 'Dados do cache' };
      }

      console.log(`🚀 PlansWithGoalsService: Carregando plano ${planId} com objetivos...`);
      
      const response = await api.get(`/plans/${planId}/with-goals`);
      
      if (response.data.success) {
        const plan = response.data.data.plan;
        
        // Salvar no cache
        PlansWithGoalsService.setCache(cacheKey, plan);
        
        console.log(`✅ PlansWithGoalsService: Plano ${planId} carregado com sucesso`);
        return {
          success: true,
          data: { plan },
          message: response.data.message || 'Plano carregado com sucesso'
        };
      } else {
        console.error(`❌ PlansWithGoalsService: Resposta não bem-sucedida para plano ${planId}:`, response.data);
        return {
          success: false,
          data: { plan: null as any },
          message: response.data.message || 'Erro ao carregar plano'
        };
      }
    } catch (error) {
      console.error(`❌ PlansWithGoalsService: Erro ao carregar plano ${planId}:`, error);
      return {
        success: false,
        data: { plan: null as any },
        message: error instanceof Error ? error.message : 'Erro ao carregar plano'
      };
    }
  }

  /**
   * Obter planos ativos com objetivos (para dashboard)
   */
  async getActivePlansWithGoals(): Promise<PlansWithGoalsResponse> {
    try {
      const allPlansResponse = await this.getAllPlansWithGoals();
      
      if (allPlansResponse.success) {
        const activePlans = allPlansResponse.data.plans.filter(plan => 
          plan.status === 'active' && plan.isActive
        );
        
        console.log(`✅ PlansWithGoalsService: ${activePlans.length} planos ativos encontrados`);
        
        return {
          success: true,
          data: { plans: activePlans },
          message: `${activePlans.length} planos ativos carregados`
        };
      }
      
      return allPlansResponse;
    } catch (error) {
      console.error('❌ PlansWithGoalsService: Erro ao carregar planos ativos:', error);
      return {
        success: false,
        data: { plans: [] },
        message: error instanceof Error ? error.message : 'Erro ao carregar planos ativos'
      };
    }
  }
}

const plansWithGoalsService = new PlansWithGoalsService();
export default plansWithGoalsService;
