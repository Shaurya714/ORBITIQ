import React from 'react';
import type { RiskLevel, EventStatus } from '../../types/conjunction';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs font-medium';

  switch (level) {
    case 'CRITICAL':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border border-[#C65D5D]/40 bg-[#C65D5D]/10 text-[#C65D5D] font-mono-telemetry font-semibold ${sizeClasses}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#C65D5D] animate-pulse" />
          Critical Risk
        </span>
      );
    case 'HIGH':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border border-[#C47C61]/40 bg-[#C47C61]/10 text-[#C47C61] font-mono-telemetry font-semibold ${sizeClasses}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#C47C61]" />
          High Risk
        </span>
      );
    case 'MODERATE':
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border border-[#C58A3C]/40 bg-[#C58A3C]/10 text-[#C58A3C] font-mono-telemetry ${sizeClasses}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#C58A3C]" />
          Moderate
        </span>
      );
    case 'LOW':
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-md border border-[#E2E1DC] bg-[#FAF9F6] text-[#626A73] font-mono-telemetry ${sizeClasses}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-[#52745C]" />
          Low Risk
        </span>
      );
  }
};

interface StatusBadgeProps {
  status: EventStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs font-medium';

  let color = 'bg-[#FAF9F6] text-[#626A73] border-[#E2E1DC]';
  let label = status as string;

  if (status === 'PENDING_ANALYSIS') {
    color = 'bg-[#FAF9F6] text-[#C58A3C] border-[#E2E1DC]';
    label = 'Pending Review';
  } else if (status === 'MANOEUVRE_PLANNED') {
    color = 'bg-[#EAF0E9] text-[#52745C] border-[#52745C]/30 font-medium';
    label = 'Manoeuvre Planned';
  } else if (status === 'SCREENED_SAFE') {
    color = 'bg-[#EAF0E9] text-[#52745C] border-[#52745C]/30 font-medium';
    label = 'Screened Safe';
  } else if (status === 'MONITORING') {
    color = 'bg-[#FAF9F6] text-[#626A73] border-[#E2E1DC]';
    label = 'Monitoring';
  }

  return (
    <span className={`inline-flex items-center rounded-md border font-mono-telemetry ${color} ${sizeClasses}`}>
      {label}
    </span>
  );
};
