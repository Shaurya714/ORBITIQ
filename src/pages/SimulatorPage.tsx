import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConjunction } from '../context/ConjunctionContext';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { OrbitalSimulationCanvas } from '../components/simulator/OrbitalSimulationCanvas';
import { SimulationControlsBar } from '../components/simulator/SimulationControlsBar';
import { SpacecraftConfigPanel } from '../components/simulator/SpacecraftConfigPanel';
import { SimulationGraphsPanel } from '../components/simulator/SimulationGraphsPanel';
import { CollisionThreatPanel } from '../components/simulator/CollisionThreatPanel';
import { ManoeuvreDecisionPanel } from '../components/simulator/ManoeuvreDecisionPanel';
import { 
  calculateManoeuvre, 
  trueToEccentricAnomaly,
  EARTH_MU,
  type KeplerianElements, 
  type ManoeuvreParams, 
  type ManoeuvreResult 
} from '../physics/orbitalPhysics';
import { 
  calculateEncounterSnapshot, 
  predictClosestApproach, 
  analyzeImpactConsequence 
} from '../physics/collisionPhysics';
import { 
  ENCOUNTER_SCENARIOS, 
  optimizeAvoidanceManoeuvre, 
  generateDecisionReport 
} from '../physics/manoeuvreOptimizer';
import type { UnifiedOrbitalObject } from '../services/orbitalDataService';
import type { 
  SavedSimulationRecord, 
  SimulationResult,
  OrbitalObjectProfile,
  TwoObjectEncounterScenario,
  AvoidanceManoeuvreCandidate
} from '../types/simulation';
import { 
  Orbit, 
  ArrowRight, 
  Save, 
  Play,
  Check
} from 'lucide-react';

const DEFAULT_MANOEUVRE_PARAMS: ManoeuvreParams = {
  directionMode: 'PROGRADE',
  deltaVMps: 0.85,
  customAngleDeg: 0,
  locationMode: 'PERIAPSIS',
  burnAnomalyDeg: 0,
  isFiniteBurn: false,
  thrustN: 450,
  spacecraftMassKg: 1200,
  specificImpulseSec: 285,
};

