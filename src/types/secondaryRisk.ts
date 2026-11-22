import type { RiskLevel, ObjectType } from './conjunction';

export interface SecondaryEncounter {
  id: string;
  secondaryObjectName: string;
  secondaryNoradId: number;
  objectType: ObjectType;
  tcaUtc: string;
  hoursFromManoeuvre: number;
  missDistanceM: number;
  relativeVelocityKms: number;
  collisionProbability: number;
  riskLevel: RiskLevel;
  radialDeltaM: number;
  crossTrackDeltaM: number;
  alongTrackDeltaM: number;
  isThreatIntroducedByManoeuvre: boolean;
  notes: string;
}

export interface SecondaryScreeningSummary {
  conjunctionId: string;
  manoeuvreId: string;
  screenedCatalogObjectsCount: number;
  screeningHorizonHours: number;
  generatedAtUtc: string;
  highRiskCount: number;
  moderateRiskCount: number;
  lowRiskCount: number;
  closestSecondaryDistanceM: number;
  clearanceVerdict: 'APPROVED_CLEAR' | 'CAUTION_NEW_ENCOUNTER' | 'REJECT_COLLISION_HAZARD';
  recommendationSummary: string;
  encounters: SecondaryEncounter[];
}
