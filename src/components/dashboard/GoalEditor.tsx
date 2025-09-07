'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Info, Save, Trash2 } from 'lucide-react';

interface GoalEditorProps {
  open: boolean;
  onClose: () => void;
  onUpdateGoal: (goalId: string, goalData: {
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    targetDate: string;
  }) => void;
  onDeleteGoal: (goalId: string) => void;
  goal: {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high';
    targetDate: string;
    completed: boolean;
  };
  planTitle?: string;
  weekNumber: number;
}

const GoalEditor: React.FC<GoalEditorProps> = ({ 
  open, 
  onClose, 
  onUpdateGoal,
  onDeleteGoal,
  goal,
  planTitle,
  weekNumber
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('saude');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [targetDate, setTargetDate] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Carregar dados do objetivo quando o modal abrir
  useEffect(() => {
    if (open && goal) {
      setTitle(goal.title || '');
      setDescription(goal.description || '');
      setCategory(goal.category || 'saude');
      setPriority(goal.priority || 'medium');
      setTargetDate(goal.targetDate ? goal.targetDate.split('T')[0] : '');
    }
  }, [open, goal]);

  const handleUpdate = () => {
    if (!title.trim()) return;

    const goalData = {
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      targetDate: targetDate || new Date().toISOString().split('T')[0]
    };

    onUpdateGoal(goal.id, goalData);
    onClose();
  };

  const handleDelete = () => {
    onDeleteGoal(goal.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleClose = () => {
    setShowDeleteConfirm(false);
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
              Editar Objetivo
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900 placeholder-gray-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none text-gray-900 placeholder-gray-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
            >
              <option value="saude">Saúde</option>
              <option value="carreira">Carreira</option>
              <option value="financas">Finanças</option>
              <option value="relacionamentos">Relacionamentos</option>
              <option value="hobbies">Hobbies</option>
              <option value="outros">Outros</option>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-gray-900"
              />
              <Calendar className="absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                <strong>Dica:</strong> Mantenha seus objetivos específicos e mensuráveis. 
                A data alvo ajuda a manter o foco e acompanhar o progresso.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 flex-shrink-0">
          {/* Delete Button */}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir</span>
          </button>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleUpdate}
              disabled={!title.trim()}
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-[101] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirmar Exclusão
                </h3>
                <p className="text-gray-600 mb-6">
                  Tem certeza que deseja excluir este objetivo? Esta ação não pode ser desfeita.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalEditor;
