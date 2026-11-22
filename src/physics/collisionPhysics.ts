/**
 * ORBITIQ - Orbital Collision Physics & Two-Object Encounter Analysis Engine
 * 
 * Implements rigorous two-body astrodynamics and encounter geometry:
 * - Common reference frame conversion & synchronized propagation
 * - Relative motion state vectors: r_rel = r_threat - r_sat, v_rel = v_threat - v_sat
 * - Center-of-Mass (CM) frame transformation
 * - Linear relative-motion approximation for initial search
 * - Global numerical minimum search for non-linear close approaches
 * - Physical hard-body collision envelope evaluation
 * - Kinetic impact energy consequence estimation (E_k = 0.5 * m_eff * v_rel^2)
 */

import { 
  EARTH_MU, 
  EARTH_RADIUS_KM, 
  propagateOrbit, 
  keplerianToState2D, 
  type KeplerianElements, 
  type StateVector2D 
} from './orbitalPhysics';
import type { 
  OrbitalObjectProfile, 
  EncounterStateSnapshot, 
  ClosestApproachPrediction, 
  ImpactConsequenceAnalysis 
} from '../types/simulation';

/**
 * Compute instantaneous state of both objects and their relative geometry at simulation time t
 */
export function calculateEncounterSnapshot(
  primary: OrbitalObjectProfile,
  threat: OrbitalObjectProfile,
  simTimeSec: number
): EncounterStateSnapshot {
  const pProp = propagateOrbit(primary.elements, simTimeSec);
  const tProp = propagateOrbit(threat.elements, simTimeSec);

  const satPos = pProp.state;
  const threatPos = tProp.state;

  const satVel = {
    vx: satPos.vx,
    vy: satPos.vy,
    speedKms: Math.sqrt(satPos.vx * satPos.vx + satPos.vy * satPos.vy),
  };

  const threatVel = {
    vx: threatPos.vx,
    vy: threatPos.vy,
    speedKms: Math.sqrt(threatPos.vx * threatPos.vx + threatPos.vy * threatPos.vy),
  };

  // Relative vectors: r_rel = r_threat - r_sat, v_rel = v_threat - v_sat
  const rx = threatPos.x - satPos.x;
  const ry = threatPos.y - satPos.y;
  const distanceKm = Math.sqrt(rx * rx + ry * ry);

  const rvx = threatVel.vx - satVel.vx;
  const rvy = threatVel.vy - satVel.vy;
  const relativeSpeedKms = Math.sqrt(rvx * rvx + rvy * rvy);

  // Center-of-Mass frame: R_cm = (m1*r1 + m2*r2) / (m1 + m2)
  const m1 = Math.max(primary.estimatedMassKg, 1);
  const m2 = Math.max(threat.estimatedMassKg, 1);
  const totalMass = m1 + m2;

  const cmRx = (m1 * satPos.x + m2 * threatPos.x) / totalMass;
  const cmRy = (m1 * satPos.y + m2 * threatPos.y) / totalMass;
  const cmVx = (m1 * satVel.vx + m2 * threatVel.vx) / totalMass;
  const cmVy = (m1 * satVel.vy + m2 * threatVel.vy) / totalMass;

  return {
    timeSec: simTimeSec,
    satPosition: satPos,
    satVelocity: satVel,
    threatPosition: threatPos,
    threatVelocity: threatVel,
    relativePosition: { rx, ry, distanceKm },
    relativeVelocity: { rvx, rvy, relativeSpeedKms },
    centerOfMass: {
      rx: cmRx,
      ry: cmRy,
      vx: cmVx,
      vy: cmVy,
      satRelPosition: { rx: satPos.x - cmRx, ry: satPos.y - cmRy },
      threatRelPosition: { rx: threatPos.x - cmRx, ry: threatPos.y - cmRy },
    },
  };
}

/**
 * Predict closest approach using dual-stage algorithm:
 * 1. Linear relative-motion approximation for initial search
 * 2. Fine-grained numerical minimum search over full orbital interval
 */
