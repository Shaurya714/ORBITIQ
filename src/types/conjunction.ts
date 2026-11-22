export type RiskLevel = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export type EventStatus = 'PENDING_ANALYSIS' | 'MANOEUVRE_PLANNED' | 'SCREENED_SAFE' | 'EXECUTED' | 'MONITORING';

export type ObjectType = 'PAYLOAD' | 'ROCKET_BODY' | 'DEBRIS' | 'UNKNOWN';

export type OrbitRegime = 'LEO' | 'SSO' | 'MEO' | 'GEO';

export interface OrbitalObject {
  id: string;
  name: string;
  noradId: number;
  intlDes: string;
  type: ObjectType;
  regime: OrbitRegime;
  operator: string;
  country: string;
  apogeeKm: number;
  perigeeKm: number;
  inclinationDeg: number;
  semiMajorAxisKm: number;
  periodMin: number;
  rcsM2: number; // Radar Cross Section
  isManoeuvrable: boolean;
  spanMeters: number;
}

export interface EncounterGeometry {
  missDistanceTotalM: number;
  radialDeltaM: number;      // ΔR (Radial)
  inTrackDeltaM: number;     // ΔT (Along-track)
  crossTrackDeltaM: number;  // ΔN (Normal / Cross-track)
  relativeVelocityKms: number;
  approachAngleDeg: number;
  bPlaneXiM: number;
  bPlaneZetaM: number;
  primaryVelocityVector: [number, number, number]; // km/s
  secondaryVelocityVector: [number, number, number];
}

export interface CovarianceEllipse {
  sigma1SemiMajorM: number;
  sigma1SemiMinorM: number;
  orientationAngleDeg: number;
  positionUncertaintyPrimaryM: number;
  positionUncertaintySecondaryM: number;
  realismScorePercent: number; // e.g. 94%
}

export interface ConjunctionEvent {
  id: string; // e.g. "CONJ-2026-0881"
  cdmId: string; // e.g. "CDM-49201-9482"
  primaryObject: OrbitalObject;
  secondaryObject: OrbitalObject;
  tcaUtc: string; // ISO string
  daysToTca: number;
  hoursToTca: number;
  missDistanceM: number;
  collisionProbability: number; // Pc, e.g. 2.41e-4
  maxCollisionProbability: number; // P_max
  riskLevel: RiskLevel;
  status: EventStatus;
  geometry: EncounterGeometry;
  covariance: CovarianceEllipse;
  atmosphericDragIndex: 'LOW' | 'NOMINAL' | 'ELEVATED' | 'SEVERE';
  solarFluxIndex: number; // sfu
  lastUpdatedUtc: string;
  screeningDataSource: 'Space-Track CDM' | 'ESA DISCOS' | 'Operator Ephemeris';
  operatorNotes?: string;
  recommendation: string;
}
