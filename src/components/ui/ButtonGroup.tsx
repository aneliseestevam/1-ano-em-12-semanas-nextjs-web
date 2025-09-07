import React from 'react';

interface ButtonGroupProps {
  options: Array<{
    value: string | number;
    label: string;
  }>;
  selectedValue: string | number;
  onSelect: (value: string | number) => void;
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function ButtonGroup({ 
  options, 
  selectedValue, 
  onSelect, 
  title,
  subtitle,
  className = ''
}: ButtonGroupProps) {
  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 border border-gray-200 ${className}`}>
      {(title || subtitle) && (
        <div className="flex items-center justify-between mb-3">
          {title && <span className="text-sm font-medium text-gray-700">{title}</span>}
          {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
              selectedValue === option.value
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
