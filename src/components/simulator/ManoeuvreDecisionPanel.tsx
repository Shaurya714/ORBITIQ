import React, { useState } from 'react';
import type { 
  AvoidanceOptimizationResult, 
  AvoidanceManoeuvreCandidate, 
  DecisionSupportReport 
} from '../../types/simulation';
import { 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Send
} from 'lucide-react';

interface ManoeuvreDecisionPanelProps {
  optimizationResult: AvoidanceOptimizationResult;
  decisionReport: DecisionSupportReport;
  onApplyCandidate: (candidate: AvoidanceManoeuvreCandidate) => void;
  selectedCandidateId?: string;
}

export const ManoeuvreDecisionPanel: React.FC<ManoeuvreDecisionPanelProps> = ({
  optimizationResult,
  decisionReport,
  onApplyCandidate,
  selectedCandidateId,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'ACTION' | 'REASONING' | 'VERIFICATION' | 'ASSUMPTIONS'>('ACTION');
  const [isReportExpanded, setIsReportExpanded] = useState<boolean>(true);

  const rec = optimizationResult.recommendedCandidate;

  return (
    <div 
      className="rounded-md border p-5 shadow-xs font-sans text-xs transition-colors space-y-5"
      style={{
        backgroundColor: 'var(--bg-surface-panel)',
        borderColor: 'var(--border-default)',
      }}
    >
      {/* ===================================================================== */}
      {/* 1. TOP HEADER & OPTIMIZATION VERDICT */}
      {/* ===================================================================== */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b"
        style={{ borderColor: 'var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h3 
              className="font-bold uppercase tracking-wider font-mono-telemetry text-xs"
              style={{ color: 'var(--text-primary)' }}
            >
              Avoidance Manoeuvre Decision Support & Candidate Engine
            </h3>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              Deterministic candidate search across burn axes, lead times and impulses evaluated against safety buffer.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span 
            className="px-2.5 py-1 rounded text-xs font-mono-telemetry font-bold border"
            style={{
              backgroundColor: optimizationResult.status === 'OPTIMAL_FOUND' ? 'var(--accent-soft)' : 'rgba(197, 138, 60, 0.1)',
              borderColor: optimizationResult.status === 'OPTIMAL_FOUND' ? 'var(--accent-primary)' : 'rgba(197, 138, 60, 0.3)',
              color: optimizationResult.status === 'OPTIMAL_FOUND' ? 'var(--accent-primary)' : 'var(--status-warning)',
            }}
          >
            {optimizationResult.status === 'OPTIMAL_FOUND' 
              ? 'OPTIMAL SOLUTION FOUND' 
              : optimizationResult.status === 'SUBOPTIMAL_FOUND' 
                ? 'SUBOPTIMAL SOLUTION' 
                : 'NO FEASIBLE SOLUTION'}
          </span>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. RECOMMENDED ACTION CARD ("WHERE & HOW TO AVOID") */}
      {/* ===================================================================== */}
      {rec && (
        <div 
          className="rounded-md border p-4 shadow-xs relative overflow-hidden"
          style={{
            backgroundColor: 'var(--bg-surface-elevated)',
            borderColor: 'var(--accent-primary)',
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Left: Action Description */}
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span 
                  className="px-2 py-0.5 rounded text-[10px] font-mono-telemetry font-black uppercase tracking-wider text-white"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  RECOMMENDED ACTION
                </span>
                <span 
                  className="font-mono-telemetry font-bold text-xs"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {rec.name}
                </span>
              </div>

              <div 
                className="text-xs leading-relaxed"
                style={{ color: 'var(--text-secondary)' }}
              >
                {rec.reasoning}
              </div>

              {/* Execution Coordinates */}
              <div 
                className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono-telemetry"
                style={{ color: 'var(--text-primary)' }}
              >
                <div className="p-2 rounded border" style={{ backgroundColor: 'var(--bg-surface-panel)', borderColor: 'var(--border-subtle)' }}>
                  <div className="text-[10px] uppercase text-[#858B92]">Impulse Vector</div>
                  <div className="font-bold text-sm" style={{ color: 'var(--accent-primary)' }}>
                    +{rec.deltaVMps.toFixed(2)} m/s
                  </div>
                  <div className="text-[10px] text-[#626A73]">{rec.direction}</div>
                </div>

                <div className="p-2 rounded border" style={{ backgroundColor: 'var(--bg-surface-panel)', borderColor: 'var(--border-subtle)' }}>
                  <div className="text-[10px] uppercase text-[#858B92]">Ignition Point</div>
                  <div className="font-bold text-sm">ν = {rec.burnAnomalyDeg}°</div>
                  <div className="text-[10px] text-[#626A73]">T-{Math.round(rec.burnTimingSec)}s prior</div>
                </div>

                <div className="p-2 rounded border" style={{ backgroundColor: 'var(--bg-surface-panel)', borderColor: 'var(--border-subtle)' }}>
                  <div className="text-[10px] uppercase text-[#858B92]">Separation Gain</div>
                  <div className="font-bold text-sm" style={{ color: 'var(--accent-primary)' }}>
                    {rec.postBurnMissDistanceM.toLocaleString()} m
                  </div>
                  <div className="text-[10px] text-[#626A73]">+{rec.missDistanceGainM.toLocaleString()} m net</div>
                </div>

                <div className="p-2 rounded border" style={{ backgroundColor: 'var(--bg-surface-panel)', borderColor: 'var(--border-subtle)' }}>
                  <div className="text-[10px] uppercase text-[#858B92]">Propellant Mass</div>
                  <div className="font-bold text-sm">{rec.propellantUsedKg.toFixed(2)} kg</div>
                  <div className="text-[10px] text-[#626A73]">Hydrazine monoprop</div>
                </div>
              </div>
            </div>

            {/* Right: CTA & Safety Clear Stamp */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-center gap-3 shrink-0">
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded border text-xs font-mono-telemetry font-bold"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  borderColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary)',
                }}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>SAFETY BUFFER CLEARED ({rec.postBurnMissDistanceM.toLocaleString()}m &gt; 2.0 km)</span>
              </div>

              <button
                type="button"
                onClick={() => onApplyCandidate(rec)}
                className="w-full sm:w-auto px-5 py-2.5 text-white font-bold rounded text-xs font-mono-telemetry uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                }}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Apply Solution to Simulator</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. CANDIDATE COMPARISON MATRIX TABLE */}
      {/* ===================================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span 
            className="font-bold uppercase tracking-wider font-mono-telemetry text-xs"
            style={{ color: 'var(--text-primary)' }}
          >
            Manoeuvre Candidate Evaluation Matrix ({optimizationResult.candidates.length} Scanned)
          </span>
          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            Ranked by multi-objective safety score
          </span>
        </div>

        <div 
          className="border rounded-md overflow-x-auto shadow-xs"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr 
                className="border-b font-mono-telemetry text-[11px] uppercase tracking-wider"
                style={{ 
                  backgroundColor: 'var(--bg-surface-elevated)', 
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-secondary)'
                }}
              >
                <th className="py-2.5 px-3">Candidate</th>
                <th className="py-2.5 px-3">Direction</th>
                <th className="py-2.5 px-3 text-right">Delta-V</th>
                <th className="py-2.5 px-3 text-right">Fuel (kg)</th>
                <th className="py-2.5 px-3 text-right">New Miss (m)</th>
                <th className="py-2.5 px-3 text-right">Gain</th>
                <th className="py-2.5 px-3 text-center">Buffer (2km)</th>
                <th className="py-2.5 px-3 text-center">Secondary Risk</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono-telemetry text-xs" style={{ borderColor: 'var(--border-subtle)' }}>
              
              {/* Baseline row (No action) */}
              <tr 
                className="opacity-80"
                style={{ backgroundColor: 'var(--bg-surface-panel)' }}
              >
                <td className="py-2.5 px-3 font-bold" style={{ color: 'var(--text-muted)' }}>
                  Baseline (No Burn)
                </td>
                <td className="py-2.5 px-3 text-[#858B92]">NONE</td>
                <td className="py-2.5 px-3 text-right text-[#858B92]">0.00 m/s</td>
                <td className="py-2.5 px-3 text-right text-[#858B92]">0.00 kg</td>
                <td className="py-2.5 px-3 text-right font-bold text-[#C65D5D]">
                  {optimizationResult.baselineMissDistanceM.toLocaleString()} m
                </td>
                <td className="py-2.5 px-3 text-right text-[#858B92]">&plusmn;0 m</td>
                <td className="py-2.5 px-3 text-center">
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#C65D5D]/10 text-[#C65D5D] border border-[#C65D5D]/25 font-bold">
                    BREACHED
                  </span>
                </td>
                <td className="py-2.5 px-3 text-center text-[#858B92]">N/A</td>
                <td className="py-2.5 px-3 text-right">
                  <span className="text-[10px] text-[#858B92]">Reference</span>
                </td>
              </tr>

              {/* Candidates */}
              {optimizationResult.candidates.map((cand) => {
                const isSelected = selectedCandidateId === cand.id || (!selectedCandidateId && cand.isRecommended);

                return (
                  <tr 
                    key={cand.id}
                    className={`transition-colors ${isSelected ? 'font-semibold' : ''}`}
                    style={{
                      backgroundColor: isSelected ? 'var(--accent-soft)' : 'var(--bg-surface-panel)',
                    }}
                  >
                    <td className="py-2.5 px-3 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                      {cand.isRecommended && (
                        <span 
                          className="px-1.5 py-0.2 rounded text-[9px] text-white font-bold"
                          style={{ backgroundColor: 'var(--accent-primary)' }}
                        >
                          REC
                        </span>
                      )}
                      <span>{cand.name}</span>
                    </td>

                    <td className="py-2.5 px-3">
                      <span 
                        className="px-1.5 py-0.5 rounded text-[10px] border"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: 'var(--border-default)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        {cand.direction}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: 'var(--text-primary)' }}>
                      {cand.deltaVMps.toFixed(2)} m/s
                    </td>

                    <td className="py-2.5 px-3 text-right" style={{ color: 'var(--text-secondary)' }}>
                      {cand.propellantUsedKg.toFixed(2)} kg
                    </td>

                    <td 
                      className="py-2.5 px-3 text-right font-bold"
                      style={{
                        color: cand.isSafetyBufferCleared ? 'var(--accent-primary)' : 'var(--status-warning)',
                      }}
                    >
                      {cand.postBurnMissDistanceM.toLocaleString()} m
                    </td>

                    <td className="py-2.5 px-3 text-right" style={{ color: 'var(--accent-primary)' }}>
                      +{cand.missDistanceGainM.toLocaleString()} m
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {cand.isSafetyBufferCleared ? (
                        <span 
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                          style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}
                        >
                          CLEARED
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#C58A3C]/10 text-[#C58A3C]">
                          &lt; 2000m
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {cand.secondaryConjunctionRisk === 'WARNING' ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#C65D5D]/15 text-[#C65D5D] border border-[#C65D5D]/30 flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>WARNING</span>
                        </span>
                      ) : cand.secondaryConjunctionRisk === 'LOW' ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#C58A3C]/10 text-[#C58A3C]">
                          LOW RISK
                        </span>
                      ) : (
                        <span 
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                          style={{ color: 'var(--accent-primary)' }}
                        >
                          CLEARED
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => onApplyCandidate(cand)}
                        className="px-2.5 py-1 rounded text-[11px] font-mono-telemetry font-bold transition-colors cursor-pointer"
                        style={{
                          backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                          color: isSelected ? '#FFFFFF' : 'var(--text-primary)',
                          border: '1px solid var(--border-default)',
                        }}
                      >
                        {isSelected ? 'Loaded' : 'Load Burn'}
                      </button>
                    </td>
                  </tr>
                );
              })}

            </tbody>
          </table>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. EXPANDABLE DECISION-SUPPORT ENGINEERING REPORT */}
      {/* ===================================================================== */}
      <div 
        className="rounded-md border p-4 shadow-xs"
        style={{
          backgroundColor: 'var(--bg-surface-elevated)',
          borderColor: 'var(--border-default)',
        }}
      >
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsReportExpanded(prev => !prev)}
        >
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <span 
              className="font-bold uppercase tracking-wider font-mono-telemetry text-xs"
              style={{ color: 'var(--text-primary)' }}
            >
              Structured Decision-Support Report & Astrodynamic Rationale
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono-telemetry" style={{ color: 'var(--text-muted)' }}>
              Generated {new Date(decisionReport.timestamp).toLocaleTimeString()}
            </span>
            {isReportExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {isReportExpanded && (
          <div className="mt-4 pt-3 border-t space-y-3" style={{ borderColor: 'var(--border-subtle)' }}>
            {/* Report Sub-Tabs */}
            <div className="flex items-center gap-2 border-b pb-2" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="button"
                onClick={() => setActiveReportTab('ACTION')}
                className={`px-2.5 py-1 rounded text-xs font-mono-telemetry cursor-pointer ${activeReportTab === 'ACTION' ? 'font-bold' : ''}`}
                style={{
                  backgroundColor: activeReportTab === 'ACTION' ? 'var(--accent-soft)' : 'transparent',
                  color: activeReportTab === 'ACTION' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                1. No-Action Outcome
              </button>

              <button
                type="button"
                onClick={() => setActiveReportTab('REASONING')}
                className={`px-2.5 py-1 rounded text-xs font-mono-telemetry cursor-pointer ${activeReportTab === 'REASONING' ? 'font-bold' : ''}`}
                style={{
                  backgroundColor: activeReportTab === 'REASONING' ? 'var(--accent-soft)' : 'transparent',
                  color: activeReportTab === 'REASONING' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                2. Physical Reasoning
              </button>

              <button
                type="button"
                onClick={() => setActiveReportTab('VERIFICATION')}
                className={`px-2.5 py-1 rounded text-xs font-mono-telemetry cursor-pointer ${activeReportTab === 'VERIFICATION' ? 'font-bold' : ''}`}
                style={{
                  backgroundColor: activeReportTab === 'VERIFICATION' ? 'var(--accent-soft)' : 'transparent',
                  color: activeReportTab === 'VERIFICATION' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                3. Post-Burn Verification
              </button>

              <button
                type="button"
                onClick={() => setActiveReportTab('ASSUMPTIONS')}
                className={`px-2.5 py-1 rounded text-xs font-mono-telemetry cursor-pointer ${activeReportTab === 'ASSUMPTIONS' ? 'font-bold' : ''}`}
                style={{
                  backgroundColor: activeReportTab === 'ASSUMPTIONS' ? 'var(--accent-soft)' : 'transparent',
                  color: activeReportTab === 'ASSUMPTIONS' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                4. Limitations & Confidence
              </button>
            </div>

            {/* Tab Contents */}
            <div className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {activeReportTab === 'ACTION' && (
                <div className="space-y-2">
                  <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    Assessment of Inertial Trajectory (Zero-Manoeuvre Default):
                  </div>
                  <p>{decisionReport.noActionOutcome}</p>
                  <p>{decisionReport.manoeuvreOptionsSummary}</p>
                </div>
              )}

              {activeReportTab === 'REASONING' && (
                <div className="space-y-2">
                  <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    Why Along-Track Phasing Burn was Chosen Over Radial Thrust:
                  </div>
                  <p>{decisionReport.physicalReasoning}</p>
                </div>
              )}

              {activeReportTab === 'VERIFICATION' && (
                <div className="space-y-2">
                  <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    Forward Orbit Safety Clearance Verification:
                  </div>
                  <p>{decisionReport.postManoeuvreVerification}</p>
                </div>
              )}

              {activeReportTab === 'ASSUMPTIONS' && (
                <div className="space-y-2">
                  <div className="font-bold" style={{ color: 'var(--text-primary)' }}>
                    Engineering Modeling Assumptions & Scope Boundaries:
                  </div>
                  <ul className="list-disc pl-5 space-y-1 font-mono-telemetry text-[11px]">
                    {decisionReport.confidenceAndLimitations.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