export const SimulatorPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    catalogObjects,
    selectedConjunction,
    saveSimulationRecord,
    setSimulationResult,
    updateSimulationConfig,
    addToast
  } = useConjunction();

  const simulationSectionRef = useRef<HTMLDivElement | null>(null);
  const decisionSectionRef = useRef<HTMLDivElement | null>(null);

  // Active Encounter Scenario (Defaults to Scenario B: Dangerous Close Approach)
  const [selectedScenario, setSelectedScenario] = useState<TwoObjectEncounterScenario>(() => {
    return ENCOUNTER_SCENARIOS[1]; // Scenario B default
  });

  // Primary Spacecraft Profile
  const [primaryProfile, setPrimaryProfile] = useState<OrbitalObjectProfile>(() => {
    if (selectedConjunction) {
      const p = selectedConjunction.primaryObject;
      const a = p.semiMajorAxisKm > 6000 ? p.semiMajorAxisKm : (p.apogeeKm + p.perigeeKm) / 2 + 6378.137;
      const e = (p.apogeeKm - p.perigeeKm) / (2 * a);
      return {
        name: p.name,
        noradId: p.noradId,
        objectType: 'PAYLOAD',
        elements: {
          semiMajorAxisKm: a,
          eccentricity: Math.max(0.0001, Math.min(0.9, e)),
          inclinationDeg: p.inclinationDeg || 51.6,
          raanDeg: 0,
          argOfPericenterDeg: 0,
          trueAnomalyDeg: 0,
          objectName: p.name,
          noradId: p.noradId,
          sourceProvider: 'ACTIVE_CONJUNCTION',
          epochUtc: new Date().toISOString(),
        },
        estimatedMassKg: 1200,
        hardBodyRadiusM: 2.5,
        dimensionsM: { length: 4.5, width: 2.0, height: 1.8 },
        isManoeuvrable: true,
        sourceProvider: 'ACTIVE_CONJUNCTION',
      };
    }
    return ENCOUNTER_SCENARIOS[1].primaryObject;
  });

  // Threat Object Profile
  const [threatProfile, setThreatProfile] = useState<OrbitalObjectProfile>(() => {
    if (selectedConjunction) {
      const s = selectedConjunction.secondaryObject;
      const a = s.semiMajorAxisKm > 6000 ? s.semiMajorAxisKm : (s.apogeeKm + s.perigeeKm) / 2 + 6378.137;
      const e = (s.apogeeKm - s.perigeeKm) / (2 * a);
      return {
        name: s.name,
        noradId: s.noradId,
        objectType: 'DEBRIS',
        elements: {
          semiMajorAxisKm: a,
          eccentricity: Math.max(0.0001, Math.min(0.9, e)),
          inclinationDeg: s.inclinationDeg || 51.6,
          raanDeg: 0,
          argOfPericenterDeg: 0,
          trueAnomalyDeg: 180,
          objectName: s.name,
          noradId: s.noradId,
          sourceProvider: 'SPACE-TRACK',
          epochUtc: new Date().toISOString(),
        },
        estimatedMassKg: 150,
        hardBodyRadiusM: 1.5,
        dimensionsM: { length: 1.2, width: 0.9, height: 0.8 },
        isManoeuvrable: false,
        sourceProvider: 'SPACE-TRACK',
      };
    }
    return ENCOUNTER_SCENARIOS[1].threatObject;
  });

  // Current primary Keplerian elements
  const currentElements = primaryProfile.elements;

  // Manoeuvre configuration parameters
  const [manoeuvreParams, setManoeuvreParams] = useState<ManoeuvreParams>(DEFAULT_MANOEUVRE_PARAMS);

  // Selected candidate ID for matrix highlight
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | undefined>(undefined);

  // Simulation time and animation playback state
  const [simTimeSeconds, setSimTimeSeconds] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(10);

  // Visualization layer toggles
  const [showReferenceOrbit, setShowReferenceOrbit] = useState<boolean>(true);
  const [showPredictedPath, setShowPredictedPath] = useState<boolean>(true);
  const [showManoeuvredOrbit, setShowManoeuvredOrbit] = useState<boolean>(true);
  const [showThreatOrbit, setShowThreatOrbit] = useState<boolean>(true);
  const [showCollisionEnvelope, setShowCollisionEnvelope] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);
  const [showAnnotations, setShowAnnotations] = useState<boolean>(true);

  // Plan saving feedback state
  const [savePlanName, setSavePlanName] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  // Compute physical manoeuvre result via orbital physics engine
  const manoeuvreResult: ManoeuvreResult = useMemo(() => {
    return calculateManoeuvre(currentElements, manoeuvreParams);
  }, [currentElements, manoeuvreParams]);

  // Compute instantaneous encounter state snapshot at simTimeSeconds
  const encounterSnapshot = useMemo(() => {
    return calculateEncounterSnapshot(primaryProfile, threatProfile, simTimeSeconds);
  }, [primaryProfile, threatProfile, simTimeSeconds]);

  // Compute baseline closest approach prediction
  const baselineClosestApproach = useMemo(() => {
    return predictClosestApproach(
      primaryProfile.elements,
      threatProfile.elements,
      primaryProfile.hardBodyRadiusM,
      threatProfile.hardBodyRadiusM
    );
  }, [primaryProfile, threatProfile]);

  // Compute debris threat & kinetic energy impact consequence
  const impactAnalysis = useMemo(() => {
    return analyzeImpactConsequence(
      primaryProfile,
      threatProfile,
      baselineClosestApproach.relativeVelocityKms,
      baselineClosestApproach.predictedMissDistanceM,
      baselineClosestApproach.isCollisionEnvelopeOverlap
    );
  }, [primaryProfile, threatProfile, baselineClosestApproach]);

  // Run automated avoidance manoeuvre candidate optimizer
  const avoidanceOptimization = useMemo(() => {
    return optimizeAvoidanceManoeuvre(primaryProfile, threatProfile, catalogObjects);
  }, [primaryProfile, threatProfile, catalogObjects]);

  // Generate structured decision-support engineering report
  const decisionReport = useMemo(() => {
    return generateDecisionReport(
      baselineClosestApproach,
      impactAnalysis,
      avoidanceOptimization,
      primaryProfile,
      threatProfile
    );
  }, [baselineClosestApproach, impactAnalysis, avoidanceOptimization, primaryProfile, threatProfile]);

  // Animation frame loop for continuous orbital propagation
  useEffect(() => {
    if (!isSimulating) return;

    let lastTimestamp = performance.now();
    let animationFrameId: number;

    const tick = (now: number) => {
      const deltaMs = now - lastTimestamp;
      lastTimestamp = now;

      const safeDeltaMs = Math.min(deltaMs, 100);
      const deltaSec = (safeDeltaMs / 1000) * speedMultiplier;

      setSimTimeSeconds(prev => prev + deltaSec);
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isSimulating, speedMultiplier]);

  // Handler: Select Preset Encounter Scenario (A through F)
  const handleSelectScenario = useCallback((scenario: TwoObjectEncounterScenario) => {
    setSelectedScenario(scenario);
    setPrimaryProfile(scenario.primaryObject);
    setThreatProfile(scenario.threatObject);
    setSimTimeSeconds(0);
    setIsSimulating(false);
    setSelectedCandidateId(undefined);

    // If Scenario D (Successful Avoidance), pre-load the prograde burn
    if (scenario.scenarioCode === 'SCENARIO_D') {
      setManoeuvreParams(prev => ({
        ...prev,
        directionMode: 'PROGRADE',
        deltaVMps: 0.85,
      }));
    } else if (scenario.scenarioCode === 'SCENARIO_E') {
      setManoeuvreParams(prev => ({
        ...prev,
        directionMode: 'RADIAL_IN',
        deltaVMps: 1.2,
      }));
    } else {
      setManoeuvreParams(prev => ({
        ...prev,
        directionMode: 'PROGRADE',
        deltaVMps: 0.85,
      }));
    }

    addToast('Scenario Loaded', `Loaded ${scenario.title}. Target: ${scenario.primaryObject.name} vs ${scenario.threatObject.name}`, 'info');
  }, [addToast]);

  // Handler: Apply Candidate from Decision Engine
  const handleApplyCandidate = useCallback((candidate: AvoidanceManoeuvreCandidate) => {
    setManoeuvreParams(prev => ({
      ...prev,
      directionMode: candidate.direction,
      deltaVMps: candidate.deltaVMps,
      locationMode: 'CUSTOM_ANOMALY',
      burnAnomalyDeg: candidate.burnAnomalyDeg,
    }));
    setSelectedCandidateId(candidate.id);
    addToast(
      'Manoeuvre Applied',
      `Loaded ${candidate.name}: +${candidate.deltaVMps.toFixed(2)} m/s ${candidate.direction}. Expected separation: ${candidate.postBurnMissDistanceM.toLocaleString()} m.`,
      'success'
    );
    simulationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [addToast]);

  // Handler: Run Simulation on demand
  const handleRunSimulation = useCallback(() => {
    setSimTimeSeconds(0);
    setIsSimulating(true);
    addToast(
      'Simulation Started',
      `Simulating ${manoeuvreParams.directionMode} ${manoeuvreParams.deltaVMps.toFixed(2)} m/s burn on ${currentElements.objectName || 'Spacecraft'}.`,
      'success'
    );
    simulationSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [manoeuvreParams, currentElements, addToast]);

  // Handler: Toggle playback
  const handleTogglePlay = useCallback(() => {
    setIsSimulating(prev => !prev);
  }, []);

  // Handler: Reset simulation time
  const handleResetSimTime = useCallback(() => {
    setSimTimeSeconds(0);
    setIsSimulating(false);
  }, []);

  // Handler: Step forward by delta seconds
  const handleStepForward = useCallback((seconds: number) => {
    setSimTimeSeconds(prev => prev + seconds);
  }, []);

  // Handler: Jump to burn location
  const handleJumpToBurn = useCallback(() => {
    if (!manoeuvreResult) return;
    const a = currentElements.semiMajorAxisKm;
    const e = currentElements.eccentricity;
    const n = Math.sqrt(EARTH_MU / Math.pow(Math.max(a, 100), 3));
    
    const targetNuDeg = manoeuvreResult.burnPositionKm.trueAnomalyDeg;
    const targetNuRad = (targetNuDeg * Math.PI) / 180;
    const targetERad = trueToEccentricAnomaly(targetNuRad, e);
    const targetMRad = targetERad - e * Math.sin(targetERad);

    const initNuRad = (currentElements.trueAnomalyDeg * Math.PI) / 180;
    const initERad = trueToEccentricAnomaly(initNuRad, e);
    const initMRad = initERad - e * Math.sin(initERad);

    let deltaM = targetMRad - initMRad;
    if (deltaM < 0) deltaM += 2 * Math.PI;

    const timeToBurnSec = deltaM / n;
    setSimTimeSeconds(timeToBurnSec);
  }, [currentElements, manoeuvreResult]);

  // Handler: Select true anomaly by clicking on canvas
  const handleSelectAnomalyFromCanvas = useCallback((nuDeg: number) => {
    setManoeuvreParams(prev => ({
      ...prev,
      locationMode: 'CUSTOM_ANOMALY',
      burnAnomalyDeg: Math.round(nuDeg),
    }));
    addToast('Burn Anomaly Selected', `Ignition point set to true anomaly ν = ${Math.round(nuDeg)}°`, 'info');
  }, [addToast]);

  // Handler: Update orbital elements
  const handleUpdateElements = useCallback((partial: Partial<KeplerianElements>) => {
    setPrimaryProfile(prev => ({
      ...prev,
      elements: { ...prev.elements, ...partial },
    }));
    setSimTimeSeconds(0);
    setIsSimulating(false);
  }, []);

  // Handler: Select satellite from catalog
  const handleSelectSatellite = useCallback((sat: UnifiedOrbitalObject) => {
    setPrimaryProfile(prev => ({
      ...prev,
      name: sat.name,
      noradId: sat.noradId,
      elements: {
        semiMajorAxisKm: sat.semiMajorAxisKm,
        eccentricity: sat.eccentricity,
        inclinationDeg: sat.inclinationDeg,
        raanDeg: sat.raanDeg,
        argOfPericenterDeg: sat.argOfPericenterDeg,
        trueAnomalyDeg: sat.meanAnomalyDeg,
        objectName: sat.name,
        noradId: sat.noradId,
        sourceProvider: sat.sourceProvider || 'CELESTRAK',
        epochUtc: sat.epochUtc,
      },
    }));
    setSimTimeSeconds(0);
    setIsSimulating(false);
    addToast('Satellite Loaded', `Loaded ${sat.name} (NORAD ${sat.noradId}).`, 'success');
  }, [addToast]);

  // Handler: Update manoeuvre params
  const handleUpdateManoeuvreParams = useCallback((partial: Partial<ManoeuvreParams>) => {
    setManoeuvreParams(prev => ({ ...prev, ...partial }));
  }, []);

  // Handler: Reset manoeuvre to defaults
  const handleResetManoeuvre = useCallback(() => {
    setManoeuvreParams(DEFAULT_MANOEUVRE_PARAMS);
    setSimTimeSeconds(0);
    setIsSimulating(false);
    setSelectedCandidateId(undefined);
    addToast('Manoeuvre Reset', 'Restored default prograde configuration.', 'info');
  }, [addToast]);

  // Handler: Save Simulation Plan
  const handleSavePlan = useCallback(() => {
    if (!manoeuvreResult) return;

    const planName = savePlanName.trim() || 
      `${currentElements.objectName || 'Spacecraft'} - ${manoeuvreParams.directionMode} ${manoeuvreParams.deltaVMps}m/s`;

    const simResult: SimulationResult = {
      id: `SIM-RES-${Date.now().toString().slice(-6)}`,
      conjunctionId: selectedConjunction ? selectedConjunction.id : selectedScenario.id,
      timestamp: new Date().toISOString(),
      config: {
        direction: manoeuvreParams.directionMode === 'CUSTOM' ? 'PROGRADE' : manoeuvreParams.directionMode,
        deltaVMps: manoeuvreParams.deltaVMps,
        timingRevsBeforeTca: 1.0,
        propulsionType: manoeuvreParams.isFiniteBurn ? 'ELECTRIC_LOW_THRUST' : 'CHEMICAL_IMPULSIVE',
        specificImpulseSec: manoeuvreParams.specificImpulseSec,
        dryMassKg: manoeuvreParams.spacecraftMassKg - manoeuvreResult.propellantUsedKg,
      },
      propellantUsedKg: manoeuvreResult.propellantUsedKg,
      baselineMissDistanceM: baselineClosestApproach.predictedMissDistanceM,
      newMissDistanceM: avoidanceOptimization.recommendedCandidate?.postBurnMissDistanceM || (baselineClosestApproach.predictedMissDistanceM + 2500),
      missDistanceGainM: (avoidanceOptimization.recommendedCandidate?.postBurnMissDistanceM || 2500) - baselineClosestApproach.predictedMissDistanceM,
      baselinePc: baselineClosestApproach.isCollisionEnvelopeOverlap ? 1.0 : 1.4e-4,
      newPc: manoeuvreResult.isAtmosphericEntry ? 0 : 2.1e-7,
      newRiskLevel: manoeuvreResult.isAtmosphericEntry ? 'CRITICAL' : 'LOW',
      newRadialDeltaM: Math.round(manoeuvreResult.deltaPerigeeKm * 1000 * 0.3),
      newInTrackDeltaM: Math.round(manoeuvreResult.deltaPeriodSec * 8.0),
      newCrossTrackDeltaM: 0,
      postBurnApogeeKm: manoeuvreResult.postBurnApogeeAltitudeKm,
      postBurnPerigeeKm: manoeuvreResult.postBurnPerigeeAltitudeKm,
      orbitPeriodDeltaSec: manoeuvreResult.deltaPeriodSec,
      safetyEllipsoidCleared: !manoeuvreResult.isAtmosphericEntry && Math.abs(manoeuvreResult.deltaApogeeKm) > 0.5,
      secondaryScreeningRequired: true,
      verdict: manoeuvreResult.isAtmosphericEntry ? 'INEFFECTIVE' : 'EFFECTIVE',
      verdictNotes: manoeuvreResult.verdictMessage,
    };

    const record: SavedSimulationRecord = {
      id: `SIM-REC-${Date.now().toString().slice(-6)}`,
      name: planName,
      conjunctionId: selectedConjunction ? selectedConjunction.id : selectedScenario.id,
      primaryObjectName: primaryProfile.name,
      secondaryObjectName: threatProfile.name,
      createdAt: new Date().toISOString(),
      config: simResult.config,
      result: simResult,
      notes: `Avoidance Solution: ${manoeuvreParams.directionMode} ${manoeuvreParams.deltaVMps} m/s burn. Post-burn miss distance: ${simResult.newMissDistanceM.toLocaleString()} m.`,
    };

    saveSimulationRecord(record);
    setSimulationResult(simResult);
    updateSimulationConfig(simResult.config);

    setIsSaved(true);
    setSavePlanName('');
    addToast('Avoidance Plan Saved', `Saved "${planName}". Transferred to secondary screening log.`, 'success');
    setTimeout(() => setIsSaved(false), 3000);
  }, [
    manoeuvreResult, 
    savePlanName, 
    currentElements, 
    manoeuvreParams, 
    selectedConjunction, 
    selectedScenario,
    primaryProfile,
    threatProfile,
    baselineClosestApproach,
    avoidanceOptimization,
    saveSimulationRecord, 
    setSimulationResult, 
    updateSimulationConfig, 
    addToast
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 font-sans">
      {/* 1. Breadcrumbs */}
      <Breadcrumbs
        items={[
          { label: 'Overview', to: '/' },
          { label: 'Collision & Avoidance Simulator' },
        ]}
      />

      {/* 2. Top Header Bar */}
      <div 
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div>
          <h1 
            className="text-lg sm:text-xl font-bold tracking-tight font-sans flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <Orbit className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
            <span>Collision Simulation & Avoidance Decision Engine</span>
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            Two-object orbital encounter modeling, kinetic impact damage assessment, and systematic avoidance optimization.
          </p>
        </div>

        {/* Spacecraft Target Chip & Navigation */}
        <div className="flex items-center gap-3">
          <div 
            className="px-3 py-1 border rounded-md text-xs font-mono-telemetry flex items-center gap-2 shadow-xs"
            style={{
              backgroundColor: 'var(--bg-surface-panel)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }}></span>
            <span style={{ color: 'var(--text-secondary)' }}>Target:</span>
            <span className="font-semibold">{primaryProfile.name}</span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/secondary-risk')}
            className="px-3 py-1 text-xs font-medium border rounded-md transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-panel)',
              borderColor: 'var(--border-default)',
              color: 'var(--accent-primary)',
            }}
          >
            <span>Secondary Risk</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: THREAT IMPACT & ENCOUNTER ASSESSMENT */}
      {/* ========================================================================= */}
      <CollisionThreatPanel
        primary={primaryProfile}
        threat={threatProfile}
        closestApproach={baselineClosestApproach}
        impactAnalysis={impactAnalysis}
        liveDistanceKm={encounterSnapshot.relativePosition.distanceKm}
        liveRelativeSpeedKms={encounterSnapshot.relativeVelocity.relativeSpeedKms}
      />

      {/* ========================================================================= */}
      {/* SECTION 2: CONFIGURE SPACECRAFT & MANOEUVRE SETUP */}
      {/* ========================================================================= */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 
            className="text-xs font-bold uppercase tracking-wider font-sans flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <span 
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}
            >
              1
            </span>
            <span>Configure Objects & Manoeuvre Inputs</span>
          </h2>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Select verifiable preset scenario or customize Keplerian orbits
          </span>
        </div>

        {/* Spacecraft & Encounter Config Panel */}
        <SpacecraftConfigPanel
          catalogSatellites={catalogObjects}
          currentElements={currentElements}
          onUpdateElements={handleUpdateElements}
          onSelectSatellite={handleSelectSatellite}
          manoeuvreParams={manoeuvreParams}
          onUpdateManoeuvreParams={handleUpdateManoeuvreParams}
          onResetManoeuvre={handleResetManoeuvre}
          selectedScenarioId={selectedScenario.id}
          onSelectScenario={handleSelectScenario}
          threatProfile={threatProfile}
        />

        {/* Action Bar with Forest Green "Run Simulation" Button */}
        <div 
          className="p-4 rounded-md border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs"
          style={{
            backgroundColor: 'var(--bg-surface-panel)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div className="text-xs text-center sm:text-left" style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Configured Burn: </span>
            <strong className="font-mono-telemetry font-bold" style={{ color: 'var(--accent-primary)' }}>
              +{manoeuvreParams.deltaVMps.toFixed(2)} m/s {manoeuvreParams.directionMode}
            </strong>
            <span style={{ color: 'var(--text-secondary)' }}> on </span>
            <strong>{primaryProfile.name}</strong>
            <span style={{ color: 'var(--text-secondary)' }}> vs threat </span>
            <strong className="text-[#C47C61]">{threatProfile.name}</strong>.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleRunSimulation}
              className="w-full sm:w-auto px-6 py-2.5 font-bold rounded-md text-xs tracking-wider uppercase font-mono-telemetry shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 text-white"
              style={{
                backgroundColor: 'var(--accent-primary)',
              }}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Simulation</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: SIMULATE — LARGE DUAL-OBJECT ORBITAL CANVAS & CONTROLS */}
      {/* ========================================================================= */}
      <section ref={simulationSectionRef} className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 
              className="text-xs font-bold uppercase tracking-wider font-mono-telemetry flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <span 
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}
              >
                2
              </span>
              <span>Orbital Trajectory & Encounter Canvas</span>
            </h2>

            {isSimulating ? (
              <span 
                className="px-2 py-0.5 text-[10px] font-semibold rounded-md font-mono-telemetry flex items-center gap-1.5 border"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  borderColor: 'var(--accent-primary)',
                  color: 'var(--accent-primary)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent-primary)' }}></span>
                <span>Simulating ({speedMultiplier}x)</span>
              </span>
            ) : simTimeSeconds > 0 ? (
              <span 
                className="px-2 py-0.5 text-[10px] font-medium border rounded-md font-mono-telemetry"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-secondary)',
                }}
              >
                Paused (t = {(simTimeSeconds / 60).toFixed(1)}m)
              </span>
            ) : (
              <span 
                className="px-2 py-0.5 text-[10px] font-medium border rounded-md font-mono-telemetry"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-secondary)',
                }}
              >
                Ready
              </span>
            )}
          </div>

          <span className="text-xs hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
            Switch between Geocentric Orbit and Relative Encounter frames &bull; Drag to pan
          </span>
        </div>

        {/* Dual Object Simulation Canvas */}
        <OrbitalSimulationCanvas
          initialElements={currentElements}
          threatProfile={threatProfile}
          manoeuvreResult={manoeuvreResult}
          closestApproach={baselineClosestApproach}
          simTimeSeconds={simTimeSeconds}
          isSimulating={isSimulating}
          showReferenceOrbit={showReferenceOrbit}
          showPredictedPath={showPredictedPath}
          showManoeuvredOrbit={showManoeuvredOrbit}
          showThreatOrbit={showThreatOrbit}
          showCollisionEnvelope={showCollisionEnvelope}
          showVectors={showVectors}
          showAnnotations={showAnnotations}
          onSelectAnomaly={handleSelectAnomalyFromCanvas}
        />

        {/* Playback Controls Bar */}
        <SimulationControlsBar
          isSimulating={isSimulating}
          onTogglePlay={handleTogglePlay}
          onReset={handleResetSimTime}
          onStepForward={handleStepForward}
          simTimeSeconds={simTimeSeconds}
          speedMultiplier={speedMultiplier}
          onChangeSpeed={setSpeedMultiplier}
          onJumpToBurn={handleJumpToBurn}
          showReferenceOrbit={showReferenceOrbit}
          onToggleReferenceOrbit={() => setShowReferenceOrbit(prev => !prev)}
          showPredictedPath={showPredictedPath}
          onTogglePredictedPath={() => setShowPredictedPath(prev => !prev)}
          showManoeuvredOrbit={showManoeuvredOrbit}
          onToggleManoeuvredOrbit={() => setShowManoeuvredOrbit(prev => !prev)}
          showThreatOrbit={showThreatOrbit}
          onToggleThreatOrbit={() => setShowThreatOrbit(prev => !prev)}
          showCollisionEnvelope={showCollisionEnvelope}
          onToggleCollisionEnvelope={() => setShowCollisionEnvelope(prev => !prev)}
          showVectors={showVectors}
          onToggleVectors={() => setShowVectors(prev => !prev)}
          showAnnotations={showAnnotations}
          onToggleAnnotations={() => setShowAnnotations(prev => !prev)}
          orbitalPeriodSec={manoeuvreResult ? manoeuvreResult.initialPeriodSec : 5400}
        />
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: AVOIDANCE DECISION SUPPORT & CANDIDATE ENGINE */}
      {/* ========================================================================= */}
      <section ref={decisionSectionRef} className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 
            className="text-xs font-bold uppercase tracking-wider font-sans flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <span 
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}
            >
              3
            </span>
            <span>Avoidance Manoeuvre Decision Engine</span>
          </h2>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Candidate evaluation matrix & engineering decision report
          </span>
        </div>

        {/* Manoeuvre Decision Support Panel */}
        <ManoeuvreDecisionPanel
          optimizationResult={avoidanceOptimization}
          decisionReport={decisionReport}
          onApplyCandidate={handleApplyCandidate}
          selectedCandidateId={selectedCandidateId}
        />
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: ANALYTICAL ENCOUNTER GRAPHS */}
      {/* ========================================================================= */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 
            className="text-xs font-bold uppercase tracking-wider font-sans flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <span 
              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
              style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-primary)' }}
            >
              4
            </span>
            <span>Analytical Encounter Graphs</span>
          </h2>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            Separation vs Time, Relative Speed, and Altitude profiles
          </span>
        </div>

        {/* Analytical Graphs Panel */}
        <SimulationGraphsPanel
          manoeuvreResult={manoeuvreResult}
          simTimeSeconds={simTimeSeconds}
          primaryProfile={primaryProfile}
          threatProfile={threatProfile}
          closestApproach={baselineClosestApproach}
        />

        {/* Save Solution to Mission Database */}
        <div 
          className="p-4 rounded-md border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs"
          style={{
            backgroundColor: 'var(--bg-surface-panel)',
            borderColor: 'var(--border-default)',
          }}
        >
          <div className="text-xs" style={{ color: 'var(--text-primary)' }}>
            <span className="font-semibold">Save Avoidance Plan: </span>
            <span style={{ color: 'var(--text-secondary)' }}>Persist this manoeuvre solution into mission logs for multi-conjunction secondary screening.</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={savePlanName}
              onChange={(e) => setSavePlanName(e.target.value)}
              placeholder={`Plan: ${primaryProfile.name} ${manoeuvreParams.deltaVMps}m/s`}
              className="px-3 py-1.5 text-xs border rounded-md font-mono-telemetry w-full sm:w-64"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
            <button
              type="button"
              onClick={handleSavePlan}
              className="px-4 py-1.5 text-xs font-semibold text-white rounded-md shadow-xs inline-flex items-center justify-center gap-1.5 transition-colors font-mono-telemetry shrink-0 cursor-pointer"
              style={{
                backgroundColor: 'var(--accent-primary)',
              }}
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaved ? 'Saved' : 'Save Plan'}</span>
            </button>
            {isSaved && (
              <span className="text-xs font-mono-telemetry flex items-center gap-1" style={{ color: 'var(--accent-primary)' }}>
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
