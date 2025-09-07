'use client';

import { useState } from 'react';
import { X, Target, Calendar, Info } from 'lucide-react';

interface GoalCreatorProps {
  open: boolean;
  onClose: () => void;
  onCreateGoal: (goalData: {
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    targetDate: string;
    status: string;
    completed: boolean;
    planId: string;
    weekId: string;
    weekNumber: number;
  }) => void;
  planId: string;
  weekId: string;
  weekNumber: number;
  planTitle?: string;
}

const GoalCreator: React.FC<GoalCreatorProps> = ({ 
  open, 
  onClose, 
  onCreateGoal, 
  planId, 
  weekId, 
  weekNumber,
  planTitle 
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('personal');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [targetDate, setTargetDate] = useState('');

  const handleCreate = () => {
    if (!title.trim()) return;

    const goalData = {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      targetDate: targetDate || new Date().toISOString().split('T')[0],
      status: 'not-started',
      completed: false,
      planId,
      weekId,
      weekNumber
    };

    onCreateGoal(goalData);
    
    // Reset form
    setTitle('');
    setDescription('');
    setCategory('personal');
    setPriority('medium');
    setTargetDate('');
    onClose();
  };

  const handleClose = () => {
    // Reset form
    setTitle('');
    setDescription('');
    setCategory('personal');
    setPriority('medium');
    setTargetDate('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] my-8 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Criar Novo Objetivo
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {planTitle && `Plano: ${planTitle}`} • Semana {weekNumber}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Título do Objetivo *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Aprender React avançado"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva os detalhes do seu objetivo..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="personal">Pessoal</option>
              <option value="professional">Profissional</option>
              <option value="health">Saúde</option>
              <option value="financial">Financeiro</option>
              <option value="education">Educação</option>
              <option value="relationships">Relacionamentos</option>
              <option value="hobbies">Hobbies</option>
              <option value="other">Outros</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Prioridade
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            >
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
            </select>
          </div>

          {/* Target Date */}
          <div>
            <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-2">
              Data Alvo
            </label>
            <div className="relative">
              <input
                id="targetDate"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              />
              <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                <strong>Dica:</strong> Defina objetivos específicos e mensuráveis para maximizar suas chances de sucesso. 
                Use a data alvo para manter o foco e o progresso.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 flex-shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Criar Objetivo
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalCreator;
