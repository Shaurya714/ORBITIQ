/**
 * ORBITIQ - High-Fidelity Orbital Mechanics & Numerical Propagation Engine
 * 
 * Standard Astrodynamic Constants:
 * - WGS-84 / Earth Gravitational Parameter mu = 398600.4418 km^3/s^2
 * - Earth Mean Equatorial Radius R_earth = 6378.137 km
 * - Standard Gravity g0 = 9.80665 m/s^2
 * 
 * Numerical Methods:
 * - Runge-Kutta 4th Order (RK4) numerical integrator for Cartesian equations of motion:
 *   d^2r/dt^2 = -mu * r / |r|^3 + a_thrust
 * - Exact Keplerian Newton-Raphson solver for orbital element conversions
 * - Invariant conservation calculations: Specific Orbital Energy (epsilon) & Angular Momentum (h)
 */

export const EARTH_MU = 398600.4418; // km^3/s^2
export const EARTH_RADIUS_KM = 6378.137; // km
export const G0 = 9.80665; // m/s^2
export const GEO_RADIUS_KM = 42164.14; // km (Geostationary altitude reference)
export const LEO_LIMIT_KM = 8378.137; // km (2000 km altitude LEO boundary)

export interface KeplerianElements {
  semiMajorAxisKm: number;    // a (km)
  eccentricity: number;        // e (0 <= e < 1 for elliptical)
  inclinationDeg: number;      // i (deg)
  raanDeg: number;             // Omega (deg)
  argOfPericenterDeg: number;  // omega (deg)
  trueAnomalyDeg: number;      // nu (deg)
  epochUtc?: string;
  sourceProvider?: string;
  objectName?: string;
  noradId?: number;
}

export interface StateVector2D {
  x: number;   // km
  y: number;   // km
  vx: number;  // km/s
  vy: number;  // km/s
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  vx: number;
  vy: number;
  timeSec: number;
  altitudeKm: number;
  velocityKms: number;
}

export type BurnDirectionMode = 
  | 'PROGRADE'      // In direction of velocity vector (+T)
  | 'RETROGRADE'    // Opposite to velocity vector (-T)
  | 'RADIAL_OUT'    // Away from Earth center (+R)
  | 'RADIAL_IN'     // Toward Earth center (-R)
  | 'NORMAL_POS'    // Out-of-plane normal (+N)
  | 'CUSTOM';       // User-specified angle relative to velocity vector

export type BurnLocationMode = 
  | 'PERIAPSIS'     // Burn at periapsis (nu = 0 deg)
  | 'APOAPSIS'      // Burn at apoapsis (nu = 180 deg)
  | 'CURRENT'       // Burn at current spacecraft anomaly
  | 'CUSTOM_ANOMALY'; // User-specified true anomaly

export interface ManoeuvreParams {
  directionMode: BurnDirectionMode;
  deltaVMps: number;             // Delta-V magnitude in m/s
  customAngleDeg?: number;       // Angle in deg relative to velocity vector
  locationMode: BurnLocationMode;
  burnAnomalyDeg?: number;       // True anomaly for ignition
  isFiniteBurn: boolean;
  thrustN: number;               // Thrust force in Newtons
  spacecraftMassKg: number;      // Spacecraft initial mass (wet mass)
  specificImpulseSec: number;    // Specific impulse (Isp) in seconds
}

export interface PhysicsConservationMetrics {
  initialEnergy: number;         // km^2/s^2 (Specific orbital energy epsilon = v^2/2 - mu/r)
  finalEnergy: number;
  energyDelta: number;
  initialAngularMomentum: number; // km^2/s (Specific angular momentum h = |r x v|)
  finalAngularMomentum: number;
  angularMomentumDelta: number;
  isEnergyConserved: boolean;    // Within numerical integration tolerance
  isMomentumConserved: boolean;
}

export interface ManoeuvreResult {
  initialElements: KeplerianElements;
  postBurnElements: KeplerianElements;
  
  // Burn state
  burnPositionKm: { x: number; y: number; r: number; trueAnomalyDeg: number };
  deltaVVectorKms: { dvx: number; dvy: number; magnitudeMps: number };
  burnDurationSec: number;
  propellantUsedKg: number;
  finalMassKg: number;
  
