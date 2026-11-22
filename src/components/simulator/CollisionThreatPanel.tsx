import React from 'react';
import type { 
  OrbitalObjectProfile, 
  ClosestApproachPrediction, 
  ImpactConsequenceAnalysis 
} from '../../types/simulation';
import { 
  AlertTriangle, 
  Flame, 
  ShieldAlert, 
  Crosshair, 
  Clock, 
  Zap, 
  Info,
  CheckCircle2,
  Radiation
} from 'lucide-react';

interface CollisionThreatPanelProps {
  primary: OrbitalObjectProfile;
  threat: OrbitalObjectProfile;
  closestApproach: ClosestApproachPrediction;
  impactAnalysis: ImpactConsequenceAnalysis;
  liveDistanceKm: number;
  liveRelativeSpeedKms: number;
}

export const CollisionThreatPanel: React.FC<CollisionThreatPanelProps> = ({
  primary,
  threat,
  closestApproach,
  impactAnalysis,
  liveDistanceKm,
  liveRelativeSpeedKms,
}) => {
  const isOverlap = closestApproach.isCollisionEnvelopeOverlap;
  const isCritical = isOverlap || closestApproach.predictedMissDistanceM < 200;
  const isWarning = !isCritical && closestApproach.predictedMissDistanceM < 2000;

  // Severity styling
  const severityBadgeClass = isOverlap
    ? 'bg-[#C65D5D]/15 text-[#C65D5D] border-[#C65D5D]/30'
    : isCritical
      ? 'bg-[#C65D5D]/10 text-[#C65D5D] border-[#C65D5D]/25'
      : isWarning
        ? 'bg-[#C58A3C]/10 text-[#C58A3C] border-[#C58A3C]/30'
        : 'bg-[#52745C]/10 text-[#52745C] border-[#52745C]/25';

  return (
    <div 
      className="rounded-md border p-4 shadow-xs font-sans text-xs transition-colors"
      style={{
        backgroundColor: 'var(--bg-surface-panel)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* Panel Header */}
      <div 
        className="flex items-center justify-between pb-3 mb-3 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          {isOverlap ? (
            <Flame className="w-4 h-4 text-[#C65D5D] animate-pulse" />
          ) : isCritical ? (
            <AlertTriangle className="w-4 h-4 text-[#C65D5D]" />
          ) : isWarning ? (
            <ShieldAlert className="w-4 h-4 text-[#C58A3C]" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#52745C]" />
          )}
          <span 
            className="font-bold uppercase tracking-wider font-mono-telemetry text-xs"
            style={{ color: 'var(--text-primary)' }}
          >
            Threat Impact & Encounter Assessment
          </span>
        </div>

        <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono-telemetry font-bold border uppercase ${severityBadgeClass}`}>
          {closestApproach.statusText}
        </span>
      </div>

      {/* Grid: Encounter Parameters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {/* Live Distance */}
        <div 
          className="p-2.5 rounded border"
          style={{ 
            backgroundColor: 'var(--bg-surface-elevated)', 
            borderColor: 'var(--border-default)' 
          }}
        >
          <div className="text-[10px] uppercase font-mono-telemetry flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <Crosshair className="w-3 h-3" />
            <span>Current Range</span>
          </div>
          <div className="text-base font-bold font-mono-telemetry mt-0.5" style={{ color: 'var(--text-primary)' }}>
            {liveDistanceKm >= 100 
              ? `${liveDistanceKm.toFixed(1)} km` 
              : `${(liveDistanceKm * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} m`}
          </div>
          <div className="text-[10px] font-mono-telemetry" style={{ color: 'var(--text-secondary)' }}>
            v_rel: {liveRelativeSpeedKms.toFixed(2)} km/s
          </div>
        </div>

        {/* Predicted Miss Distance */}
        <div 
          className="p-2.5 rounded border"
          style={{ 
            backgroundColor: 'var(--bg-surface-elevated)', 
            borderColor: isCritical ? '#C65D5D' : isWarning ? '#C58A3C' : 'var(--border-default)' 
          }}
        >
          <div className="text-[10px] uppercase font-mono-telemetry flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <Radiation className="w-3 h-3" />
            <span>Predicted d_CA</span>
          </div>
          <div 
            className="text-base font-bold font-mono-telemetry mt-0.5"
            style={{ color: isCritical ? '#C65D5D' : isWarning ? '#C58A3C' : 'var(--accent-primary)' }}
          >
            {closestApproach.predictedMissDistanceM.toLocaleString()} m
          </div>
          <div className="text-[10px] font-mono-telemetry" style={{ color: 'var(--text-secondary)' }}>
            Buffer: {closestApproach.predictedMissDistanceM < 2000 ? 'BREACHED (< 2.0 km)' : 'CLEARED (>= 2.0 km)'}
          </div>
        </div>

        {/* Time to Closest Approach */}
        <div 
          className="p-2.5 rounded border"
          style={{ 
            backgroundColor: 'var(--bg-surface-elevated)', 
            borderColor: 'var(--border-default)' 
          }}
        >
          <div className="text-[10px] uppercase font-mono-telemetry flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <Clock className="w-3 h-3" />
            <span>TCA Time Horizon</span>
          </div>
          <div className="text-base font-bold font-mono-telemetry mt-0.5" style={{ color: 'var(--text-primary)' }}>
            {Math.floor(closestApproach.timeToClosestApproachSec / 60)}m {closestApproach.timeToClosestApproachSec % 60}s
          </div>
          <div className="text-[10px] font-mono-telemetry" style={{ color: 'var(--text-secondary)' }}>
            at ν = {closestApproach.closestApproachTrueAnomalyDeg}° anomaly
          </div>
        </div>

        {/* Hard-Body Sphere Overlap */}
        <div 
          className="p-2.5 rounded border"
          style={{ 
            backgroundColor: 'var(--bg-surface-elevated)', 
            borderColor: 'var(--border-default)' 
          }}
        >
          <div className="text-[10px] uppercase font-mono-telemetry flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
            <Zap className="w-3 h-3" />
            <span>Collision Envelope</span>
          </div>
          <div 
            className="text-base font-bold font-mono-telemetry mt-0.5"
            style={{ color: isOverlap ? '#C65D5D' : 'var(--text-primary)' }}
          >
            {isOverlap ? 'OVERLAP DIRECT' : 'NO OVERLAP'}
          </div>
          <div className="text-[10px] font-mono-telemetry" style={{ color: 'var(--text-secondary)' }}>
            R1+R2: {closestApproach.combinedHardBodyRadiusM.toFixed(1)} m envelope
          </div>
        </div>
      </div>

      {/* Kinetic Energy & Consequence Analysis Banner */}
      <div 
        className="p-3 rounded border mb-3"
        style={{
          backgroundColor: isCritical ? 'rgba(198, 93, 93, 0.08)' : isWarning ? 'rgba(197, 138, 60, 0.08)' : 'var(--bg-surface-elevated)',
          borderColor: isCritical ? 'rgba(198, 93, 93, 0.3)' : isWarning ? 'rgba(197, 138, 60, 0.3)' : 'var(--border-subtle)',
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-bold font-mono-telemetry flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
              <span>Consequence Rating:</span>
              <span className="uppercase text-[#C65D5D] font-black">
                {impactAnalysis.severityCategory.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {impactAnalysis.severityDescription}
            </p>
          </div>

          <div className="flex items-center gap-4 text-right shrink-0">
            <div>
              <div className="text-[10px] uppercase font-mono-telemetry" style={{ color: 'var(--text-muted)' }}>
                Impact Kinetic Energy
              </div>
              <div className="text-sm font-bold font-mono-telemetry" style={{ color: 'var(--text-primary)' }}>
                {impactAnalysis.kineticEnergyMegajoules >= 1000 
                  ? `${(impactAnalysis.kineticEnergyMegajoules / 1000).toFixed(2)} GJ` 
                  : `${impactAnalysis.kineticEnergyMegajoules.toFixed(1)} MJ`}
              </div>
            </div>

            <div 
              className="pl-3 border-l"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="text-[10px] uppercase font-mono-telemetry" style={{ color: 'var(--text-muted)' }}>
                TNT Equiv.
              </div>
              <div className="text-sm font-bold font-mono-telemetry text-[#C65D5D]">
                {impactAnalysis.tntEquivalentKg >= 1000 
                  ? `${(impactAnalysis.tntEquivalentKg / 1000).toFixed(2)} t TNT` 
                  : `${impactAnalysis.tntEquivalentKg.toFixed(1)} kg TNT`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Disclosed Physical Assumptions Dropdown / Footnote */}
      <div 
        className="pt-2 text-[11px] flex items-start gap-1.5"
        style={{ color: 'var(--text-muted)' }}
      >
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <div className="space-y-0.5">
          <span>Physical assumptions: </span>
          <span className="font-mono-telemetry">
            Primary: {primary.name} ({primary.estimatedMassKg.toLocaleString()} kg, R={primary.hardBodyRadiusM}m) &bull; Threat: {threat.name} ({threat.estimatedMassKg.toLocaleString()} kg, R={threat.hardBodyRadiusM}m) &bull; Reduced Mass m_eff = {impactAnalysis.effectiveMassKg} kg &bull; Relative Velocity v_rel = {closestApproach.relativeVelocityKms} km/s.
          </span>
        </div>
      </div>
    </div>
  );
};
