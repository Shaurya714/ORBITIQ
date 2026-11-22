import type { RiskLevel } from './conjunction';
import type { KeplerianElements, StateVector2D, TrajectoryPoint, BurnDirectionMode } from '../physics/orbitalPhysics';

export type BurnDirection = 
  | 'PROGRADE'     // +T (Along-track forward)
  | 'RETROGRADE'   // -T (Along-track backward)
  | 'RADIAL_OUT'   // +R (Away from Earth center)
  | 'RADIAL_IN'    // -R (Toward Earth center)
  | 'NORMAL_POS'   // +N (Orbital momentum vector direction)
  | 'NORMAL_NEG';  // -N (Opposite angular momentum)

export type PropulsionType = 'CHEMICAL_IMPULSIVE' | 'ELECTRIC_LOW_THRUST';

export interface ManoeuvreConfig {
  direction: BurnDirection;
  deltaVMps: number; // Delta-V in m/s (e.g. 0.45 m/s)
  timingRevsBeforeTca: number; // e.g. 1.0 orbit revolutions before TCA
  propulsionType: PropulsionType;
  specificImpulseSec: number; // Isp in seconds (e.g. 220s for monopropellant, 1800s for electric)
  dryMassKg: number;
}

export interface SimulationResult {
  id: string;
  conjunctionId: string;
  timestamp: string;
  config: ManoeuvreConfig;
  propellantUsedKg: number;
  
  // Baseline vs Modified
  baselineMissDistanceM: number;
  newMissDistanceM: number;
  missDistanceGainM: number;
  
  baselinePc: number;
  newPc: number;
  newRiskLevel: RiskLevel;
  
  newRadialDeltaM: number;
  newInTrackDeltaM: number;
  newCrossTrackDeltaM: number;
  
  postBurnApogeeKm: number;
  postBurnPerigeeKm: number;
  orbitPeriodDeltaSec: number;
  
  safetyEllipsoidCleared: boolean; // Clears 2.0 km screening zone
  secondaryScreeningRequired: boolean;
  verdict: 'EFFECTIVE' | 'MARGINAL' | 'INEFFECTIVE';
  verdictNotes: string;
}

export interface SavedSimulationRecord {
  id: string;
  name: string;
  conjunctionId: string;
  primaryObjectName: string;
  secondaryObjectName: string;
  createdAt: string;
  config: ManoeuvreConfig;
  result: SimulationResult;
  notes?: string;
}

// =============================================================================
// TWO-OBJECT ENCOUNTER & COLLISION SIMULATION TYPES
// =============================================================================

export interface OrbitalObjectProfile {
  name: string;
  noradId: number;
  objectType: 'PAYLOAD' | 'ROCKET_BODY' | 'DEBRIS' | 'UNKNOWN';
  elements: KeplerianElements;
  estimatedMassKg: number;
  hardBodyRadiusM: number; // Collision sphere radius
  dimensionsM: { length: number; width: number; height: number };
  isManoeuvrable: boolean;
  sourceProvider: string;
}

export interface EncounterStateSnapshot {
  timeSec: number;
  satPosition: StateVector2D;
  satVelocity: { vx: number; vy: number; speedKms: number };
  threatPosition: StateVector2D;
  threatVelocity: { vx: number; vy: number; speedKms: number };
  relativePosition: { rx: number; ry: number; distanceKm: number };
  relativeVelocity: { rvx: number; rvy: number; relativeSpeedKms: number };
  centerOfMass: {
    rx: number;
    ry: number;
    vx: number;
    vy: number;
    satRelPosition: { rx: number; ry: number };
    threatRelPosition: { rx: number; ry: number };
  };
}

export interface ClosestApproachPrediction {
  timeToClosestApproachSec: number;
  predictedMissDistanceM: number;
  relativeVelocityKms: number;
  closestApproachPositionKm: { x: number; y: number };
  closestApproachTrueAnomalyDeg: number;
  isCollisionEnvelopeOverlap: boolean;
  combinedHardBodyRadiusM: number;
  linearEstimateMissDistanceM: number;
  isEncounterPast: boolean;
  statusText: string;
}

export interface ImpactConsequenceAnalysis {
  effectiveMassKg: number;
  relativeVelocityKms: number;
  kineticEnergyJoules: number;
  kineticEnergyMegajoules: number;
  tntEquivalentKg: number;
  severityCategory: 'NEGLIGIBLE_RISK' | 'CLOSE_PASS' | 'POTENTIAL_DAMAGING_IMPACT' | 'SEVERE_SPACECRAFT_DAMAGE' | 'MISSION_LOSS';
  severityDescription: string;
  assumptionsDisclosed: string[];
}

export interface AvoidanceManoeuvreCandidate {
  id: string;
  name: string;
  direction: BurnDirectionMode;
  deltaVMps: number;
  burnTimingSec: number; // Seconds from simulation start
  burnAnomalyDeg: number;
  propellantUsedKg: number;
  postBurnMissDistanceM: number;
  missDistanceGainM: number;
  postBurnRelativeVelocityKms: number;
  postBurnClosestApproachSec: number;
  isSafetyBufferCleared: boolean; // Clears 2000m
  secondaryConjunctionRisk: 'CLEARED' | 'LOW' | 'WARNING';
  secondaryThreatDescription?: string;
  score: number;
  isRecommended: boolean;
  reasoning: string;
  postBurnTrajectory: TrajectoryPoint[];
}

export interface AvoidanceOptimizationResult {
  baselineMissDistanceM: number;
  baselineTcaSec: number;
  candidates: AvoidanceManoeuvreCandidate[];
  recommendedCandidate: AvoidanceManoeuvreCandidate | null;
  optimizationSummary: string;
  status: 'OPTIMAL_FOUND' | 'SUBOPTIMAL_FOUND' | 'NO_FEASIBLE_SOLUTION';
}

export interface DecisionSupportReport {
  timestamp: string;
  threatAssessment: {
    primaryName: string;
    threatName: string;
    missDistanceM: number;
    tcaSeconds: number;
    relativeSpeedKms: number;
    collisionEnvelopeOverlap: boolean;
    consequenceRating: string;
  };
  noActionOutcome: string;
  manoeuvreOptionsSummary: string;
  recommendedAction: {
    burnDirection: string;
    deltaVMps: number;
    burnLocation: string;
    expectedSeparationM: number;
    propellantRequiredKg: number;
  } | null;
  physicalReasoning: string;
  postManoeuvreVerification: string;
  confidenceAndLimitations: string[];
}

export interface TwoObjectEncounterScenario {
  id: string;
  title: string;
  scenarioCode: 'SCENARIO_A' | 'SCENARIO_B' | 'SCENARIO_C' | 'SCENARIO_D' | 'SCENARIO_E' | 'SCENARIO_F';
  description: string;
  primaryObject: OrbitalObjectProfile;
  threatObject: OrbitalObjectProfile;
  expectedBaselineMissM: number;
  expectedOutcome: string;
}
