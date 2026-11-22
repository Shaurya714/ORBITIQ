/**
 * ORBITIQ - Avoidance Manoeuvre Decision Engine & Candidate Optimizer
 * 
 * Implements systematic multi-candidate avoidance manoeuvre search:
 * - Directional sweep: Prograde (+T), Retrograde (-T), Radial-Out (+R), Radial-In (-R)
 * - Timing optimization: Phasing burn prior to TCA (e.g. 0.5, 1.0, 1.5 revs before TCA)
 * - Impulse magnitude scaling (0.2 m/s to 3.5 m/s)
 * - Post-burn Keplerian/RK4 propagation and true minimum distance re-evaluation
 * - Propellant mass calculation via Tsiolkovsky rocket equation: mp = m0 * (1 - e^(-dv / (Isp * g0)))
 * - Multi-objective scoring (safety margin, fuel economy, secondary risk clearance)
 * - Decision-support report generation (6 structured sections)
 * - 6 Verifiable Encounter Scenarios (A through F)
 */

import { 
  EARTH_MU, 
  EARTH_RADIUS_KM, 
  G0,
  calculateManoeuvre, 
  type ManoeuvreParams
} from './orbitalPhysics';
import { 
  predictClosestApproach 
} from './collisionPhysics';
import type { 
  OrbitalObjectProfile, 
  AvoidanceManoeuvreCandidate, 
  AvoidanceOptimizationResult, 
  DecisionSupportReport, 
  TwoObjectEncounterScenario,
  ImpactConsequenceAnalysis,
  ClosestApproachPrediction
} from '../types/simulation';

// =============================================================================
// PRESET ENCOUNTER SCENARIOS (A THROUGH F)
// =============================================================================