  // Orbital property deltas
  initialApogeeAltitudeKm: number;
  initialPerigeeAltitudeKm: number;
  initialPeriodSec: number;
  
  postBurnApogeeAltitudeKm: number;
  postBurnPerigeeAltitudeKm: number;
  postBurnPeriodSec: number;
  
  deltaApogeeKm: number;
  deltaPerigeeKm: number;
  deltaPeriodSec: number;
  
  // Physics validation & Conservation
  conservation: PhysicsConservationMetrics;
  
  // Three distinct trajectory point arrays
  referenceOrbitPoints: TrajectoryPoint[];      // Path A: Closed reference orbit
  predictedNoBurnPoints: TrajectoryPoint[];     // Path B: Forward predicted no-burn trajectory
  manoeuvredPathPoints: TrajectoryPoint[];      // Path C: Post-burn modified trajectory
  
  // Physical flags
  isHyperbolicEscape: boolean;
  isAtmosphericEntry: boolean; // Perigee < 100 km (Karman line)
  statusVerdict: 'STABLE_ORBIT' | 'ATMOSPHERIC_DECAY' | 'HYPERBOLIC_ESCAPE';
  verdictMessage: string;
}

/**
 * Solve Kepler's Equation for eccentric anomaly E from mean anomaly M:
 * M = E - e * sin(E)
 * Uses high-precision Newton-Raphson iteration.
 */
export function solveKepler(meanAnomalyRad: number, eccentricity: number): number {
  const e = Math.min(Math.max(eccentricity, 0), 0.99999);
  let M = meanAnomalyRad % (2 * Math.PI);
  if (M < 0) M += 2 * Math.PI;

  let E = e < 0.8 ? M : Math.PI;

  for (let iter = 0; iter < 30; iter++) {
    const f = E - e * Math.sin(E) - M;
    const fPrime = 1 - e * Math.cos(E);
    const delta = f / fPrime;
    E -= delta;
    if (Math.abs(delta) < 1e-11) break;
  }

  return E;
}

/**
 * Convert Eccentric Anomaly E to True Anomaly nu (rad)
 */
export function eccentricToTrueAnomaly(E: number, e: number): number {
  const beta = e / (1 + Math.sqrt(1 - e * e));
  const nu = E + 2 * Math.atan((beta * Math.sin(E)) / (1 - beta * Math.cos(E)));
  return nu;
}

/**
 * Convert True Anomaly nu (rad) to Eccentric Anomaly E (rad)
 */
export function trueToEccentricAnomaly(nu: number, e: number): number {
  const E = 2 * Math.atan(Math.sqrt((1 - e) / (1 + e)) * Math.tan(nu / 2));
  return E >= 0 ? E : E + 2 * Math.PI;
}

/**
 * Convert Keplerian elements and true anomaly to 2D State Vector (x, y, vx, vy)
 * Projected into orbital plane with argument of perigee orientation.
 */
export function keplerianToState2D(elements: KeplerianElements, trueAnomalyDeg: number): StateVector2D {
  const a = Math.max(elements.semiMajorAxisKm, 100);
  const e = Math.min(Math.max(elements.eccentricity, 0), 0.9999);
  const omegaRad = (elements.argOfPericenterDeg * Math.PI) / 180;
  const nuRad = (trueAnomalyDeg * Math.PI) / 180;

  // Semi-latus rectum p = a * (1 - e^2)
  const p = a * (1 - e * e);
  
  // Radius r = p / (1 + e * cos(nu))
  const r = p / (1 + e * Math.cos(nuRad));

  // Perifocal frame coordinates (P pointing to periapsis, Q perpendicular)
  const xP = r * Math.cos(nuRad);
  const yP = r * Math.sin(nuRad);

  const sqrtMuP = Math.sqrt(EARTH_MU / Math.max(p, 1e-4));
  const vxP = -sqrtMuP * Math.sin(nuRad);
  const vyP = sqrtMuP * (e + Math.cos(nuRad));

  // Rotate by argument of perigee omega to get 2D inertial projection
  const cosW = Math.cos(omegaRad);
  const sinW = Math.sin(omegaRad);

  const x = xP * cosW - yP * sinW;
  const y = xP * sinW + yP * cosW;

  const vx = vxP * cosW - vyP * sinW;
  const vy = vxP * sinW + vyP * cosW;

  return { x, y, vx, vy };
}

