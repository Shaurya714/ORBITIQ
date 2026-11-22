/**
 * ORBITIQ - Unified Orbital Data Types
 * Used by Space-Track, CelesTrak, and the Unified Provider Layer
 */

export type SourceProvider = 'SPACE_TRACK' | 'CELESTRAK';

export interface UnifiedOrbitalObject {
  noradId: number;
  name: string;
  intlDes: string;
  objectType: 'PAYLOAD' | 'ROCKET_BODY' | 'DEBRIS' | 'UNKNOWN';
  epochUtc: string;
  semiMajorAxisKm: number;
  apogeeKm: number;
  perigeeKm: number;
  inclinationDeg: number;
  eccentricity: number;
  periodMin: number;
  raanDeg: number;
  argOfPericenterDeg: number;
  meanAnomalyDeg: number;
  meanMotionRevsPerDay: number;
  bstar: number;
  rcsSize: 'LARGE' | 'MEDIUM' | 'SMALL' | 'UNKNOWN';
  orbitRegime: 'LEO' | 'MEO' | 'GEO' | 'HEO';
  isManoeuvrable: boolean;
  daysSinceEpoch: number;
  sourceProvider: SourceProvider;
  sourceRecordTimestamp: string | null;
  retrievalTimestamp: string;
}

export type ProviderStatusCode = 
  | 'CONNECTED' 
  | 'NOT_CONFIGURED' 
  | 'CONNECTION_FAILED' 
  | 'RATE_LIMITED' 
  | 'NETWORK_ERROR' 
  | 'STANDBY';

export interface ProviderStatus {
  id: 'spacetrack' | 'celestrak';
  name: string;
  status: ProviderStatusCode;
  isConfigured: boolean;
  message: string;
  lastSyncUtc: string | null;
  cachedEntriesCount: number;
  requiresAuth: boolean;
  maskedIdentity?: string | null;
  currentGroup?: string;
}

export interface UnifiedGatewayStatus {
  overallStatus: 'OPERATIONAL' | 'PARTIALLY_AVAILABLE' | 'STANDBY' | 'ERROR';
  message: string;
  totalCachedObjects: number;
  providers: {
    spacetrack: ProviderStatus;
    celestrak: ProviderStatus;
  };
  lastSyncUtc: string | null;
}