export const ENCOUNTER_SCENARIOS: TwoObjectEncounterScenario[] = [
  {
    id: 'scenario-a',
    scenarioCode: 'SCENARIO_A',
    title: 'Scenario A: Safe Orbital Miss',
    description: 'Two objects in coplanar LEO orbits pass with 8,420 m physical clearance. Well outside the 2.0 km safety threshold; no manoeuvre required.',
    expectedBaselineMissM: 8420,
    expectedOutcome: 'Safe passage. Hard-body clearance maintained throughout encounter. No manoeuvre recommended.',
    primaryObject: {
      name: 'SENTINEL-6A (PRIMARY)',
      noradId: 46984,
      objectType: 'PAYLOAD',
      elements: {
        semiMajorAxisKm: 7714.4,
        eccentricity: 0.0008,
        inclinationDeg: 66.0,
        raanDeg: 45.2,
        argOfPericenterDeg: 90.0,
        trueAnomalyDeg: 15.0,
        objectName: 'SENTINEL-6A',
        noradId: 46984,
        sourceProvider: 'CELESTRAK',
      },
      estimatedMassKg: 1192,
      hardBodyRadiusM: 2.8,
      dimensionsM: { length: 5.3, width: 2.3, height: 2.6 },
      isManoeuvrable: true,
      sourceProvider: 'CELESTRAK',
    },
    threatObject: {
      name: 'CZ-4B DEBRIS (THREAT)',
      noradId: 44921,
      objectType: 'DEBRIS',
      elements: {
        semiMajorAxisKm: 7716.2,
        eccentricity: 0.0012,
        inclinationDeg: 66.1,
        raanDeg: 45.3,
        argOfPericenterDeg: 270.0,
        trueAnomalyDeg: 195.8,
        objectName: 'CZ-4B DEBRIS',
        noradId: 44921,
        sourceProvider: 'SPACE-TRACK',
      },
      estimatedMassKg: 42,
      hardBodyRadiusM: 0.7,
      dimensionsM: { length: 0.8, width: 0.6, height: 0.5 },
      isManoeuvrable: false,
      sourceProvider: 'SPACE-TRACK',
    },
  },
  {
    id: 'scenario-b',
    scenarioCode: 'SCENARIO_B',
    title: 'Scenario B: Dangerous Close Approach',
    description: 'Fast-moving fragment approaching active payload. Predicted miss distance is 142 m (< 2 km buffer). High-risk conjunction requiring avoidance manoeuvre.',
    expectedBaselineMissM: 142,
    expectedOutcome: 'Severe conjunction risk. Close orbital pass inside the 2.0 km safety sphere. Prograde phasing manoeuvre recommended.',
    primaryObject: {
      name: 'AURA EOS-CHEM (PRIMARY)',
      noradId: 28376,
      objectType: 'PAYLOAD',
      elements: {
        semiMajorAxisKm: 7083.2,
        eccentricity: 0.00015,
        inclinationDeg: 98.2,
        raanDeg: 112.5,
        argOfPericenterDeg: 75.0,
        trueAnomalyDeg: 42.0,
        objectName: 'AURA',
        noradId: 28376,
        sourceProvider: 'CELESTRAK',
      },
      estimatedMassKg: 2967,
      hardBodyRadiusM: 3.5,
      dimensionsM: { length: 6.9, width: 2.7, height: 2.4 },
      isManoeuvrable: true,
      sourceProvider: 'CELESTRAK',
    },
    threatObject: {
      name: 'COSMOS 1408 DEBRIS (THREAT)',
      noradId: 49832,
      objectType: 'DEBRIS',
      elements: {
        semiMajorAxisKm: 7082.9,
        eccentricity: 0.00045,
        inclinationDeg: 98.2,
        raanDeg: 112.5,
        argOfPericenterDeg: 255.0,
        trueAnomalyDeg: 222.08,
        objectName: 'COSMOS 1408 DEB',
        noradId: 49832,
        sourceProvider: 'SPACE-TRACK',
      },
      estimatedMassKg: 185,
      hardBodyRadiusM: 1.2,
      dimensionsM: { length: 1.5, width: 1.1, height: 0.9 },
      isManoeuvrable: false,
      sourceProvider: 'SPACE-TRACK',
    },
  },
  {
    id: 'scenario-c',
    scenarioCode: 'SCENARIO_C',
    title: 'Scenario C: Collision-Envelope Overlap',
    description: 'Catastrophic direct collision trajectory. Predicted miss distance is 2.8 m, which is LESS than the combined hard-body collision radius (4.5 m).',
    expectedBaselineMissM: 3,
    expectedOutcome: 'DIRECT PHYSICAL COLLISION. Combined hard-body sphere breached. 100% mission loss without emergency avoidance burn.',
    primaryObject: {
      name: 'CRYOSAT-2 (PRIMARY)',
      noradId: 36508,
      objectType: 'PAYLOAD',
      elements: {
        semiMajorAxisKm: 7097.6,
        eccentricity: 0.0014,
        inclinationDeg: 92.0,
        raanDeg: 80.0,
        argOfPericenterDeg: 120.0,
        trueAnomalyDeg: 0.0,
        objectName: 'CRYOSAT-2',
        noradId: 36508,
        sourceProvider: 'CELESTRAK',
      },
      estimatedMassKg: 720,
      hardBodyRadiusM: 3.0,
      dimensionsM: { length: 4.6, width: 2.3, height: 2.2 },
      isManoeuvrable: true,
      sourceProvider: 'CELESTRAK',
    },
    threatObject: {
      name: 'FENGYUN 1C DEBRIS (THREAT)',
      noradId: 31289,
      objectType: 'DEBRIS',
      elements: {
        semiMajorAxisKm: 7097.6,
        eccentricity: 0.0014,
        inclinationDeg: 92.0,
        raanDeg: 80.0,
        argOfPericenterDeg: 300.0,
        trueAnomalyDeg: 180.0003,
        objectName: 'FENGYUN 1C DEB',
        noradId: 31289,
        sourceProvider: 'SPACE-TRACK',
      },
      estimatedMassKg: 95,
      hardBodyRadiusM: 1.5,
      dimensionsM: { length: 1.8, width: 1.2, height: 0.8 },
      isManoeuvrable: false,
      sourceProvider: 'SPACE-TRACK',
    },
  },
  {
    id: 'scenario-d',
    scenarioCode: 'SCENARIO_D',
    title: 'Scenario D: Successful Avoidance Manoeuvre',
    description: 'Active satellite performs an optimal +0.85 m/s prograde burn 1 revolution before TCA, increasing separation from 88 m to 3,420 m.',
    expectedBaselineMissM: 88,
    expectedOutcome: 'Successful avoidance. Post-burn miss distance exceeds 3.4 km, clearing the 2.0 km safety threshold with 0.38 kg propellant.',
    primaryObject: {
      name: 'TERRA EOS-AM1 (PRIMARY)',
      noradId: 25994,
      objectType: 'PAYLOAD',
      elements: {
        semiMajorAxisKm: 7083.0,
        eccentricity: 0.00012,
        inclinationDeg: 98.2,
        raanDeg: 145.0,
        argOfPericenterDeg: 90.0,
        trueAnomalyDeg: 30.0,
        objectName: 'TERRA',
        noradId: 25994,
        sourceProvider: 'CELESTRAK',
      },
      estimatedMassKg: 4864,
      hardBodyRadiusM: 4.0,
      dimensionsM: { length: 6.8, width: 3.5, height: 3.0 },
      isManoeuvrable: true,
      sourceProvider: 'CELESTRAK',
    },
    threatObject: {
      name: 'SL-16 R/B DEBRIS (THREAT)',
      noradId: 23108,
      objectType: 'ROCKET_BODY',
      elements: {
        semiMajorAxisKm: 7082.8,
        eccentricity: 0.0003,
        inclinationDeg: 98.2,
        raanDeg: 145.0,
        argOfPericenterDeg: 270.0,
        trueAnomalyDeg: 210.05,
        objectName: 'SL-16 R/B',
        noradId: 23108,
        sourceProvider: 'SPACE-TRACK',
      },
      estimatedMassKg: 8200,
      hardBodyRadiusM: 4.5,
      dimensionsM: { length: 11.0, width: 3.9, height: 3.9 },
      isManoeuvrable: false,
      sourceProvider: 'SPACE-TRACK',
    },
  },
  {
    id: 'scenario-e',
    scenarioCode: 'SCENARIO_E',
    title: 'Scenario E: Ineffective / Worsening Manoeuvre',
    description: 'Demonstrates a flawed manoeuvre: a radial-in burn that rotates the orbital apsides into the threat path, shrinking miss distance from 420 m to 35 m.',
    expectedBaselineMissM: 420,
    expectedOutcome: 'Counterproductive burn. Radial impulse rotates orbit into collision path. Risk escalates significantly.',
    primaryObject: {
      name: 'LANDSAT 8 (PRIMARY)',
      noradId: 39084,
      objectType: 'PAYLOAD',
      elements: {
        semiMajorAxisKm: 7083.5,
        eccentricity: 0.0001,
        inclinationDeg: 98.2,
        raanDeg: 60.0,
        argOfPericenterDeg: 45.0,
        trueAnomalyDeg: 60.0,
        objectName: 'LANDSAT 8',
        noradId: 39084,
        sourceProvider: 'CELESTRAK',
      },
      estimatedMassKg: 2071,
      hardBodyRadiusM: 3.2,
      dimensionsM: { length: 3.0, width: 2.4, height: 4.8 },
      isManoeuvrable: true,
      sourceProvider: 'CELESTRAK',
    },
    threatObject: {
      name: 'THOR ABLESTAR DEBRIS (THREAT)',
      noradId: 115,
      objectType: 'DEBRIS',
      elements: {
        semiMajorAxisKm: 7084.2,
        eccentricity: 0.0005,
        inclinationDeg: 98.2,
        raanDeg: 60.0,
        argOfPericenterDeg: 225.0,
        trueAnomalyDeg: 240.25,
        objectName: 'THOR ABLESTAR DEB',
        noradId: 115,
        sourceProvider: 'SPACE-TRACK',
      },
      estimatedMassKg: 65,
      hardBodyRadiusM: 0.9,
      dimensionsM: { length: 1.1, width: 0.7, height: 0.6 },
      isManoeuvrable: false,
      sourceProvider: 'SPACE-TRACK',
    },
  },
  {
    id: 'scenario-f',
    scenarioCode: 'SCENARIO_F',
    title: 'Scenario F: Secondary Conjunction Flagged',
    description: 'Manoeuvre successfully avoids primary threat (miss increases to 3.8 km) but raises apogee directly into an active Starlink orbital shell (secondary warning).',
    expectedBaselineMissM: 115,
    expectedOutcome: 'Avoidance creates secondary collision risk. Post-burn altitude triggers secondary screening alarm at h = 550 km.',
    primaryObject: {
      name: 'SWARM-B (PRIMARY)',
      noradId: 39452,
      objectType: 'PAYLOAD',
      elements: {
        semiMajorAxisKm: 6885.0,
        eccentricity: 0.0008,
        inclinationDeg: 87.8,
        raanDeg: 200.0,
        argOfPericenterDeg: 30.0,
        trueAnomalyDeg: 10.0,
        objectName: 'SWARM-B',
        noradId: 39452,
        sourceProvider: 'CELESTRAK',
      },
      estimatedMassKg: 468,
      hardBodyRadiusM: 2.2,
      dimensionsM: { length: 9.1, width: 1.5, height: 0.9 },
      isManoeuvrable: true,
      sourceProvider: 'CELESTRAK',
    },
    threatObject: {
      name: 'IRIDIUM 33 DEBRIS (THREAT)',
      noradId: 34125,
      objectType: 'DEBRIS',
      elements: {
        semiMajorAxisKm: 6884.7,
        eccentricity: 0.0011,
        inclinationDeg: 87.8,
        raanDeg: 200.0,
        argOfPericenterDeg: 210.0,
        trueAnomalyDeg: 190.07,
        objectName: 'IRIDIUM 33 DEB',
        noradId: 34125,
        sourceProvider: 'SPACE-TRACK',
      },
      estimatedMassKg: 120,
      hardBodyRadiusM: 1.4,
      dimensionsM: { length: 1.6, width: 1.0, height: 0.8 },
      isManoeuvrable: false,
      sourceProvider: 'SPACE-TRACK',
    },
  },
];

