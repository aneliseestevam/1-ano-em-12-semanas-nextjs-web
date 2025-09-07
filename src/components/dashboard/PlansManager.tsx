'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Copy, 
  Play,
  Calendar,
  TrendingUp,
  X
} from 'lucide-react';
import { TwelveWeekPlan } from '../../types/dashboard';
import PlanCreator from './PlanCreator';

interface PlansManagerProps {
  open: boolean;
  onClose: () => void;
  plans: TwelveWeekPlan[];
  currentPlanId: string | null;
  onSelectPlan: (planId: string) => void;
  onDeletePlan: (planId: string) => void;
  onDuplicatePlan: (planId: string) => void;
  onCreatePlan: (title: string, description: string, startDate: Date, year: number) => void;
}

const PlansManager: React.FC<PlansManagerProps> = ({
  open,
  onClose,
  plans,
  currentPlanId,
  onSelectPlan,
  onDeletePlan,
  onDuplicatePlan,
  onCreatePlan,
}) => {
  const [showPlanCreator, setShowPlanCreator] = useState(false);

  const handleCreatePlan = (title: string, description: string, startDate: Date, year: number) => {
    onCreatePlan(title, description, startDate, year);
    setShowPlanCreator(false);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600 bg-green-100';
    if (progress >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'archived': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'completed': return 'Concluído';
      case 'archived': return 'Arquivado';
      default: return 'Desconhecido';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const calculateOverallProgress = (plan: TwelveWeekPlan) => {
    if (plan.totalGoals === 0) return 0;
    return Math.round((plan.completedGoals / plan.totalGoals) * 100);
  };

  if (!open) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] my-8 flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Meus Planos
            </h2>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowPlanCreator(true)}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Plano</span>
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {plans.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Nenhum plano criado ainda
                </h3>
                <p className="text-gray-600 mb-6">
                  Crie seu primeiro plano para começar a transformar seus objetivos em 12 semanas!
                </p>
                <button
                  onClick={() => setShowPlanCreator(true)}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Primeiro Plano</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {plans.map((plan) => {
                  const progress = calculateOverallProgress(plan);
                  const completedWeeks = plan.weeks.filter(week => week.completed).length;
                  const totalGoals = plan.totalGoals;
                  const completedGoals = plan.completedGoals;

                  return (
                    <div
                      key={plan.id}
                      className={`border rounded-xl p-6 transition-all duration-300 hover:shadow-lg ${
                        currentPlanId === plan.id 
                          ? 'border-indigo-500 bg-indigo-50' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-xl font-bold text-gray-900">
                              {plan.title}
                            </h3>
                            {currentPlanId === plan.id && (
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-semibold">
                                Ativo
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(plan.status)}`}>
                              {getStatusText(plan.status)}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-gray-600 mb-4">
                            {plan.description}
                          </p>

                          {/* Info Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {completedWeeks} de {plan.weeks.length} semanas • {completedGoals} de {totalGoals} objetivos
                              </span>
                            </div>
                          </div>

                          {/* Progress */}
                          <div className="flex items-center space-x-3">
                            <span className="text-sm text-gray-600">Progresso:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getProgressColor(progress)}`}>
                              {progress}%
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {currentPlanId !== plan.id && (
                            <button
                              onClick={() => onSelectPlan(plan.id)}
                              className="p-2 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                              title="Ativar plano"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => onDuplicatePlan(plan.id)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            title="Duplicar plano"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => onDeletePlan(plan.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            title="Excluir plano"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {plans.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Dica:</strong> Você pode ter múltiplos planos ativos. Use o botão &quot;Ativar&quot; para alternar entre eles.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>

      {/* Plan Creator Modal */}
      <PlanCreator
        open={showPlanCreator}
        onClose={() => setShowPlanCreator(false)}
        onCreatePlan={handleCreatePlan}
      />
    </>
  );
};

export default PlansManager;
