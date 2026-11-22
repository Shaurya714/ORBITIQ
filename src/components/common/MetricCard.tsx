import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | React.ReactNode;
  subValue?: string | React.ReactNode;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  highlight?: 'normal' | 'critical' | 'warning' | 'accent';
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subValue,
  badge,
  icon,
  highlight = 'normal',
  className = '',
}) => {
  let borderClasses = 'border-[#E2E1DC]';
  let bgClasses = 'bg-[#FFFFFF]';

  if (highlight === 'critical') {
    borderClasses = 'border-[#C65D5D]/40 bg-[#C65D5D]/5';
  } else if (highlight === 'warning') {
    borderClasses = 'border-[#C58A3C]/40 bg-[#C58A3C]/5';
  } else if (highlight === 'accent') {
    borderClasses = 'border-[#52745C]/40 bg-[#EAF0E9]/40';
  }

  return (
    <div className={`rounded-md border ${borderClasses} ${bgClasses} p-4 transition-colors shadow-xs ${className}`}>
      <div className="flex items-center justify-between text-xs text-[#626A73] font-medium mb-1.5">
        <span>{label}</span>
        <div className="flex items-center gap-1.5">
          {badge}
          {icon && <span className="text-[#858B92]">{icon}</span>}
        </div>
      </div>
      <div className="text-xl font-bold text-[#252A30] font-mono-telemetry tracking-tight">
        {value}
      </div>
      {subValue && (
        <div className="text-xs text-[#858B92] mt-1 font-mono-telemetry truncate">
          {subValue}
        </div>
      )}
    </div>
  );
};