export function predictClosestApproach(
  primaryElements: KeplerianElements,
  threatElements: KeplerianElements,
  primaryHardBodyRadiusM: number = 2.5,
  threatHardBodyRadiusM: number = 1.5,
  searchHorizonSec?: number
): ClosestApproachPrediction {
  const a1 = primaryElements.semiMajorAxisKm;
  const period1 = 2 * Math.PI * Math.sqrt(Math.pow(Math.max(a1, 100), 3) / EARTH_MU);
  const a2 = threatElements.semiMajorAxisKm;
  const period2 = 2 * Math.PI * Math.sqrt(Math.pow(Math.max(a2, 100), 3) / EARTH_MU);
  
  // Search window defaults to 1.5 orbital periods
  const horizon = searchHorizonSec || Math.min(period1, period2) * 1.5;

  // Initial state vectors at t = 0
  const p0 = keplerianToState2D(primaryElements, primaryElements.trueAnomalyDeg);
  const t0 = keplerianToState2D(threatElements, threatElements.trueAnomalyDeg);

  const r0x = t0.x - p0.x;
  const r0y = t0.y - p0.y;
  const v0x = t0.vx - p0.vx;
  const v0y = t0.vy - p0.vy;

  const vRelSq = v0x * v0x + v0y * v0y;
  const rDotV = r0x * v0x + r0y * v0y;

  // Linear relative-motion approximation
  let tCaLinear = vRelSq > 1e-6 ? -rDotV / vRelSq : 0;
  const rCaLinX = r0x + tCaLinear * v0x;
  const rCaLinY = r0y + tCaLinear * v0y;
  const dCaLinearM = Math.sqrt(rCaLinX * rCaLinX + rCaLinY * rCaLinY) * 1000;

  // Numerical scan over the horizon
  // Sample every dt seconds
  const numSamples = 240;
  const dt = horizon / numSamples;
  let minDistanceKm = Infinity;
  let tCaSec = 0;
  let bestSatPos: StateVector2D = p0;
  let bestThreatPos: StateVector2D = t0;

  for (let step = 0; step <= numSamples; step++) {
    const t = step * dt;
    const p = propagateOrbit(primaryElements, t).state;
    const th = propagateOrbit(threatElements, t).state;

    const dx = th.x - p.x;
    const dy = th.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < minDistanceKm) {
      minDistanceKm = dist;
      tCaSec = t;
      bestSatPos = p;
      bestThreatPos = th;
    }
  }

  // Refine around the local minimum with golden section / ternary search
  const refineWindow = Math.max(dt * 2, 30);
  let left = Math.max(0, tCaSec - refineWindow);
  let right = Math.min(horizon, tCaSec + refineWindow);

  for (let iter = 0; iter < 25; iter++) {
    const m1 = left + (right - left) / 3;
    const m2 = right - (right - left) / 3;

    const p1 = propagateOrbit(primaryElements, m1).state;
    const th1 = propagateOrbit(threatElements, m1).state;
    const dist1 = Math.sqrt(Math.pow(th1.x - p1.x, 2) + Math.pow(th1.y - p1.y, 2));

    const p2 = propagateOrbit(primaryElements, m2).state;
    const th2 = propagateOrbit(threatElements, m2).state;
    const dist2 = Math.sqrt(Math.pow(th2.x - p2.x, 2) + Math.pow(th2.y - p2.y, 2));

    if (dist1 < dist2) {
      right = m2;
      minDistanceKm = dist1;
      tCaSec = m1;
      bestSatPos = p1;
      bestThreatPos = th1;
    } else {
      left = m1;
      minDistanceKm = dist2;
      tCaSec = m2;
      bestSatPos = p2;
      bestThreatPos = th2;
    }
  }

  const predictedMissDistanceM = Math.round(minDistanceKm * 1000);
  const combinedHardBodyRadiusM = primaryHardBodyRadiusM + threatHardBodyRadiusM;
  const isCollisionEnvelopeOverlap = predictedMissDistanceM <= combinedHardBodyRadiusM;

  // Relative velocity at closest approach
  const vRelAtCaKms = Math.sqrt(
    Math.pow(bestThreatPos.vx - bestSatPos.vx, 2) + 
    Math.pow(bestThreatPos.vy - bestSatPos.vy, 2)
  );

  const closestApproachPositionKm = {
    x: (bestSatPos.x + bestThreatPos.x) / 2,
    y: (bestSatPos.y + bestThreatPos.y) / 2,
  };

  const caTrueAnomalyDeg = (Math.atan2(bestSatPos.y, bestSatPos.x) * (180 / Math.PI) + 360) % 360;

  let statusText = '';
  if (isCollisionEnvelopeOverlap) {
    statusText = 'DIRECT COLLISION ENVELOPE OVERLAP DETECTED';
  } else if (predictedMissDistanceM < 200) {
    statusText = 'CRITICAL PROXIMITY — HIGH COLLISION RISK';
  } else if (predictedMissDistanceM < 1000) {
    statusText = 'ELEVATED CONJUNCTION — SAFETY BUFFER BREACHED';
  } else if (predictedMissDistanceM < 5000) {
    statusText = 'CLOSE ORBITAL PASS — PASSIVE MONITORING';
  } else {
    statusText = 'SAFE ORBITAL SEPARATION';
  }

  return {
    timeToClosestApproachSec: Math.round(tCaSec),
    predictedMissDistanceM,
    relativeVelocityKms: Number(vRelAtCaKms.toFixed(2)),
    closestApproachPositionKm,
    closestApproachTrueAnomalyDeg: Math.round(caTrueAnomalyDeg),
    isCollisionEnvelopeOverlap,
    combinedHardBodyRadiusM,
    linearEstimateMissDistanceM: Math.round(dCaLinearM),
    isEncounterPast: tCaSec < 0,
    statusText,
  };
}

