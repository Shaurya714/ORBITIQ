import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-[#858B92] mb-4 font-mono-telemetry ${className}`}>
      <ol className="flex items-center space-x-1.5 flex-wrap">
        <li>
          <Link to="/" className="hover:text-[#252A30] transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-[#858B92]" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={idx} className="flex items-center space-x-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-[#858B92] shrink-0" />
              {item.to && !isLast ? (
                <Link to={item.to} className="text-[#626A73] hover:text-[#252A30] transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-[#252A30] font-semibold truncate max-w-[240px]">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
