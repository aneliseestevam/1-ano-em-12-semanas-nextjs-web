"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../hooks/useAuth';
import { planService } from '../../../../services/planService';
import { TwelveWeekPlan, Week, Goal } from '../../../../types/dashboard';
import { ArrowLeft, Calendar, Target, CheckCircle, Circle, TrendingUp } from 'lucide-react';

export default function PlanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [plan, setPlan] = useState<TwelveWeekPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const planId = params.id as string;

  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/');
      return;
    }

    if (isAuthenticated && planId) {
      loadPlan();
    }
  }, [isAuthenticated, authLoading, planId, router]);

  const loadPlan = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await planService.getPlan(planId);
      if (response.success && response.data) {
        setPlan(response.data);
      } else {
        setError(response.error || 'Erro ao carregar plano');
      }
    } catch (error: unknown) {
      console.error('Erro ao carregar plano:', error);
      setError(error instanceof Error ? error.message : 'Erro ao carregar plano');
    } finally {
      setLoading(false);
    }
  };

  const getWeekProgress = (week: Week) => {
    if (!week.goals || week.goals.length === 0) return 0;
    const completedGoals = week.goals.filter(goal => goal.completed).length;
    return Math.round((completedGoals / week.goals.length) * 100);
  };

  const getGoalStatusIcon = (goal: Goal) => {
    if (goal.completed) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <Circle className="w-5 h-5 text-gray-400" />;
  };

  const getGoalStatusColor = (goal: Goal) => {
    if (goal.completed) {
      return 'text-green-600 bg-green-50 border-green-200';
    }
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-4">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500 text-xl mb-4">{error}</div>
            <button
              onClick={() => router.push('/dashboard/plans')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Voltar para Planos
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="text-gray-500 text-xl mb-4">Plano não encontrado</div>
            <button
              onClick={() => router.push('/dashboard/plans')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Voltar para Planos
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard/plans')}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{plan.title}</h1>
                <p className="text-gray-500">{plan.description}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                plan.status === 'active' ? 'text-green-600 bg-green-100' :
                plan.status === 'completed' ? 'text-blue-600 bg-blue-100' :
                'text-gray-600 bg-gray-100'
              }`}>
                {plan.status === 'active' ? 'Ativo' :
                 plan.status === 'completed' ? 'Concluído' : 'Arquivado'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Plan Overview */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {plan.weeks?.length || 0}
              </div>
              <div className="text-sm text-gray-500">Semanas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {plan.weeks?.reduce((total, week) => 
                  total + (week.goals?.length || 0), 0) || 0}
              </div>
              <div className="text-sm text-gray-500">Objetivos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {plan.weeks?.reduce((total, week) => 
                  total + (week.goals?.filter(goal => goal.completed).length || 0), 0) || 0}
              </div>
              <div className="text-sm text-gray-500">Concluídos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {plan.weeks?.reduce((total, week) => {
                  const weekGoals = week.goals?.length || 0;
                  const completedGoals = week.goals?.filter(goal => goal.completed).length || 0;
                  return total + (weekGoals > 0 ? Math.round((completedGoals / weekGoals) * 100) : 0);
                }, 0) / Math.max(plan.weeks?.length || 1, 1) || 0}%
              </div>
              <div className="text-sm text-gray-500">Progresso Geral</div>
            </div>
          </div>
        </div>

        {/* Weeks Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {plan.weeks?.map((week, weekIndex) => (
            <div key={week.id || weekIndex} className="bg-white rounded-lg shadow-sm border">
              {/* Week Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold text-gray-900">
                      Semana {week.weekNumber || weekIndex + 1}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600">
                      {getWeekProgress(week)}%
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getWeekProgress(week)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Goals List */}
              <div className="p-4">
                {week.goals && week.goals.length > 0 ? (
                  <div className="space-y-3">
                    {week.goals.map((goal, goalIndex) => (
                      <div
                        key={goal.id || goalIndex}
                        className={`p-3 rounded-lg border ${getGoalStatusColor(goal)}`}
                      >
                        <div className="flex items-start space-x-3">
                          {getGoalStatusIcon(goal)}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900">
                              {goal.title}
                            </h4>
                            {goal.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {goal.description}
                              </p>
                            )}
                            {goal.category && (
                              <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                                {goal.category}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Target className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Nenhum objetivo definido</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {(!plan.weeks || plan.weeks.length === 0) && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma semana definida
            </h3>
            <p className="text-gray-500 mb-6">
              Este plano ainda não possui semanas ou objetivos definidos.
            </p>
            <button
              onClick={() => router.push('/dashboard/plans')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Voltar para Planos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
