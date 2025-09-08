'use client';

import { useState } from 'react';
import { X, Save, Calendar, Clock } from 'lucide-react';
import { Goal } from '../../types/dashboard'

interface TaskCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  planId: string;
  weekId: string;
  onTaskCreated: () => void;
}

export default function TaskCreator({ 
  isOpen, 
  onClose, 
  goal, 
  planId, 
  weekId, 
  onTaskCreated 
}: TaskCreatorProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim() || !goal) return;

    setLoading(true);
    try {
      const { taskService } = await import('../../services/taskService');
      
      const taskData = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        estimatedTime: estimatedTime ? parseInt(estimatedTime) : undefined,
        dueDate: dueDate || undefined
      };

      const result = await taskService.createTask(planId, weekId, goal.id, taskData);

      if (result.success) {
        // Limpar formulário
        setTitle('');
        setDescription('');
        setPriority('medium');
        setEstimatedTime('');
        setDueDate('');
        
        // Fechar modal e notificar sucesso
        onClose();
        onTaskCreated();
      } else {
        console.error('Erro ao criar tarefa:', result.error);
        alert('Erro ao criar tarefa: ' + (result.error?.message || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
      alert('Erro ao criar tarefa');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setEstimatedTime('');
    setDueDate('');
    onClose();
  };

  if (!isOpen || !goal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Nova Tarefa</h2>
            <p className="text-sm text-gray-600">Objetivo: {goal.title}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
          {/* Título */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              placeholder="Digite o título da tarefa"
              maxLength={200}
            />
          </div>

          {/* Descrição */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 placeholder-gray-500"
              placeholder="Descreva a tarefa (opcional)"
              maxLength={500}
            />
          </div>

          {/* Prioridade */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Prioridade
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>

          {/* Tempo Estimado */}
          <div>
            <label htmlFor="estimatedTime" className="block text-sm font-medium text-gray-700 mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Tempo Estimado (minutos)
            </label>
            <input
              type="number"
              id="estimatedTime"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              placeholder="Ex: 30"
              min="1"
            />
          </div>

          {/* Data Limite */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              Data Limite
            </label>
            <input
              type="date"
              id="dueDate"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{loading ? 'Criando...' : 'Criar Tarefa'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