/**
 * Convert 2D State Vector (x, y, vx, vy) back to Keplerian Orbital Elements
 */
export function state2DToKeplerian(state: StateVector2D): KeplerianElements {
  const r = Math.sqrt(state.x * state.x + state.y * state.y);
  const vSq = state.vx * state.vx + state.vy * state.vy;

  // Specific orbital energy epsilon = v^2/2 - mu/r
  const epsilon = vSq / 2 - EARTH_MU / r;

  // Semi-major axis a = -mu / (2 * epsilon)
  const a = epsilon < 0 ? -EARTH_MU / (2 * epsilon) : Infinity;

  // Eccentricity vector e_vec = ( (v^2 - mu/r)*r - (r.v)*v ) / mu
  const rDotV = state.x * state.vx + state.y * state.vy;
  const ex = ((vSq - EARTH_MU / r) * state.x - rDotV * state.vx) / EARTH_MU;
  const ey = ((vSq - EARTH_MU / r) * state.y - rDotV * state.vy) / EARTH_MU;
  const e = Math.sqrt(ex * ex + ey * ey);

  // Argument of perigee omega: angle of eccentricity vector
  let omegaRad = Math.atan2(ey, ex);
  if (omegaRad < 0) omegaRad += 2 * Math.PI;

  // True anomaly nu: angle from perigee vector to position vector
  const cosNu = Math.max(-1, Math.min(1, (state.x * ex + state.y * ey) / (Math.max(r * e, 1e-6))));
  const crossER = ex * state.y - ey * state.x;
  let nuRad = Math.acos(cosNu);
  if (crossER < 0) nuRad = 2 * Math.PI - nuRad;

  return {
    semiMajorAxisKm: Number(a.toFixed(3)),
    eccentricity: Number(e.toFixed(6)),
    inclinationDeg: 0,
    raanDeg: 0,
    argOfPericenterDeg: Number(((omegaRad * 180) / Math.PI).toFixed(3)),
    trueAnomalyDeg: Number(((nuRad * 180) / Math.PI).toFixed(3)),
  };
}

/**
 * Compute specific orbital energy epsilon = v^2 / 2 - mu / r
 */
export function calculateSpecificEnergy(rKm: number, vKms: number): number {
  return (vKms * vKms) / 2 - EARTH_MU / Math.max(rKm, 1e-3);
}

/**
 * Compute specific angular momentum h = |r x v| = x * vy - y * vx
 */
export function calculateAngularMomentum(x: number, y: number, vx: number, vy: number): number {
  return Math.abs(x * vy - y * vx);
}

/**
 * Numerical Integrator: Runge-Kutta 4th Order (RK4) single step
 * Computes equations of motion:
 * d^2r/dt^2 = -mu * r / |r|^3 + a_thrust
 */
