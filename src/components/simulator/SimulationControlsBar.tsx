import React, { useState } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Flame,
  Layers,
  Clock
} from 'lucide-react';

interface SimulationControlsBarProps {
  isSimulating: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onStepForward: (seconds: number) => void;
  simTimeSeconds: number;
  speedMultiplier: number;
  onChangeSpeed: (multiplier: number) => void;
  onJumpToBurn: () => void;
  showReferenceOrbit: boolean;
  onToggleReferenceOrbit: () => void;
  showPredictedPath: boolean;
  onTogglePredictedPath: () => void;
  showManoeuvredOrbit: boolean;
  onToggleManoeuvredOrbit: () => void;
  showThreatOrbit?: boolean;
  onToggleThreatOrbit?: () => void;
  showCollisionEnvelope?: boolean;
  onToggleCollisionEnvelope?: () => void;
  showVectors: boolean;
  onToggleVectors: () => void;
  showAnnotations: boolean;
  onToggleAnnotations: () => void;
  orbitalPeriodSec: number;
}

export const SimulationControlsBar: React.FC<SimulationControlsBarProps> = ({
  isSimulating,
  onTogglePlay,
  onReset,
  onStepForward,
  simTimeSeconds,
  speedMultiplier,
  onChangeSpeed,
  onJumpToBurn,
  showReferenceOrbit,
  onToggleReferenceOrbit,
  showPredictedPath,
  onTogglePredictedPath,
  showManoeuvredOrbit,
  onToggleManoeuvredOrbit,
  showThreatOrbit = true,
  onToggleThreatOrbit,
  showCollisionEnvelope = true,
  onToggleCollisionEnvelope,
  showVectors,
  onToggleVectors,
  showAnnotations,
  onToggleAnnotations,
  orbitalPeriodSec,
}) => {
  const [showLayerMenu, setShowLayerMenu] = useState<boolean>(false);
  const speedOptions = [1, 10, 60, 300];

  // Format simulated time: T + HH:MM:SS
  const formatSimTime = (totalSec: number) => {
    const absSec = Math.abs(Math.floor(totalSec));
    const hours = Math.floor(absSec / 3600);
    const minutes = Math.floor((absSec % 3600) / 60);
    const seconds = absSec % 60;
    const prefix = totalSec < 0 ? 'T -' : 'T +';
    
    if (hours > 0) {
      return `${prefix} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${prefix} ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const completedOrbits = orbitalPeriodSec > 0 
    ? (simTimeSeconds / orbitalPeriodSec).toFixed(1) 
    : '0.0';

  return (
    <div 
      className="rounded-md border px-4 py-3 shadow-xs font-sans text-xs transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface-panel)',
        borderColor: 'var(--border-default)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        
        {/* 1. Primary Playback & Step Controls */}
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={onTogglePlay}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md font-semibold text-xs transition-colors shadow-xs cursor-pointer"
            style={{
              backgroundColor: isSimulating ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
              color: isSimulating ? '#FFFFFF' : 'var(--accent-primary)',
              border: isSimulating ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
            }}
          >
            {isSimulating ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate</span>
              </>
            )}
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-secondary)',
            }}
            title="Reset Simulation to t = 0"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="font-mono-telemetry">Reset</span>
          </button>

          {/* Step Button (+1m) */}
          <button
            type="button"
            onClick={() => onStepForward(60)}
            className="px-2.5 py-1.5 rounded-md border transition-colors font-mono-telemetry text-xs cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-secondary)',
            }}
            title="Step forward +1 minute"
          >
            +1m
          </button>

          {/* Jump to Ignition Button */}
          <button
            type="button"
            onClick={onJumpToBurn}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border transition-colors text-xs font-medium cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-default)',
              color: 'var(--accent-primary)',
            }}
            title="Jump to configured burn ignition anomaly"
          >
            <Flame className="w-3 h-3" />
            <span>To Burn</span>
          </button>
        </div>

        {/* 2. Speed Warp Segmented Control */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium hidden sm:inline" style={{ color: 'var(--text-secondary)' }}>Speed:</span>
          <div 
            className="flex items-center p-0.5 rounded-md border"
            style={{ 
              backgroundColor: 'var(--bg-surface-elevated)', 
              borderColor: 'var(--border-default)' 
            }}
          >
            {speedOptions.map((mult) => (
              <button
                key={mult}
                type="button"
                onClick={() => onChangeSpeed(mult)}
                className={`px-2 py-1 rounded text-xs font-mono-telemetry transition-colors cursor-pointer ${
                  speedMultiplier === mult
                    ? 'font-semibold shadow-xs'
                    : ''
                }`}
                style={{
                  backgroundColor: speedMultiplier === mult ? 'var(--accent-soft)' : 'transparent',
                  color: speedMultiplier === mult ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                {mult}x
              </button>
            ))}
          </div>
        </div>

        {/* 3. Time Readout & Display Layer Popover */}
        <div className="flex items-center gap-3">
          {/* Elapsed Sim Time */}
          <div 
            className="flex items-center gap-2 px-3 py-1 rounded-md border font-mono-telemetry text-xs"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }} />
            <span className="font-semibold">{formatSimTime(simTimeSeconds)}</span>
            <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>({completedOrbits} rev)</span>
          </div>

          {/* Layer Options Drawer Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="p-1.5 rounded-md border transition-colors flex items-center gap-1 text-xs cursor-pointer"
              style={{
                backgroundColor: showLayerMenu ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                borderColor: showLayerMenu ? 'var(--accent-primary)' : 'var(--border-default)',
                color: showLayerMenu ? 'var(--accent-primary)' : 'var(--text-secondary)',
              }}
              title="Display Layers"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="text-xs hidden md:inline">Layers</span>
            </button>

            {showLayerMenu && (
              <div 
                className="absolute right-0 bottom-full mb-2 w-56 border rounded-md shadow-lg p-3 z-20 space-y-2 text-xs"
                style={{
                  backgroundColor: 'var(--bg-surface-panel)',
                  borderColor: 'var(--border-default)',
                }}
              >
                <div 
                  className="text-[10px] uppercase font-semibold pb-1 border-b"
                  style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}
                >
                  Canvas Visualization Layers
                </div>

                <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={showReferenceOrbit}
                    onChange={onToggleReferenceOrbit}
                    className="rounded accent-[#52745C]"
                  />
                  <span>Primary Baseline Orbit</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={showPredictedPath}
                    onChange={onTogglePredictedPath}
                    className="rounded accent-[#52745C]"
                  />
                  <span>Predicted Path</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={showManoeuvredOrbit}
                    onChange={onToggleManoeuvredOrbit}
                    className="rounded accent-[#52745C]"
                  />
                  <span>Post-Burn Orbit</span>
                </label>

                {onToggleThreatOrbit && (
                  <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={showThreatOrbit}
                      onChange={onToggleThreatOrbit}
                      className="rounded accent-[#52745C]"
                    />
                    <span>Threat Object Trajectory</span>
                  </label>
                )}

                {onToggleCollisionEnvelope && (
                  <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={showCollisionEnvelope}
                      onChange={onToggleCollisionEnvelope}
                      className="rounded accent-[#52745C]"
                    />
                    <span>Collision Envelope (R1+R2)</span>
                  </label>
                )}

                <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={showVectors}
                    onChange={onToggleVectors}
                    className="rounded accent-[#52745C]"
                  />
                  <span>Velocity & Δv Vectors</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
                  <input
                    type="checkbox"
                    checked={showAnnotations}
                    onChange={onToggleAnnotations}
                    className="rounded accent-[#52745C]"
                  />
                  <span>Distance Rings & Scales</span>
                </label>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
