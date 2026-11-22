import React from 'react';
import { SearchX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: LucideIcon;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText,
  onAction,
  icon: Icon = SearchX,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-[#FFFFFF] rounded-md border border-[#E2E1DC] shadow-xs ${className}`}>
      <div className="p-3 bg-[#F0EFEA] rounded-full text-[#626A73] mb-3 border border-[#E2E1DC]">
        <Icon className="w-6 h-6 text-[#52745C]" />
      </div>
      <h4 className="text-sm font-semibold text-[#252A30] mb-1">{title}</h4>
      <p className="text-xs text-[#626A73] max-w-sm mb-4 leading-relaxed">{description}</p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#52745C] hover:bg-[#64866D] rounded-md transition-colors cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
