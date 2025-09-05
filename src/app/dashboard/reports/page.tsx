'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, Download, Target, CheckCircle, Filter } from 'lucide-react';
import { TwelveWeekPlan } from '../../../types/dashboard';
import { dashboardService } from '../../../services/dashboardService';
import DashboardNav from '../../../components/dashboard/DashboardNav';

export default function ReportsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<TwelveWeekPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedPlan, setSelectedPlan] = useState<string>('all');

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

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await dashboardService.getPlans();
      if (response.success && response.data) {
        setPlans(response.data);
      } else {
        setPlans([]);
      }
    } catch (error: unknown) {
      console.error('Error loading plans:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar planos');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    if (!plans.length) return null;

    const totalPlans = plans.length;
    const activePlans = plans.filter(p => p.status === 'active').length;
    const completedPlans = plans.filter(p => p.status === 'completed').length;
    const archivedPlans = plans.filter(p => p.status === 'archived').length;

    let totalGoals = 0;
    let completedGoals = 0;
    let totalTasks = 0;
    let completedTasks = 0;
    const categoryStats = new Map<string, { total: number; completed: number }>();

    plans.forEach(plan => {
      if (plan.weeks) {
        plan.weeks.forEach(week => {
          if (week.goals) {
            week.goals.forEach(goal => {
              totalGoals++;
              if (goal.completed) completedGoals++;

              // Categoria stats
              const category = goal.category || 'outros';
              if (!categoryStats.has(category)) {
                categoryStats.set(category, { total: 0, completed: 0 });
              }
              const catStats = categoryStats.get(category)!;
              catStats.total++;
              if (goal.completed) catStats.completed++;

              // Task stats
              if (goal.tasks) {
                goal.tasks.forEach(task => {
                  totalTasks++;
                  if (task.completed) completedTasks++;
                });
              }
            });
          }
        });
      }
    });

    const overallCompletionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalPlans,
      activePlans,
      completedPlans,
      archivedPlans,
      totalGoals,
      completedGoals,
      totalTasks,
      completedTasks,
      overallCompletionRate,
      taskCompletionRate,
      categoryStats: Array.from(categoryStats.entries()).map(([category, stats]) => ({
        category,
        total: stats.total,
        completed: stats.completed,
        completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
      }))
    };
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

  const getCategoryColor = (category: string) => {
    const colors = {
      saude: 'bg-green-500',
      carreira: 'bg-blue-500',
      financas: 'bg-yellow-500',
      relacionamentos: 'bg-pink-500',
      hobbies: 'bg-purple-500',
      outros: 'bg-gray-500'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const handleExportReport = (format: 'pdf' | 'csv' | 'excel') => {
    // Implementar exportação de relatório
    console.log(`Exporting report as ${format}`);
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

  const stats = calculateStats();

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <DashboardNav currentPage="reports" />
      <div className="flex-1 lg:ml-64">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExportReport('pdf')}
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-300 flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filtros:</span>
              </div>
              
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'quarter' | 'year')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="week">Última Semana</option>
                <option value="month">Último Mês</option>
                <option value="quarter">Último Trimestre</option>
                <option value="year">Último Ano</option>
              </select>

              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todos os Planos</option>
                {plans.map(plan => (
                  <option key={plan.id} value={plan.id}>{plan.title}</option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando relatórios...</p>
            </div>
          ) : !stats ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum dado disponível
              </h3>
              <p className="text-gray-600 mb-6">
                Crie alguns planos e objetivos para gerar relatórios interessantes!
              </p>
            </div>
          ) : (
            <>
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total de Planos</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalPlans}</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-indigo-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-2 text-xs">
                    <span className="text-green-600">{stats.activePlans} ativos</span>
                    <span className="text-blue-600">{stats.completedPlans} concluídos</span>
                    <span className="text-gray-600">{stats.archivedPlans} arquivados</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                      <p className="text-2xl font-bold text-green-600">{stats.overallCompletionRate}%</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-600">
                    {stats.completedGoals} de {stats.totalGoals} objetivos
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tarefas Concluídas</p>
                      <p className="text-2xl font-bold text-purple-600">{stats.taskCompletionRate}%</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-600">
                    {stats.completedTasks} de {stats.totalTasks} tarefas
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Produtividade</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {stats.totalGoals > 0 ? Math.round((stats.completedGoals / stats.totalGoals) * 100) : 0}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="mt-4 text-xs text-gray-600">
                    Baseado em objetivos
                  </div>
                </div>
              </div>

              {/* Category Performance */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance por Categoria</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stats.categoryStats.map((category) => (
                    <div key={category.category} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${getCategoryColor(category.category)}`}></div>
                          <span className="font-medium text-gray-900">
                            {getCategoryLabel(category.category)}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          {category.completionRate}%
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            category.completionRate >= 80 ? 'bg-green-500' :
                            category.completionRate >= 50 ? 'bg-yellow-500' :
                            'bg-blue-500'
                          }`}
                          style={{ width: `${category.completionRate}%` }}
                        ></div>
                      </div>
                      
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>{category.completed} concluídos</span>
                        <span>{category.total} total</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Progress Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Progresso Mensal</h3>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">Gráfico de progresso mensal será implementado aqui</p>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Atividade Recente</h3>
                <div className="space-y-4">
                  {plans.slice(0, 5).map((plan) => (
                    <div key={plan.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <Target className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{plan.title}</h4>
                        <p className="text-sm text-gray-600">
                          Criado em {new Date(plan.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          plan.status === 'active' ? 'text-green-600 bg-green-100' :
                          plan.status === 'completed' ? 'text-blue-600 bg-blue-100' :
                          'text-gray-600 bg-gray-100'
                        }`}>
                          {plan.status === 'active' ? 'Ativo' : 
                           plan.status === 'completed' ? 'Concluído' : 'Arquivado'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
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
