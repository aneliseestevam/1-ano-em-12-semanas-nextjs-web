'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Target } from 'lucide-react';
import { Goal } from '../../../types/dashboard';
import { usePlansManager } from '../../../hooks/usePlansManager';
import { PageHeader, ProgressCard, StatCard, FilterBar, ButtonGroup, LoadingSpinner, EmptyState } from '../../../components/ui';
import GoalCreator from '../../../components/dashboard/GoalCreator';

interface GoalWithPlanInfo extends Goal {
  planId: string;
  planTitle: string;
  weekNumber: number;
  weekId: string;
}

// Interfaces removidas para simplificar tipos

export default function ObjectivesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { plans, loading: plansLoading, loadPlans } = usePlansManager();
  const [allGoals, setAllGoals] = useState<GoalWithPlanInfo[]>([]);
  const [error] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activePlanFilter] = useState<string>('all');
  const [apiStats, setApiStats] = useState<{ overview?: { plans?: { completedPlans?: number; activePlans?: number; totalPlans?: number; avgDuration?: number }; goals?: { completedGoals?: number; pendingGoals?: number } } } | null>(null);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [updatingGoal, setUpdatingGoal] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');
  const [availableWeeks, setAvailableWeeks] = useState<number[]>([]);
  const [currentWeek, setCurrentWeek] = useState<number>(1);
  const [loadedWeeks, setLoadedWeeks] = useState<Set<number>>(new Set());
  const [apiOffline] = useState(false);
  const [showGoalCreator, setShowGoalCreator] = useState(false);
  const [selectedPlanForGoal, setSelectedPlanForGoal] = useState<{ planId: string; weekId: string; weekNumber: number; planTitle: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPlans();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !plansLoading) {
      loadPlansAndWeeks();
    }
  }, [isAuthenticated, plansLoading]);

  useEffect(() => {
    if (selectedWeek !== 'all' && typeof selectedWeek === 'number') {
      loadGoalsForWeek(selectedWeek);
    } else if (selectedWeek === 'all') {
      loadAllGoalsFromAPI();
    }
  }, [selectedWeek]);


  // Otimizar filtros com useMemo
  const filteredGoals = useMemo(() => {
    let filtered = allGoals;

    // Filtro por semana
    if (selectedWeek !== 'all') {
      filtered = filtered.filter(goal => goal.weekNumber === selectedWeek);
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(goal => 
        statusFilter === 'completed' ? goal.completed : !goal.completed
      );
    }

    // Filtro por categoria
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(goal => goal.category === categoryFilter);
    }

    // Filtro por plano ativo
    if (activePlanFilter !== 'all') {
      filtered = filtered.filter(goal => goal.planId === activePlanFilter);
    }

    // Filtro por busca
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(goal => 
        goal.title.toLowerCase().includes(searchLower) ||
        goal.description?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [allGoals, selectedWeek, statusFilter, categoryFilter, activePlanFilter, searchTerm]);

  const loadPlansAndWeeks = async () => {
    try {
      console.log('🚀 Carregando planos com objetivos usando nova API otimizada...');
      
      // Usar a nova API otimizada que retorna tudo em uma única requisição
      const { default: plansWithGoalsService } = await import('../../../services/plansWithGoalsService');
      const result = await plansWithGoalsService.getActivePlansWithGoals();
      
      console.log('🔍 loadPlansAndWeeks: Resultado da nova API:', {
        success: result.success,
        hasData: !!result.data,
        plansLength: result.data?.plans?.length || 0,
        message: result.message
      });
      
      if (result.success && result.data.plans.length > 0) {
        const activePlan = result.data.plans[0]; // Pegar o primeiro plano ativo
        
        if (activePlan.weeks && activePlan.weeks.length > 0) {
          const weeksArray = activePlan.weeks
            .map((week) => week.weekNumber)
            .filter((weekNumber: number) => weekNumber > 0)
            .sort((a: number, b: number) => a - b);
          
          setAvailableWeeks(weeksArray);
          
          // Definir semana atual (primeira semana disponível)
          if (weeksArray.length > 0) {
            setCurrentWeek(weeksArray[0]);
            setSelectedWeek(weeksArray[0]);
            
            // Carregar objetivos da semana atual diretamente dos dados já carregados
            console.log(`🚀 Carregando objetivos da semana ${weeksArray[0]} dos dados já carregados`);
            loadGoalsFromPlanData(activePlan, weeksArray[0]);
          }
          
          console.log('📅 Semanas disponíveis (nova API):', weeksArray);
          console.log('✅ Planos e objetivos carregados com sucesso em uma única requisição!');
        } else {
          console.warn('⚠️ Plano ativo encontrado mas sem semanas');
        }
      } else {
        console.warn('⚠️ Nenhum plano ativo encontrado:', result.message);
        
        // Fallback: tentar método antigo se a nova API falhar
        console.log('🔄 Tentando fallback com método antigo...');
        try {
          const { default: optimizedPlanService } = await import('../../../services/optimizedPlanService');
          const plansResult = await optimizedPlanService.getPlansBasic();
          
          if (plansResult.success && plansResult.data && plansResult.data.length > 0) {
            const activePlan = plansResult.data.find((plan: any) => plan.status === 'active');
            
            if (activePlan) {
              const weeksResult = await optimizedPlanService.getPlanWeeks(activePlan.id);
              
              if (weeksResult.success && weeksResult.data.length > 0) {
                const weeksArray = weeksResult.data
                  .map((week: any) => week.weekNumber)
                  .filter((weekNumber: number) => weekNumber > 0)
                  .sort((a: number, b: number) => a - b);
                
                setAvailableWeeks(weeksArray);
                
                if (weeksArray.length > 0) {
                  setCurrentWeek(weeksArray[0]);
                  setSelectedWeek(weeksArray[0]);
                  loadGoalsForWeekOptimized(activePlan.id, weeksArray[0]);
                }
                
                console.log('📅 Semanas disponíveis (fallback):', weeksArray);
                return;
              }
            }
          }
        } catch (fallbackError) {
          console.error('❌ Fallback também falhou:', fallbackError);
        }
        
        // Último fallback: criar semanas padrão (1-12)
        const defaultWeeks = Array.from({ length: 12 }, (_, i) => i + 1);
        setAvailableWeeks(defaultWeeks);
        setCurrentWeek(1);
        setSelectedWeek(1);
        
        console.log('🚀 Carregando apenas a semana 1 (padrão)');
        loadGoalsForWeek(1);
        
        console.log('📅 Usando semanas padrão:', defaultWeeks);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar planos com objetivos:', error);
      
      // Fallback: tentar método antigo se a nova API falhar
      console.log('🔄 Tentando fallback com método antigo...');
      try {
        const { default: optimizedPlanService } = await import('../../../services/optimizedPlanService');
        const plansResult = await optimizedPlanService.getPlansBasic();
        
        if (plansResult.success && plansResult.data && plansResult.data.length > 0) {
          const activePlan = plansResult.data.find((plan: any) => plan.status === 'active');
          
          if (activePlan) {
            const weeksResult = await optimizedPlanService.getPlanWeeks(activePlan.id);
            
            if (weeksResult.success && weeksResult.data.length > 0) {
              const weeksArray = weeksResult.data
                .map((week: any) => week.weekNumber)
                .filter((weekNumber: number) => weekNumber > 0)
                .sort((a: number, b: number) => a - b);
              
              setAvailableWeeks(weeksArray);
              
              if (weeksArray.length > 0) {
                setCurrentWeek(weeksArray[0]);
                setSelectedWeek(weeksArray[0]);
                loadGoalsForWeekOptimized(activePlan.id, weeksArray[0]);
              }
              
              console.log('📅 Semanas disponíveis (fallback):', weeksArray);
              return;
            }
          }
        }
      } catch (fallbackError) {
        console.error('❌ Fallback também falhou:', fallbackError);
      }
      
      // Último fallback: criar semanas padrão (1-12)
      const defaultWeeks = Array.from({ length: 12 }, (_, i) => i + 1);
      setAvailableWeeks(defaultWeeks);
      setCurrentWeek(1);
      setSelectedWeek(1);
      
      console.log('🚀 Carregando apenas a semana 1 (padrão)');
      loadGoalsForWeek(1);
      
      console.log('📅 Usando semanas padrão:', defaultWeeks);
    }
  };

  // Nova função para carregar objetivos diretamente dos dados do plano
  const loadGoalsFromPlanData = (planData: unknown, weekNumber: number) => {
    try {
      console.log(`🚀 loadGoalsFromPlanData: Carregando objetivos da semana ${weekNumber} dos dados do plano`);
      
      const week = (planData as any).weeks?.find((w: any) => w.weekNumber === weekNumber);
      if (!week || !week.goals) {
        console.warn(`⚠️ Semana ${weekNumber} não encontrada ou sem objetivos`);
        return;
      }
      
      const goalsWithPlanInfo: GoalWithPlanInfo[] = week.goals.map((goal: any) => ({
        id: goal._id || goal.id,
        title: goal.title,
        description: goal.description,
        category: goal.category,
        priority: goal.priority,
        status: goal.status,
        completed: goal.completed,
        targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
        completedAt: goal.completedAt ? new Date(goal.completedAt) : undefined,
        createdAt: goal.createdAt ? new Date(goal.createdAt) : new Date(),
        updatedAt: goal.updatedAt ? new Date(goal.updatedAt) : new Date(),
        tasks: goal.tasks || [],
        planId: (planData as any)._id,
        planTitle: (planData as any).title,
        weekNumber: weekNumber,
        weekId: (week as any)._id
      }));
      
      setAllGoals(goalsWithPlanInfo);
      setLoadedWeeks(prev => new Set([...prev, weekNumber]));
      
      console.log(`✅ loadGoalsFromPlanData: ${goalsWithPlanInfo.length} objetivos carregados da semana ${weekNumber}`);
    } catch (error) {
      console.error(`❌ loadGoalsFromPlanData: Erro ao carregar objetivos da semana ${weekNumber}:`, error);
    }
  };

  const loadGoalsForWeekOptimized = async (planId: string, weekNumber: number) => {
    // Verificar se a semana já foi carregada
    if (loadedWeeks.has(weekNumber)) {
      console.log(`📦 Semana ${weekNumber} já carregada, usando cache`);
      // Filtrar objetivos da semana já carregada
      const weekGoals = allGoals.filter(goal => goal.weekNumber === weekNumber);
      if (weekGoals.length > 0) {
        setAllGoals(weekGoals);
      }
      return;
    }

    setGoalsLoading(true);
    try {
      console.log(`🔄 Carregando objetivos da semana ${weekNumber} (otimizado)...`);
      
      const { default: optimizedPlanService } = await import('../../../services/optimizedPlanService');
      const weekDataResult = await optimizedPlanService.getWeekData(planId, weekNumber);
      
      if (weekDataResult.success && weekDataResult.data) {
        const { week, goals } = weekDataResult.data;
        
        const allGoals: GoalWithPlanInfo[] = goals.map((goal: any) => ({
          ...goal,
          id: goal.id || goal._id,
          planId: planId,
          planTitle: 'Plano Ativo', // Pode ser melhorado
          weekNumber: weekNumber,
          weekId: week?.id || `week_${weekNumber}`
        }));
        
        console.log(`✅ Objetivos carregados da semana ${weekNumber} (otimizado):`, allGoals.length);
        setAllGoals(allGoals);
        
        // Marcar semana como carregada
        setLoadedWeeks(prev => new Set([...prev, weekNumber]));
      } else {
        console.warn(`⚠️ Não foi possível carregar dados da semana ${weekNumber}`);
      }
      
    } catch (error) {
      console.error('❌ Erro ao carregar objetivos da semana (otimizado):', error);
    } finally {
      setGoalsLoading(false);
    }
  };

  const loadGoalsForWeek = async (weekNumber: number) => {
    console.log(`🔄 loadGoalsForWeek: Carregando semana ${weekNumber}...`);
    
    // Primeiro, verificar se já temos dados carregados de todas as semanas
    // Se sim, apenas verificar se a semana específica existe
    if (allGoals.length > 0) {
      const weekGoals = allGoals.filter(goal => goal.weekNumber === weekNumber);
      console.log(`📦 Usando dados já carregados: ${weekGoals.length} objetivos da semana ${weekNumber}`);
      
      if (weekGoals.length > 0) {
        // Se encontrou objetivos da semana, não alterar allGoals - apenas retornar
        // O filtro será feito pelo useMemo filteredGoals
        console.log(`✅ Semana ${weekNumber} já carregada, usando filtro local`);
        return;
      }
    }

    // Se não temos dados ou a semana específica não foi encontrada,
    // carregar todos os dados uma vez e depois filtrar
    setGoalsLoading(true);
    try {
      console.log(`🔄 Carregando todos os dados para filtrar semana ${weekNumber}...`);
      
      // Usar a nova API otimizada que já carregou todos os dados
      const { default: plansWithGoalsService } = await import('../../../services/plansWithGoalsService');
      const result = await plansWithGoalsService.getActivePlansWithGoals();
      
      if (!result.success || !result.data.plans.length) {
        console.warn('⚠️ Não foi possível carregar planos com objetivos');
        setGoalsLoading(false);
        return;
      }

      const allPlans = result.data.plans;
      const allGoalsFromAPI: GoalWithPlanInfo[] = [];

      // Carregar TODOS os objetivos de TODAS as semanas
      for (const plan of allPlans) {
        if (plan.weeks && plan.weeks.length > 0) {
          for (const week of plan.weeks) {
            if (week.goals && week.goals.length > 0) {
              week.goals.forEach((goal) => {
                const goalData = {
                  ...goal,
                  id: (goal as any).id || (goal as any)._id,
                  planId: (plan as any)._id,
                  planTitle: (plan as any).title,
                  weekNumber: (week as any).weekNumber,
                  weekId: (week as any)._id,
                  updatedAt: (goal as any).updatedAt || new Date().toISOString(),
                  category: (goal as any).category as "saude" | "carreira" | "financas" | "relacionamentos" | "hobbies" | "outros",
                  targetDate: (goal as any).targetDate ? new Date((goal as any).targetDate) : undefined,
                  completedAt: (goal as any).completedAt ? new Date((goal as any).completedAt) : undefined,
                  createdAt: (goal as any).createdAt ? new Date((goal as any).createdAt) : new Date(),
                  tasks: (goal as any).tasks || []
                };
                
                // Log detalhado para debug
                console.log(`🔍 Objetivo carregado:`, {
                  id: goalData.id,
                  title: goalData.title,
                  weekNumber: goalData.weekNumber,
                  completed: goalData.completed,
                  completedType: typeof goalData.completed,
                  originalGoal: goal
                });
                
                allGoalsFromAPI.push(goalData);
              });
            }
          }
        }
      }

      console.log(`✅ Total de objetivos carregados de todas as semanas:`, allGoalsFromAPI.length);
      
      // Salvar todos os objetivos no estado (não filtrar por semana)
      setAllGoals(allGoalsFromAPI);
      
      // Marcar todas as semanas como carregadas
      const allWeekNumbers = [...new Set(allGoalsFromAPI.map(goal => goal.weekNumber))];
      setLoadedWeeks(new Set(allWeekNumbers));
      
      console.log(`📅 Semanas carregadas:`, allWeekNumbers);
      console.log(`📊 Objetivos por semana:`, allWeekNumbers.map(week => ({
        week,
        total: allGoalsFromAPI.filter(g => g.weekNumber === week).length,
        completed: allGoalsFromAPI.filter(g => g.weekNumber === week && g.completed).length
      })));
      
    } catch (error) {
      console.error('❌ Erro ao carregar objetivos da semana:', error);
    } finally {
      setGoalsLoading(false);
    }
  };

  const loadAllGoalsFromAPI = async () => {
    setGoalsLoading(true);
    try {
      console.log('🔄 Carregando todos os objetivos usando dados já carregados...');
      
      // Usar a nova API otimizada que já carregou todos os dados
      const { default: plansWithGoalsService } = await import('../../../services/plansWithGoalsService');
      const result = await plansWithGoalsService.getActivePlansWithGoals();
      
      if (!result.success || !result.data.plans.length) {
        console.warn('⚠️ Não foi possível carregar planos com objetivos');
        setGoalsLoading(false);
        return;
      }

      const allPlans = result.data.plans;
      console.log('📋 Planos carregados:', allPlans.length);

      // Extrair todos os objetivos de todos os planos e semanas
      const allGoals: GoalWithPlanInfo[] = [];

      for (const plan of allPlans) {
        if (plan.weeks && plan.weeks.length > 0) {
          for (const week of plan.weeks) {
            if (week.goals && week.goals.length > 0) {
              week.goals.forEach((goal) => {
                allGoals.push({
                  ...goal,
                  id: (goal as any).id || (goal as any)._id,
                  planId: (plan as any)._id,
                  planTitle: (plan as any).title,
                  weekNumber: (week as any).weekNumber,
                  weekId: (week as any)._id,
                  updatedAt: (goal as any).updatedAt || new Date().toISOString(),
                  category: (goal as any).category as "saude" | "carreira" | "financas" | "relacionamentos" | "hobbies" | "outros",
                  targetDate: (goal as any).targetDate ? new Date((goal as any).targetDate) : undefined,
                  completedAt: (goal as any).completedAt ? new Date((goal as any).completedAt) : undefined,
                  createdAt: (goal as any).createdAt ? new Date((goal as any).createdAt) : new Date(),
                  tasks: (goal as any).tasks || []
                });
              });
              
              console.log(`✅ Objetivos carregados da semana ${week.weekNumber} do plano ${plan.title}:`, week.goals.length);
            }
          }
        }
      }

      console.log('✅ Total de objetivos carregados (otimizado):', allGoals.length);
      setAllGoals(allGoals);
      
      // Marcar todas as semanas como carregadas
      const allWeekNumbers = [...new Set(allGoals.map(goal => goal.weekNumber))];
      setLoadedWeeks(new Set(allWeekNumbers));
      
      console.log(`📅 Semanas disponíveis:`, allWeekNumbers);
    } catch (error) {
      console.error('❌ Erro ao carregar objetivos da API:', error);
    } finally {
      setGoalsLoading(false);
    }
  };


  // Buscar estatísticas da API em background
  useEffect(() => {
    const loadApiStats = async () => {
      try {
        const { planService } = await import('../../../services/planService');
        const statsResult = await planService.getAllPlansStats();
        
        if (statsResult.success && statsResult.data) {
          setApiStats(statsResult.data);
          console.log('✅ Estatísticas da API carregadas para objetivos:', {
            overview: statsResult.data.overview,
            summary: statsResult.data.summary,
            totalGoals: statsResult.data.overview?.goals?.totalGoals || 0,
            completedGoals: statsResult.data.overview?.goals?.completedGoals || 0
          });
        }
      } catch {
        console.warn('⚠️ Não foi possível carregar estatísticas da API para objetivos');
      }
    };

    // Carregar stats da API sempre, independente dos planos locais
    loadApiStats();
  }, []);



  const getCategoryColor = (category: string) => {
    const colors = {
      saude: 'bg-green-100 text-green-800',
      carreira: 'bg-blue-100 text-blue-800',
      financas: 'bg-yellow-100 text-yellow-800',
      relacionamentos: 'bg-pink-100 text-pink-800',
      hobbies: 'bg-purple-100 text-purple-800',
      outros: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.outros;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      saude: 'Saúde',
      carreira: 'Carreira',
      financas: 'Finanças',
      relacionamentos: 'Relacionamentos',
      hobbies: 'Hobbies',
      outros: 'Outros'
    };
    return labels[category as keyof typeof labels] || 'Outros';
  };

  const handleCreateGoal = async (goalData: {
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    targetDate: string;
    status: string;
    completed: boolean;
    planId: string;
    weekId: string;
    weekNumber: number;
  }) => {
    try {
      console.log('🔄 Criando novo objetivo:', goalData);
      
      const { goalService } = await import('../../../services/goalService');
      
      const result = await goalService.createGoal(goalData.planId, goalData.weekId, {
        title: goalData.title,
        description: goalData.description,
        category: goalData.category,
        priority: goalData.priority,
        targetDate: goalData.targetDate,
        status: goalData.status,
        completed: goalData.completed
      });

      if (result.success) {
        console.log('✅ Objetivo criado com sucesso:', result.data);
        
        // Recarregar objetivos para incluir o novo
        if (goalData.weekNumber === selectedWeek || selectedWeek === 'all') {
          await loadAllGoalsFromAPI();
        }
        
        setShowGoalCreator(false);
        setSelectedPlanForGoal(null);
      } else {
        console.error('❌ Erro ao criar objetivo:', result.error);
      }
    } catch (error) {
      console.error('❌ Erro ao criar objetivo:', error);
    }
  };

  const handleOpenGoalCreator = async () => {
    // Se há planos disponíveis, usar o primeiro plano ativo
    const activePlans = plans?.filter(plan => plan.status === 'active') || [];
    if (activePlans.length > 0) {
      const firstPlan = activePlans[0];
      // Usar a primeira semana disponível ou semana 1 como padrão
      const firstWeek = availableWeeks.length > 0 ? availableWeeks[0] : 1;
      
      try {
        // Tentar obter o weekId real do backend
        const { goalService } = await import('../../../services/goalService');
        const weeksResponse = await goalService.getWeeks(firstPlan.id);
        
        let weekId = `week_${firstWeek}`; // Fallback
        
        if (weeksResponse.success && weeksResponse.data) {
          // Procurar pela semana correspondente
          const week = weeksResponse.data.find((w: any) => w.weekNumber === firstWeek);
          if (week && week._id) {
            weekId = week._id;
          }
        }
        
        setSelectedPlanForGoal({
          planId: firstPlan.id,
          weekId: weekId,
          weekNumber: firstWeek,
          planTitle: firstPlan.title
        });
        setShowGoalCreator(true);
      } catch (error) {
        console.warn('⚠️ Erro ao obter semanas do plano, usando fallback:', error);
        // Fallback: usar formato padrão
        setSelectedPlanForGoal({
          planId: firstPlan.id,
          weekId: `week_${firstWeek}`,
          weekNumber: firstWeek,
          planTitle: firstPlan.title
        });
        setShowGoalCreator(true);
      }
    } else {
      console.warn('⚠️ Nenhum plano ativo encontrado para criar objetivo');
    }
  };

  const toggleGoalCompletion = async (goal: GoalWithPlanInfo) => {
    console.log('🔍 toggleGoalCompletion: Objetivo recebido:', goal);
    console.log('🔍 toggleGoalCompletion: Propriedades do objetivo:', {
      id: goal.id,
      _id: (goal as GoalWithPlanInfo & { _id?: string })._id,
      planId: goal.planId,
      weekId: goal.weekId,
      weekNumber: goal.weekNumber,
      title: goal.title,
      completed: goal.completed
    });

    // Validar se todos os parâmetros necessários estão definidos
    if (!goal.id || !goal.planId || !goal.weekId) {
      console.error('❌ toggleGoalCompletion: Parâmetros inválidos:', {
        goalId: goal.id,
        planId: goal.planId,
        weekId: goal.weekId,
        goal
      });
      return;
    }

    setUpdatingGoal(goal.id);
    try {
      console.log('🔄 toggleGoalCompletion: Dados do objetivo:', {
        goalId: goal.id,
        planId: goal.planId,
        weekId: goal.weekId,
        weekNumber: goal.weekNumber,
        title: goal.title
      });

      const { goalService } = await import('../../../services/goalService');
      
      const newCompletedStatus = !goal.completed;
      const result = await goalService.updateGoal(goal.planId, goal.weekId, goal.id, {
        completed: newCompletedStatus
      });

      if (result.success) {
        // Atualizar o estado local
        setAllGoals(prevGoals => 
          prevGoals.map(g => 
            g.id === goal.id 
              ? { ...g, completed: newCompletedStatus }
              : g
          )
        );
        console.log(`✅ Objetivo ${goal.title} ${newCompletedStatus ? 'concluído' : 'reaberto'}`);
      } else {
        console.error('❌ Erro ao atualizar objetivo:', result.error);
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar objetivo:', error);
    } finally {
      setUpdatingGoal(null);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Função auxiliar para verificar se um objetivo está concluído
  const isGoalCompleted = (goal: GoalWithPlanInfo): boolean => {
    // Verificar diferentes formatos possíveis de completed
    if (goal.completed === true || (goal.completed as any) === 'true' || (goal.completed as any) === 1) {
      return true;
    }
    
    // Verificar se é false, 'false', 0, null, undefined
    if (goal.completed === false || (goal.completed as any) === 'false' || (goal.completed as any) === 0 || 
        goal.completed === null || goal.completed === undefined) {
      return false;
    }
    
    // Se não conseguir determinar, considerar como não concluído
    console.warn(`⚠️ Estado de completed não reconhecido para objetivo ${goal.id}:`, goal.completed);
    return false;
  };

  // Calcular estatísticas baseadas na semana selecionada
  const getWeekStats = () => {
    if (selectedWeek === 'all') {
      // Se "todas" as semanas estão selecionadas, mostrar estatísticas globais
      const completedGoals = allGoals.filter(goal => isGoalCompleted(goal)).length;
      const pendingGoals = allGoals.filter(goal => !isGoalCompleted(goal)).length;
      const totalGoals = allGoals.length;
      
      console.log(`📊 Estatísticas GLOBAIS:`, {
        totalGoals,
        completedGoals,
        pendingGoals,
        allGoalsSample: allGoals.slice(0, 5).map(g => ({ 
          id: g.id, 
          title: g.title, 
          completed: g.completed, 
          completedType: typeof g.completed,
          isCompleted: isGoalCompleted(g),
          weekNumber: g.weekNumber 
        }))
      });
      
      return { completedGoals, pendingGoals, totalGoals };
    } else {
      // Se uma semana específica está selecionada, mostrar estatísticas dessa semana
      const weekGoals = allGoals.filter(goal => goal.weekNumber === selectedWeek);
      
      const completedGoals = weekGoals.filter(goal => isGoalCompleted(goal)).length;
      const pendingGoals = weekGoals.filter(goal => !isGoalCompleted(goal)).length;
      const totalGoals = weekGoals.length;
      
      console.log(`📊 Estatísticas da SEMANA ${selectedWeek}:`, {
        totalGoals,
        completedGoals,
        pendingGoals,
        weekGoalsSample: weekGoals.slice(0, 5).map(g => ({ 
          id: g.id, 
          title: g.title, 
          completed: g.completed, 
          completedType: typeof g.completed,
          isCompleted: isGoalCompleted(g),
          weekNumber: g.weekNumber 
        })),
        allWeekGoals: weekGoals.map(g => ({ 
          id: g.id, 
          title: g.title, 
          completed: g.completed, 
          isCompleted: isGoalCompleted(g) 
        }))
      });
      
      return { completedGoals, pendingGoals, totalGoals };
    }
  };

  const weekStats = getWeekStats();
  const completedGoals = weekStats.completedGoals;
  const pendingGoals = weekStats.pendingGoals;
  const totalGoals = weekStats.totalGoals;

  // Log para debug das estatísticas
  console.log(`📊 Estatísticas da semana ${selectedWeek}:`, {
    selectedWeek,
    completedGoals,
    pendingGoals,
    totalGoals,
    allGoalsCount: allGoals.length,
    weekGoals: selectedWeek !== 'all' ? allGoals.filter(goal => goal.weekNumber === selectedWeek) : 'all',
    weekGoalsCompleted: selectedWeek !== 'all' ? allGoals.filter(goal => goal.weekNumber === selectedWeek && goal.completed) : 'all'
  });

  // Calcular estatísticas do plano ativo de forma segura
  // const activePlans = plans?.filter(plan => 
  //   plan.status === 'active' || 
  //   (plan.weeks && plan.weeks.length > 0)
  // ) || [];

  // const currentPlan = activePlans[0]; // Pegar o primeiro plano ativo
  // const totalWeeks = currentPlan?.weeks?.length || availableWeeks.length || 0;
  
  // Calcular semanas concluídas de forma mais simples
  // const completedWeeks = Math.min(
  //   Math.floor((completedGoals / Math.max(totalGoals, 1)) * totalWeeks),
  //   totalWeeks
  // );

  // Calcular progresso baseado na semana selecionada
  const overallProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  
  // Calcular média de objetivos por semana
  // const avgObjectivesPerWeek = totalWeeks > 0 ? (totalGoals / totalWeeks).toFixed(1) : '0.0';

  return (
    <div>
      <PageHeader title="Objetivos" icon={Target} />

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Botão de Criação de Objetivos */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gerenciar Objetivos</h2>
              <p className="text-gray-600 mt-1">Crie e gerencie seus objetivos por semana</p>
            </div>
            <button
              onClick={handleOpenGoalCreator}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Target className="w-5 h-5" />
              <span>Novo Objetivo</span>
            </button>
          </div>
          {/* Notificação de API Offline */}
          {apiOffline && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    API Temporariamente Offline
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>Estamos exibindo dados de demonstração. Algumas funcionalidades podem estar limitadas.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progresso */}
          <ProgressCard 
            title={selectedWeek === 'all' ? "Progresso Geral" : `Progresso da Semana ${selectedWeek}`}
            percentage={overallProgress} 
            className="mb-6"
          />

          {/* Status Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard 
              value={selectedWeek === 'all' ? (apiStats?.overview?.goals?.completedGoals || completedGoals) : completedGoals}
              label={selectedWeek === 'all' ? "Concluídos" : `Concluídos (Semana ${selectedWeek})`}
              color="text-green-600"
            />
            <StatCard 
              value={selectedWeek === 'all' ? (apiStats?.overview?.goals?.pendingGoals || pendingGoals) : pendingGoals}
              label={selectedWeek === 'all' ? "Pendentes" : `Pendentes (Semana ${selectedWeek})`}
              color="text-orange-600"
            />
            <StatCard 
              value={availableWeeks.length}
              label="Semanas"
              color="text-blue-600"
            />
            <StatCard 
              value={currentWeek}
              label="Atual"
              color="text-purple-600"
            />
          </div>


          {/* Week Selector */}
          <ButtonGroup
            title="Semana"
            subtitle={availableWeeks.length > 0 ? `${availableWeeks.length} disponíveis` : undefined}
            options={[
              { value: 'all', label: 'Todas' },
              ...availableWeeks.map(week => ({ value: week, label: week.toString() }))
            ]}
            selectedValue={selectedWeek}
            onSelect={(value) => setSelectedWeek(value as number | 'all')}
            className="mb-6"
          />

          {/* Filters */}
          <FilterBar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Buscar objetivos..."
            filters={[
              {
                label: "Status",
                value: statusFilter,
                options: [
                  { value: 'completed', label: 'Concluídos' },
                  { value: 'pending', label: 'Pendentes' }
                ],
                onChange: (value) => setStatusFilter(value as 'all' | 'completed' | 'pending')
              },
              {
                label: "Categoria",
                value: categoryFilter,
                options: [
                  { value: 'saude', label: 'Saúde' },
                  { value: 'carreira', label: 'Carreira' },
                  { value: 'financas', label: 'Finanças' },
                  { value: 'relacionamentos', label: 'Relacionamentos' },
                  { value: 'hobbies', label: 'Hobbies' },
                  { value: 'outros', label: 'Outros' }
                ],
                onChange: setCategoryFilter
              }
            ]}
            className="mb-6"
          />

          {/* Goals List by Weeks */}
          {goalsLoading ? (
            <LoadingSpinner message="Carregando objetivos..." />
          ) : filteredGoals.length === 0 ? (
            <EmptyState
              icon={Target}
              title={allGoals.length === 0 ? 'Nenhum objetivo encontrado' : 'Nenhum objetivo corresponde aos filtros'}
              description={allGoals.length === 0 
                  ? 'Comece criando seus primeiros objetivos para transformar seus sonhos em realidade!'
                  : 'Tente ajustar os filtros de busca para encontrar seus objetivos.'
                }
            />
          ) : (
            <div className="space-y-8">
              {/* Mostrar objetivos da semana selecionada ou todas as semanas */}
              {selectedWeek === 'all' ? (
                // Mostrar todas as semanas agrupadas
                Object.entries(
                  filteredGoals.reduce((acc, goal) => {
                    const weekKey = `Semana ${goal.weekNumber}`;
                    if (!acc[weekKey]) {
                      acc[weekKey] = [];
                    }
                    acc[weekKey].push(goal);
                    return acc;
                  }, {} as Record<string, GoalWithPlanInfo[]>)
                )
                .sort(([a], [b]) => {
                  const weekNumA = parseInt(a.replace('Semana ', ''));
                  const weekNumB = parseInt(b.replace('Semana ', ''));
                  return weekNumA - weekNumB;
                })
                .map(([weekLabel, weekGoals]) => (
                  <div key={weekLabel} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-purple-600">{weekGoals[0]?.weekNumber}</span>
                        </div>
                        <span>{weekLabel}</span>
                      </h3>
                      <div className="text-sm text-gray-500">
                        {weekGoals.filter(g => g.completed).length} de {weekGoals.length} concluídos
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {weekGoals.map((goal) => {
                        console.log('🔍 Renderizando objetivo individual:', {
                          goal,
                          id: goal.id,
                          planId: goal.planId,
                          weekId: goal.weekId,
                          weekNumber: goal.weekNumber
                        });
                        return (
                        <div 
                          key={goal.id} 
                          className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                            goal.completed 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            {/* Checkbox */}
                            <button
                              onClick={() => toggleGoalCompletion(goal)}
                              disabled={updatingGoal === goal.id}
                              className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                                goal.completed
                                  ? 'bg-green-500 border-green-500 text-white'
                                  : 'border-gray-300 hover:border-green-400'
                              } ${updatingGoal === goal.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              {updatingGoal === goal.id ? (
                                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : goal.completed ? (
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              ) : null}
                            </button>

                            <div className="flex-1 min-w-0">
                              <h4 className={`font-semibold text-sm mb-1 ${
                                goal.completed ? 'text-green-800 line-through' : 'text-gray-900'
                              }`}>
                                {goal.title}
                              </h4>
                              
                              {goal.description && (
                                <p className={`text-xs mb-2 ${
                                  goal.completed ? 'text-green-600' : 'text-gray-600'
                                }`}>
                                  {goal.description}
                                </p>
                              )}

                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(goal.category)}`}>
                        {getCategoryLabel(goal.category)}
                      </span>
                                
                                {goal.tasks && goal.tasks.length > 0 && (
                      <span className="text-xs text-gray-500">
                                    {goal.tasks.filter(t => t.completed).length}/{goal.tasks.length} tarefas
                      </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                // Mostrar apenas a semana selecionada
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Semana {selectedWeek}
                    </h3>
                    <div className="text-xs text-gray-500">
                      {filteredGoals.filter(g => g.completed).length}/{filteredGoals.length} concluídos
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {filteredGoals.map((goal) => (
                      <div 
                        key={goal.id} 
                        className={`border rounded-md p-3 transition-all duration-200 hover:shadow-sm ${
                          goal.completed 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-start space-x-2">
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleGoalCompletion(goal)}
                            disabled={updatingGoal === goal.id}
                            className={`mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                              goal.completed
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-green-400'
                            } ${updatingGoal === goal.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {updatingGoal === goal.id ? (
                              <div className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : goal.completed ? (
                              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : null}
                          </button>

                          <div className="flex-1 min-w-0">
                            <h4 className={`font-medium text-sm mb-1 ${
                              goal.completed ? 'text-green-800 line-through' : 'text-gray-900'
                            }`}>
                              {goal.title}
                            </h4>
                            
                            <div className="flex items-center justify-between">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(goal.category)}`}>
                                {getCategoryLabel(goal.category)}
                              </span>

                    {goal.tasks && goal.tasks.length > 0 && (
                                <span className="text-xs text-gray-500">
                                  {goal.tasks.filter(t => t.completed).length}/{goal.tasks.length}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-8">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </main>

        {/* Goal Creator Modal */}
        {selectedPlanForGoal && (
          <GoalCreator
            open={showGoalCreator}
            onClose={() => {
              setShowGoalCreator(false);
              setSelectedPlanForGoal(null);
            }}
            onCreateGoal={handleCreateGoal}
            planId={selectedPlanForGoal.planId}
            weekId={selectedPlanForGoal.weekId}
            weekNumber={selectedPlanForGoal.weekNumber}
            planTitle={selectedPlanForGoal.planTitle}
          />
        )}
    </div>
  );
}