'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Eye, Calendar, Target, CheckCircle, Clock } from 'lucide-react';
// import { TwelveWeekPlan } from '../../../types/dashboard';
import { dashboardService } from '../../../services/dashboardService';
import { usePlansManager } from '../../../hooks/usePlansManager';
import DashboardNav from '../../../components/dashboard/DashboardNav';

export default function PlansPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { plans, loading: plansLoading, loadPlans, activatePlan } = usePlansManager();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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



  const handleCreatePlan = () => {
    // Implementar criação de plano
    console.log('Create plan clicked');
  };

  const handleEditPlan = (planId: string) => {
    // Implementar edição de plano
    console.log('Edit plan:', planId);
  };

  const handleDeletePlan = async (planId: string) => {
    if (confirm('Tem certeza que deseja excluir este plano?')) {
      try {
        const response = await dashboardService.deletePlan(planId);
        if (response.success) {
          await loadPlans();
          setSuccess('Plano excluído com sucesso!');
        } else {
          setError('Erro ao excluir plano');
        }
      } catch (error: unknown) {
        console.error('Error deleting plan:', error);
        setError(error instanceof Error ? error.message : 'Erro ao excluir plano');
      }
    }
  };

  const handleStatusChange = async (planId: string, newStatus: 'active' | 'completed' | 'archived') => {
    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) return;

      // Se estiver ativando o plano, usar o endpoint específico
      if (newStatus === 'active') {
        const response = await activatePlan(planId);
        if (response.success) {
          setSuccess('Plano ativado com sucesso!');
        } else {
          setError(response.error || 'Erro ao ativar plano');
        }
        return;
      }

      // Para outros status, usar o método de atualização geral
      const updatedPlan = {
        ...plan,
        status: newStatus,
        archivedAt: newStatus === 'archived' ? new Date() : undefined
      };

      const response = await dashboardService.updatePlan(planId, updatedPlan);
      if (response.success) {
        await loadPlans();
        setSuccess('Status do plano atualizado com sucesso!');
      } else {
        setError('Erro ao atualizar status do plano');
      }
    } catch (error: unknown) {
      console.error('Error updating plan status:', error);
      setError(error instanceof Error ? error.message : 'Erro ao atualizar status do plano');
    }
  };

  const handleViewPlan = (planId: string) => {
    router.push(`/dashboard/plans/${planId}`);
  };

  if (authLoading || plansLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <DashboardNav currentPage="plans" />
      <div className="flex-1 lg:ml-64">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Meus Planos</span>
              </div>
              <button
                onClick={handleCreatePlan}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Plano</span>
              </button>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-600">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Planos</p>
                  <p className="text-2xl font-bold text-gray-900">{plans.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Planos Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.filter(p => p.status === 'active').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Concluídos</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.filter(p => p.status === 'completed').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Arquivados</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {plans.filter(p => p.status === 'archived').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Plans List */}
          {plansLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando planos...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum plano criado
              </h3>
              <p className="text-gray-600 mb-6">
                Comece criando seu primeiro plano para transformar seus objetivos anuais em resultados extraordinários!
              </p>
              <button
                onClick={handleCreatePlan}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Criar Primeiro Plano</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{plan.title}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{plan.description}</p>
                    </div>
                    <select
                      value={plan.status}
                      onChange={(e) => handleStatusChange(plan.id, e.target.value as 'active' | 'completed' | 'archived')}
                      className={`px-2 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                        plan.status === 'active' ? 'text-green-600 bg-green-100' :
                        plan.status === 'completed' ? 'text-blue-600 bg-blue-100' :
                        'text-gray-600 bg-gray-100'
                      }`}
                    >
                      <option value="active" className="bg-white text-gray-900">Ativo</option>
                      <option value="completed" className="bg-white text-gray-900">Concluído</option>
                      <option value="archived" className="bg-white text-gray-900">Arquivado</option>
                    </select>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{new Date(plan.startDate).toLocaleDateString('pt-BR')} - {new Date(plan.endDate).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Target className="w-4 h-4 mr-2" />
                      <span>{plan.totalGoals} objetivos • {plan.completedGoals} concluídos</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progresso</span>
                        <span>{plan.completionRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${plan.completionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewPlan(plan.id)}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditPlan(plan.id)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePlan(plan.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
