import React from 'react';
import { Info } from 'lucide-react';

interface DataNoticeProps {
  message?: string;
  className?: string;
  compact?: boolean;
}

export const DataNotice: React.FC<DataNoticeProps> = ({
  message = 'Space-Track integration active: Queries are proxied securely through the local backend at http://localhost:8000/api. Connect credentials to stream live GP orbital elements.',
  className = '',
  compact = false,
}) => {
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#626A73] bg-[#FAF9F6] border border-[#E2E1DC] rounded-md font-mono-telemetry ${className}`}>
        <Info className="w-3.5 h-3.5 text-[#52745C] shrink-0" />
        <span>DATA PROXY ACTIVE</span>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-2.5 p-3.5 text-xs text-[#626A73] bg-[#FAF9F6] border border-[#E2E1DC] rounded-md shadow-xs ${className}`}>
      <Info className="w-4 h-4 text-[#52745C] shrink-0 mt-0.5" />
      <div className="flex-1 leading-relaxed font-sans">
        <span className="font-semibold text-[#252A30] mr-1.5 font-mono-telemetry text-xs">System Notice:</span>
        {message}
      </div>
    </div>
  );
};
