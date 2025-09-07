import React from 'react';

interface ProgressCardProps {
  title: string;
  percentage: number;
  color?: string;
  className?: string;
}

export default function ProgressCard({ title, percentage, color = 'from-purple-500 to-purple-600', className = '' }: ProgressCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <span className="text-lg font-bold text-gray-900">{percentage}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
        <div 
          className={`bg-gradient-to-r ${color} h-2 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
