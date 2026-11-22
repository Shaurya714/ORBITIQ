import React from 'react';
import { useConjunction } from '../../context/ConjunctionContext';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useConjunction();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        let borderClass = 'border-[#E2E1DC] bg-[#FFFFFF]';
        let icon = <Info className="w-4 h-4 text-[#52745C] shrink-0" />;

        if (toast.type === 'success') {
          borderClass = 'border-[#52745C]/40 bg-[#EAF0E9]';
          icon = <CheckCircle className="w-4 h-4 text-[#52745C] shrink-0" />;
        } else if (toast.type === 'warning') {
          borderClass = 'border-[#C58A3C]/40 bg-[#FAF9F6]';
          icon = <AlertTriangle className="w-4 h-4 text-[#C58A3C] shrink-0" />;
        } else if (toast.type === 'error') {
          borderClass = 'border-[#C65D5D]/40 bg-[#FAF9F6]';
          icon = <AlertCircle className="w-4 h-4 text-[#C65D5D] shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-md border ${borderClass} shadow-xl text-xs text-[#252A30] transition-all`}
          >
            {icon}
            <div className="flex-1">
              <div className="font-semibold text-[#252A30]">{toast.title}</div>
              <div className="text-[#626A73] mt-0.5 leading-snug">{toast.message}</div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="p-1 text-[#858B92] hover:text-[#252A30] rounded transition-colors"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
