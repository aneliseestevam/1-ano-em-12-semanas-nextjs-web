import { useState, useCallback, useRef } from 'react';
import { TwelveWeekPlan, Week } from '../types/dashboard';
import { planService } from '../services/planService';

// Cache local para evitar requisições desnecessárias
const plansCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

// Função para converter strings de data em objetos Date
const convertDatesInPlan = (plan: Record<string, unknown>): TwelveWeekPlan => {
  if (!plan) {
    console.warn('⚠️ convertDatesInPlan: plan é undefined ou null');
    return {
      id: '',
      title: '',
      description: '',
      startDate: new Date(),
      endDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      year: new Date().getFullYear(),
      tags: [],
      completionRate: 0,
      totalGoals: 0,
      completedGoals: 0,
      totalTasks: 0,
      completedTasks: 0,
      weeks: []
    };
  }

  return {
    ...plan,
    id: String(plan._id || plan.id || ''),
    title: (plan.title as string) || '',
    description: (plan.description as string) || '',
    startDate: plan.startDate ? new Date(plan.startDate as string) : new Date(),
    endDate: plan.endDate ? new Date(plan.endDate as string) : new Date(),
    createdAt: plan.createdAt ? new Date(plan.createdAt as string) : new Date(),
    updatedAt: plan.updatedAt ? new Date(plan.updatedAt as string) : new Date(),
    status: (plan.status as 'active' | 'completed' | 'archived') || 'active',
    year: (plan.year as number) || new Date((plan.startDate as string) || new Date()).getFullYear(),
    tags: (plan.tags as string[]) || [],
    archivedAt: plan.archivedAt ? new Date(plan.archivedAt as string) : undefined,
    completionRate: (plan.completionRate as number) || 0,
    totalGoals: (plan.totalGoals as number) || 0,
    completedGoals: (plan.completedGoals as number) || 0,
    totalTasks: (plan.totalTasks as number) || 0,
    completedTasks: (plan.completedTasks as number) || 0,
    weeks: ((plan.weeks as Record<string, unknown>[]) || []).map((week: Record<string, unknown>) => {
      if (!week) return null;
      
      return {
        ...week,
        id: String(week._id || week.id || ''),
        startDate: week.startDate ? new Date(week.startDate as string) : new Date(),
        endDate: week.endDate ? new Date(week.endDate as string) : new Date(),
        goals: ((week.goals as Record<string, unknown>[]) || []).map((goal: Record<string, unknown>) => {
          if (!goal) return null;
          
          return {
            ...goal,
            id: String(goal._id || goal.id || ''),
            targetDate: goal.targetDate ? new Date(goal.targetDate as string) : undefined,
            createdAt: goal.createdAt ? new Date(goal.createdAt as string) : new Date(),
            updatedAt: goal.updatedAt ? new Date(goal.updatedAt as string) : new Date(),
            completedAt: goal.completedAt ? new Date(goal.completedAt as string) : undefined,
            tasks: ((goal.tasks as Record<string, unknown>[]) || []).map((task: Record<string, unknown>) => {
              if (!task) return null;
              
              return {
                ...task,
                id: String(task._id || task.id || ''),
                dueDate: task.dueDate ? new Date(task.dueDate as string) : undefined,
                createdAt: task.createdAt ? new Date(task.createdAt as string) : new Date(),
                updatedAt: task.updatedAt ? new Date(task.updatedAt as string) : new Date(),
                completedAt: task.completedAt ? new Date(task.completedAt as string) : undefined,
              };
            }).filter(Boolean) as unknown[],
          };
        }).filter(Boolean) as unknown[],
      };
    }).filter(Boolean) as Week[],
  } as TwelveWeekPlan;
};

