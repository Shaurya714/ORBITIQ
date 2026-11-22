import React from 'react';
import { Orbit, Clock, ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer 
      className="border-t text-xs py-5 mt-auto transition-colors font-sans"
      style={{
        backgroundColor: 'var(--bg-surface-secondary)',
        borderColor: 'var(--border-default)',
        color: 'var(--text-secondary)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Platform Identity */}
          <div className="flex items-center gap-2.5">
            <div 
              className="w-6 h-6 rounded flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--accent-soft)',
                borderColor: 'var(--border-default)',
                color: 'var(--accent-primary)',
              }}
            >
              <Orbit className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span 
                className="font-bold tracking-wider font-mono-telemetry text-xs"
                style={{ color: 'var(--text-primary)' }}
              >
                ORBITIQ
              </span>
              <span className="hidden sm:inline" style={{ color: 'var(--text-muted)' }}>&bull;</span>
              <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                Orbital Collision Risk & Avoidance Decision Support Platform
              </span>
            </div>
          </div>

          {/* User-Relevant Operational Status & Timezone */}
          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono-telemetry">
            <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <Clock className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span>Timezone: <strong>IST (UTC+05:30)</strong></span>
            </div>

            <div className="flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span>Status: <strong style={{ color: 'var(--accent-primary)' }}>Active</strong></span>
            </div>

            <div style={{ color: 'var(--text-muted)' }}>
              &copy; 2026 ORBITIQ
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
};
