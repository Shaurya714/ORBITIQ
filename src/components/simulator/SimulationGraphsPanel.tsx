import React, { useState, useMemo } from 'react';
import type { ManoeuvreResult } from '../../physics/orbitalPhysics';
import type { 
  OrbitalObjectProfile, 
  ClosestApproachPrediction 
} from '../../types/simulation';
import { generateEncounterTimeSeries } from '../../physics/collisionPhysics';
import { 
  LineChart 
} from 'lucide-react';

interface SimulationGraphsPanelProps {
  manoeuvreResult: ManoeuvreResult | null;
  simTimeSeconds: number;
  primaryProfile?: OrbitalObjectProfile;
  threatProfile?: OrbitalObjectProfile;
  closestApproach?: ClosestApproachPrediction;
}

export const SimulationGraphsPanel: React.FC<SimulationGraphsPanelProps> = ({
  manoeuvreResult,
  simTimeSeconds,
  primaryProfile,
  threatProfile,
  closestApproach,
}) => {
  const [activeTab, setActiveTab] = useState<'SEPARATION' | 'RELATIVE_SPEED' | 'ALTITUDE'>('SEPARATION');

  // Compute encounter time series
  const encounterSeries = useMemo(() => {
    if (!primaryProfile || !threatProfile) return null;

    const postBurnElements = manoeuvreResult ? manoeuvreResult.postBurnElements : null;
    return generateEncounterTimeSeries(
      primaryProfile.elements,
      threatProfile.elements,
      postBurnElements,
      5400, // 90 min encounter horizon
      120
    );
  }, [primaryProfile, threatProfile, manoeuvreResult]);

  // SVG Chart bounds
  const svgWidth = 660;
  const svgHeight = 210;
  const padding = { top: 15, right: 25, bottom: 30, left: 60 };
  const plotWidth = svgWidth - padding.left - padding.right;
  const plotHeight = svgHeight - padding.top - padding.bottom;

  // Compute scales based on selected tab
  const chartScales = useMemo(() => {
    if (!encounterSeries) return null;

    const maxTime = Math.max(...encounterSeries.timePointsSec, 3600);

    // Separation scale (meters)
    const allSep = [
      ...encounterSeries.baselineSeparationM,
      ...(encounterSeries.postBurnSeparationM.length > 0 ? encounterSeries.postBurnSeparationM : []),
    ];
    const maxSepM = Math.max(...allSep, 10000);
    const minSepM = Math.min(...allSep, 0);

    // Speed scale (km/s)
    const maxSpeed = Math.max(...encounterSeries.relativeSpeedKms, 15);
    const minSpeed = Math.min(...encounterSeries.relativeSpeedKms, 0);

    // Altitude scale (km)
    const allAlts = [
      ...encounterSeries.primaryAltitudeKm,
      ...encounterSeries.threatAltitudeKm,
      ...(encounterSeries.postBurnAltitudeKm.length > 0 ? encounterSeries.postBurnAltitudeKm : []),
    ];
    const maxAlt = Math.max(...allAlts, 800) + 15;
    const minAlt = Math.max(0, Math.min(...allAlts) - 15);

    return {
      maxTime,
      minSepM,
      maxSepM,
      minSpeed,
      maxSpeed,
      minAlt,
      maxAlt,
    };
  }, [encounterSeries]);

  const scaleX = (t: number) => {
    if (!chartScales) return 0;
    return padding.left + (t / chartScales.maxTime) * plotWidth;
  };

  const scaleYSep = (sepM: number) => {
    if (!chartScales) return 0;
    const range = Math.max(chartScales.maxSepM - chartScales.minSepM, 100);
    return padding.top + plotHeight - ((sepM - chartScales.minSepM) / range) * plotHeight;
  };

  const scaleYSpeed = (speedKms: number) => {
    if (!chartScales) return 0;
    const range = Math.max(chartScales.maxSpeed - chartScales.minSpeed, 1);
    return padding.top + plotHeight - ((speedKms - chartScales.minSpeed) / range) * plotHeight;
  };

  const scaleYAlt = (altKm: number) => {
    if (!chartScales) return 0;
    const range = Math.max(chartScales.maxAlt - chartScales.minAlt, 10);
    return padding.top + plotHeight - ((altKm - chartScales.minAlt) / range) * plotHeight;
  };

  // Build SVG Paths
  const baselineSepPath = useMemo(() => {
    if (!encounterSeries || activeTab !== 'SEPARATION') return '';
    return encounterSeries.timePointsSec.map((t, idx) => {
      const x = scaleX(t);
      const y = scaleYSep(encounterSeries.baselineSeparationM[idx]);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }, [encounterSeries, activeTab, chartScales]);

  const postBurnSepPath = useMemo(() => {
    if (!encounterSeries || activeTab !== 'SEPARATION' || encounterSeries.postBurnSeparationM.length === 0) return '';
    return encounterSeries.timePointsSec.map((t, idx) => {
      const x = scaleX(t);
      const y = scaleYSep(encounterSeries.postBurnSeparationM[idx]);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }, [encounterSeries, activeTab, chartScales]);

  const speedPath = useMemo(() => {
    if (!encounterSeries || activeTab !== 'RELATIVE_SPEED') return '';
    return encounterSeries.timePointsSec.map((t, idx) => {
      const x = scaleX(t);
      const y = scaleYSpeed(encounterSeries.relativeSpeedKms[idx]);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }, [encounterSeries, activeTab, chartScales]);

  const primaryAltPath = useMemo(() => {
    if (!encounterSeries || activeTab !== 'ALTITUDE') return '';
    return encounterSeries.timePointsSec.map((t, idx) => {
      const x = scaleX(t);
      const y = scaleYAlt(encounterSeries.primaryAltitudeKm[idx]);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }, [encounterSeries, activeTab, chartScales]);

  const threatAltPath = useMemo(() => {
    if (!encounterSeries || activeTab !== 'ALTITUDE') return '';
    return encounterSeries.timePointsSec.map((t, idx) => {
      const x = scaleX(t);
      const y = scaleYAlt(encounterSeries.threatAltitudeKm[idx]);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }, [encounterSeries, activeTab, chartScales]);

  const postBurnAltPath = useMemo(() => {
    if (!encounterSeries || activeTab !== 'ALTITUDE' || encounterSeries.postBurnAltitudeKm.length === 0) return '';
    return encounterSeries.timePointsSec.map((t, idx) => {
      const x = scaleX(t);
      const y = scaleYAlt(encounterSeries.postBurnAltitudeKm[idx]);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ');
  }, [encounterSeries, activeTab, chartScales]);

  // Safety buffer threshold Y in Separation plot (2,000 meters)
  const safetyBufferY = chartScales ? scaleYSep(2000) : 0;
  const cursorX = chartScales ? scaleX(simTimeSeconds % chartScales.maxTime) : 0;

  return (
    <div 
      className="rounded-md border p-5 shadow-xs font-sans text-xs space-y-4 transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface-panel)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* ===================================================================== */}
      {/* 1. DYNAMIC ENCOUNTER STATEMENT BANNER */}
      {/* ===================================================================== */}
      {closestApproach && primaryProfile && threatProfile && (
        <div 
          className="p-3.5 rounded-md border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span 
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: closestApproach.isCollisionEnvelopeOverlap 
                    ? '#C65D5D' 
                    : closestApproach.predictedMissDistanceM < 2000 
                      ? '#C58A3C' 
                      : 'var(--accent-primary)',
                }}
              ></span>
              <span 
                className="font-bold uppercase tracking-wider font-mono-telemetry text-xs"
                style={{ color: 'var(--text-primary)' }}
              >
                Dynamic Encounter Statement
              </span>
            </div>

            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Encounter Geometry: <strong style={{ color: 'var(--text-primary)' }}>{threatProfile.name}</strong> is approaching <strong style={{ color: 'var(--text-primary)' }}>{primaryProfile.name}</strong> at a relative velocity of <strong className="font-mono-telemetry" style={{ color: 'var(--text-primary)' }}>{closestApproach.relativeVelocityKms.toFixed(2)} km/s</strong>. Predicted closest approach occurs in <strong className="font-mono-telemetry" style={{ color: 'var(--text-primary)' }}>{Math.floor(closestApproach.timeToClosestApproachSec / 60)}m {closestApproach.timeToClosestApproachSec % 60}s</strong> with a baseline separation of <strong className="font-mono-telemetry" style={{ color: closestApproach.predictedMissDistanceM < 2000 ? '#C65D5D' : 'var(--accent-primary)' }}>{closestApproach.predictedMissDistanceM.toLocaleString()} m</strong>.
            </p>
          </div>

          <div 
            className="flex items-center gap-4 text-xs font-mono-telemetry shrink-0 border-t md:border-t-0 md:border-l pt-2 md:pt-0 md:pl-4"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div>
              <span className="text-[10px] uppercase block" style={{ color: 'var(--text-muted)' }}>Status</span>
              <span 
                className="font-bold"
                style={{ color: closestApproach.isCollisionEnvelopeOverlap ? '#C65D5D' : closestApproach.predictedMissDistanceM < 2000 ? '#C58A3C' : 'var(--accent-primary)' }}
              >
                {closestApproach.predictedMissDistanceM < 2000 ? 'BUFFER BREACH' : 'CLEARED'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase block" style={{ color: 'var(--text-muted)' }}>Combined R</span>
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                {closestApproach.combinedHardBodyRadiusM.toFixed(1)} m
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. ANALYTICAL ENCOUNTER SVG GRAPHS */}
      {/* ===================================================================== */}
      <div className="space-y-2">
        {/* Graph Header & Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
          <div className="flex items-center gap-2">
            <LineChart className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span 
              className="font-semibold text-xs"
              style={{ color: 'var(--text-primary)' }}
            >
              Analytical Encounter Trajectory Plots (RK4 Propagation)
            </span>
          </div>

          <div 
            className="flex items-center p-0.5 rounded-md border"
            style={{ 
              backgroundColor: 'var(--bg-surface-elevated)', 
              borderColor: 'var(--border-default)' 
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('SEPARATION')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'SEPARATION'
                  ? 'font-bold shadow-xs'
                  : ''
              }`}
              style={{
                backgroundColor: activeTab === 'SEPARATION' ? 'var(--accent-soft)' : 'transparent',
                color: activeTab === 'SEPARATION' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
            >
              Separation d(t)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('RELATIVE_SPEED')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'RELATIVE_SPEED'
                  ? 'font-bold shadow-xs'
                  : ''
              }`}
              style={{
                backgroundColor: activeTab === 'RELATIVE_SPEED' ? 'var(--accent-soft)' : 'transparent',
                color: activeTab === 'RELATIVE_SPEED' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
            >
              Relative Speed v(t)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ALTITUDE')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeTab === 'ALTITUDE'
                  ? 'font-bold shadow-xs'
                  : ''
              }`}
              style={{
                backgroundColor: activeTab === 'ALTITUDE' ? 'var(--accent-soft)' : 'transparent',
                color: activeTab === 'ALTITUDE' ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
            >
              Altitudes h(t)
            </button>
          </div>
        </div>

        {/* Clean SVG Plot Container */}
        <div 
          className="rounded-md border p-3 relative overflow-hidden select-none"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--border-default)',
          }}
        >
          {chartScales && (
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="w-full h-auto block"
            >
              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
                const y = padding.top + plotHeight * ratio;
                return (
                  <line
                    key={ratio}
                    x1={padding.left}
                    y1={y}
                    x2={svgWidth - padding.right}
                    y2={y}
                    stroke="rgba(133, 139, 146, 0.25)"
                    strokeDasharray="3 3"
                  />
                );
              })}

              {/* 2.0 km Safety Buffer Reference Line on Separation Plot */}
              {activeTab === 'SEPARATION' && safetyBufferY >= padding.top && safetyBufferY <= svgHeight - padding.bottom && (
                <g>
                  <line
                    x1={padding.left}
                    y1={safetyBufferY}
                    x2={svgWidth - padding.right}
                    y2={safetyBufferY}
                    stroke="#C58A3C"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={svgWidth - padding.right - 4}
                    y={safetyBufferY - 4}
                    fill="#C58A3C"
                    fontSize="8"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    2.0 km Safety Buffer Threshold
                  </text>
                </g>
              )}

              {/* Curves */}
              {activeTab === 'SEPARATION' && (
                <>
                  {/* Baseline curve (Terracotta / Red when dipping low) */}
                  <path
                    d={baselineSepPath}
                    fill="none"
                    stroke="#C47C61"
                    strokeWidth="2"
                  />

                  {/* Post-Burn Curve (Forest Green) */}
                  {postBurnSepPath && (
                    <path
                      d={postBurnSepPath}
                      fill="none"
                      stroke="#52745C"
                      strokeWidth="2.2"
                      strokeDasharray="5 3"
                    />
                  )}
                </>
              )}

              {activeTab === 'RELATIVE_SPEED' && (
                <path
                  d={speedPath}
                  fill="none"
                  stroke="#52745C"
                  strokeWidth="2"
                />
              )}

              {activeTab === 'ALTITUDE' && (
                <>
                  <path
                    d={primaryAltPath}
                    fill="none"
                    stroke="#858B92"
                    strokeWidth="1.8"
                  />
                  <path
                    d={threatAltPath}
                    fill="none"
                    stroke="#C47C61"
                    strokeWidth="1.8"
                    strokeDasharray="4 3"
                  />
                  {postBurnAltPath && (
                    <path
                      d={postBurnAltPath}
                      fill="none"
                      stroke="#52745C"
                      strokeWidth="2"
                    />
                  )}
                </>
              )}

              {/* Live Simulation Time Cursor */}
              {cursorX >= padding.left && cursorX <= svgWidth - padding.right && (
                <line
                  x1={cursorX}
                  y1={padding.top}
                  x2={cursorX}
                  y2={svgHeight - padding.bottom}
                  stroke="#52745C"
                  strokeWidth="1.5"
                />
              )}

              {/* Y-Axis Value Labels */}
              {activeTab === 'SEPARATION' && (
                <>
                  <text x={padding.left - 8} y={padding.top + 4} fill="#858B92" fontSize="9" textAnchor="end" fontFamily="monospace">
                    {(chartScales.maxSepM / 1000).toFixed(1)} km
                  </text>
                  <text x={padding.left - 8} y={padding.top + plotHeight / 2 + 3} fill="#858B92" fontSize="9" textAnchor="end" fontFamily="monospace">
                    {((chartScales.maxSepM + chartScales.minSepM) / 2000).toFixed(1)} km
                  </text>
                  <text x={padding.left - 8} y={svgHeight - padding.bottom} fill="#858B92" fontSize="9" textAnchor="end" fontFamily="monospace">
                    {(chartScales.minSepM / 1000).toFixed(1)} km
                  </text>
                </>
              )}

              {activeTab === 'RELATIVE_SPEED' && (
                <>
                  <text x={padding.left - 8} y={padding.top + 4} fill="#858B92" fontSize="9" textAnchor="end" fontFamily="monospace">
                    {chartScales.maxSpeed.toFixed(1)} km/s
                  </text>
                  <text x={padding.left - 8} y={svgHeight - padding.bottom} fill="#858B92" fontSize="9" textAnchor="end" fontFamily="monospace">
                    {chartScales.minSpeed.toFixed(1)} km/s
                  </text>
                </>
              )}

              {activeTab === 'ALTITUDE' && (
                <>
                  <text x={padding.left - 8} y={padding.top + 4} fill="#858B92" fontSize="9" textAnchor="end" fontFamily="monospace">
                    {chartScales.maxAlt.toFixed(0)} km
                  </text>
                  <text x={padding.left - 8} y={svgHeight - padding.bottom} fill="#858B92" fontSize="9" textAnchor="end" fontFamily="monospace">
                    {chartScales.minAlt.toFixed(0)} km
                  </text>
                </>
              )}

              {/* X-Axis Time Ticks */}
              {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
                const tSec = chartScales.maxTime * ratio;
                const x = padding.left + plotWidth * ratio;
                return (
                  <text
                    key={ratio}
                    x={x}
                    y={svgHeight - padding.bottom + 16}
                    fill="#858B92"
                    fontSize="9"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    T+{(tSec / 60).toFixed(0)}m
                  </text>
                );
              })}
            </svg>
          )}

          {/* Curve Legend (Bottom-Right) */}
          <div 
            className="absolute bottom-2 right-4 flex items-center gap-3 text-[10px] font-mono-telemetry bg-black/40 backdrop-blur-xs px-2.5 py-1 rounded border border-white/10"
          >
            {activeTab === 'SEPARATION' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-[2px] bg-[#C47C61]"></span>
                  <span className="text-[#E2E1DC]">Baseline Miss d(t)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-[2px] border-b border-dashed border-[#52745C]"></span>
                  <span className="text-[#8BA893]">Post-Manoeuvre</span>
                </div>
              </>
            )}

            {activeTab === 'RELATIVE_SPEED' && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-[2px] bg-[#52745C]"></span>
                <span className="text-[#8BA893]">Relative Speed (km/s)</span>
              </div>
            )}

            {activeTab === 'ALTITUDE' && (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-[2px] bg-[#858B92]"></span>
                  <span className="text-[#E2E1DC]">Primary h₁</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-[2px] border-b border-dashed border-[#C47C61]"></span>
                  <span className="text-[#C47C61]">Threat h₂</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-[2px] bg-[#52745C]"></span>
                  <span className="text-[#8BA893]">Post-Burn</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