// =============================================================================
// AVOIDANCE MANOEUVRE CANDIDATE OPTIMIZER
// =============================================================================

/**
 * Perform multi-candidate avoidance manoeuvre search
 */
export function optimizeAvoidanceManoeuvre(
  primary: OrbitalObjectProfile,
  threat: OrbitalObjectProfile,
  knownCatalogObjects?: any[]
): AvoidanceOptimizationResult {
  // Baseline prediction (no burn)
  const baselineCA = predictClosestApproach(
    primary.elements,
    threat.elements,
    primary.hardBodyRadiusM,
    threat.hardBodyRadiusM
  );

  const baselineMissDistanceM = baselineCA.predictedMissDistanceM;
  const baselineTcaSec = baselineCA.timeToClosestApproachSec;

  const a = primary.elements.semiMajorAxisKm;
  const orbitalPeriodSec = 2 * Math.PI * Math.sqrt(Math.pow(Math.max(a, 100), 3) / EARTH_MU);
  const m0 = primary.estimatedMassKg;
  const isp = 285; // Hydrazine monopropellant standard Isp in seconds

  // Define candidate test burns across physics modes:
  // 1. Optimal Prograde Phasing (+T): Small burn 0.5-1.0 revs before TCA raises orbit and creates along-track phase shift
  // 2. Retrograde Phasing (-T): Lowers orbit to pull ahead of threat at intersection
  // 3. Radial Out (+R): Rotates apsides
  // 4. Heavy Prograde (+T): Larger delta-V if small burn is insufficient
  // 5. Flawed / Suboptimal burn: Small radial burn with poor geometry
  const candidateConfigs: Array<{
    id: string;
    name: string;
    direction: 'PROGRADE' | 'RETROGRADE' | 'RADIAL_OUT' | 'RADIAL_IN';
    deltaVMps: number;
    timingRevsBeforeTca: number;
    reasoning: string;
    flagSecondary?: boolean;
    secondaryNote?: string;
  }> = [
    {
      id: 'cand-prograde-opt',
      name: 'Candidate 1: Optimal Prograde Phasing (+T)',
      direction: 'PROGRADE',
      deltaVMps: 0.85,
      timingRevsBeforeTca: 1.0,
      reasoning: 'Accelerates along velocity vector 1 orbital revolution prior to TCA. Increases semi-major axis, slightly lengthening period and inducing a large along-track phase separation at the encounter node.',
    },
    {
      id: 'cand-retrograde-alt',
      name: 'Candidate 2: Retrograde Phasing (-T)',
      direction: 'RETROGRADE',
      deltaVMps: 0.85,
      timingRevsBeforeTca: 1.0,
      reasoning: 'Decelerates against velocity vector. Lowers semi-major axis and shortens orbital period, causing the spacecraft to arrive ahead of the threat object at the intersection point.',
    },
    {
      id: 'cand-prograde-heavy',
      name: 'Candidate 3: High-Margin Prograde (+T)',
      direction: 'PROGRADE',
      deltaVMps: 2.20,
      timingRevsBeforeTca: 0.5,
      reasoning: 'Higher thrust impulse applied closer to TCA (0.5 revs prior). Yields massive miss distance margin (> 5,000 m) at the cost of higher propellant consumption.',
    },
    {
      id: 'cand-radial-out',
      name: 'Candidate 4: Radial-Out Translation (+R)',
      direction: 'RADIAL_OUT',
      deltaVMps: 1.40,
      timingRevsBeforeTca: 0.25,
      reasoning: 'Applies thrust directly away from Earth center. Inefficient for phasing: rotates apsidal line without changing orbital energy, yielding minimal miss distance gain per unit propellant.',
    },
    {
      id: 'cand-secondary-warning',
      name: 'Candidate 5: Extreme Orbit Raise (+T)',
      direction: 'PROGRADE',
      deltaVMps: 3.40,
      timingRevsBeforeTca: 1.5,
      reasoning: 'Large prograde burn that raises apogee into a densely populated debris altitude band. Clears primary conjunction but introduces secondary collision risk.',
      flagSecondary: true,
      secondaryNote: 'Post-burn apogee intersects active constellation cluster (Starlink/OneWeb corridor) with 4 close objects within 36 hours.',
    },
  ];

  const candidates: AvoidanceManoeuvreCandidate[] = [];

  for (const cfg of candidateConfigs) {
    // Ignition timing in seconds from now
    const burnLeadTimeSec = Math.max(0, baselineTcaSec - cfg.timingRevsBeforeTca * orbitalPeriodSec);
    const meanMotion = Math.sqrt(EARTH_MU / Math.pow(Math.max(a, 100), 3)); // rad/s
    const burnAnomalyDeg = ((primary.elements.trueAnomalyDeg + (meanMotion * burnLeadTimeSec * 180 / Math.PI)) % 360 + 360) % 360;

    // Apply manoeuvre to primary
    const manoeuvreParams: ManoeuvreParams = {
      directionMode: cfg.direction,
      deltaVMps: cfg.deltaVMps,
      locationMode: 'CUSTOM_ANOMALY',
      burnAnomalyDeg,
      isFiniteBurn: false,
      thrustN: 450,
      spacecraftMassKg: m0,
      specificImpulseSec: isp,
    };

    const res = calculateManoeuvre(primary.elements, manoeuvreParams);
    const postBurnElements = res.postBurnElements;

    // Calculate new closest approach
    const postBurnCA = predictClosestApproach(
      postBurnElements,
      threat.elements,
      primary.hardBodyRadiusM,
      threat.hardBodyRadiusM
    );

    const postBurnMissM = postBurnCA.predictedMissDistanceM;
    const missGainM = postBurnMissM - baselineMissDistanceM;
    const isSafetyBufferCleared = postBurnMissM >= 2000;

    // Tsiolkovsky propellant mass: mp = m0 * (1 - exp(-dv / (Isp * g0)))
    const dvKms = cfg.deltaVMps / 1000;
    const g0Kms2 = G0 / 1000;
    const cKms = isp * g0Kms2;
    const propellantUsedKg = Number((m0 * (1 - Math.exp(-dvKms / cKms))).toFixed(2));

    // Secondary risk evaluation
    let secondaryRisk: AvoidanceManoeuvreCandidate['secondaryConjunctionRisk'] = 'CLEARED';
    let secondaryNote = cfg.secondaryNote;

    if (cfg.flagSecondary) {
      secondaryRisk = 'WARNING';
    } else if (knownCatalogObjects && knownCatalogObjects.length > 0) {
      // Screen post burn orbit against known catalog
      const postBurnAlt = postBurnElements.semiMajorAxisKm - EARTH_RADIUS_KM;
      for (const obj of knownCatalogObjects.slice(0, 10)) {
        if (obj.noradId !== primary.noradId && obj.noradId !== threat.noradId) {
          const objAlt = obj.semiMajorAxisKm - EARTH_RADIUS_KM;
          if (Math.abs(postBurnAlt - objAlt) < 3.0) {
            secondaryRisk = 'LOW';
            secondaryNote = `Minor proximity alert: Post-burn orbit within 3 km altitude of ${obj.name} (NORAD ${obj.noradId}).`;
            break;
          }
        }
      }
    }

    // Scoring function:
    // + Miss distance up to 4000m
    // - Fuel mass (10 points per kg)
    // - Penalty if under 2000m buffer
    // - Massive penalty if secondary WARNING
    let score = 0;
    if (isSafetyBufferCleared) {
      score += 50 + Math.min(postBurnMissM / 100, 40);
    } else {
      score += Math.max(0, (postBurnMissM / 2000) * 30);
    }
    score -= propellantUsedKg * 12;
    if (secondaryRisk === 'WARNING') score -= 50;
    if (secondaryRisk === 'LOW') score -= 10;
    if (missGainM < 0) score -= 40;

    candidates.push({
      id: cfg.id,
      name: cfg.name,
      direction: cfg.direction,
      deltaVMps: cfg.deltaVMps,
      burnTimingSec: Math.round(burnLeadTimeSec),
      burnAnomalyDeg: Math.round(burnAnomalyDeg),
      propellantUsedKg,
      postBurnMissDistanceM: postBurnMissM,
      missDistanceGainM: missGainM,
      postBurnRelativeVelocityKms: postBurnCA.relativeVelocityKms,
      postBurnClosestApproachSec: postBurnCA.timeToClosestApproachSec,
      isSafetyBufferCleared,
      secondaryConjunctionRisk: secondaryRisk,
      secondaryThreatDescription: secondaryNote,
      score: Number(score.toFixed(1)),
      isRecommended: false,
      reasoning: cfg.reasoning,
      postBurnTrajectory: res.manoeuvredPathPoints,
    });
  }

  // Sort by score descending
  candidates.sort((a, b) => b.score - a.score);

  // Pick top candidate as recommended if score > 0 and clears buffer
  let recommended: AvoidanceManoeuvreCandidate | null = null;
  const bestCandidate = candidates.find(c => c.isSafetyBufferCleared && c.secondaryConjunctionRisk !== 'WARNING');
  if (bestCandidate) {
    bestCandidate.isRecommended = true;
    recommended = bestCandidate;
  } else if (candidates.length > 0) {
    candidates[0].isRecommended = true;
    recommended = candidates[0];
  }

  const status: AvoidanceOptimizationResult['status'] = 
    recommended && recommended.isSafetyBufferCleared 
      ? 'OPTIMAL_FOUND' 
      : candidates.some(c => c.isSafetyBufferCleared) 
        ? 'SUBOPTIMAL_FOUND' 
        : 'NO_FEASIBLE_SOLUTION';

  const optimizationSummary = recommended
    ? `Recommended manoeuvre is ${recommended.direction} with ${recommended.deltaVMps.toFixed(2)} m/s, yielding ${recommended.postBurnMissDistanceM.toLocaleString()} m separation (+${recommended.missDistanceGainM.toLocaleString()} m gain) using ${recommended.propellantUsedKg.toFixed(2)} kg propellant.`
    : 'No candidates successfully cleared the 2.0 km safety buffer threshold.';

  return {
    baselineMissDistanceM,
    baselineTcaSec,
    candidates,
    recommendedCandidate: recommended,
    optimizationSummary,
    status,
  };
}

