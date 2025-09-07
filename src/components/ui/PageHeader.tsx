import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  subtitle?: string;
}

export default function PageHeader({ title, icon: Icon, iconColor = 'from-green-600 to-emerald-600', subtitle }: PageHeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center py-4">
          <div className={`w-8 h-8 bg-gradient-to-br ${iconColor} rounded-lg flex items-center justify-center`}>
            <Icon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 ml-3">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-600 ml-4">{subtitle}</p>
          )}
        </div>
      </div>
    </header>
  );
}
