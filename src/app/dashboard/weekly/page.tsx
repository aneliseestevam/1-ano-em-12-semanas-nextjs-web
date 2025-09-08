'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { 
  Calendar, 
  CheckCircle, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Target,
  Edit3,
  Trash2,
  Move,
  Filter
} from 'lucide-react';
import { TwelveWeekPlan, Week, Goal, Task } from '../../../types/dashboard';
import { usePlansManager } from '../../../hooks/usePlansManager';
import { useDateMonitoring } from '../../../hooks/useDateMonitoring';
import { PageHeader, StatCard, LoadingSpinner, EmptyState } from '../../../components/ui';
import TaskCreator from '../../../components/dashboard/TaskCreator';
import optimizedPlanService from '../../../services/optimizedPlanService';

// Tipos para o quadro Kanban
interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  tasks: TaskWithContext[];
  dayInfo?: {
    date: Date;
    dayName: string;
    dayNumber: number;
    month: number;
    year: number;
    isToday: boolean;
    isPast: boolean;
  };
}

interface TaskWithContext extends Task {
  goalId: string;
  goalTitle: string;
  weekId: string;
  weekNumber: number;
  planId: string;
  planTitle: string;
}

export default function WeeklyPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const { plans, loading: plansLoading, loadPlans } = usePlansManager();
  const [apiStats, setApiStats] = useState<{ overview?: { weeks?: { totalWeeks?: number; completedWeeks?: number; pendingWeeks?: number } } } | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para o quadro Kanban
  const [selectedPlan, setSelectedPlan] = useState<TwelveWeekPlan | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<Week | null>(null);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [showTaskCreator, setShowTaskCreator] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [loading, setLoading] = useState(false);
  const { currentDate, lastUpdateTime, isNewDay, refreshDate } = useDateMonitoring();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadPlans();
    }
  }, [isAuthenticated, loadPlans]);

  // Função para calcular os dias da semana
  const getWeekDays = (weekNumber: number, planStartDate: Date) => {
    const startDate = new Date(planStartDate);
    // Calcular a data de início da semana específica
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
    
    const days = [];
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const now = currentDate; // Usar a data atual monitorada
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(weekStartDate);
      dayDate.setDate(weekStartDate.getDate() + i);
      
      days.push({
        date: dayDate,
        dayName: dayNames[dayDate.getDay()],
        dayNumber: dayDate.getDate(),
        month: dayDate.getMonth() + 1,
        year: dayDate.getFullYear(),
        isToday: dayDate.toDateString() === now.toDateString(),
        isPast: dayDate < now && !dayDate.toDateString().includes(now.toDateString())
      });
    }
    
    return days;
  };

  // Carregar semanas do plano selecionado com objetivos
  const loadPlanWeeks = async (planId: string) => {
    try {
      console.log('🔄 Carregando semanas do plano:', planId);
      const result = await optimizedPlanService.getPlanWeeks(planId);
      
      if (result.success && result.data.weeks) {
        console.log('✅ Semanas carregadas:', result.data.weeks.length);
        
        // Carregar objetivos para cada semana
        const weeksWithGoals = await Promise.all(
          result.data.weeks.map(async (week: any) => {
            try {
              const goalsResult = await optimizedPlanService.getWeekGoals(planId, week._id);
              if (goalsResult.success) {
                return {
                  ...week,
                  id: week._id,
                  goals: goalsResult.data || []
                };
              } else {
                console.log(`⚠️ Erro ao carregar objetivos da semana ${week.weekNumber}:`, goalsResult.error);
                return {
                  ...week,
                  id: week._id,
                  goals: []
                };
              }
            } catch (error) {
              console.error(`❌ Erro ao carregar objetivos da semana ${week.weekNumber}:`, error);
              return {
                ...week,
                id: week._id,
                goals: []
              };
            }
          })
        );
        
        console.log('✅ Semanas com objetivos carregadas:', weeksWithGoals.length);
        return weeksWithGoals;
      } else {
        console.log('❌ Erro ao carregar semanas:', result.error);
        return [];
      }
    } catch (error) {
      console.error('❌ Erro ao carregar semanas:', error);
      return [];
    }
  };

  // Selecionar o primeiro plano ativo automaticamente e navegar para a semana atual
  useEffect(() => {
    console.log('🔄 useEffect seleção de plano:', {
      plansLength: plans.length,
      selectedPlan: !!selectedPlan,
      selectedPlanId: selectedPlan?.id
    });
    
    if (plans.length > 0 && !selectedPlan) {
      const activePlan = plans.find(plan => plan.status === 'active') || plans[0];
      console.log('📋 Plano selecionado:', {
        id: activePlan.id,
        title: activePlan.title,
        hasWeeks: !!activePlan.weeks,
        weeksLength: activePlan.weeks?.length || 0
      });
      
      setSelectedPlan(activePlan);
      
      // Carregar semanas do plano
      loadPlanWeeks(activePlan.id).then(weeks => {
        if (weeks.length > 0) {
          const planWithWeeks = { ...activePlan, weeks };
          setSelectedPlan(planWithWeeks);
          
          // Tentar encontrar a semana atual
          const today = new Date();
          const currentWeek = weeks.find((week: any) => {
            const weekDays = getWeekDays(week.weekNumber, activePlan.startDate);
            return weekDays.some(day => day.date.toDateString() === today.toDateString());
          });
          
          if (currentWeek) {
            console.log('📅 Semana atual encontrada:', currentWeek.weekNumber);
            setSelectedWeek(currentWeek);
            const weekIndex = weeks.findIndex((w: any) => w.id === currentWeek.id);
            setCurrentWeekIndex(weekIndex);
          } else {
            // Se não encontrar a semana atual, usar a primeira semana
            console.log('📅 Usando primeira semana:', weeks[0].weekNumber);
            setSelectedWeek(weeks[0]);
            setCurrentWeekIndex(0);
          }
        } else {
          console.log('❌ Nenhuma semana encontrada para o plano');
        }
      });
    }
  }, [plans, selectedPlan]);

  // Monitorar mudanças de data e atualizar automaticamente a semana
  useEffect(() => {
    if (isNewDay && selectedPlan && selectedPlan.weeks && selectedPlan.weeks.length > 0) {
      const currentWeek = selectedPlan.weeks.find((week: any) => {
        const weekDays = getWeekDays(week.weekNumber, selectedPlan.startDate);
        return weekDays.some(day => day.date.toDateString() === currentDate.toDateString());
      });
      
      if (currentWeek && currentWeek.id !== selectedWeek?.id) {
        console.log('📅 Mudando para a semana atual:', currentWeek.weekNumber);
        setSelectedWeek(currentWeek);
        const weekIndex = selectedPlan.weeks.findIndex((w: any) => w.id === currentWeek.id);
        setCurrentWeekIndex(weekIndex);
      }
    }
  }, [isNewDay, currentDate, selectedPlan, selectedWeek]);

  // Carregar estatísticas da API
  useEffect(() => {
    const loadApiStats = async () => {
      try {
        const { planService } = await import('../../../services/planService');
        const statsResult = await planService.getAllPlansStats();
        
        if (statsResult.success && statsResult.data) {
          setApiStats(statsResult.data);
          console.log('✅ Estatísticas da API carregadas para weekly:', {
            weeks: statsResult.data.overview?.weeks
          });
        }
      } catch {
        console.warn('⚠️ Não foi possível carregar estatísticas da API para weekly');
      }
    };

    loadApiStats();
  }, []);

  // Gerar colunas do Kanban baseadas nos dias da semana
  const kanbanColumns = useMemo((): KanbanColumn[] => {
    console.log('🔄 kanbanColumns useMemo:', {
      selectedWeek: !!selectedWeek,
      selectedPlan: !!selectedPlan,
      selectedWeekId: selectedWeek?.id,
      selectedPlanId: selectedPlan?.id,
      goalsType: typeof selectedWeek?.goals,
      goalsIsArray: Array.isArray(selectedWeek?.goals),
      goalsLength: selectedWeek?.goals?.length
    });
    
    if (!selectedWeek || !selectedPlan) {
      console.log('❌ kanbanColumns: selectedWeek ou selectedPlan não definidos');
      return [];
    }

    const allTasks: TaskWithContext[] = [];
    
    // Coletar todas as tarefas da semana
    if (selectedWeek.goals && Array.isArray(selectedWeek.goals)) {
      selectedWeek.goals.forEach(goal => {
        if (goal.tasks && Array.isArray(goal.tasks)) {
          goal.tasks.forEach(task => {
            allTasks.push({
              ...task,
              goalId: goal.id,
              goalTitle: goal.title,
              weekId: selectedWeek.id,
              weekNumber: selectedWeek.weekNumber,
              planId: selectedPlan.id,
              planTitle: selectedPlan.title
            });
          });
        }
      });
    }

    // Calcular os dias da semana
    const weekDays = getWeekDays(selectedWeek.weekNumber, selectedPlan.startDate);
    
    // Criar colunas para cada dia da semana
    const columns: KanbanColumn[] = weekDays.map(day => {
      // Filtrar tarefas para este dia (baseado na data de vencimento ou distribuição)
      const dayTasks = allTasks.filter(task => {
        if (task.dueDate) {
          const taskDate = new Date(task.dueDate);
          return taskDate.toDateString() === day.date.toDateString();
        }
        // Se não tem data de vencimento, distribuir por prioridade
        return false;
      });

      // Se não há tarefas com data específica, distribuir as tarefas sem data
      if (dayTasks.length === 0) {
        const tasksWithoutDate = allTasks.filter(task => !task.dueDate);
        if (tasksWithoutDate.length > 0) {
          // Distribuir tarefas sem data pelos dias da semana
          const tasksPerDay = Math.ceil(tasksWithoutDate.length / 7);
          const dayIndex = weekDays.indexOf(day);
          const startIndex = dayIndex * tasksPerDay;
          const endIndex = Math.min(startIndex + tasksPerDay, tasksWithoutDate.length);
          dayTasks.push(...tasksWithoutDate.slice(startIndex, endIndex));
        }
      }

      return {
        id: `day-${day.dayNumber}`,
        title: `${day.dayName} ${day.dayNumber}/${day.month}`,
        color: day.isToday 
          ? 'bg-blue-100 border-blue-400' 
          : day.isPast 
            ? 'bg-gray-100 border-gray-300' 
            : 'bg-white border-gray-300',
        tasks: dayTasks,
        dayInfo: day
      };
    });

    return columns;
  }, [selectedWeek, selectedPlan]);

  // Funções de navegação
  const navigateWeek = (direction: 'prev' | 'next') => {
    if (!selectedPlan?.weeks) return;
    
    const newIndex = direction === 'prev' 
      ? Math.max(0, currentWeekIndex - 1)
      : Math.min(selectedPlan.weeks.length - 1, currentWeekIndex + 1);
    
    setCurrentWeekIndex(newIndex);
    setSelectedWeek(selectedPlan.weeks[newIndex]);
  };

  const selectWeek = (week: Week) => {
    setSelectedWeek(week);
    const weekIndex = selectedPlan?.weeks?.findIndex(w => w.id === week.id) || 0;
    setCurrentWeekIndex(weekIndex);
  };

  // Funções para manipulação de tarefas
  const handleCreateTask = (goal: Goal) => {
    setSelectedGoal(goal);
    setShowTaskCreator(true);
  };

  const handleToggleTask = async (task: TaskWithContext) => {
    try {
      setLoading(true);
      const { taskService } = await import('../../../services/taskService');
      
      if (task.completed) {
        await taskService.uncompleteTask(task.planId, task.weekId, task.goalId, task.id);
      } else {
        await taskService.completeTask(task.planId, task.weekId, task.goalId, task.id);
      }
      
      // Recarregar planos para atualizar dados
      await loadPlans();
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
      setError('Erro ao atualizar tarefa');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (task: TaskWithContext) => {
    if (!confirm('Tem certeza que deseja excluir esta tarefa?')) return;
    
    try {
      setLoading(true);
      const { taskService } = await import('../../../services/taskService');
      await taskService.deleteTask(task.planId, task.weekId, task.goalId, task.id);
      
      // Recarregar planos para atualizar dados
      await loadPlans();
    } catch (error) {
      console.error('Erro ao excluir tarefa:', error);
      setError('Erro ao excluir tarefa');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = async () => {
    // Recarregar planos para atualizar dados
    await loadPlans();
  };

  const goToCurrentWeek = async () => {
    if (!selectedPlan) return;
    
    // Se não tem semanas carregadas, carregar primeiro
    if (!selectedPlan.weeks || selectedPlan.weeks.length === 0) {
      const weeks = await loadPlanWeeks(selectedPlan.id);
      if (weeks.length > 0) {
        const planWithWeeks = { ...selectedPlan, weeks };
        setSelectedPlan(planWithWeeks);
        
        const currentWeek = weeks.find((week: any) => {
          const weekDays = getWeekDays(week.weekNumber, selectedPlan.startDate);
          return weekDays.some(day => day.date.toDateString() === currentDate.toDateString());
        });
        
        if (currentWeek) {
          setSelectedWeek(currentWeek);
          const weekIndex = weeks.findIndex((w: any) => w.id === currentWeek.id);
          setCurrentWeekIndex(weekIndex);
        }
      }
      return;
    }
    
    const currentWeek = selectedPlan.weeks.find((week: any) => {
      const weekDays = getWeekDays(week.weekNumber, selectedPlan.startDate);
      return weekDays.some(day => day.date.toDateString() === currentDate.toDateString());
    });
    
    if (currentWeek) {
      setSelectedWeek(currentWeek);
      const weekIndex = selectedPlan.weeks.findIndex((w: any) => w.id === currentWeek.id);
      setCurrentWeekIndex(weekIndex);
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
    <div>
        <PageHeader title="Planejamento Semanal" icon={Calendar} iconColor="from-blue-600 to-indigo-600" />

        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard 
              value={totalWeeks}
              label="Total de Semanas"
              color="text-gray-900"
            />
            <StatCard 
              value={completedWeeks}
              label="Semanas Concluídas"
              color="text-green-600"
            />
            <StatCard 
              value={pendingWeeks}
              label="Semanas Pendentes"
              color="text-orange-600"
            />
          </div>

          {plansLoading ? (
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
          <div className="space-y-6">
            {/* Seletor de Plano e Semana */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Seletor de Plano */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Plano
                    </label>
                    <select
                      value={selectedPlan?.id || ''}
                      onChange={(e) => {
                        const plan = plans.find(p => p.id === e.target.value);
                        if (plan) {
                          setSelectedPlan(plan);
                          if (plan.weeks && plan.weeks.length > 0) {
                            setSelectedWeek(plan.weeks[0]);
                            setCurrentWeekIndex(0);
                          }
                        }
                      }}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      {plans.map(plan => (
                        <option key={plan.id} value={plan.id}>
                          {plan.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Navegação de Semana */}
                  {selectedPlan?.weeks && selectedPlan.weeks.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Semana
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigateWeek('prev')}
                          disabled={currentWeekIndex === 0}
                          className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <select
                          value={selectedWeek?.id || ''}
                          onChange={(e) => {
                            const week = selectedPlan.weeks?.find(w => w.id === e.target.value);
                            if (week) selectWeek(week);
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          {selectedPlan.weeks.map((week, index) => (
                            <option key={week.id || `week-${week.weekNumber}-${index}`} value={week.id}>
                              Semana {week.weekNumber}
                            </option>
                          ))}
                        </select>
                        
                        <button
                          onClick={() => navigateWeek('next')}
                          disabled={currentWeekIndex === (selectedPlan.weeks?.length || 1) - 1}
                          className="p-2 rounded-md border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={goToCurrentWeek}
                          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          title="Ir para a semana atual"
                        >
                          Hoje
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Informações da Semana */}
                {selectedWeek && (
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      <p><strong>Semana {selectedWeek.weekNumber}</strong></p>
                      <p>{selectedWeek.goals && Array.isArray(selectedWeek.goals) ? selectedWeek.goals.length : 0} objetivos</p>
                      <p>{selectedWeek.goals && Array.isArray(selectedWeek.goals) ? selectedWeek.goals.reduce((total, goal) => total + (goal.tasks?.length || 0), 0) : 0} tarefas</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quadro Kanban */}
            {(() => {
              console.log('🔄 Renderização do Kanban:', {
                selectedWeek: !!selectedWeek,
                selectedPlan: !!selectedPlan,
                kanbanColumnsLength: kanbanColumns.length
              });
              return selectedWeek && selectedPlan;
            })() && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Tarefas da Semana {selectedWeek?.weekNumber}
                  </h2>
                  <div className="text-sm text-gray-600">
                    {kanbanColumns.reduce((total, col) => total + col.tasks.length, 0)} tarefas
                  </div>
                </div>

                {/* Colunas do Kanban - Dias da Semana */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
                  {kanbanColumns.map(column => (
                    <div key={column.id} className={`rounded-lg border-2 ${column.color} p-3`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className={`font-semibold text-sm ${
                            column.dayInfo?.isToday ? 'text-blue-700' : 'text-gray-900'
                          }`}>
                            {column.dayInfo?.dayName}
                          </h3>
                          <p className={`text-xs ${
                            column.dayInfo?.isToday ? 'text-blue-600' : 'text-gray-600'
                          }`}>
                            {column.dayInfo?.dayNumber}/{column.dayInfo?.month}
                          </p>
                        </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          column.dayInfo?.isToday 
                            ? 'bg-blue-200 text-blue-700' 
                            : 'bg-white text-gray-600'
                            }`}>
                          {column.tasks.length}
                            </span>
                          </div>

                      <div className="space-y-2 min-h-[150px]">
                        {column.tasks.length === 0 ? (
                          <div className="text-center py-6 text-gray-500">
                            <Target className="w-6 h-6 mx-auto mb-1 opacity-50" />
                            <p className="text-xs">Nenhuma tarefa</p>
                          </div>
                        ) : (
                          column.tasks.map(task => (
                            <div
                              key={task.id}
                              className={`group rounded-lg border p-3 shadow-sm hover:shadow-md transition-shadow ${
                                task.completed 
                                  ? 'bg-green-50 border-green-200' 
                                  : 'bg-white border-gray-200'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900 text-xs leading-tight">
                                  {task.title}
                                </h4>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => handleToggleTask(task)}
                                    disabled={loading}
                                    className="p-1 hover:bg-gray-100 rounded transition-colors"
                                    title={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
                                  >
                                    <CheckCircle 
                                      className={`w-3 h-3 ${
                                        task.completed ? 'text-green-600' : 'text-gray-400'
                                      }`} 
                                    />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(task)}
                                    disabled={loading}
                                    className="p-1 hover:bg-red-100 rounded transition-colors"
                                    title="Excluir tarefa"
                                  >
                                    <Trash2 className="w-3 h-3 text-red-500" />
                                  </button>
                                </div>
                              </div>
                              
                              {task.description && (
                                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500 truncate">
                                  {task.goalTitle}
                                </span>
                                <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                  task.priority === 'high' ? 'bg-red-100 text-red-600' :
                                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                  {task.priority === 'high' ? 'Alta' : 
                                   task.priority === 'medium' ? 'Média' : 'Baixa'}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                          </div>
                        </div>
                      ))}
                    </div>
              </div>
            )}

            {/* Lista de Objetivos para Adicionar Tarefas */}
            {selectedWeek && selectedPlan && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Objetivos da Semana {selectedWeek.weekNumber}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedWeek.goals && Array.isArray(selectedWeek.goals) ? selectedWeek.goals.map(goal => (
                    <div key={goal.id} className="group border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{goal.title}</h4>
                        <button
                          onClick={() => handleCreateTask(goal)}
                          className="p-2 hover:bg-blue-100 rounded transition-colors opacity-0 group-hover:opacity-100"
                          title="Adicionar tarefa"
                        >
                          <Plus className="w-4 h-4 text-blue-600" />
                        </button>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">{goal.description}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{goal.tasks?.length || 0} tarefas</span>
                        <span className={`px-2 py-1 rounded-full ${
                          goal.completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {goal.completed ? 'Concluído' : 'Pendente'}
                        </span>
                      </div>
                    </div>
                  )) : (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhum objetivo encontrado para esta semana</p>
                    </div>
                  )}
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

      {/* Task Creator Modal */}
      <TaskCreator
        isOpen={showTaskCreator}
        onClose={() => setShowTaskCreator(false)}
        goal={selectedGoal}
        planId={selectedPlan?.id || ''}
        weekId={selectedWeek?.id || ''}
        onTaskCreated={handleTaskCreated}
      />
    </div>
  );
}