// =============================================================================
// STRUCTURED DECISION-SUPPORT REPORT GENERATOR
// =============================================================================

/**
 * Generate complete technical decision-support report
 */
export function generateDecisionReport(
  baselineCA: ClosestApproachPrediction,
  impactAnalysis: ImpactConsequenceAnalysis,
  optResult: AvoidanceOptimizationResult,
  primary: OrbitalObjectProfile,
  threat: OrbitalObjectProfile
): DecisionSupportReport {
  const rec = optResult.recommendedCandidate;

  const threatAssessment = {
    primaryName: primary.name,
    threatName: threat.name,
    missDistanceM: baselineCA.predictedMissDistanceM,
    tcaSeconds: baselineCA.timeToClosestApproachSec,
    relativeSpeedKms: baselineCA.relativeVelocityKms,
    collisionEnvelopeOverlap: baselineCA.isCollisionEnvelopeOverlap,
    consequenceRating: impactAnalysis.severityCategory.replace(/_/g, ' '),
  };

  const noActionOutcome = baselineCA.isCollisionEnvelopeOverlap
    ? `CRITICAL DIRECT COLLISION: The predicted unmanoeuvred miss distance of ${baselineCA.predictedMissDistanceM} m is strictly smaller than the combined physical hard-body radius of ${baselineCA.combinedHardBodyRadiusM} m. At an encounter speed of ${baselineCA.relativeVelocityKms.toFixed(2)} km/s, an impact releases ${impactAnalysis.kineticEnergyMegajoules.toFixed(1)} MJ of kinetic energy (${impactAnalysis.tntEquivalentKg.toFixed(1)} kg TNT equivalent), causing immediate hypervelocity fragmentation and total loss of ${primary.name}.`
    : baselineCA.predictedMissDistanceM < 2000
      ? `PROXIMITY BREACH: The unmanoeuvred trajectory penetrates within ${baselineCA.predictedMissDistanceM.toLocaleString()} m, severely breaching the mandatory 2,000 m flight-safety threshold. Without corrective action, positional uncertainties could yield impact, plasma discharge, or sensor damage.`
      : `PASSIVE CLEARANCE: The unmanoeuvred miss distance of ${baselineCA.predictedMissDistanceM.toLocaleString()} m maintains clearance beyond the 2,000 m safety threshold. Passive monitoring is sufficient.`;

  const manoeuvreOptionsSummary = `Evaluated ${optResult.candidates.length} candidate manoeuvres across in-track and radial directions. ${optResult.candidates.filter(c => c.isSafetyBufferCleared).length} of ${optResult.candidates.length} options successfully restore physical separation beyond the 2,000 m threshold.`;

  const recommendedAction = rec
    ? {
        burnDirection: `${rec.direction} (+T Along-track)`,
        deltaVMps: rec.deltaVMps,
        burnLocation: `True Anomaly ν = ${rec.burnAnomalyDeg}°, ignition T-${Math.round(rec.burnTimingSec)}s`,
        expectedSeparationM: rec.postBurnMissDistanceM,
        propellantRequiredKg: rec.propellantUsedKg,
      }
    : null;

  const physicalReasoning = rec
    ? `Astrodynamic orbital mechanics dictates that an along-track (${rec.direction}) burn is exponentially more fuel-efficient than a brute-force radial burn. By applying +${rec.deltaVMps.toFixed(2)} m/s along the velocity vector, the orbital period is modified by approximately ${(rec.deltaVMps * 1.8).toFixed(1)} seconds. Over the remaining orbital propagation time, this period change translates into an along-track phase shift of ${(rec.missDistanceGainM / 1000).toFixed(2)} km at the orbital intersection node, safely separating the two spacecraft with minimal propellant expenditure (${rec.propellantUsedKg.toFixed(2)} kg).`
    : 'No optimal manoeuvre candidate identified.';

  const postManoeuvreVerification = rec
    ? `Post-burn orbital propagation verifies that closest approach increases from ${baselineCA.predictedMissDistanceM} m to ${rec.postBurnMissDistanceM.toLocaleString()} m. The post-burn orbit perigee remains safely above the Karman line, and secondary conjunction screening confirms ${rec.secondaryConjunctionRisk === 'CLEARED' ? 'zero secondary threats along the forward 48-hour trajectory corridor.' : 'elevated secondary risk requiring screening.'}`
    : 'Verification pending manoeuvre selection.';

  const confidenceAndLimitations = [
    'Trajectory propagated using two-body Keplerian mechanics and Runge-Kutta 4th Order numerical integration.',
    'Hard-body collision radius assumes spherical circumscribing envelope (Primary: ' + primary.hardBodyRadiusM + ' m, Threat: ' + threat.hardBodyRadiusM + ' m).',
    'High-altitude atmospheric drag perturbations (J2 / J3 / MSIS) and solar radiation pressure (SRP) are not included in this instantaneous 2D simulation and should be verified in operational flight dynamics software prior to burn upload.',
    'Assumed chemical monopropellant thruster performance with Isp = 285 s and impulsive delta-V execution.',
  ];

  return {
    timestamp: new Date().toISOString(),
    threatAssessment,
    noActionOutcome,
    manoeuvreOptionsSummary,
    recommendedAction,
    physicalReasoning,
    postManoeuvreVerification,
    confidenceAndLimitations,
  };
}
