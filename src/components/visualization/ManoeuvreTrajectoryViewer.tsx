import React from 'react';
import type { ManoeuvreConfig } from '../../types/simulation';
import { Compass, Info } from 'lucide-react';

interface ManoeuvreTrajectoryViewerProps {
  config: ManoeuvreConfig;
  className?: string;
}

export const ManoeuvreTrajectoryViewer: React.FC<ManoeuvreTrajectoryViewerProps> = ({
  config,
  className = '',
}) => {
  const svgWidth = 560;
  const svgHeight = 280;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  return (
    <div className={`bg-[#FFFFFF] border border-[#E2E1DC] rounded overflow-hidden flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-[#E2E1DC] bg-[#FFFFFF] text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#252A30] font-mono-telemetry uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#52745C]" />
            <span>ORBITAL COORDINATE FRAME (HILL / RTN)</span>
          </span>
          <span className="text-[#858B92]">|</span>
          <span className="text-[11px] text-[#626A73] font-mono-telemetry">
            VECTOR: {config.direction} ({config.deltaVMps} m/s)
          </span>
        </div>

        <span className="text-[10px] text-[#52745C] font-mono-telemetry bg-[#52745C]/15 border border-[#52745C]/40 px-2 py-0.5 rounded">
          PROPAGATOR ENGINE PENDING
        </span>
      </div>

      <div className="relative w-full h-[280px] bg-[#FFFFFF] flex items-center justify-center overflow-hidden">
        {/* Subtle coordinate grid */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle, #E2E1DC 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full">
          <defs>
            <marker id="axis-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#858B92" />
            </marker>
            <marker id="thrust-arrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="#52745C" />
            </marker>
          </defs>

          {/* Coordinate axes centered at satellite */}
          {/* Along-track axis (T) */}
          <line
            x1={50}
            y1={centerY}
            x2={svgWidth - 50}
            y2={centerY}
            stroke="#E2E1DC"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            markerEnd="url(#axis-arrow)"
          />
          <text x={svgWidth - 45} y={centerY - 8} fill="#626A73" fontSize="10" fontFamily="monospace">
            +T (In-Track / Velocity)
          </text>
          <text x={45} y={centerY - 8} fill="#858B92" fontSize="10" fontFamily="monospace" textAnchor="end">
            -T (Retrograde)
          </text>

          {/* Radial axis (R) */}
          <line
            x1={centerX}
            y1={svgHeight - 35}
            x2={centerX}
            y2={35}
            stroke="#E2E1DC"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            markerEnd="url(#axis-arrow)"
          />
          <text x={centerX + 8} y={45} fill="#626A73" fontSize="10" fontFamily="monospace">
            +R (Radial Out)
          </text>
          <text x={centerX + 8} y={svgHeight - 40} fill="#858B92" fontSize="10" fontFamily="monospace">
            -R (Toward Earth)
          </text>

          {/* Satellite initial state origin at t = 0 */}
          <circle cx={centerX} cy={centerY} r={8} fill="#FFFFFF" stroke="#52745C" strokeWidth="2" />
          <text x={centerX} y={centerY + 22} fill="#252A30" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            Satellite State (t = 0)
          </text>

          {/* Active thrust vector orientation based on direction */}
          {config.direction === 'PROGRADE' && (
            <line x1={centerX} y1={centerY} x2={centerX + 90} y2={centerY} stroke="#52745C" strokeWidth="2.5" markerEnd="url(#thrust-arrow)" />
          )}
          {config.direction === 'RETROGRADE' && (
            <line x1={centerX} y1={centerY} x2={centerX - 90} y2={centerY} stroke="#52745C" strokeWidth="2.5" markerEnd="url(#thrust-arrow)" />
          )}
          {config.direction === 'RADIAL_OUT' && (
            <line x1={centerX} y1={centerY} x2={centerX} y2={centerY - 80} stroke="#52745C" strokeWidth="2.5" markerEnd="url(#thrust-arrow)" />
          )}
          {config.direction === 'RADIAL_IN' && (
            <line x1={centerX} y1={centerY} x2={centerX} y2={centerY + 80} stroke="#52745C" strokeWidth="2.5" markerEnd="url(#thrust-arrow)" />
          )}
          {config.direction === 'NORMAL_POS' && (
            <g>
              <line x1={centerX} y1={centerY} x2={centerX + 65} y2={centerY - 65} stroke="#52745C" strokeWidth="2.5" markerEnd="url(#thrust-arrow)" />
              <text x={centerX + 70} y={centerY - 70} fill="#52745C" fontSize="10" fontFamily="monospace">+N (Cross-Track Plane)</text>
            </g>
          )}
          {config.direction === 'NORMAL_NEG' && (
            <g>
              <line x1={centerX} y1={centerY} x2={centerX - 65} y2={centerY + 65} stroke="#52745C" strokeWidth="2.5" markerEnd="url(#thrust-arrow)" />
              <text x={centerX - 70} y={centerY + 75} fill="#52745C" fontSize="10" fontFamily="monospace" textAnchor="end">-N (Anti-Normal Plane)</text>
            </g>
          )}

          {/* Thrust Vector Badge */}
          <rect x={centerX + 15} y={centerY - 45} width="115" height="20" rx="3" fill="#FFFFFF" stroke="#52745C" strokeWidth="1" />
          <text x={centerX + 72} y={centerY - 31} fill="#52745C" fontSize="10" fontFamily="monospace" textAnchor="middle" fontWeight="bold">
            Δv = {config.deltaVMps.toFixed(2)} m/s
          </text>
        </svg>

        {/* Informational overlay notice */}
        <div className="absolute bottom-2.5 left-3 right-3 text-[11px] font-mono-telemetry text-[#626A73] bg-[#FFFFFF]/90 border border-[#E2E1DC] px-3 py-1.5 rounded flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-[#252A30]">
            <Info className="w-3.5 h-3.5 text-[#52745C]" />
            <span>Orientation: Hill (Radial-Tangential-Normal) frame relative to initial orbit.</span>
          </span>
          <span className="text-[#858B92]">Real propagation curve will render upon Phase 2 engine link.</span>
        </div>
      </div>
    </div>
  );
};
