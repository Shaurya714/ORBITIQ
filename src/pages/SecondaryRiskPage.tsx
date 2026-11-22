import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConjunction } from '../context/ConjunctionContext';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { DataNotice } from '../components/common/DataNotice';
import { 
  Layers, 
  Sliders, 
  ArrowLeft, 
  Database,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const SecondaryRiskPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    selectedConjunction, 
    simulationConfig,
    simulationResult,
    spaceTrackStatus
  } = useConjunction();

  const isConnected = spaceTrackStatus.status === 'CONNECTED';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10 font-sans">
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Overview', to: '/' },
          { label: 'Simulator', to: '/simulator' },
          { label: 'Check for New Risks' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-[#E2E1DC]">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#252A30] font-mono-telemetry uppercase flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#52745C]" />
              <span>Secondary Collision Risk Screening</span>
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#EAF0E9] text-[#52745C] border border-[#52745C]/30 rounded-md font-mono-telemetry flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#52745C]" />
              <span>POST-BURN TRAJECTORY LOADED</span>
            </span>
          </div>
          <p className="text-xs text-[#626A73] mt-1 font-mono-telemetry">
            Screen modified post-manoeuvre trajectories against the catalog to audit potential secondary conjunctions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/simulator')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#252A30] bg-[#FFFFFF] hover:bg-[#FAF9F6] border border-[#E2E1DC] rounded-md transition-colors font-mono-telemetry cursor-pointer shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#858B92]" />
          <span>Return to Simulator</span>
        </button>
      </div>

      {/* System Notice */}
      <DataNotice 
        message={
          isConnected 
            ? `Space-Track catalog online (${spaceTrackStatus.cachedEntriesCount} objects cached). Trajectory clearance screening active.`
            : "Secondary collision screening evaluates modified orbit ephemerides against the full tracked space catalog to verify no newly induced hazards occur."
        } 
      />

      {/* Active Trajectory Context Card */}
      <div className="bg-[#FFFFFF] rounded-md border border-[#E2E1DC] p-5 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-[#E2E1DC]">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#52745C]" />
            <h3 className="text-xs font-bold text-[#252A30] uppercase font-mono-telemetry tracking-wider">
              Proposed Manoeuvre Trajectory Context
            </h3>
          </div>
          <span className="text-xs text-[#626A73] font-mono-telemetry">
            Target Asset: <strong className="text-[#252A30]">{selectedConjunction?.primaryObject.name || 'Simulated Spacecraft'}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs font-mono-telemetry text-[#252A30]">
          <div>
            <span className="text-[#858B92] block text-[10px] uppercase font-sans">BURN DIRECTION</span>
            <span className="font-bold text-[#52745C]">{simulationConfig.direction}</span>
          </div>
          <div>
            <span className="text-[#858B92] block text-[10px] uppercase font-sans">MAGNITUDE (Δv)</span>
            <span className="font-bold text-[#252A30]">{simulationConfig.deltaVMps.toFixed(2)} m/s</span>
          </div>
          <div>
            <span className="text-[#858B92] block text-[10px] uppercase font-sans">POST-BURN APOGEE</span>
            <span className="font-bold text-[#252A30]">
              {simulationResult ? `${simulationResult.postBurnApogeeKm.toFixed(0)} km` : 'Pending Burn'}
            </span>
          </div>
          <div>
            <span className="text-[#858B92] block text-[10px] uppercase font-sans">POST-BURN PERIGEE</span>
            <span className="font-bold text-[#252A30]">
              {simulationResult ? `${simulationResult.postBurnPerigeeKm.toFixed(0)} km` : 'Pending Burn'}
            </span>
          </div>
        </div>
      </div>

      {/* Structured Standby State for Secondary Screening */}
      <div className="bg-[#FFFFFF] rounded-md border border-[#E2E1DC] p-8 text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#E2E1DC] flex items-center justify-center text-[#52745C] mx-auto">
          <Layers className="w-6 h-6 text-[#52745C]" />
        </div>

        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#252A30] font-mono-telemetry">
            Secondary Collision Clearance Verification
          </h3>
          <p className="text-xs text-[#626A73] max-w-md mx-auto leading-relaxed font-sans">
            Secondary encounter screening checks the modified post-burn trajectory against the entire space catalog (25,000+ objects from Space-Track) to guarantee the avoidance burn does not induce a new close approach.
          </p>
        </div>

        <div className="p-4 bg-[#FAF9F6] rounded-md border border-[#E2E1DC] max-w-lg mx-auto text-left text-xs font-mono-telemetry space-y-2 text-[#252A30]">
          <div className="font-bold text-[#252A30] uppercase text-xs pb-1 border-b border-[#E2E1DC] flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-[#52745C]" />
            <span>Secondary Risk Screening Verification Protocol:</span>
          </div>
          <ul className="space-y-1 text-[#626A73] list-disc list-inside font-sans">
            <li>Generate perturbed post-burn orbit ephemeris starting at t_burn</li>
            <li>Screen trajectory against active satellites and debris catalog across a 72h window</li>
            <li>Flag any newly induced encounters exceeding safety buffer (&lt; 2.0 km miss distance)</li>
            <li>Provide clear trade-off verdicts (Approved Clear vs Caution New Threat)</li>
            <li>Allow instantaneous iteration back to the Manoeuvre Simulator</li>
          </ul>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/simulator')}
            className="px-4 py-2 text-xs font-semibold text-[#252A30] bg-[#FAF9F6] hover:bg-[#F0EFEA] border border-[#E2E1DC] rounded-md transition-colors font-mono-telemetry cursor-pointer shadow-xs"
          >
            Adjust Manoeuvre in Simulator
          </button>
          <button
            type="button"
            onClick={() => navigate('/reports')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#52745C] hover:bg-[#64866D] rounded-md shadow-xs transition-colors font-mono-telemetry cursor-pointer"
          >
            <span>Review Decision Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
