'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { Calendar, CheckCircle, Clock } from 'lucide-react';
import { TwelveWeekPlan } from '../../../types/dashboard';
import { dashboardService } from '../../../services/dashboardService';
import DashboardNav from '../../../components/dashboard/DashboardNav';

export default function WeeklyPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<TwelveWeekPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const totalWeeks = plans.reduce((total, plan) => total + (plan.weeks?.length || 0), 0);
  const completedWeeks = plans.reduce((total, plan) => 
    total + (plan.weeks?.filter(week => week.completed).length || 0), 0
  );
  const pendingWeeks = totalWeeks - completedWeeks;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <DashboardNav currentPage="weekly" />
      <div className="flex-1 lg:ml-64">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Planejamento Semanal</h1>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Semanas</p>
                  <p className="text-2xl font-bold text-gray-900">{totalWeeks}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Semanas Concluídas</p>
                  <p className="text-2xl font-bold text-green-600">{completedWeeks}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Semanas Pendentes</p>
                  <p className="text-2xl font-bold text-orange-600">{pendingWeeks}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Plans List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando semanas...</p>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma semana encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                Crie planos para visualizar suas semanas de planejamento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div key={plan.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{plan.title}</h3>
                  
                  {plan.weeks && plan.weeks.length > 0 ? (
                    <div className="space-y-3">
                      {plan.weeks.map((week) => (
                        <div key={week.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">Semana {week.weekNumber}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              week.completed ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
                            }`}>
                              {week.completed ? 'Concluída' : 'Pendente'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>{week.goals?.length || 0} objetivos</p>
                            <p>{week.goals?.filter(g => g.completed).length || 0} concluídos</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Nenhuma semana definida</p>
                  )}
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