/**
 * Calculate Debris Threat & Kinetic Energy Damage Consequence
 * E_k = 0.5 * m_eff * v_rel^2
 */
export function analyzeImpactConsequence(
  primary: OrbitalObjectProfile,
  threat: OrbitalObjectProfile,
  relativeVelocityKms: number,
  missDistanceM: number,
  isEnvelopeOverlap: boolean
): ImpactConsequenceAnalysis {
  // Effective mass for impact mechanics: m_eff = (m1 * m2) / (m1 + m2)
  const m1 = primary.estimatedMassKg;
  const m2 = threat.estimatedMassKg;
  const effectiveMassKg = (m1 * m2) / (m1 + m2);

  // Velocity in m/s
  const vMps = relativeVelocityKms * 1000;

  // Kinetic energy E_k = 0.5 * m * v^2 in Joules
  const kineticEnergyJoules = 0.5 * effectiveMassKg * vMps * vMps;
  const kineticEnergyMegajoules = kineticEnergyJoules / 1e6;

  // TNT equivalence: 1 kg TNT = 4.184 x 10^6 Joules (4.184 MJ)
  const tntEquivalentKg = kineticEnergyMegajoules / 4.184;

  let severityCategory: ImpactConsequenceAnalysis['severityCategory'] = 'NEGLIGIBLE_RISK';
  let severityDescription = '';

  if (isEnvelopeOverlap || (missDistanceM <= 10 && kineticEnergyMegajoules > 50)) {
    severityCategory = 'MISSION_LOSS';
    severityDescription = 'Catastrophic hypervelocity fragmentation. Complete structural disintegration and total mission loss guaranteed upon contact.';
  } else if (missDistanceM <= 250) {
    severityCategory = 'SEVERE_SPACECRAFT_DAMAGE';
    severityDescription = 'High-probability plasma discharge and secondary ejecta penetration. Critical damage to primary payload systems or solar arrays.';
  } else if (missDistanceM <= 1000) {
    severityCategory = 'POTENTIAL_DAMAGING_IMPACT';
    severityDescription = 'Proximity hazard. Possible hypervelocity debris micro-fragment strike or sensor blinding along line-of-sight.';
  } else if (missDistanceM <= 5000) {
    severityCategory = 'CLOSE_PASS';
    severityDescription = 'Close orbital pass. Hard-body clearance maintained; active avoidance recommended if covariance uncertainties are uncalibrated.';
  } else {
    severityCategory = 'NEGLIGIBLE_RISK';
    severityDescription = 'Safe orbital geometry. Physical clearance exceeds operational screening threshold.';
  }

  const assumptionsDisclosed = [
    `Assumed primary satellite mass: ${m1.toLocaleString()} kg (dimensions: ${primary.dimensionsM.length}×${primary.dimensionsM.width}×${primary.dimensionsM.height} m)`,
    `Assumed threat debris mass: ${m2.toLocaleString()} kg (collision radius: ${threat.hardBodyRadiusM} m)`,
    `Impact kinetic energy derived using reduced effective mass m_eff = ${effectiveMassKg.toFixed(1)} kg at v_rel = ${relativeVelocityKms.toFixed(2)} km/s`,
    `Physical collision envelope calculated as hard-body sphere sum: ${(primary.hardBodyRadiusM + threat.hardBodyRadiusM).toFixed(1)} m`,
  ];

  return {
    effectiveMassKg: Number(effectiveMassKg.toFixed(1)),
    relativeVelocityKms,
    kineticEnergyJoules,
    kineticEnergyMegajoules: Number(kineticEnergyMegajoules.toFixed(2)),
    tntEquivalentKg: Number(tntEquivalentKg.toFixed(2)),
    severityCategory,
    severityDescription,
    assumptionsDisclosed,
  };
}

