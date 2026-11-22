import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useConjunction } from '../context/ConjunctionContext';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { MetricCard } from '../components/common/MetricCard';
import { RiskBadge, StatusBadge } from '../components/common/StatusBadge';
import { DataNotice } from '../components/common/DataNotice';
import { EncounterGeometryViewer } from '../components/visualization/EncounterGeometryViewer';
import { 
  formatScientific, 
  formatDistance, 
  formatUtcDateTime, 
  formatCountdownTca 
} from '../utils/formatters';
import { exportReportToCdmText } from '../utils/exportUtils';
import type { EventStatus } from '../types/conjunction';
import type { SavedReport } from '../types/report';
import { 
  ShieldAlert, 
  Sliders, 
  FileText, 
  Download, 
  Save, 
  Clock, 
  Zap, 
  Compass, 
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

export const EncounterAnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { 
    conjunctions, 
    selectConjunction, 
    updateConjunctionStatus, 
    saveReport 
  } = useConjunction();

  const conjunction = conjunctions.find((c) => c.id === id) || null;

  const [operatorNotes, setOperatorNotes] = useState<string>('');
  const [eventStatus, setEventStatus] = useState<EventStatus>('PENDING_ANALYSIS');
  const [isSavedRecently, setIsSavedRecently] = useState<boolean>(false);

  useEffect(() => {
    if (conjunction) {
      setOperatorNotes(conjunction.operatorNotes || '');
      setEventStatus(conjunction.status);
      selectConjunction(conjunction.id);
    }
  }, [conjunction?.id]);

  const handleStatusChange = (newStatus: EventStatus) => {
    if (!conjunction) return;
    setEventStatus(newStatus);
    updateConjunctionStatus(conjunction.id, newStatus, operatorNotes);
  };

  const handleSaveNotes = () => {
    if (!conjunction) return;
    updateConjunctionStatus(conjunction.id, eventStatus, operatorNotes);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2500);
  };

  const handleOpenSimulator = () => {
    if (conjunction) {
      selectConjunction(conjunction.id);
    }
    navigate('/simulator');
  };

  const handleSaveAssessmentReport = () => {
    if (!conjunction) return;
    const newReport: SavedReport = {
      id: `REP-${Date.now().toString().slice(-6)}`,
      referenceCode: `ORB-REP-${conjunction.id.replace('CONJ-', '')}`,
      title: `${conjunction.primaryObject.name} vs ${conjunction.secondaryObject.name} Assessment`,
      reportType: 'CONJUNCTION_ASSESSMENT',
      conjunctionId: conjunction.id,
      primaryObjectName: conjunction.primaryObject.name,
      secondaryObjectName: conjunction.secondaryObject.name,
      riskLevel: conjunction.riskLevel,
      author: 'Operations Console',
      createdAt: new Date().toISOString(),
      summary: `Automated close-approach assessment briefing for event ${conjunction.id}. Miss distance: ${formatDistance(conjunction.missDistanceM)}, Pc: ${formatScientific(conjunction.collisionProbability)}.`,
      conjunctionSnapshot: conjunction,
      operatorNotes: operatorNotes || 'Assessment initiated via Encounter Analysis workspace.',
      recommendedAction: conjunction.recommendation,
      approvalStatus: 'DRAFT',
    };
    saveReport(newReport);
    navigate('/reports');
  };

  const handleExportBriefing = () => {
    if (!conjunction) return;
    const dummyReport: SavedReport = {
      id: `REP-${Date.now().toString().slice(-6)}`,
      referenceCode: `ORB-REP-${conjunction.id.replace('CONJ-', '')}`,
      title: `${conjunction.primaryObject.name} Conjunction Briefing`,
      reportType: 'CONJUNCTION_ASSESSMENT',
      conjunctionId: conjunction.id,
      primaryObjectName: conjunction.primaryObject.name,
      secondaryObjectName: conjunction.secondaryObject.name,
      riskLevel: conjunction.riskLevel,
      author: 'Operations Console',
      createdAt: new Date().toISOString(),
      summary: `Operational conjunction assessment briefing for ${conjunction.id}.`,
      conjunctionSnapshot: conjunction,
      operatorNotes: operatorNotes,
      recommendedAction: conjunction.recommendation,
      approvalStatus: 'APPROVED',
    };
    exportReportToCdmText(dummyReport);
  };

  if (!conjunction) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto font-sans">
        <Breadcrumbs
          items={[
            { label: 'Conjunction Registry', to: '/conjunctions' },
            { label: 'Encounter Analysis' },
          ]}
        />

        <div className="bg-[#FFFFFF] rounded-md border border-[#E2E1DC] p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#E2E1DC] flex items-center justify-center text-[#52745C] mx-auto">
            <Compass className="w-6 h-6 text-[#52745C]" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-[#252A30] font-mono-telemetry">
              No Conjunction Event Loaded
            </h2>
            <p className="text-xs text-[#626A73] max-w-md mx-auto leading-relaxed">
              No active conjunction record was found for ID <code className="text-[#52745C] font-mono font-bold">{id || 'UNSET'}</code>. Select an encounter from the Conjunction Registry to view detailed geometry and risk metrics.
            </p>
          </div>

          <div className="p-4 bg-[#FAF9F6] rounded-md border border-[#E2E1DC] max-w-md mx-auto text-left text-xs font-mono-telemetry space-y-2 text-[#252A30]">
            <div className="font-bold text-[#252A30] uppercase text-xs pb-1 border-b border-[#E2E1DC]">
              Encounter Analysis Capabilities:
            </div>
            <ul className="space-y-1 text-[#626A73] list-disc list-inside font-sans">
              <li>Primary Satellite and Secondary Object orbital parameters</li>
              <li>Radial, In-track, and Cross-track relative miss vectors</li>
              <li>B-Plane coordinate projection and covariance ellipsoid</li>
              <li>Collision Probability (Pc) and maximum likelihood threshold</li>
              <li>Flight controller directives, notes, and CDM briefing export</li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/conjunctions')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#52745C] hover:bg-[#64866D] font-bold rounded-md shadow-xs transition-colors cursor-pointer font-mono-telemetry"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Conjunction Registry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans pb-10">
      <Breadcrumbs
        items={[
          { label: 'Conjunction Registry', to: '/conjunctions' },
          { label: `${conjunction.id} Analysis` },
        ]}
      />

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-[#E2E1DC]">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#252A30] font-mono-telemetry uppercase">
              {conjunction.id} Encounter Analysis
            </h1>
            <RiskBadge level={conjunction.riskLevel} />
            <StatusBadge status={eventStatus} />
          </div>
          <p className="text-xs text-[#626A73] mt-1 font-mono-telemetry">
            CDM Reference: {conjunction.cdmId} &bull; Data Source: {conjunction.screeningDataSource}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportBriefing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#252A30] bg-[#FFFFFF] hover:bg-[#FAF9F6] border border-[#E2E1DC] rounded-md transition-colors font-mono-telemetry shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#858B92]" />
            <span>Download Briefing</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAssessmentReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#252A30] bg-[#FFFFFF] hover:bg-[#FAF9F6] border border-[#E2E1DC] rounded-md transition-colors font-mono-telemetry shadow-xs cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-[#52745C]" />
            <span>Save to Reports</span>
          </button>

          <button
            type="button"
            onClick={handleOpenSimulator}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#52745C] hover:bg-[#64866D] font-bold rounded-md shadow-xs transition-colors font-mono-telemetry cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-[#FFFFFF]" />
            <span>Open Manoeuvre Simulator</span>
          </button>
        </div>
      </div>

      <DataNotice />

      {/* Telemetry Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Total Miss Distance"
          value={formatDistance(conjunction.missDistanceM)}
          subValue={`ΔR: ${conjunction.geometry.radialDeltaM}m • ΔT: ${conjunction.geometry.inTrackDeltaM}m`}
          icon={<Compass className="w-4 h-4 text-[#52745C]" />}
        />

        <MetricCard
          label="Collision Probability (Pc)"
          value={formatScientific(conjunction.collisionProbability)}
          subValue={`P_max: ${formatScientific(conjunction.maxCollisionProbability)}`}
          icon={<ShieldAlert className="w-4 h-4 text-[#C65D5D]" />}
        />

        <MetricCard
          label="TCA Countdown"
          value={formatCountdownTca(conjunction.hoursToTca)}
          subValue={formatUtcDateTime(conjunction.tcaUtc)}
          icon={<Clock className="w-4 h-4 text-[#52745C]" />}
        />

        <MetricCard
          label="Relative Velocity"
          value={`${conjunction.geometry.relativeVelocityKms.toFixed(2)} km/s`}
          subValue={`Approach Angle: ${conjunction.geometry.approachAngleDeg.toFixed(1)}°`}
          icon={<Zap className="w-4 h-4 text-[#C47C61]" />}
        />
      </div>

      {/* Object Telemetry Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#FFFFFF] rounded-md border border-[#E2E1DC] p-5 shadow-xs">
          <div className="pb-2 border-b border-[#E2E1DC]">
            <span className="text-xs font-bold text-[#52745C] uppercase tracking-wider font-mono-telemetry block">
              PRIMARY ASSET
            </span>
            <h3 className="text-sm font-bold text-[#252A30] mt-0.5">{conjunction.primaryObject.name}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 text-xs font-mono-telemetry text-[#626A73]">
            <div><span className="text-[#858B92] block text-[10px] font-sans">NORAD ID</span>{conjunction.primaryObject.noradId}</div>
            <div><span className="text-[#858B92] block text-[10px] font-sans">OPERATOR</span>{conjunction.primaryObject.operator}</div>
            <div><span className="text-[#858B92] block text-[10px] font-sans">ORBIT REGIME</span>{conjunction.primaryObject.regime}</div>
            <div><span className="text-[#858B92] block text-[10px] font-sans">APOGEE/PERIGEE</span>{conjunction.primaryObject.apogeeKm} / {conjunction.primaryObject.perigeeKm} km</div>
            <div><span className="text-[#858B92] block text-[10px] font-sans">INCLINATION</span>{conjunction.primaryObject.inclinationDeg}&deg;</div>
            <div><span className="text-[#858B92] block text-[10px] font-sans">PROPULSION</span>{conjunction.primaryObject.isManoeuvrable ? 'Equipped' : 'Passive'}</div>
          </div>
        </div>

        <div className="bg-[#FFFFFF] rounded-md border border-[#E2E1DC] p-5 shadow-xs">
          <div className="pb-2 border-b border-[#E2E1DC]">
            <span className="text-xs font-bold text-[#C47C61] uppercase tracking-wider font-mono-telemetry block">
              SECONDARY THREAT
            </span>
            <h3 className="text-sm font-bold text-[#252A30] mt-0.5">{conjunction.secondaryObject.name}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 text-xs font-mono-telemetry text-[#626A73]">
            <div><span className="text-[#858B92] block text-[10px] font-sans">NORAD ID</span>{conjunction.secondaryObject.noradId}</div>
            <div><span className="text-[#858B92] block text-[10px] font-sans">TYPE</span>{conjunction.secondaryObject.type}</div>
            <div><span className="text-[#858B92] block text-[10px] font-sans">COUNTRY</span>{conjunction.secondaryObject.country}</div>
            <div><span className="text-[#858B92] block text-[10px] font-sans">APOGEE/PERIGEE</span>{conjunction.secondaryObject.apogeeKm} / {conjunction.secondaryObject.perigeeKm} km</div>
            <div><span className="text-[#858B92] block text-[10px] font-sans">INCLINATION</span>{conjunction.secondaryObject.inclinationDeg}&deg;</div>
            <div><span className="text-[#858B92] block text-[10px] font-sans">ESTIMATED RCS</span>{conjunction.secondaryObject.rcsM2} m&sup2;</div>
          </div>
        </div>
      </div>

      {/* Geometry Canvas */}
      <EncounterGeometryViewer conjunction={conjunction} />

      {/* Operator Directives */}
      <div className="bg-[#FFFFFF] rounded-md border border-[#E2E1DC] p-5 shadow-xs space-y-3 font-sans">
        <div className="flex items-center justify-between pb-2 border-b border-[#E2E1DC]">
          <h3 className="text-xs font-bold text-[#252A30] uppercase font-mono-telemetry">
            Operator Directives & Notes
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#626A73] font-mono-telemetry uppercase">Status:</span>
            <select
              value={eventStatus}
              onChange={(e) => handleStatusChange(e.target.value as EventStatus)}
              className="px-2.5 py-1 text-xs border border-[#E2E1DC] bg-[#FAF9F6] rounded-md font-mono-telemetry text-[#252A30] focus:outline-none focus:border-[#52745C]"
            >
              <option value="PENDING_ANALYSIS">Pending Analysis</option>
              <option value="MANOEUVRE_PLANNED">Manoeuvre Planned</option>
              <option value="SCREENED_SAFE">Screened Safe</option>
              <option value="MONITORING">Monitoring</option>
            </select>
          </div>
        </div>

        <textarea
          rows={3}
          value={operatorNotes}
          onChange={(e) => setOperatorNotes(e.target.value)}
          placeholder="Document operator review, radar pass evaluations, ground station uplink windows..."
          className="w-full p-2.5 text-xs border border-[#E2E1DC] bg-[#FAF9F6] rounded-md font-mono-telemetry text-[#252A30] placeholder-[#858B92] focus:outline-none focus:border-[#52745C]"
        />

        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleSaveNotes}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#52745C] hover:bg-[#64866D] font-bold rounded-md shadow-xs transition-colors font-mono-telemetry cursor-pointer"
          >
            {isSavedRecently ? <CheckCircle className="w-3.5 h-3.5 text-[#FFFFFF]" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSavedRecently ? 'Saved' : 'Save Directives'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
