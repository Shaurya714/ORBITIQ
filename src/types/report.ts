import type { ConjunctionEvent, RiskLevel } from './conjunction';
import type { SimulationResult } from './simulation';
import type { SecondaryScreeningSummary } from './secondaryRisk';

export type ReportType = 
  | 'CONJUNCTION_ASSESSMENT'
  | 'MANOEUVRE_PLAN'
  | 'SECONDARY_RISK_AUDIT'
  | 'EXECUTIVE_BRIEFING';

export interface SavedReport {
  id: string;
  referenceCode: string; // e.g. "REP-2026-0881-A"
  title: string;
  reportType: ReportType;
  conjunctionId: string;
  primaryObjectName: string;
  secondaryObjectName: string;
  riskLevel: RiskLevel;
  author: string;
  createdAt: string;
  summary: string;
  conjunctionSnapshot: ConjunctionEvent;
  simulationSnapshot?: SimulationResult;
  secondaryScreeningSnapshot?: SecondaryScreeningSummary;
  operatorNotes: string;
  recommendedAction: string;
  approvalStatus: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'WAIVED';
}
