'use client';

import React from 'react';
import { 
  TrendingUp, 
  Calendar, 
  CheckCircle, 
  Flag, 
  FileText,
  BarChart3
} from 'lucide-react';
import { TwelveWeekPlan } from '../../types/dashboard';

interface PlanOverviewProps {
  plan: TwelveWeekPlan;
  onStartPlan?: () => void;
}

const PlanOverview: React.FC<PlanOverviewProps> = ({ plan, onStartPlan }) => {
  const weeks = plan.weeks || [];
  const currentWeek = weeks.find(week => !week.completed) || weeks[weeks.length - 1];
  const overallProgress = plan.completionRate || 0;
  
  const completedWeeks = weeks.filter(week => week.completed).length;
  const totalGoals = plan.totalGoals || 0;
  const completedGoals = plan.completedGoals || 0;
  const pendingGoals = totalGoals - completedGoals;
  const averageGoalsPerWeek = totalGoals > 0 ? (totalGoals / weeks.length).toFixed(1) : '0';

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  // const getCategoryIcon = (category: string) => {
  //   switch (category) {
  //     case 'saude': return '🏃‍♂️';
  //     case 'carreira': return '💼';
  //     case 'financas': return '💰';
  //     case 'relacionamentos': return '❤️';
  //     case 'hobbies': return '🎨';
  //     default: return '📋';
  //   }
  // };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 mb-8">
      {/* Título e descrição */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        {plan.title}
      </h2>
      
      <p className="text-gray-600 mb-6 text-sm">
        {plan.description}
      </p>

      {/* Informações principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center p-3 bg-indigo-50 rounded-lg">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mr-3">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
            </p>
            <p className="text-xs text-gray-600">Período do plano</p>
          </div>
        </div>
        
        <div className="flex items-center p-3 bg-orange-50 rounded-lg">
          <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mr-3">
            <Flag className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {completedWeeks} de {weeks.length} semanas concluídas
            </p>
            <p className="text-xs text-gray-600">Progresso semanal</p>
          </div>
        </div>
      </div>

      {/* Progresso geral */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Progresso Geral
          </h3>
          <span className="text-2xl font-bold text-indigo-600">
            {overallProgress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-indigo-600 to-purple-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-indigo-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600 mb-1">
            {completedWeeks}
          </div>
          <div className="text-xs text-gray-600 font-medium">
            Semanas Concluídas
          </div>
        </div>
        
        <div className="bg-white border border-green-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {completedGoals}
          </div>
          <div className="text-xs text-gray-600 font-medium">
            Objetivos Concluídos
          </div>
        </div>
        
        <div className="bg-white border border-orange-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600 mb-1">
            {pendingGoals}
          </div>
          <div className="text-xs text-gray-600 font-medium">
            Objetivos Pendentes
          </div>
        </div>
        
        <div className="bg-white border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {currentWeek ? currentWeek.weekNumber : '-'}
          </div>
          <div className="text-xs text-gray-600 font-medium">
            Semana Atual
          </div>
        </div>
      </div>

      {/* Estatísticas dos objetivos */}
      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg mb-6 border border-indigo-200">
        <h4 className="text-sm font-bold text-indigo-700 mb-3 flex items-center">
          <BarChart3 className="w-4 h-4 mr-2" />
          Estatísticas dos Objetivos
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mr-3">
              <FileText className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              <strong>{totalGoals}</strong> objetivos no total
            </span>
          </div>
          <div className="flex items-center">
            <div className="w-6 h-6 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center mr-3">
              <TrendingUp className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-700">
              <strong>{averageGoalsPerWeek}</strong> objetivos/semana em média
            </span>
          </div>
        </div>
      </div>

      {/* Semana atual */}
      {currentWeek && (
        <div className="p-4 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg mb-6 text-white">
          <h4 className="text-lg font-bold mb-2">
            Semana Atual: Semana {currentWeek.weekNumber}
          </h4>
          <p className="text-sm opacity-90 mb-3">
            Foque nos objetivos desta semana para manter o progresso!
          </p>
          <div className="flex gap-2">
            <span className="px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs font-semibold">
              {currentWeek.goals.length} objetivo{currentWeek.goals.length !== 1 ? 's' : ''}
            </span>
            <span className="px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs font-semibold">
              {currentWeek.goals.filter(g => g.completed).length} concluído{currentWeek.goals.filter(g => g.completed).length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Botão de começar plano */}
      {onStartPlan && (
        <div className="text-center">
          <button
            onClick={onStartPlan}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 flex items-center space-x-2 mx-auto"
          >
            <CheckCircle className="w-5 h-5" />
            <span>Começar Plano</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PlanOverview;