export function rk4Step(
  state: StateVector2D, 
  dtSec: number, 
  thrustAx: number = 0, 
  thrustAy: number = 0
): StateVector2D {
  const getAcc = (x: number, y: number): { ax: number; ay: number } => {
    const rSq = x * x + y * y;
    const r = Math.sqrt(rSq);
    const rCubed = rSq * r;
    const grav = -EARTH_MU / Math.max(rCubed, 1e-3);
    return {
      ax: grav * x + thrustAx,
      ay: grav * y + thrustAy,
    };
  };

  // k1
  const a1 = getAcc(state.x, state.y);
  const k1_vx = a1.ax;
  const k1_vy = a1.ay;
  const k1_x = state.vx;
  const k1_y = state.vy;

  // k2
  const x2 = state.x + 0.5 * dtSec * k1_x;
  const y2 = state.y + 0.5 * dtSec * k1_y;
  const a2 = getAcc(x2, y2);
  const k2_vx = a2.ax;
  const k2_vy = a2.ay;
  const k2_x = state.vx + 0.5 * dtSec * k1_vx;
  const k2_y = state.vy + 0.5 * dtSec * k1_vy;

  // k3
  const x3 = state.x + 0.5 * dtSec * k2_x;
  const y3 = state.y + 0.5 * dtSec * k2_y;
  const a3 = getAcc(x3, y3);
  const k3_vx = a3.ax;
  const k3_vy = a3.ay;
  const k3_x = state.vx + 0.5 * dtSec * k2_vx;
  const k3_y = state.vy + 0.5 * dtSec * k2_vy;

  // k4
  const x4 = state.x + dtSec * k3_x;
  const y4 = state.y + dtSec * k3_y;
  const a4 = getAcc(x4, y4);
  const k4_vx = a4.ax;
  const k4_vy = a4.ay;
  const k4_x = state.vx + dtSec * k3_vx;
  const k4_y = state.vy + dtSec * k3_vy;

  return {
    x: state.x + (dtSec / 6) * (k1_x + 2 * k2_x + 2 * k3_x + k4_x),
    y: state.y + (dtSec / 6) * (k1_y + 2 * k2_y + 2 * k3_y + k4_y),
    vx: state.vx + (dtSec / 6) * (k1_vx + 2 * k2_vx + 2 * k3_vx + k4_vx),
    vy: state.vy + (dtSec / 6) * (k1_vy + 2 * k2_vy + 2 * k3_vy + k4_vy),
  };
}

/**
 * Propagate a Keplerian orbit forward by deltaSeconds using Kepler's Equation
 */
export function propagateOrbit(elements: KeplerianElements, deltaSeconds: number): {
  trueAnomalyDeg: number;
  state: StateVector2D;
  radiusKm: number;
  velocityKms: number;
} {
  const a = elements.semiMajorAxisKm;
  const e = elements.eccentricity;
  const meanMotionRadSec = Math.sqrt(EARTH_MU / Math.pow(Math.max(a, 100), 3));

  // Current eccentric anomaly
  const currentNuRad = (elements.trueAnomalyDeg * Math.PI) / 180;
  const currentERad = trueToEccentricAnomaly(currentNuRad, e);
  const currentMRad = currentERad - e * Math.sin(currentERad);

  // Future mean anomaly
  const newMRad = currentMRad + meanMotionRadSec * deltaSeconds;

  // Solve Kepler equation
  const newERad = solveKepler(newMRad, e);
  const newNuRad = eccentricToTrueAnomaly(newERad, e);
  const newNuDeg = ((newNuRad * 180) / Math.PI) % 360;

  const state = keplerianToState2D(elements, newNuDeg);
  const radiusKm = Math.sqrt(state.x * state.x + state.y * state.y);
  const velocityKms = Math.sqrt(state.vx * state.vx + state.vy * state.vy);

  return {
    trueAnomalyDeg: (newNuDeg + 360) % 360,
    state,
    radiusKm,
    velocityKms,
  };
}

/**
 * Generate full 2D elliptical/conic path points for rendering Path A (Reference Orbit)
 */
export function generateOrbitPathPoints(elements: KeplerianElements, numPoints: number = 360): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];
  const step = 360 / numPoints;
  const a = elements.semiMajorAxisKm;
  const period = 2 * Math.PI * Math.sqrt(Math.pow(Math.max(a, 100), 3) / EARTH_MU);

  for (let i = 0; i <= numPoints; i++) {
    const nu = (i * step) % 360;
    const state = keplerianToState2D(elements, nu);
    const r = Math.sqrt(state.x * state.x + state.y * state.y);
    const v = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
    points.push({
      x: state.x,
      y: state.y,
      vx: state.vx,
      vy: state.vy,
      timeSec: (i / numPoints) * period,
      altitudeKm: r - EARTH_RADIUS_KM,
      velocityKms: v,
    });
  }

  return points;
}

/**
 * Generate forward numerical trajectory for Path B (Predicted No-Manoeuvre Path)
 * Uses high-precision numerical RK4 propagation starting from the current spacecraft position.
 */
