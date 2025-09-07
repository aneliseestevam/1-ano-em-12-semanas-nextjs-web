import React from 'react';

interface StatCardProps {
  value: number | string;
  label: string;
  color?: string;
  className?: string;
}

export default function StatCard({ value, label, color = 'text-gray-900', className = '' }: StatCardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 border border-gray-200 ${className}`}>
      <div className="text-center">
        <p className={`text-xl font-bold ${color} mb-1`}>
          {value}
        </p>
        <p className="text-xs text-gray-600">{label}</p>
      </div>
    </div>
  );
}
