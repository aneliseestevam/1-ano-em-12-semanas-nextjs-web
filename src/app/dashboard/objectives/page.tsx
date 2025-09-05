'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Target, Clock, Search } from 'lucide-react';
import { Goal } from '../../../types/dashboard';
import { usePlansManager } from '../../../hooks/usePlansManager';
import DashboardNav from '../../../components/dashboard/DashboardNav';

interface GoalWithPlanInfo extends Goal {
  planId: string;
  planTitle: string;
  weekNumber: number;
}

export default function ObjectivesPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { plans, loading: plansLoading, loadPlans } = usePlansManager();
  const [allGoals, setAllGoals] = useState<GoalWithPlanInfo[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<GoalWithPlanInfo[]>([]);
  const [error] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activePlanFilter, setActivePlanFilter] = useState<string>('all');
  const [apiStats, setApiStats] = useState<{ overview?: { plans?: { completedPlans?: number; activePlans?: number; totalPlans?: number; avgDuration?: number }; goals?: { completedGoals?: number; pendingGoals?: number } } } | null>(null);

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
    if (plans.length > 0) {
      extractGoalsFromPlans();
    }
  }, [plans]);

  useEffect(() => {
    filterGoals();
  }, [allGoals, searchTerm, statusFilter, categoryFilter, activePlanFilter]);

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

    if (plans.length > 0) {
      loadApiStats();
    }
  }, [plans]);

  const extractGoalsFromPlans = () => {
    const goals: GoalWithPlanInfo[] = [];
    
    // Filtrar apenas planos ativos
    const activePlans = plans.filter(plan => 
      plan.status === 'active' || 
      (plan.weeks && plan.weeks.length > 0 && plan.weeks.some(week => week.goals && week.goals.length > 0))
    );
    
    activePlans.forEach(plan => {
      if (plan.weeks) {
        plan.weeks.forEach(week => {
          if (week.goals) {
            week.goals.forEach(goal => {
              goals.push({
                ...goal,
                planId: plan.id,
                planTitle: plan.title,
                weekNumber: week.weekNumber
              });
            });
          }
        });
      }
    });
    
    setAllGoals(goals);
  };

  const filterGoals = () => {
    let filtered = [...allGoals];

    if (searchTerm) {
      filtered = filtered.filter(goal => 
        goal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        goal.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(goal => 
        statusFilter === 'completed' ? goal.completed : !goal.completed
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(goal => goal.category === categoryFilter);
    }

    if (activePlanFilter !== 'all') {
      filtered = filtered.filter(goal => goal.planId === activePlanFilter);
    }

    setFilteredGoals(filtered);
  };

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

  const completedGoals = allGoals.filter(goal => goal.completed).length;
  const pendingGoals = allGoals.filter(goal => !goal.completed).length;
  const totalGoals = allGoals.length;

  // Calcular estatísticas do plano ativo
  const activePlans = plans.filter(plan => 
    plan.status === 'active' || 
    (plan.weeks && plan.weeks.length > 0 && plan.weeks.some(week => week.goals && week.goals.length > 0))
  );

  const currentPlan = activePlans[0]; // Pegar o primeiro plano ativo
  const totalWeeks = currentPlan?.weeks?.length || 0;
  const completedWeeks = currentPlan?.weeks?.filter(week => 
    week.goals && week.goals.length > 0 && week.goals.every(goal => goal.completed)
  ).length || 0;
  
  // Calcular semana atual (baseado na data atual)
  const currentWeek = currentPlan ? (() => {
    const now = new Date();
    const startDate = new Date(currentPlan.startDate);
    const weeksSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(weeksSinceStart + 1, 1), totalWeeks);
  })() : 1;

  // Calcular progresso geral do plano
  const overallProgress = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  
  // Calcular média de objetivos por semana
  const avgObjectivesPerWeek = totalWeeks > 0 ? (totalGoals / totalWeeks).toFixed(1) : '0.0';

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <DashboardNav currentPage="objectives" />
      <div className="flex-1 lg:ml-64">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Objetivos do Plano Ativo</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Visualize e gerencie os objetivos do seu plano ativo atual
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Progresso Geral */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Progresso Geral</h2>
              <span className="text-2xl font-bold text-gray-900">{overallProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${overallProgress}%` }}
              ></div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600 mb-2">
                  {apiStats?.overview?.plans?.completedPlans || completedWeeks}
                </p>
                <p className="text-sm font-medium text-gray-600">
                  {apiStats ? 'Planos Concluídos' : 'Semanas Concluídas'}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600 mb-2">
                  {apiStats?.overview?.goals?.completedGoals || completedGoals}
                </p>
                <p className="text-sm font-medium text-gray-600">Objetivos Concluídos</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600 mb-2">
                  {apiStats?.overview?.goals?.pendingGoals || pendingGoals}
                </p>
                <p className="text-sm font-medium text-gray-600">Objetivos Pendentes</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="text-center">
                <p className="text-3xl font-bold text-indigo-600 mb-2">
                  {apiStats?.overview?.plans?.activePlans || currentWeek}
                </p>
                <p className="text-sm font-medium text-gray-600">
                  {apiStats ? 'Planos Ativos' : 'Semana Atual'}
                </p>
              </div>
            </div>
          </div>

          {/* Estatísticas dos Objetivos */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-purple-200 mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Estatísticas dos Objetivos</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-gray-700 font-medium">
                  {apiStats ? `${apiStats.overview?.plans?.totalPlans || 0} planos no total` : `${totalGoals} objetivos no total`}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-yellow-600" />
                </div>
                <span className="text-gray-700 font-medium">
                  {apiStats ? `${apiStats.overview?.plans?.avgDuration || 0} dias em média` : `${avgObjectivesPerWeek} objetivos/semana em média`}
                </span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar objetivos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'pending')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todos os Status</option>
                <option value="completed">Concluídos</option>
                <option value="pending">Pendentes</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todas as Categorias</option>
                <option value="saude">Saúde</option>
                <option value="carreira">Carreira</option>
                <option value="financas">Finanças</option>
                <option value="relacionamentos">Relacionamentos</option>
                <option value="hobbies">Hobbies</option>
                <option value="outros">Outros</option>
              </select>

              <select
                value={activePlanFilter}
                onChange={(e) => setActivePlanFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todos os Planos</option>
                {plans
                  .filter(plan => plan.status === 'active' || (plan.weeks && plan.weeks.length > 0))
                  .map(plan => (
                    <option key={plan.id} value={plan.id}>
                      {plan.title}
                    </option>
                  ))
                }
              </select>
            </div>
          </div>

          {/* Goals List */}
          {plansLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando objetivos...</p>
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {allGoals.length === 0 ? 'Nenhum objetivo encontrado' : 'Nenhum objetivo corresponde aos filtros'}
              </h3>
              <p className="text-gray-600 mb-6">
                {allGoals.length === 0 
                  ? 'Comece criando seus primeiros objetivos para transformar seus sonhos em realidade!'
                  : 'Tente ajustar os filtros de busca para encontrar seus objetivos.'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGoals.map((goal) => (
                <div key={goal.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{goal.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{goal.description}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(goal.category)}`}>
                        {getCategoryLabel(goal.category)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Semana {goal.weekNumber}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p><strong>Plano:</strong> {goal.planTitle}</p>
                    </div>

                    {goal.tasks && goal.tasks.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <p><strong>Tarefas:</strong> {goal.tasks.filter(t => t.completed).length}/{goal.tasks.length} concluídas</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className={`text-sm font-medium ${
                      goal.completed ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      {goal.completed ? 'Concluído' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-8">
              <p className="text-red-600">{error}</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}