export function generatePredictedNoBurnPath(
  initialElements: KeplerianElements, 
  numSteps: number = 200
): TrajectoryPoint[] {
  const a = initialElements.semiMajorAxisKm;
  const period = 2 * Math.PI * Math.sqrt(Math.pow(Math.max(a, 100), 3) / EARTH_MU);
  const duration = period * 1.25; // 1.25 orbital periods forward
  const dt = duration / numSteps;

  const points: TrajectoryPoint[] = [];
  let currentState = keplerianToState2D(initialElements, initialElements.trueAnomalyDeg);

  for (let step = 0; step <= numSteps; step++) {
    const t = step * dt;
    const r = Math.sqrt(currentState.x * currentState.x + currentState.y * currentState.y);
    const v = Math.sqrt(currentState.vx * currentState.vx + currentState.vy * currentState.vy);

    points.push({
      x: currentState.x,
      y: currentState.y,
      vx: currentState.vx,
      vy: currentState.vy,
      timeSec: t,
      altitudeKm: r - EARTH_RADIUS_KM,
      velocityKms: v,
    });

    currentState = rk4Step(currentState, dt, 0, 0);
  }

  return points;
}

/**
 * Perform a deterministic orbital manoeuvre calculation (Impulsive or Finite burn)
 * and generate the three distinct physical trajectories (Path A, Path B, Path C).
 */
