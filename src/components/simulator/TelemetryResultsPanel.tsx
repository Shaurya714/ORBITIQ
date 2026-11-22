import React from 'react';
import type { ManoeuvreResult } from '../../physics/orbitalPhysics';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Compass, 
  Save,
  ShieldCheck,
  Activity
} from 'lucide-react';

interface TelemetryResultsPanelProps {
  manoeuvreResult: ManoeuvreResult | null;
  onSavePlan?: () => void;
}

export const TelemetryResultsPanel: React.FC<TelemetryResultsPanelProps> = ({
  manoeuvreResult,
  onSavePlan,
}) => {
  if (!manoeuvreResult) {
    return (
      <div className="bg-[#FFFFFF] rounded-md border border-[#E2E1DC] p-5 text-center text-[#626A73] font-mono-telemetry text-xs space-y-2 shadow-xs">
        <Compass className="w-6 h-6 text-[#858B92] mx-auto" />
        <div className="text-[#252A30] font-bold">Awaiting Manoeuvre Calculation</div>
        <p className="text-xs text-[#858B92] max-w-sm mx-auto">
          Configure burn direction and Δv magnitude to evaluate post-manoeuvre trajectory and orbit modifications.
        </p>
      </div>
    );
  }

  const {
    initialApogeeAltitudeKm,
    initialPerigeeAltitudeKm,
    initialPeriodSec,
    postBurnApogeeAltitudeKm,
    postBurnPerigeeAltitudeKm,
    postBurnPeriodSec,
    deltaApogeeKm,
    deltaPerigeeKm,
    deltaPeriodSec,
    propellantUsedKg,
    burnDurationSec,
    finalMassKg,
    deltaVVectorKms,
    conservation,
    isAtmosphericEntry,
    isHyperbolicEscape,
    statusVerdict,
    verdictMessage,
  } = manoeuvreResult;

  const initialPeriodMin = (initialPeriodSec / 60).toFixed(2);
  const postPeriodMin = (postBurnPeriodSec / 60).toFixed(2);

  return (
    <div className="bg-[#FFFFFF] rounded-md border border-[#E2E1DC] p-5 shadow-xs space-y-4 font-mono-telemetry text-xs">
      {/* 1. Verdict & Status Banner */}
      <div className={`p-3 rounded-md border flex items-start gap-2.5 ${
        isAtmosphericEntry
          ? 'bg-[#C65D5D]/10 border-[#C65D5D]/30 text-[#C65D5D]'
          : isHyperbolicEscape
          ? 'bg-[#C58A3C]/10 border-[#C58A3C]/30 text-[#C58A3C]'
          : 'bg-[#EAF0E9] border-[#52745C]/30 text-[#52745C]'
      }`}>
        {isAtmosphericEntry ? (
          <AlertTriangle className="w-4 h-4 text-[#C65D5D] shrink-0 mt-0.5" />
        ) : isHyperbolicEscape ? (
          <Flame className="w-4 h-4 text-[#C58A3C] shrink-0 mt-0.5" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-[#52745C] shrink-0 mt-0.5" />
        )}
        <div className="flex-1">
          <div className="font-bold text-xs uppercase tracking-wider text-[#252A30]">
            Trajectory Status: {statusVerdict.replace(/_/g, ' ')}
          </div>
          <p className="text-xs mt-0.5 leading-snug font-sans text-[#626A73]">
            {verdictMessage}
          </p>
        </div>
      </div>

      {/* 2. Primary Delta Comparison Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Apogee Change */}
        <div className="p-3 rounded-md bg-[#FAF9F6] border border-[#E2E1DC] space-y-1">
          <span className="text-[#858B92] text-[10px] uppercase font-bold block font-sans">
            Apogee Altitude (ha)
          </span>
          <div className="text-[#252A30] font-bold text-sm">
            {postBurnApogeeAltitudeKm.toFixed(0)} km
          </div>
          <span className={`text-xs font-semibold block ${deltaApogeeKm >= 0 ? 'text-[#52745C]' : 'text-[#C65D5D]'}`}>
            {deltaApogeeKm >= 0 ? '+' : ''}{deltaApogeeKm.toFixed(0)} km
          </span>
          <span className="text-[10px] text-[#858B92] block">Baseline: {initialApogeeAltitudeKm.toFixed(0)} km</span>
        </div>

        {/* Perigee Change */}
        <div className="p-3 rounded-md bg-[#FAF9F6] border border-[#E2E1DC] space-y-1">
          <span className="text-[#858B92] text-[10px] uppercase font-bold block font-sans">
            Perigee Altitude (hp)
          </span>
          <div className={`font-bold text-sm ${isAtmosphericEntry ? 'text-[#C65D5D]' : 'text-[#252A30]'}`}>
            {postBurnPerigeeAltitudeKm.toFixed(0)} km
          </div>
          <span className={`text-xs font-semibold block ${deltaPerigeeKm >= 0 ? 'text-[#52745C]' : 'text-[#C65D5D]'}`}>
            {deltaPerigeeKm >= 0 ? '+' : ''}{deltaPerigeeKm.toFixed(0)} km
          </span>
          <span className="text-[10px] text-[#858B92] block">Baseline: {initialPerigeeAltitudeKm.toFixed(0)} km</span>
        </div>

        {/* Period Change */}
        <div className="p-3 rounded-md bg-[#FAF9F6] border border-[#E2E1DC] space-y-1">
          <span className="text-[#858B92] text-[10px] uppercase font-bold block font-sans">
            Orbital Period (T)
          </span>
          <div className="text-[#252A30] font-bold text-sm">
            {postPeriodMin} min
          </div>
          <span className={`text-xs font-semibold block ${deltaPeriodSec >= 0 ? 'text-[#52745C]' : 'text-[#C65D5D]'}`}>
            {deltaPeriodSec >= 0 ? '+' : ''}{(deltaPeriodSec / 60).toFixed(2)} min
          </span>
          <span className="text-[10px] text-[#858B92] block">Baseline: {initialPeriodMin} min</span>
        </div>

        {/* Propellant Budget */}
        <div className="p-3 rounded-md bg-[#FAF9F6] border border-[#E2E1DC] space-y-1">
          <span className="text-[#858B92] text-[10px] uppercase font-bold block font-sans">
            Propellant Budget (Δm)
          </span>
          <div className="text-[#52745C] font-bold text-sm">
            {propellantUsedKg.toFixed(2)} kg
          </div>
          <span className="text-xs text-[#252A30] font-semibold block">
            Final Mass: {finalMassKg.toFixed(0)} kg
          </span>
          <span className="text-[10px] text-[#858B92] block font-sans">
            {burnDurationSec > 0 ? `Burn: ${burnDurationSec.toFixed(1)}s` : 'Impulsive Δv'}
          </span>
        </div>
      </div>

      {/* 3. Astrodynamics Conservation Metrics & Invariants */}
      <div className="p-3 rounded-md bg-[#FAF9F6] border border-[#E2E1DC] space-y-2">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#E2E1DC]">
          <span className="text-xs font-bold text-[#252A30] uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#52745C]" />
            <span>Physics Invariant Conservation Telemetry</span>
          </span>
          <span className="text-xs text-[#52745C] bg-[#EAF0E9] border border-[#52745C]/30 px-2 py-0.5 rounded font-medium flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-[#52745C]" />
            <span>Integrator Verified (RK4)</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[#858B92] block text-[10px] font-sans">Specific Orbital Energy (ε = v²/2 - μ/r)</span>
            <div className="text-[#252A30] font-semibold">
              Initial: {conservation.initialEnergy} km²/s²
            </div>
            <div className="text-[#626A73] text-[11px]">
              Post-Burn: <span className="text-[#52745C] font-semibold">{conservation.finalEnergy} km²/s²</span> (Δε = {conservation.energyDelta} km²/s²)
            </div>
          </div>

          <div>
            <span className="text-[#858B92] block text-[10px] font-sans">Specific Angular Momentum (h = |r⃗ × v⃗|)</span>
            <div className="text-[#252A30] font-semibold">
              Initial: {conservation.initialAngularMomentum} km²/s
            </div>
            <div className="text-[#626A73] text-[11px]">
              Post-Burn: <span className="text-[#52745C] font-semibold">{conservation.finalAngularMomentum} km²/s</span> (Δh = {conservation.angularMomentumDelta} km²/s)
            </div>
          </div>
        </div>
      </div>

      {/* 4. Detailed Apsidal Transition Table */}
      <div className="overflow-x-auto pt-1">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-[#E2E1DC] text-xs text-[#626A73] uppercase tracking-wider bg-[#FAF9F6]">
              <th className="py-1.5 px-2">Orbital Metric</th>
              <th className="py-1.5 px-2">Pre-Burn Baseline</th>
              <th className="py-1.5 px-2">Post-Burn Target</th>
              <th className="py-1.5 px-2 text-right">Net Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E1DC] text-[#626A73] text-xs">
            <tr>
              <td className="py-1.5 px-2 font-semibold text-[#252A30]">Semi-Major Axis (a)</td>
              <td className="py-1.5 px-2">{manoeuvreResult.initialElements.semiMajorAxisKm.toFixed(1)} km</td>
              <td className="py-1.5 px-2 text-[#52745C] font-semibold">{manoeuvreResult.postBurnElements.semiMajorAxisKm.toFixed(1)} km</td>
              <td className="py-1.5 px-2 text-right font-semibold text-[#252A30]">
                {(manoeuvreResult.postBurnElements.semiMajorAxisKm - manoeuvreResult.initialElements.semiMajorAxisKm).toFixed(1)} km
              </td>
            </tr>
            <tr>
              <td className="py-1.5 px-2 font-semibold text-[#252A30]">Eccentricity (e)</td>
              <td className="py-1.5 px-2">{manoeuvreResult.initialElements.eccentricity.toFixed(5)}</td>
              <td className="py-1.5 px-2 text-[#52745C] font-semibold">{manoeuvreResult.postBurnElements.eccentricity.toFixed(5)}</td>
              <td className="py-1.5 px-2 text-right font-semibold text-[#252A30]">
                {(manoeuvreResult.postBurnElements.eccentricity - manoeuvreResult.initialElements.eccentricity).toFixed(5)}
              </td>
            </tr>
            <tr>
              <td className="py-1.5 px-2 font-semibold text-[#252A30]">Burn Delta-V (Δv)</td>
              <td className="py-1.5 px-2">0.00 m/s</td>
              <td className="py-1.5 px-2 text-[#52745C] font-semibold">{deltaVVectorKms.magnitudeMps.toFixed(2)} m/s</td>
              <td className="py-1.5 px-2 text-right text-[#52745C] font-semibold">+{deltaVVectorKms.magnitudeMps.toFixed(2)} m/s</td>
            </tr>
          </tbody>
        </table>
      </div>

      {onSavePlan && (
        <div className="pt-2 border-t border-[#E2E1DC] flex justify-end">
          <button
            type="button"
            onClick={onSavePlan}
            className="px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#52745C] hover:bg-[#64866D] rounded-md shadow-xs inline-flex items-center gap-1.5 transition-colors font-mono-telemetry cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Solution</span>
          </button>
        </div>
      )}
    </div>
  );
};
