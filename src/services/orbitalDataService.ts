import type { ConjunctionEvent } from '../types/conjunction';
import { API_CONFIG } from './apiConfig';

export type SourceProvider = 'SPACE_TRACK' | 'CELESTRAK';

export interface ProviderStatus {
  id: 'spacetrack' | 'celestrak';
  name: string;
  status: 'CONNECTED' | 'NOT_CONFIGURED' | 'CONNECTION_FAILED' | 'RATE_LIMITED' | 'NETWORK_ERROR' | 'STANDBY';
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

// Backward-compatibility aliases
export type NormalizedGpObject = UnifiedOrbitalObject;
export type SpaceTrackStatusResponse = ProviderStatus;

export class OrbitalDataService {
  private static baseUrl = API_CONFIG.baseUrl;

  /**
   * Get unified status across all providers
   */
  public static async getUnifiedStatus(): Promise<UnifiedGatewayStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/status`);
      if (response.ok) {
        return await response.json();
      }
      return this.fallbackOfflineStatus();
    } catch {
      return this.fallbackOfflineStatus();
    }
  }

  private static fallbackOfflineStatus(): UnifiedGatewayStatus {
    return {
      overallStatus: 'STANDBY',
      message: 'Gateway proxy offline. Run "npm run server" to start backend.',
      totalCachedObjects: 0,
      providers: {
        spacetrack: {
          id: 'spacetrack',
          name: 'Space-Track.org (18th SDS)',
          status: 'NOT_CONFIGURED',
          isConfigured: false,
          message: 'Backend offline',
          lastSyncUtc: null,
          cachedEntriesCount: 0,
          requiresAuth: true,
        },
        celestrak: {
          id: 'celestrak',
          name: 'CelesTrak (Public GP API)',
          status: 'STANDBY',
          isConfigured: true,
          message: 'Backend offline',
          lastSyncUtc: null,
          cachedEntriesCount: 0,
          requiresAuth: false,
          currentGroup: 'stations',
        },
      },
      lastSyncUtc: null,
    };
  }

  /**
   * Fetch unified orbital catalog (from CelesTrak, Space-Track, or both)
   */
  public static async fetchUnifiedCatalog(options: {
    provider?: 'ALL' | 'CELESTRAK' | 'SPACE_TRACK';
    group?: string;
    search?: string;
    regime?: string;
    limit?: number;
    refresh?: boolean;
  } = {}): Promise<UnifiedOrbitalObject[]> {
    try {
      const params = new URLSearchParams();
      if (options.provider) params.set('provider', options.provider);
      if (options.group) params.set('group', options.group);
      if (options.search) params.set('search', options.search);
      if (options.regime) params.set('regime', options.regime);
      if (options.limit) params.set('limit', String(options.limit));
      if (options.refresh) params.set('refresh', 'true');

      const response = await fetch(`${this.baseUrl}/orbital/catalog?${params.toString()}`);
      if (!response.ok) return [];
      const json = await response.json();
      return json.data || [];
    } catch {
      return [];
    }
  }

  /**
   * Switch or fetch a specific CelesTrak group (e.g. stations, active, visual, last-30-days, starlink)
   */
  public static async fetchCelesTrakGroup(group: string): Promise<UnifiedOrbitalObject[]> {
    return this.fetchUnifiedCatalog({
      provider: 'CELESTRAK',
      group,
      refresh: true,
    });
  }

  /**
   * Connect or authenticate Space-Track with credentials
   */
  public static async connectSpaceTrack(username: string, password: string): Promise<{
    success: boolean;
    message: string;
    status: ProviderStatus;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/providers/spacetrack/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      return data;
    } catch (err: any) {
      return {
        success: false,
        message: `Gateway request failed: ${err.message}`,
        status: {
          id: 'spacetrack',
          name: 'Space-Track.org',
          status: 'NETWORK_ERROR',
          message: err.message,
          isConfigured: false,
          lastSyncUtc: null,
          cachedEntriesCount: 0,
          requiresAuth: true,
        },
      };
    }
  }

  /**
   * Disconnect Space-Track session
   */
  public static async disconnectSpaceTrack(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/providers/spacetrack/disconnect`, { method: 'POST' });
      return await response.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Trigger a full catalog sync across providers
   */
  public static async syncUnifiedCatalog(): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/orbital/sync`, { method: 'POST' });
      return await response.json();
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Fetch screened close approaches derived from live catalog elements
   */
  public static async fetchConjunctions(forceRescreen: boolean = false): Promise<ConjunctionEvent[]> {
    const url = `${this.baseUrl}/orbital/conjunctions${forceRescreen ? '?rescreen=true' : ''}`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch conjunctions: HTTP ${response.status} ${response.statusText}`);
    }
    const json = await response.json();
    return json.data || [];
  }

  // Backward compatibility helpers
  public static async getSpaceTrackStatus(): Promise<ProviderStatus> {
    const status = await this.getUnifiedStatus();
    return status.providers.spacetrack;
  }

  public static async fetchGpObjects(options: any = {}): Promise<UnifiedOrbitalObject[]> {
    return this.fetchUnifiedCatalog(options);
  }

  public static async syncSpaceTrack(): Promise<{ success: boolean; message: string }> {
    return this.syncUnifiedCatalog();
  }
}