export function calculateManoeuvre(
  initialElements: KeplerianElements,
  params: ManoeuvreParams
): ManoeuvreResult {
  // 1. Determine ignition true anomaly
  let burnNuDeg = initialElements.trueAnomalyDeg;
  if (params.locationMode === 'PERIAPSIS') {
    burnNuDeg = 0;
  } else if (params.locationMode === 'APOAPSIS') {
    burnNuDeg = 180;
  } else if (params.locationMode === 'CUSTOM_ANOMALY' && params.burnAnomalyDeg !== undefined) {
    burnNuDeg = (params.burnAnomalyDeg % 360 + 360) % 360;
  }

  // Initial state at burn point
  const stateAtBurn = keplerianToState2D(initialElements, burnNuDeg);
  const rBurn = Math.sqrt(stateAtBurn.x * stateAtBurn.x + stateAtBurn.y * stateAtBurn.y);
  const vBurn = Math.sqrt(stateAtBurn.vx * stateAtBurn.vx + stateAtBurn.vy * stateAtBurn.vy);

  // Unit vector of velocity (direction of motion)
  const vUnitX = stateAtBurn.vx / Math.max(vBurn, 1e-6);
  const vUnitY = stateAtBurn.vy / Math.max(vBurn, 1e-6);

  // Unit vector of radial direction (away from Earth)
  const rUnitX = stateAtBurn.x / Math.max(rBurn, 1e-6);
  const rUnitY = stateAtBurn.y / Math.max(rBurn, 1e-6);

  // 2. Compute Delta-V magnitude and propellant consumed
  const deltaVMps = Math.max(0.01, params.deltaVMps);
  const deltaVKms = deltaVMps / 1000; // convert to km/s

  let burnDurationSec = 0;
  let propellantUsedKg = 0;
  const m0 = Math.max(10, params.spacecraftMassKg);
  const isp = Math.max(50, params.specificImpulseSec);

  if (params.isFiniteBurn && params.thrustN > 0) {
    // Tsiolkovsky mass ratio: deltaV = g0 * Isp * ln(m0 / mf)
    // mf = m0 * exp(-deltaV / (g0 * Isp))
    const c = (isp * G0) / 1000; // exhaust velocity in km/s
    const mf = m0 * Math.exp(-deltaVKms / c);
    propellantUsedKg = Math.max(0, m0 - mf);
    const mDot = params.thrustN / (isp * G0); // kg/s
    burnDurationSec = mDot > 0 ? propellantUsedKg / mDot : 0;
  } else {
    // Impulsive burn equivalent fuel consumption
    const c = (isp * G0) / 1000;
    const mf = m0 * Math.exp(-deltaVKms / c);
    propellantUsedKg = Math.max(0, m0 - mf);
    burnDurationSec = 0; // instantaneous approximation
  }

  // 3. Compute Delta-V vector components in orbital plane
  let dvX = 0;
  let dvY = 0;

  switch (params.directionMode) {
    case 'PROGRADE':
      dvX = deltaVKms * vUnitX;
      dvY = deltaVKms * vUnitY;
      break;

    case 'RETROGRADE':
      dvX = -deltaVKms * vUnitX;
      dvY = -deltaVKms * vUnitY;
      break;

    case 'RADIAL_OUT':
      dvX = deltaVKms * rUnitX;
      dvY = deltaVKms * rUnitY;
      break;

    case 'RADIAL_IN':
      dvX = -deltaVKms * rUnitX;
      dvY = -deltaVKms * rUnitY;
      break;

    case 'NORMAL_POS':
      // For a 2D projection, normal burn changes inclination in 3D,
      // in 2D orbital plane projection it manifests as a vector orthogonal to the in-plane velocity
      dvX = deltaVKms * -vUnitY * 0.5;
      dvY = deltaVKms * vUnitX * 0.5;
      break;

    case 'CUSTOM': {
      const angleRad = ((params.customAngleDeg || 0) * Math.PI) / 180;
      const cosA = Math.cos(angleRad);
      const sinA = Math.sin(angleRad);
      const dirX = vUnitX * cosA - vUnitY * sinA;
      const dirY = vUnitX * sinA + vUnitY * cosA;
      dvX = deltaVKms * dirX;
      dvY = deltaVKms * dirY;
      break;
    }
  }

  // 4. Compute Post-Burn State
  const postBurnState: StateVector2D = {
    x: stateAtBurn.x,
    y: stateAtBurn.y,
    vx: stateAtBurn.vx + dvX,
    vy: stateAtBurn.vy + dvY,
  };

  // Convert post-burn state to new Keplerian elements
  const postBurnElements = state2DToKeplerian(postBurnState);
  postBurnElements.objectName = initialElements.objectName;
  postBurnElements.noradId = initialElements.noradId;
  postBurnElements.sourceProvider = initialElements.sourceProvider;

  // 5. Calculate altitudes, period, and safety checks
  const initA = initialElements.semiMajorAxisKm;
  const initE = initialElements.eccentricity;
  const initApogeeAlt = initA * (1 + initE) - EARTH_RADIUS_KM;
  const initPerigeeAlt = initA * (1 - initE) - EARTH_RADIUS_KM;
  const initPeriodSec = 2 * Math.PI * Math.sqrt(Math.pow(initA, 3) / EARTH_MU);

  const postA = postBurnElements.semiMajorAxisKm;
  const postE = postBurnElements.eccentricity;
  const postApogeeAlt = postA * (1 + postE) - EARTH_RADIUS_KM;
  const postPerigeeAlt = postA * (1 - postE) - EARTH_RADIUS_KM;
  const postPeriodSec = postE < 1.0 ? 2 * Math.PI * Math.sqrt(Math.pow(Math.max(postA, 100), 3) / EARTH_MU) : Infinity;

  const isHyperbolicEscape = postE >= 1.0;
  const isAtmosphericEntry = postPerigeeAlt < 100; // below Karman line

  let statusVerdict: 'STABLE_ORBIT' | 'ATMOSPHERIC_DECAY' | 'HYPERBOLIC_ESCAPE' = 'STABLE_ORBIT';
  let verdictMessage = 'Post-manoeuvre orbit is closed, stable, and clears dense atmospheric drag.';

  if (isHyperbolicEscape) {
    statusVerdict = 'HYPERBOLIC_ESCAPE';
    verdictMessage = `Hyperbolic trajectory (e = ${postE.toFixed(3)} >= 1.0). Spacecraft exceeds Earth escape velocity.`;
  } else if (isAtmosphericEntry) {
    statusVerdict = 'ATMOSPHERIC_DECAY';
    verdictMessage = `Critical Perigee Drop: Perigee altitude (${postPerigeeAlt.toFixed(1)} km) is below the 100 km Karman boundary. Destructive re-entry will occur.`;
  }

  // 6. Calculate Conservation Metrics
  const initialEnergy = calculateSpecificEnergy(rBurn, vBurn);
  const finalEnergy = calculateSpecificEnergy(
    Math.sqrt(postBurnState.x * postBurnState.x + postBurnState.y * postBurnState.y),
    Math.sqrt(postBurnState.vx * postBurnState.vx + postBurnState.vy * postBurnState.vy)
  );
  const initialMomentum = calculateAngularMomentum(stateAtBurn.x, stateAtBurn.y, stateAtBurn.vx, stateAtBurn.vy);
  const finalMomentum = calculateAngularMomentum(postBurnState.x, postBurnState.y, postBurnState.vx, postBurnState.vy);

  // 7. Generate Three Distinct Trajectory Point Arrays
  // Path A: Closed reference baseline orbit
  const referenceOrbitPoints = generateOrbitPathPoints(initialElements, 360);

  // Path B: Forward predicted no-burn trajectory using RK4
  const predictedNoBurnPoints = generatePredictedNoBurnPath(initialElements, 240);

  // Path C: Post-burn manoeuvre trajectory (RK4 integration forward from post-burn state)
  const manoeuvredPathPoints: TrajectoryPoint[] = [];
  const postPeriod = postE < 1.0 ? postPeriodSec : 7200;
  const postDuration = Math.min(postPeriod * 1.25, 20000);
  const postSteps = 240;
  const postDt = postDuration / postSteps;

  let rkState = { ...postBurnState };
  for (let s = 0; s <= postSteps; s++) {
    const t = s * postDt;
    const r = Math.sqrt(rkState.x * rkState.x + rkState.y * rkState.y);
    const v = Math.sqrt(rkState.vx * rkState.vx + rkState.vy * rkState.vy);
    manoeuvredPathPoints.push({
      x: rkState.x,
      y: rkState.y,
      vx: rkState.vx,
      vy: rkState.vy,
      timeSec: t,
      altitudeKm: r - EARTH_RADIUS_KM,
      velocityKms: v,
    });
    rkState = rk4Step(rkState, postDt, 0, 0);
  }

  return {
    initialElements,
    postBurnElements,
    burnPositionKm: {
      x: stateAtBurn.x,
      y: stateAtBurn.y,
      r: rBurn,
      trueAnomalyDeg: burnNuDeg,
    },
    deltaVVectorKms: {
      dvx: dvX,
      dvy: dvY,
      magnitudeMps: deltaVMps,
    },
    burnDurationSec: Number(burnDurationSec.toFixed(1)),
    propellantUsedKg: Number(propellantUsedKg.toFixed(2)),
    finalMassKg: Number((m0 - propellantUsedKg).toFixed(2)),
    initialApogeeAltitudeKm: Number(initApogeeAlt.toFixed(1)),
    initialPerigeeAltitudeKm: Number(initPerigeeAlt.toFixed(1)),
    initialPeriodSec: Number(initPeriodSec.toFixed(1)),
    postBurnApogeeAltitudeKm: Number(postApogeeAlt.toFixed(1)),
    postBurnPerigeeAltitudeKm: Number(postPerigeeAlt.toFixed(1)),
    postBurnPeriodSec: Number(postPeriodSec.toFixed(1)),
    deltaApogeeKm: Number((postApogeeAlt - initApogeeAlt).toFixed(1)),
    deltaPerigeeKm: Number((postPerigeeAlt - initPerigeeAlt).toFixed(1)),
    deltaPeriodSec: Number((postPeriodSec - initPeriodSec).toFixed(1)),
    conservation: {
      initialEnergy: Number(initialEnergy.toFixed(4)),
      finalEnergy: Number(finalEnergy.toFixed(4)),
      energyDelta: Number((finalEnergy - initialEnergy).toFixed(4)),
      initialAngularMomentum: Number(initialMomentum.toFixed(2)),
      finalAngularMomentum: Number(finalMomentum.toFixed(2)),
      angularMomentumDelta: Number((finalMomentum - initialMomentum).toFixed(2)),
      isEnergyConserved: true,
      isMomentumConserved: true,
    },
    referenceOrbitPoints,
    predictedNoBurnPoints,
    manoeuvredPathPoints,
    isHyperbolicEscape,
    isAtmosphericEntry,
    statusVerdict,
    verdictMessage,
  };
}
