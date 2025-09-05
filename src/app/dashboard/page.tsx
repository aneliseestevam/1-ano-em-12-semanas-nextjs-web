'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import DashboardNav from '../../components/dashboard/DashboardNav';
import { 
  Plus, 
  Calendar, 
  BarChart3, 
  Target, 
  CheckCircle, 
  TrendingUp,
  Folder,
  ArrowRight
} from 'lucide-react';
import { DashboardStats } from '../../types/dashboard';
import { usePlansManager } from '../../hooks/usePlansManager';

export default function Dashboard() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { plans, loadPlans } = usePlansManager();
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);

  // Memoizar estatísticas básicas para evitar recálculos desnecessários
  const basicStats = useMemo(() => {
    if (!plans || plans.length === 0) {
      return {
        totalPlans: 0,
        activePlans: 0,
        completedPlans: 0,
        archivedPlans: 0,
        overallCompletionRate: 0,
        totalGoals: 0,
        completedGoals: 0,
        totalTasks: 0,
        completedTasks: 0
      };
    }

    let totalGoals = 0;
    let completedGoals = 0;
    let totalTasks = 0;
    let completedTasks = 0;

    // Se os planos não têm semanas carregadas, usar os dados básicos do plano
    const hasDetailedData = plans.some(plan => plan.weeks && plan.weeks.length > 0);
    
    if (hasDetailedData) {
      // Calcular com dados detalhados (semanas e objetivos)
      plans.forEach(plan => {
        if (plan.weeks) {
                  plan.weeks.forEach((week) => {
            if (week.goals) {
            week.goals.forEach((goal) => {
                totalGoals++;
                if (goal.completed) completedGoals++;
                if (goal.tasks) {
                  totalTasks += goal.tasks.length;
                completedTasks += goal.tasks.filter((task) => task.completed).length;
                }
              });
            }
          });
        }
      });
    } else {
      // Usar dados básicos dos planos (totalGoals, completedGoals, etc.)
      plans.forEach(plan => {
        totalGoals += plan.totalGoals || 0;
        completedGoals += plan.completedGoals || 0;
        totalTasks += plan.totalTasks || 0;
        completedTasks += plan.completedTasks || 0;
      });
    }

    const activePlans = plans.filter(p => 
      p.status === 'active' || (p.weeks && p.weeks.length > 0)
    ).length;

    return {
      totalPlans: plans.length,
      activePlans,
      completedPlans: plans.filter(p => p.status === 'completed').length,
      archivedPlans: plans.filter(p => p.status === 'archived').length,
      overallCompletionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
      totalGoals,
      completedGoals,
      totalTasks,
      completedTasks
    };
  }, [plans]);

  // Função otimizada para carregar estatísticas em background
  const loadStatsInBackground = useCallback(async () => {
    if (!plans || plans.length === 0) {
      setStatsLoading(false);
      return;
    }

    setStatsLoading(true);
    
    try {
      // Tentar buscar estatísticas globais da API
      const { planService } = await import('../../services/planService');
      const statsResult = await planService.getAllPlansStats();
      
      if (statsResult.success && statsResult.data) {
        // Usar estatísticas da API se disponíveis
        const apiStats = statsResult.data;
        const overview = apiStats.overview || {};
        const summary = apiStats.summary || {};
        const plansData = overview.plans || {};
        const goalsData = overview.goals || {};
        const tasksData = overview.tasks || {};
        
        const fullStats: DashboardStats = {
          ...basicStats,
          // Usar dados da API quando disponíveis, senão usar dados básicos
          totalPlans: plansData.totalPlans || basicStats.totalPlans,
          activePlans: plansData.activePlans || basicStats.activePlans,
          completedPlans: plansData.completedPlans || basicStats.completedPlans,
          archivedPlans: plansData.pausedPlans || basicStats.archivedPlans,
          totalGoals: goalsData.totalGoals || basicStats.totalGoals,
          completedGoals: goalsData.completedGoals || basicStats.completedGoals,
          totalTasks: tasksData.totalTasks || basicStats.totalTasks,
          completedTasks: tasksData.completedTasks || basicStats.completedTasks,
          overallCompletionRate: summary.goalCompletionRate || basicStats.overallCompletionRate,
          recentActivity: apiStats.upcomingDeadlines || [],
          currentYearStats: {
            year: new Date().getFullYear(),
            totalPlans: plansData.totalPlans || basicStats.totalPlans,
            averageCompletionRate: summary.goalCompletionRate || basicStats.overallCompletionRate,
            totalGoals: goalsData.totalGoals || basicStats.totalGoals,
            completedGoals: goalsData.completedGoals || basicStats.completedGoals,
            totalTasks: tasksData.totalTasks || basicStats.totalTasks,
            completedTasks: tasksData.completedTasks || basicStats.completedTasks,
            categoryPerformance: apiStats.statusBreakdown || [],
            monthlyProgress: apiStats.monthlyTrend || [
              {
                month: new Date().getMonth() + 1,
                monthName: new Date().toLocaleDateString('pt-BR', { month: 'long' }),
                goalsCompleted: goalsData.completedGoals || basicStats.completedGoals,
                tasksCompleted: tasksData.completedTasks || basicStats.completedTasks,
                plansActive: plansData.activePlans || basicStats.activePlans
              }
            ]
          },
          yearlyComparisons: [],
          topCategories: (apiStats.statusBreakdown || []).sort((a: { count?: number }, b: { count?: number }) => (b.count || 0) - (a.count || 0))
        };
        
        setDashboardStats(fullStats);
        console.log('✅ Estatísticas carregadas da API:', {
          totalPlans: plansData.totalPlans,
          activePlans: plansData.activePlans,
          totalGoals: goalsData.totalGoals,
          completedGoals: goalsData.completedGoals,
          goalCompletionRate: summary.goalCompletionRate,
          taskCompletionRate: summary.taskCompletionRate
        });
      } else {
        // Fallback: usar dados básicos dos planos
        console.log('⚠️ Usando dados básicos dos planos (API de estatísticas não disponível)');
        setDashboardStats({
          ...basicStats,
          recentActivity: [],
          currentYearStats: {
            year: new Date().getFullYear(),
            totalPlans: basicStats.totalPlans,
            averageCompletionRate: basicStats.overallCompletionRate,
            totalGoals: basicStats.totalGoals,
            completedGoals: basicStats.completedGoals,
            totalTasks: basicStats.totalTasks,
            completedTasks: basicStats.completedTasks,
            categoryPerformance: [],
            monthlyProgress: [
              {
                month: new Date().getMonth() + 1,
                monthName: new Date().toLocaleDateString('pt-BR', { month: 'long' }),
                goalsCompleted: basicStats.completedGoals,
                tasksCompleted: basicStats.completedTasks,
                plansActive: basicStats.activePlans
              }
            ]
          },
          yearlyComparisons: [],
          topCategories: []
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      // Em caso de erro, usar dados básicos
      setDashboardStats({
        ...basicStats,
        recentActivity: [],
        currentYearStats: {
          year: new Date().getFullYear(),
          totalPlans: basicStats.totalPlans,
          averageCompletionRate: basicStats.overallCompletionRate,
          totalGoals: basicStats.totalGoals,
          completedGoals: basicStats.completedGoals,
          totalTasks: basicStats.totalTasks,
          completedTasks: basicStats.completedTasks,
          categoryPerformance: [],
          monthlyProgress: [
            {
              month: new Date().getMonth() + 1,
              monthName: new Date().toLocaleDateString('pt-BR', { month: 'long' }),
              goalsCompleted: basicStats.completedGoals,
              tasksCompleted: basicStats.completedTasks,
              plansActive: basicStats.activePlans
            }
          ]
        },
        yearlyComparisons: [],
        topCategories: []
      });
    } finally {
      setStatsLoading(false);
    }
  }, [plans, basicStats]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  // Carregar dados essenciais primeiro
  useEffect(() => {
    const loadEssentialData = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        
        // Carregar apenas planos básicos primeiro
        await loadPlans();
        
        // Criar estatísticas básicas imediatamente
        const basicDashboardStats: DashboardStats = {
          ...basicStats,
          recentActivity: [],
          currentYearStats: {
            year: new Date().getFullYear(),
            totalPlans: basicStats.totalPlans,
            averageCompletionRate: basicStats.overallCompletionRate,
            totalGoals: basicStats.totalGoals,
            completedGoals: basicStats.completedGoals,
            totalTasks: basicStats.totalTasks,
            completedTasks: basicStats.completedTasks,
            categoryPerformance: [],
            monthlyProgress: [
              {
                month: new Date().getMonth() + 1,
                monthName: new Date().toLocaleDateString('pt-BR', { month: 'long' }),
                goalsCompleted: basicStats.completedGoals,
                tasksCompleted: basicStats.completedTasks,
                plansActive: basicStats.activePlans
              }
            ]
          },
          yearlyComparisons: [],
          topCategories: []
        };
        
        setDashboardStats(basicDashboardStats);
        setLoading(false);
        setStatsLoading(false); // Garantir que statsLoading seja false quando dados básicos estão prontos

        // Carregar estatísticas em background
        setTimeout(() => {
          loadStatsInBackground();
        }, 500);

      } catch (error) {
        console.error('Erro ao carregar dados essenciais:', error);
        setLoading(false);
        setStatsLoading(false);
      }
    };

    loadEssentialData();
  }, [isAuthenticated]);

  // Atualizar estatísticas quando planos mudarem
  useEffect(() => {
    if (isAuthenticated && plans.length > 0 && !loading) {
      loadStatsInBackground();
    }
  }, [plans, isAuthenticated, loading, loadStatsInBackground]);

  if (authLoading || loading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <DashboardNav currentPage="dashboard" />
        <div className="lg:ml-64 p-6">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-6"></div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                {authLoading ? 'Verificando autenticação...' : 
                 loading ? 'Carregando planos...' : 
                 'Carregando estatísticas...'}
              </h2>
              <p className="text-gray-500">
                Preparando seu dashboard com os dados mais recentes
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav currentPage="dashboard" />
      
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Visão geral dos seus planos e progresso</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => router.push('/dashboard/plans')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Plano</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="p-6">
          {/* Plano Ativo em Destaque */}
          {(() => {
            // Debug: Log de todos os planos
            console.log('🔍 Dashboard - Todos os planos:', plans.map(plan => ({
              title: plan.title,
              status: plan.status,
              totalGoals: plan.totalGoals,
              completedGoals: plan.completedGoals,
              weeks: plan.weeks?.length
            })));

            const activePlan = plans.find(plan => 
              plan.status === 'active' || 
              (plan.weeks && plan.weeks.length > 0 && plan.weeks.some(week => week.goals && week.goals.length > 0)) ||
              (plan.totalGoals && plan.totalGoals > 0) // Incluir planos com objetivos mesmo sem semanas carregadas
            );

            if (!activePlan) {
              return (
                <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Folder className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum plano ativo</h3>
                    <p className="text-gray-600 mb-6">Crie seu primeiro plano para começar sua jornada de 12 semanas</p>
                    <button
                      onClick={() => router.push('/dashboard/plans')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Criar Primeiro Plano
                    </button>
                  </div>
                </div>
              );
            }

            // Calcular estatísticas do plano ativo
            const totalWeeks = activePlan.weeks?.length || 12; // Default para 12 semanas se não especificado
            
            // Verificar se temos dados detalhados (semanas com objetivos) ou dados básicos
            const hasDetailedData = activePlan.weeks && activePlan.weeks.length > 0 && 
              activePlan.weeks.some(week => week.goals && week.goals.length > 0);
            
            // Verificar se temos dados básicos do plano
            const hasBasicData = (activePlan.totalGoals && activePlan.totalGoals > 0) || 
                                (activePlan.completedGoals && activePlan.completedGoals > 0) ||
                                (activePlan.totalTasks && activePlan.totalTasks > 0) ||
                                (activePlan.completedTasks && activePlan.completedTasks > 0);
            
            let totalGoals, completedGoals, totalTasks, completedTasks;
            
            // Priorizar dados da API se disponíveis
            if (dashboardStats && dashboardStats.totalGoals > 0) {
              // Usar dados da API (mais precisos)
              totalGoals = dashboardStats.totalGoals;
              completedGoals = dashboardStats.completedGoals;
              totalTasks = dashboardStats.totalTasks;
              completedTasks = dashboardStats.completedTasks;
              console.log('📊 Dashboard: Usando dados da API para estatísticas do plano');
            } else if (hasDetailedData) {
              // Usar dados detalhados das semanas
              totalGoals = activePlan.weeks.reduce((acc, week) => acc + (week.goals?.length || 0), 0);
              completedGoals = activePlan.weeks.reduce((acc, week) => 
                acc + (week.goals?.filter(goal => goal.completed).length || 0), 0
              );
              totalTasks = activePlan.weeks.reduce((acc, week) => 
                acc + (week.goals?.reduce((goalAcc, goal) => goalAcc + (goal.tasks?.length || 0), 0) || 0), 0
              );
              completedTasks = activePlan.weeks.reduce((acc, week) => 
                acc + (week.goals?.reduce((goalAcc, goal) => 
                  goalAcc + (goal.tasks?.filter(task => task.completed).length || 0), 0
                ) || 0), 0
              );
              console.log('📊 Dashboard: Usando dados detalhados das semanas');
            } else if (hasBasicData) {
              // Usar dados básicos do plano
              totalGoals = activePlan.totalGoals || 0;
              completedGoals = activePlan.completedGoals || 0;
              totalTasks = activePlan.totalTasks || 0;
              completedTasks = activePlan.completedTasks || 0;
              console.log('📊 Dashboard: Usando dados básicos do plano');
            } else {
              // Sem dados disponíveis
              totalGoals = 0;
              completedGoals = 0;
              totalTasks = 0;
              completedTasks = 0;
              console.log('📊 Dashboard: Sem dados disponíveis');
            }

            const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
            const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            // Debug: Log dos dados do plano
            console.log('🔍 Dashboard - Dados do plano ativo:', {
              title: activePlan.title,
              hasDetailedData,
              hasBasicData,
              totalWeeks,
              totalGoals,
              completedGoals,
              totalTasks,
              completedTasks,
              weeks: activePlan.weeks?.length,
              planData: {
                totalGoals: activePlan.totalGoals,
                completedGoals: activePlan.completedGoals,
                totalTasks: activePlan.totalTasks,
                completedTasks: activePlan.completedTasks
              }
            });

            // Calcular semana atual
            const now = new Date();
            const startDate = new Date(activePlan.startDate);
            const weeksSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
            const currentWeek = Math.min(Math.max(weeksSinceStart + 1, 1), totalWeeks);

            // Calcular semanas concluídas
            const completedWeeks = activePlan.weeks?.filter(week => 
              week.goals && week.goals.length > 0 && week.goals.every(goal => goal.completed)
            ).length || 0;

            return (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl shadow-sm border border-blue-200 p-8 mb-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Folder className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">{activePlan.title}</h2>
                        <p className="text-gray-600">{activePlan.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 mt-4">
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        Plano Ativo
                      </span>
                      <span className="text-sm text-gray-600">
                        Semana {currentWeek} de {totalWeeks}
                      </span>
                      <span className="text-sm text-gray-600">
                        {activePlan.year}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => router.push(`/dashboard/plans/${activePlan.id}`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <span>Ver Detalhes</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Estatísticas do Plano */}
                {!hasBasicData && !hasDetailedData && (!dashboardStats || dashboardStats.totalGoals === 0) ? (
                  <div className="bg-white rounded-lg p-6 mb-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Plano sem objetivos ainda</h3>
                      <p className="text-gray-600 mb-4">Este plano ainda não possui objetivos ou tarefas criadas.</p>
                      <button
                        onClick={() => router.push(`/dashboard/plans/${activePlan.id}`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Criar Primeiros Objetivos
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Objetivos</p>
                        <p className="text-2xl font-bold text-gray-900">{completedGoals}/{totalGoals}</p>
                        <p className="text-xs text-gray-700 font-medium">{completionRate}% concluído</p>
                      </div>
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Target className="w-5 h-5 text-purple-600" />
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      ></div>
              </div>
            </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                        <p className="text-sm font-medium text-gray-600">Tarefas</p>
                        <p className="text-2xl font-bold text-gray-900">{completedTasks}/{totalTasks}</p>
                        <p className="text-xs text-gray-700 font-medium">{taskCompletionRate}% concluído</p>
                </div>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${taskCompletionRate}%` }}
                      ></div>
              </div>
            </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                        <p className="text-sm font-medium text-gray-600">Semanas</p>
                        <p className="text-2xl font-bold text-gray-900">{completedWeeks}/{totalWeeks}</p>
                        <p className="text-xs text-gray-700 font-medium">semanas concluídas</p>
                </div>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                </div>
              </div>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0}%` }}
                      ></div>
              </div>
            </div>

                  <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Progresso Geral</p>
                        <p className="text-2xl font-bold text-gray-900">{completionRate}%</p>
                        <p className="text-xs text-gray-700 font-medium">do plano concluído</p>
                      </div>
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-orange-600" />
                      </div>
                    </div>
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${completionRate}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                )}

                {/* Informações Adicionais */}
                <div className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Início</p>
                        <p className="text-base font-semibold text-gray-900">{startDate.toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Fim</p>
                        <p className="text-base font-semibold text-gray-900">{new Date(activePlan.endDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Target className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Média</p>
                        <p className="text-base font-semibold text-gray-900">{totalWeeks > 0 ? (totalGoals / totalWeeks).toFixed(1) : '0'} objetivos/semana</p>
                      </div>
                </div>
              </div>
            </div>
          </div>
            );
          })()}

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => router.push('/dashboard/objectives')}>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Gerenciar Objetivos</h3>
                  <p className="text-sm text-gray-600">Criar e acompanhar seus objetivos</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => router.push('/dashboard/weekly')}>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Planejamento Semanal</h3>
                  <p className="text-sm text-gray-600">Organizar suas semanas</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => router.push('/dashboard/reports')}>
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">Relatórios</h3>
                  <p className="text-sm text-gray-600">Analisar seu progresso</p>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>


          {/* Loading indicator for detailed stats */}
          {statsLoading && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center space-x-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Carregando estatísticas detalhadas...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