/**
 * Generate time-series separation, relative speed, and altitudes for the Analytical Encounter Graph
 */
export function generateEncounterTimeSeries(
  primaryElements: KeplerianElements,
  threatElements: KeplerianElements,
  postBurnElements: KeplerianElements | null,
  durationSec: number = 3600,
  numPoints: number = 180
): {
  timePointsSec: number[];
  baselineSeparationM: number[];
  postBurnSeparationM: number[];
  relativeSpeedKms: number[];
  primaryAltitudeKm: number[];
  threatAltitudeKm: number[];
  postBurnAltitudeKm: number[];
} {
  const dt = durationSec / numPoints;
  const timePointsSec: number[] = [];
  const baselineSeparationM: number[] = [];
  const postBurnSeparationM: number[] = [];
  const relativeSpeedKms: number[] = [];
  const primaryAltitudeKm: number[] = [];
  const threatAltitudeKm: number[] = [];
  const postBurnAltitudeKm: number[] = [];

  for (let i = 0; i <= numPoints; i++) {
    const t = i * dt;
    timePointsSec.push(t);

    const p = propagateOrbit(primaryElements, t).state;
    const th = propagateOrbit(threatElements, t).state;

    // Baseline separation
    const dx = th.x - p.x;
    const dy = th.y - p.y;
    const distM = Math.round(Math.sqrt(dx * dx + dy * dy) * 1000);
    baselineSeparationM.push(distM);

    const rvx = th.vx - p.vx;
    const rvy = th.vy - p.vy;
    relativeSpeedKms.push(Number(Math.sqrt(rvx * rvx + rvy * rvy).toFixed(2)));

    primaryAltitudeKm.push(Math.round(Math.sqrt(p.x * p.x + p.y * p.y) - EARTH_RADIUS_KM));
    threatAltitudeKm.push(Math.round(Math.sqrt(th.x * th.x + th.y * th.y) - EARTH_RADIUS_KM));

    // Post-burn separation if manoeuvre is executed
    if (postBurnElements) {
      const pb = propagateOrbit(postBurnElements, t).state;
      const pbdx = th.x - pb.x;
      const pbdy = th.y - pb.y;
      postBurnSeparationM.push(Math.round(Math.sqrt(pbdx * pbdx + pbdy * pbdy) * 1000));
      postBurnAltitudeKm.push(Math.round(Math.sqrt(pb.x * pb.x + pb.y * pb.y) - EARTH_RADIUS_KM));
    }
  }

  return {
    timePointsSec,
    baselineSeparationM,
    postBurnSeparationM,
    relativeSpeedKms,
    primaryAltitudeKm,
    threatAltitudeKm,
    postBurnAltitudeKm,
  };
}
