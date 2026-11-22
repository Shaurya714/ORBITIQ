import React, { useState } from 'react';
import type { 
  KeplerianElements, 
  ManoeuvreParams, 
  BurnDirectionMode, 
  BurnLocationMode 
} from '../../physics/orbitalPhysics';
import type { UnifiedOrbitalObject } from '../../services/orbitalDataService';
import type { 
  OrbitalObjectProfile, 
  TwoObjectEncounterScenario 
} from '../../types/simulation';
import { ENCOUNTER_SCENARIOS } from '../../physics/manoeuvreOptimizer';
import { 
  Satellite, 
  Sliders, 
  ChevronDown, 
  ChevronUp,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface SpacecraftConfigPanelProps {
  catalogSatellites: UnifiedOrbitalObject[];
  currentElements: KeplerianElements;
  onUpdateElements: (elements: Partial<KeplerianElements>) => void;
  onSelectSatellite: (sat: UnifiedOrbitalObject) => void;
  manoeuvreParams: ManoeuvreParams;
  onUpdateManoeuvreParams: (params: Partial<ManoeuvreParams>) => void;
  onResetManoeuvre: () => void;
  selectedScenarioId?: string;
  onSelectScenario: (scenario: TwoObjectEncounterScenario) => void;
  threatProfile?: OrbitalObjectProfile;
}

export const SpacecraftConfigPanel: React.FC<SpacecraftConfigPanelProps> = ({
  catalogSatellites,
  currentElements,
  onUpdateElements,
  onSelectSatellite,
  manoeuvreParams,
  onUpdateManoeuvreParams,
  onResetManoeuvre,
  selectedScenarioId,
  onSelectScenario,
  threatProfile,
}) => {
  const [initMode, setInitMode] = useState<'SCENARIOS' | 'CATALOG' | 'CUSTOM'>('SCENARIOS');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Compute clean display altitude from semiMajorAxisKm & eccentricity
  const a = currentElements.semiMajorAxisKm;
  const e = currentElements.eccentricity;
  const perigeeAlt = Math.round(a * (1 - e) - 6378.137);
  const apogeeAlt = Math.round(a * (1 + e) - 6378.137);

  // Primary direction modes
  const primaryDirections: { mode: BurnDirectionMode; label: string; desc: string }[] = [
    { mode: 'PROGRADE', label: '+T Prograde', desc: 'Accelerates along velocity vector to raise orbit & create along-track phase separation' },
    { mode: 'RETROGRADE', label: '-T Retrograde', desc: 'Decelerates against velocity vector to lower orbit & accelerate arrival' },
    { mode: 'RADIAL_OUT', label: '+R Radial Out', desc: 'Thrusts away from Earth center to rotate apsides (lower efficiency)' },
    { mode: 'RADIAL_IN', label: '-R Radial In', desc: 'Thrusts toward Earth center to rotate apsides' },
  ];

  // Primary burn locations
  const locations: { mode: BurnLocationMode; label: string }[] = [
    { mode: 'CURRENT', label: 'Current Position' },
    { mode: 'PERIAPSIS', label: 'At Periapsis (Oberth)' },
    { mode: 'APOAPSIS', label: 'At Apoapsis' },
  ];

  return (
    <div 
      className="rounded-md border p-5 shadow-xs font-sans text-xs transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface-panel)',
        borderColor: 'var(--border-default)',
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ===================================================================== */}
        {/* LEFT COLUMN: SCENARIOS & ENCOUNTER SELECTION */}
        {/* ===================================================================== */}
        <div className="space-y-4">
          {/* Header & Source Mode Switch */}
          <div 
            className="flex items-center justify-between pb-2 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div 
              className="font-semibold uppercase tracking-wider text-xs flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <Satellite className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span>Encounter & Spacecraft Targets</span>
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
                onClick={() => setInitMode('SCENARIOS')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  initMode === 'SCENARIOS'
                    ? 'font-bold shadow-xs'
                    : ''
                }`}
                style={{
                  backgroundColor: initMode === 'SCENARIOS' ? 'var(--accent-soft)' : 'transparent',
                  color: initMode === 'SCENARIOS' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                <Sparkles className="w-3 h-3" />
                <span>Presets (A–F)</span>
              </button>

              <button
                type="button"
                onClick={() => setInitMode('CATALOG')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  initMode === 'CATALOG'
                    ? 'font-bold shadow-xs'
                    : ''
                }`}
                style={{
                  backgroundColor: initMode === 'CATALOG' ? 'var(--accent-soft)' : 'transparent',
                  color: initMode === 'CATALOG' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                Catalog ({catalogSatellites.length})
              </button>

              <button
                type="button"
                onClick={() => setInitMode('CUSTOM')}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  initMode === 'CUSTOM'
                    ? 'font-bold shadow-xs'
                    : ''
                }`}
                style={{
                  backgroundColor: initMode === 'CUSTOM' ? 'var(--accent-soft)' : 'transparent',
                  color: initMode === 'CUSTOM' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                Custom
              </button>
            </div>
          </div>

          {/* Mode 1: Presets A through F */}
          {initMode === 'SCENARIOS' && (
            <div className="space-y-2">
              <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Select Verifiable Collision / Avoidance Scenario
              </label>

              <div className="grid grid-cols-1 gap-2 max-h-[170px] overflow-y-auto pr-1">
                {ENCOUNTER_SCENARIOS.map((sc) => {
                  const isSelected = selectedScenarioId === sc.id;

                  return (
                    <div
                      key={sc.id}
                      onClick={() => onSelectScenario(sc)}
                      className="p-2.5 rounded border transition-colors cursor-pointer text-left"
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-default)',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span 
                          className="font-bold font-mono-telemetry text-xs"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {sc.title}
                        </span>
                        <span 
                          className="font-mono-telemetry font-bold text-[11px]"
                          style={{ color: sc.expectedBaselineMissM < 2000 ? '#C65D5D' : 'var(--accent-primary)' }}
                        >
                          d_CA: {sc.expectedBaselineMissM.toLocaleString()} m
                        </span>
                      </div>
                      <p className="text-[11px] mt-0.5 leading-snug line-clamp-1" style={{ color: 'var(--text-secondary)' }}>
                        {sc.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mode 2: Catalog Satellite Dropdown */}
          {initMode === 'CATALOG' && (
            <div className="space-y-2.5">
              <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Select Active Spacecraft from Live Catalog
              </label>
              <select
                value={currentElements.noradId || ''}
                onChange={(e) => {
                  const sat = catalogSatellites.find(s => s.noradId === parseInt(e.target.value, 10));
                  if (sat) onSelectSatellite(sat);
                }}
                className="w-full px-3 py-2 rounded-md text-xs focus:outline-hidden font-mono-telemetry border"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="">Select satellite to simulate...</option>
                {catalogSatellites.map((sat) => (
                  <option key={sat.noradId} value={sat.noradId}>
                    {sat.name} (NORAD {sat.noradId}) &mdash; {Math.round(sat.perigeeKm)}&times;{Math.round(sat.apogeeKm)} km
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Mode 3: Custom Spacecraft Inputs */}
          {initMode === 'CUSTOM' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Semi-Major Axis (km)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="6500"
                    max="45000"
                    value={Math.round(currentElements.semiMajorAxisKm)}
                    onChange={(e) => onUpdateElements({ semiMajorAxisKm: parseFloat(e.target.value) || 6800 })}
                    className="w-full px-2.5 py-1.5 rounded-md border text-xs font-mono-telemetry"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Eccentricity (e)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max="0.85"
                    value={parseFloat(currentElements.eccentricity.toFixed(4))}
                    onChange={(e) => onUpdateElements({ eccentricity: parseFloat(e.target.value) || 0.001 })}
                    className="w-full px-2.5 py-1.5 rounded-md border text-xs font-mono-telemetry"
                    style={{
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dual Object Telemetry Chip (Primary & Threat) */}
          <div 
            className="p-3 rounded-md border space-y-2 font-mono-telemetry text-xs"
            style={{
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-default)',
            }}
          >
            {/* Primary Spacecraft */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }}></span>
                <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
                  {currentElements.objectName || 'PRIMARY'}
                </span>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>
                {perigeeAlt}&times;{apogeeAlt} km &bull; {currentElements.inclinationDeg.toFixed(1)}°
              </span>
            </div>

            {/* Threat Object */}
            {threatProfile && (
              <div 
                className="flex items-center justify-between pt-1.5 border-t"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C47C61]"></span>
                  <span className="font-bold text-[#C47C61]">
                    {threatProfile.name}
                  </span>
                </div>
                <span style={{ color: 'var(--text-secondary)' }}>
                  R_body: {threatProfile.hardBodyRadiusM}m &bull; {threatProfile.estimatedMassKg} kg
                </span>
              </div>
            )}
          </div>

          {/* Advanced Thruster / Mass properties */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showAdvanced ? 'Hide' : 'Configure'} Thruster & Dry Mass Properties</span>
            </button>

            {showAdvanced && (
              <div 
                className="grid grid-cols-3 gap-2.5 mt-2.5 p-3 rounded-md border font-mono-telemetry text-xs"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-default)',
                }}
              >
                <div>
                  <label className="block text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>Wet Mass (kg)</label>
                  <input
                    type="number"
                    step="10"
                    min="10"
                    value={manoeuvreParams.spacecraftMassKg}
                    onChange={(e) => onUpdateManoeuvreParams({ spacecraftMassKg: parseFloat(e.target.value) || 1000 })}
                    className="w-full px-2 py-1 rounded border text-xs mt-1"
                    style={{
                      backgroundColor: 'var(--bg-surface-panel)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>Isp (sec)</label>
                  <input
                    type="number"
                    step="5"
                    min="50"
                    max="4500"
                    value={manoeuvreParams.specificImpulseSec}
                    onChange={(e) => onUpdateManoeuvreParams({ specificImpulseSec: parseFloat(e.target.value) || 285 })}
                    className="w-full px-2 py-1 rounded border text-xs mt-1"
                    style={{
                      backgroundColor: 'var(--bg-surface-panel)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>Thrust (N)</label>
                  <input
                    type="number"
                    step="10"
                    min="0"
                    value={manoeuvreParams.thrustN}
                    onChange={(e) => onUpdateManoeuvreParams({ thrustN: parseFloat(e.target.value) || 450 })}
                    className="w-full px-2 py-1 rounded border text-xs mt-1"
                    style={{
                      backgroundColor: 'var(--bg-surface-panel)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===================================================================== */}
        {/* RIGHT COLUMN: MANUAL MANOEUVRE TUNING */}
        {/* ===================================================================== */}
        <div className="space-y-4">
          <div 
            className="flex items-center justify-between pb-2 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <div 
              className="font-semibold uppercase tracking-wider text-xs flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <Sliders className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span>Manual Impulse Vector Override</span>
            </div>

            <button
              type="button"
              onClick={onResetManoeuvre}
              className="text-xs flex items-center gap-1 transition-colors cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
              title="Reset manoeuvre configuration"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>

          {/* 1. Direction Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Thrust Direction Axis
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {primaryDirections.map((d) => (
                <button
                  key={d.mode}
                  type="button"
                  onClick={() => onUpdateManoeuvreParams({ directionMode: d.mode })}
                  className={`py-1.5 px-2 rounded-md text-center border text-xs font-medium transition-colors cursor-pointer ${
                    manoeuvreParams.directionMode === d.mode
                      ? 'font-bold shadow-xs'
                      : ''
                  }`}
                  style={{
                    backgroundColor: manoeuvreParams.directionMode === d.mode ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                    borderColor: manoeuvreParams.directionMode === d.mode ? 'var(--accent-primary)' : 'var(--border-default)',
                    color: manoeuvreParams.directionMode === d.mode ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] pt-0.5" style={{ color: 'var(--text-muted)' }}>
              {primaryDirections.find(d => d.mode === manoeuvreParams.directionMode)?.desc}
            </p>
          </div>

          {/* 2. Delta-V Magnitude (Δv) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                Velocity Impulse (Δv)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.05"
                  min="0.05"
                  max="30.00"
                  value={manoeuvreParams.deltaVMps}
                  onChange={(e) => onUpdateManoeuvreParams({ deltaVMps: parseFloat(e.target.value) || 0.1 })}
                  className="w-18 px-2 py-0.5 rounded border font-mono-telemetry text-xs font-semibold text-right"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--accent-primary)',
                  }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>m/s</span>
              </div>
            </div>

            <input
              type="range"
              min="0.05"
              max="15.00"
              step="0.05"
              value={manoeuvreParams.deltaVMps}
              onChange={(e) => onUpdateManoeuvreParams({ deltaVMps: parseFloat(e.target.value) })}
              className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
              style={{
                backgroundColor: 'var(--border-default)',
                accentColor: 'var(--accent-primary)',
              }}
            />

            {/* Quick sets */}
            <div className="flex items-center justify-between text-[11px] pt-0.5" style={{ color: 'var(--text-secondary)' }}>
              <span>Presets:</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateManoeuvreParams({ deltaVMps: 0.85, directionMode: 'PROGRADE' })}
                  className="hover:underline cursor-pointer"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  0.85 m/s (Phasing)
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => onUpdateManoeuvreParams({ deltaVMps: 2.20, directionMode: 'PROGRADE' })}
                  className="hover:underline cursor-pointer"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  2.20 m/s (High-Margin)
                </button>
                <span>&bull;</span>
                <button
                  type="button"
                  onClick={() => onUpdateManoeuvreParams({ deltaVMps: 1.40, directionMode: 'RADIAL_OUT' })}
                  className="hover:underline cursor-pointer"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  1.40 m/s (Radial)
                </button>
              </div>
            </div>
          </div>

          {/* 3. Burn Location */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              Execution Location on Orbit
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {locations.map((loc) => (
                <button
                  key={loc.mode}
                  type="button"
                  onClick={() => onUpdateManoeuvreParams({ locationMode: loc.mode })}
                  className={`py-1.5 px-2 rounded-md text-center border text-xs font-medium transition-colors cursor-pointer ${
                    manoeuvreParams.locationMode === loc.mode
                      ? 'font-bold shadow-xs'
                      : ''
                  }`}
                  style={{
                    backgroundColor: manoeuvreParams.locationMode === loc.mode ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                    borderColor: manoeuvreParams.locationMode === loc.mode ? 'var(--accent-primary)' : 'var(--border-default)',
                    color: manoeuvreParams.locationMode === loc.mode ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