export const usePlansManager = () => {
  const [plans, setPlans] = useState<TwelveWeekPlan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const savedPlanId = localStorage.getItem('currentPlanId');
      return savedPlanId;
    }
    return null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastLoadTime = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);

  // Função otimizada para carregar planos básicos (para dashboard)
  const loadPlans = useCallback(async (forceRefresh = false) => {
    if (typeof window === 'undefined') return;
    
    const authToken = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    
    if (!authToken || !user) {
      setPlans([]);
      setCurrentPlanId(null);
      plansCache.clear();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentPlanId');
        localStorage.removeItem('plans');
        localStorage.removeItem('plansCache');
      }
      return;
    }
    
    // Evitar múltiplas requisições simultâneas
    if (isLoadingRef.current && !forceRefresh) {
      console.log('⏳ usePlansManager: Requisição já em andamento, aguardando...');
      return;
    }

    // Verificar cache local
    const now = Date.now();
    const cachedData = plansCache.get('plans');
    if (!forceRefresh && cachedData && (now - cachedData.timestamp) < CACHE_DURATION) {
      console.log('📦 usePlansManager: Usando cache local');
      setPlans(cachedData.data);
      setLoading(false);
      return;
    }

    // Debounce: Verificar se já carregou recentemente (aumentado para 1 segundo)
    if (!forceRefresh && (now - lastLoadTime.current) < 1000) {
      console.log('⏳ usePlansManager: Debounce ativo, aguardando...');
      return;
    }

    setLoading(true);
    setError(null);
    isLoadingRef.current = true;
    lastLoadTime.current = now;

    try {
      console.log('🔄 usePlansManager: Carregando planos básicos...');
      const result = await planService.getPlans();
      
      if (result.success) {
        const convertedPlans = result.data.map(convertDatesInPlan);
        
        // Atualizar cache local
        plansCache.set('plans', {
          data: convertedPlans,
          timestamp: now
        });
        
        setPlans(convertedPlans);
        console.log(`✅ usePlansManager: ${convertedPlans.length} planos carregados com sucesso`);
      } else {
        setError(result.error || 'Erro ao carregar planos');
        console.error('❌ usePlansManager: Erro ao carregar planos:', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ usePlansManager: Erro geral:', errorMessage);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, []);

  // Função para carregar plano completo (para páginas de detalhes)
  const loadPlanDetails = useCallback(async (planId: string) => {
    if (!planId) return null;
    
    try {
      console.log(`🔄 usePlansManager: Carregando detalhes do plano ${planId}...`);
      const result = await planService.getPlan(planId);
      
      if (result.success) {
        const convertedPlan = convertDatesInPlan(result.data);
        
        // Atualizar o plano na lista local
        setPlans(prevPlans => 
          prevPlans.map(plan => 
            plan.id === planId ? convertedPlan : plan
          )
        );
        
        return convertedPlan;
      } else {
        console.error(`❌ usePlansManager: Erro ao carregar detalhes do plano ${planId}:`, result.error);
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`❌ usePlansManager: Erro geral ao carregar plano ${planId}:`, errorMessage);
      return null;
    }
  }, []);

  // Função otimizada para atualizar plano localmente
  const updatePlanLocally = useCallback((updatedPlan: TwelveWeekPlan) => {
    if (typeof window === 'undefined') return;
    
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.log('🚨 updatePlanLocally: Usuário não autenticado, ignorando atualização por segurança');
      return;
    }
    
    setPlans(prevPlans => {
      const newPlans = prevPlans.map(plan => 
        plan.id === updatedPlan.id ? updatedPlan : plan
      );
      
      // Atualizar cache local
      plansCache.set('plans', {
        data: newPlans,
        timestamp: Date.now()
      });
      
      return newPlans;
    });
  }, []);

  // Função para limpar planos
  const clearPlans = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    setPlans([]);
    setCurrentPlanId(null);
    plansCache.clear();
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentPlanId');
      localStorage.removeItem('plans');
      localStorage.removeItem('plansCache');
    }
  }, []);

  // Função para obter plano atual
  const getCurrentPlan = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    if (!currentPlanId) return null;
    return plans.find(plan => plan.id === currentPlanId) || null;
  }, [currentPlanId, plans]);

  // Função para definir plano atual
  const setCurrentPlan = useCallback((planId: string | null) => {
    if (typeof window === 'undefined') return;
    
    setCurrentPlanId(planId);
    if (planId && typeof window !== 'undefined') {
      localStorage.setItem('currentPlanId', planId);
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('currentPlanId');
    }
  }, []);

  // Função para atualizar plano via API
  const updatePlan = useCallback(async (planId: string, updates: Partial<TwelveWeekPlan>) => {
    try {
      const result = await planService.updatePlan(planId, updates);
      
      if (result.success) {
        // Atualizar localmente
        updatePlanLocally(result.data as TwelveWeekPlan);
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }, [updatePlanLocally]);

  // Função para deletar plano
  const deletePlan = useCallback(async (planId: string) => {
    try {
      const result = await planService.deletePlan(planId);
      
      if (result.success) {
        // Remover da lista local
        setPlans(prevPlans => prevPlans.filter(plan => plan.id !== planId));
        
        // Se era o plano atual, limpar
        if (currentPlanId === planId) {
          setCurrentPlan(null);
        }
        
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }, [currentPlanId, setCurrentPlan]);

  // Função para criar novo plano
  const createPlan = useCallback(async (planData: Partial<TwelveWeekPlan>) => {
    try {
      const result = await planService.createPlan(planData);
      
      if (result.success) {
        // Recarregar planos para incluir o novo
        await loadPlans(true);
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }, [loadPlans]);

  // Função para buscar planos por status
  const getPlansByStatus = useCallback(async (status: string) => {
    try {
      const result = await planService.getPlansByStatus(status);
      
      if (result.success) {
        const convertedPlans = result.data.map(convertDatesInPlan);
        return { success: true, data: convertedPlans };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }, []);

  // Função para buscar planos por ano
  const getPlansByYear = useCallback(async (year: number) => {
    try {
      const result = await planService.getPlansByYear(year);
      
      if (result.success) {
        const convertedPlans = result.data.map(convertDatesInPlan);
        return { success: true, data: convertedPlans };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }, []);

  // Função para ativar plano
  const activatePlan = useCallback(async (planId: string) => {
    try {
      const result = await planService.activatePlan(planId);
      
      if (result.success) {
        // Atualizar o plano na lista local
        setPlans(prevPlans => 
          prevPlans.map(plan => 
            plan.id === planId ? { ...plan, status: 'active' } : plan
          )
        );
        
        // Atualizar cache local
        plansCache.set('plans', {
          data: plans.map(plan => 
            plan.id === planId ? { ...plan, status: 'active' } : plan
          ),
          timestamp: Date.now()
        });
        
        return { success: true, data: result.data };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      return { success: false, error: errorMessage };
    }
  }, [plans]);

  return {
    plans,
    loading,
    error,
    currentPlanId,
    loadPlans,
    loadPlanDetails,
    updatePlanLocally,
    updatePlan,
    deletePlan,
    createPlan,
    clearPlans,
    getCurrentPlan,
    setCurrentPlan,
    getPlansByStatus,
    getPlansByYear,
    activatePlan
  };
};
