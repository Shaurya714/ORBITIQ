/**
 * ORBITIQ - Space-Track API Client
 * 
 * Handles:
 * 1. Authentication with https://www.space-track.org/ajaxauth/login
 * 2. Session cookie management and automatic re-authentication
 * 3. GP (General Perturbations) orbital elements queries
 * 4. Data validation and normalization
 * 5. In-memory caching with TTL to respect Space-Track rate limits
 */

import type { UnifiedOrbitalObject, ProviderStatus, ProviderStatusCode } from './types';

export interface SpaceTrackGpRaw {
  CCSDS_OMM_VERS?: string;
  COMMENT?: string;
  ORIGINATOR?: string;
  OBJECT_NAME: string;
  OBJECT_ID: string;
  NORAD_CAT_ID: string | number;
  OBJECT_TYPE?: string;
  CLASSIFICATION_TYPE?: string;
  EPOCH: string;
  MEAN_MOTION: string | number;
  ECCENTRICITY: string | number;
  INCLINATION: string | number;
  RA_OF_ASC_NODE: string | number;
  ARG_OF_PERICENTER: string | number;
  MEAN_ANOMALY: string | number;
  EPHEMERIS_TYPE?: string | number;
  SEMIMAJOR_AXIS?: string | number;
  PERIOD?: string | number;
  APOAPSIS?: string | number;
  PERIAPSIS?: string | number;
  BSTAR?: string | number;
  MEAN_MOTION_DOT?: string | number;
  MEAN_MOTION_DDOT?: string | number;
  RCS_SIZE?: string;
  REF_FRAME?: string;
  TIME_SYSTEM?: string;
}

export type NormalizedGpObject = UnifiedOrbitalObject;
export type ConnectionStatus = ProviderStatusCode;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class SpaceTrackClient {
  private username: string = '';
  private password: string = '';
  private sessionCookies: string[] = [];
  private lastAuthTime: number = 0;
  private connectionStatus: ConnectionStatus = 'NOT_CONFIGURED';
  private lastStatusMessage: string = 'Space-Track credentials not configured yet.';
  private lastSyncTimeUtc: string | null = null;

  // In-memory cache (TTL: 60 minutes)
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cacheTtlMs: number = 60 * 60 * 1000;

  constructor() {
    this.updateCredentialsFromEnv();
  }

  public updateCredentialsFromEnv() {
    const user = process.env.SPACETRACK_USER || process.env.SPACETRACK_USERNAME || '';
    const pass = process.env.SPACETRACK_PASSWORD || process.env.SPACETRACK_PASS || '';
    if (user && pass) {
      this.username = user.trim();
      this.password = pass.trim();
      this.connectionStatus = 'NOT_CONFIGURED';
      this.lastStatusMessage = 'Credentials loaded from environment. Ready for connection.';
    } else {
      this.username = '';
      this.password = '';
      this.connectionStatus = 'NOT_CONFIGURED';
      this.lastStatusMessage = 'No credentials provided in environment.';
    }
  }

  public setCredentials(user: string, pass: string) {
    this.username = user.trim();
    this.password = pass.trim();
    this.sessionCookies = [];
    this.lastAuthTime = 0;
    this.cache.clear();
    this.connectionStatus = 'NOT_CONFIGURED';
    this.lastStatusMessage = 'Credentials updated. Ready for connection.';
  }

  public getStatus(): ProviderStatus {
    return {
      id: 'spacetrack',
      name: 'Space-Track.org (18th SDS)',
      status: this.connectionStatus,
      message: this.lastStatusMessage,
      isConfigured: !!(this.username && this.password),
      maskedIdentity: this.username ? this.maskEmail(this.username) : null,
      lastSyncUtc: this.lastSyncTimeUtc,
      cachedEntriesCount: this.cache.size,
      requiresAuth: true,
    };
  }

  private maskEmail(email: string): string {
    if (!email.includes('@')) {
      return email.length > 3 ? `${email.substring(0, 2)}***` : '***';
    }
    const [name, domain] = email.split('@');
    const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name[0]}***`;
    return `${maskedName}@${domain}`;
  }

  /**
   * Authenticate with Space-Track and extract session cookies
   */
  public async authenticate(force: boolean = false): Promise<boolean> {
    if (!this.username || !this.password) {
      this.connectionStatus = 'NOT_CONFIGURED';
      this.lastStatusMessage = 'Space-Track username or password is missing.';
      return false;
    }

    // Reuse session cookie if authenticated within 1 hour
    const now = Date.now();
    if (!force && this.sessionCookies.length > 0 && now - this.lastAuthTime < 60 * 60 * 1000) {
      return true;
    }

    try {
      const loginUrl = 'https://www.space-track.org/ajaxauth/login';
      const body = new URLSearchParams({
        identity: this.username,
        password: this.password,
      });

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
        redirect: 'manual',
      });

      const rawSetCookie = response.headers.getSetCookie 
        ? response.headers.getSetCookie() 
        : [response.headers.get('set-cookie') || ''];

      const cookies = rawSetCookie.filter(Boolean);
      const text = await response.text();

      // Space-Track returns 200 with "Login Failed" or status 401 when bad password
      if (response.status === 401 || text.toLowerCase().includes('failed') || text.toLowerCase().includes('invalid')) {
        this.connectionStatus = 'AUTHENTICATION_FAILED';
        this.lastStatusMessage = 'Space-Track rejected credentials. Check your email & password.';
        this.sessionCookies = [];
        return false;
      }

      if (cookies.length === 0 && !response.ok) {
        this.connectionStatus = 'AUTHENTICATION_FAILED';
        this.lastStatusMessage = `Login failed with HTTP status ${response.status}.`;
        return false;
      }

      // Store cookie strings for subsequent requests
      this.sessionCookies = cookies.map(c => c.split(';')[0]);
      this.lastAuthTime = now;
      this.connectionStatus = 'CONNECTED';
      this.lastStatusMessage = 'Successfully authenticated with Space-Track.';
      return true;
    } catch (err: any) {
      this.connectionStatus = 'NETWORK_ERROR';
      this.lastStatusMessage = `Network error connecting to Space-Track: ${err.message}`;
      return false;
    }
  }

  /**
   * Fetch GP orbital elements from Space-Track
   */
  public async getGpData(options: {
    noradIds?: number[];
    limit?: number;
    decayed?: boolean;
    nameQuery?: string;
  } = {}): Promise<NormalizedGpObject[]> {
    const cacheKey = JSON.stringify(options);
    const cached = this.cache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < this.cacheTtlMs) {
      return cached.data;
    }

    const isAuthed = await this.authenticate();
    if (!isAuthed) {
      throw new Error(this.lastStatusMessage);
    }

    try {
      let queryPath = 'https://www.space-track.org/basicspacedata/query/class/gp';

      if (options.noradIds && options.noradIds.length > 0) {
        queryPath += `/NORAD_CAT_ID/${options.noradIds.join(',')}`;
      } else if (options.nameQuery) {
        queryPath += `/OBJECT_NAME/~~${encodeURIComponent(options.nameQuery)}`;
      } else {
        // Default query: Active on-orbit payloads and objects from recent epochs
        queryPath += '/DECAY_DATE/null-val/EPOCH/%3Enow-30/orderby/NORAD_CAT_ID%20asc';
      }

      const limit = options.limit || 60;
      queryPath += `/limit/${limit}/format/json`;

      const response = await fetch(queryPath, {
        method: 'GET',
        headers: {
          Cookie: this.sessionCookies.join('; '),
          'User-Agent': 'ORBITIQ-SpaceOps/1.0',
        },
      });

      if (response.status === 401) {
        // Re-authenticate once and retry
        const reAuthed = await this.authenticate(true);
        if (!reAuthed) {
          throw new Error('Space-Track session expired and re-authentication failed.');
        }
        return this.getGpData(options);
      }

      if (response.status === 429) {
        this.connectionStatus = 'RATE_LIMITED';
        this.lastStatusMessage = 'Space-Track query rate limit exceeded. Please wait a few moments.';
        throw new Error(this.lastStatusMessage);
      }

      if (!response.ok) {
        throw new Error(`Space-Track query returned HTTP ${response.status}`);
      }

      const rawJson = (await response.json()) as SpaceTrackGpRaw[];
      if (!Array.isArray(rawJson)) {
        throw new Error('Space-Track did not return a valid JSON array.');
      }

      const normalized = rawJson.map(record => this.normalizeGpRecord(record));

      // Cache normalized results
      this.cache.set(cacheKey, { data: normalized, timestamp: now });
      this.lastSyncTimeUtc = new Date().toISOString();
      this.connectionStatus = 'CONNECTED';
      this.lastStatusMessage = `Synchronized ${normalized.length} orbital objects from Space-Track.`;

      return normalized;
    } catch (err: any) {
      if (this.connectionStatus !== 'RATE_LIMITED' && this.connectionStatus !== 'AUTHENTICATION_FAILED') {
        this.connectionStatus = 'NETWORK_ERROR';
        this.lastStatusMessage = err.message;
      }
      throw err;
    }
  }

  /**
   * Normalizes a raw Space-Track GP record into an ORBITIQ standard representation
   */
  public normalizeGpRecord(raw: SpaceTrackGpRaw): NormalizedGpObject {
    const noradId = typeof raw.NORAD_CAT_ID === 'number' 
      ? raw.NORAD_CAT_ID 
      : parseInt(String(raw.NORAD_CAT_ID), 10) || 0;

    const epochStr = raw.EPOCH;
    const epochDate = new Date(epochStr);
    const now = new Date();
    const daysSinceEpoch = Math.max(0, (now.getTime() - epochDate.getTime()) / (1000 * 60 * 60 * 24));

    const sma = parseFloat(String(raw.SEMIMAJOR_AXIS || 0));
    const apogeeAlt = parseFloat(String(raw.APOAPSIS || 0));
    const perigeeAlt = parseFloat(String(raw.PERIAPSIS || 0));
    const inclination = parseFloat(String(raw.INCLINATION || 0));
    const eccentricity = parseFloat(String(raw.ECCENTRICITY || 0));
    const period = parseFloat(String(raw.PERIOD || 0));

    // Determine orbit regime based on altitude
    let orbitRegime: 'LEO' | 'MEO' | 'GEO' | 'HEO' = 'LEO';
    if (apogeeAlt > 35000 && perigeeAlt > 35000) {
      orbitRegime = 'GEO';
    } else if (apogeeAlt > 2000 && perigeeAlt > 2000) {
      orbitRegime = 'MEO';
    } else if (eccentricity > 0.25) {
      orbitRegime = 'HEO';
    }

    // Determine object type
    const rawType = (raw.OBJECT_TYPE || '').toUpperCase();
    let objectType: 'PAYLOAD' | 'ROCKET_BODY' | 'DEBRIS' | 'UNKNOWN' = 'UNKNOWN';
    if (rawType.includes('PAYLOAD')) objectType = 'PAYLOAD';
    else if (rawType.includes('ROCKET') || rawType.includes('BODY')) objectType = 'ROCKET_BODY';
    else if (rawType.includes('DEBRIS')) objectType = 'DEBRIS';

    // Maneuverability flag (payloads in active LEO/GEO often possess propulsion)
    const isManoeuvrable = objectType === 'PAYLOAD' && daysSinceEpoch < 180;

    const rcsStr = (raw.RCS_SIZE || '').toUpperCase();
    let rcsSize: 'LARGE' | 'MEDIUM' | 'SMALL' | 'UNKNOWN' = 'UNKNOWN';
    if (rcsStr.includes('LARGE')) rcsSize = 'LARGE';
    else if (rcsStr.includes('MEDIUM')) rcsSize = 'MEDIUM';
    else if (rcsStr.includes('SMALL')) rcsSize = 'SMALL';

    return {
      noradId,
      name: (raw.OBJECT_NAME || `OBJECT ${noradId}`).trim(),
      intlDes: (raw.OBJECT_ID || 'N/A').trim(),
      objectType,
      epochUtc: epochStr,
      semiMajorAxisKm: Number(sma.toFixed(2)),
      apogeeKm: Number(apogeeAlt.toFixed(2)),
      perigeeKm: Number(perigeeAlt.toFixed(2)),
      inclinationDeg: Number(inclination.toFixed(2)),
      eccentricity: Number(eccentricity.toFixed(6)),
      periodMin: Number(period.toFixed(2)),
      raanDeg: Number(parseFloat(String(raw.RA_OF_ASC_NODE || 0)).toFixed(2)),
      argOfPericenterDeg: Number(parseFloat(String(raw.ARG_OF_PERICENTER || 0)).toFixed(2)),
      meanAnomalyDeg: Number(parseFloat(String(raw.MEAN_ANOMALY || 0)).toFixed(2)),
      meanMotionRevsPerDay: Number(parseFloat(String(raw.MEAN_MOTION || 0)).toFixed(4)),
      bstar: Number(parseFloat(String(raw.BSTAR || 0)).toExponential(4)),
      rcsSize,
      orbitRegime,
      isManoeuvrable,
      daysSinceEpoch: Number(daysSinceEpoch.toFixed(1)),
      sourceProvider: 'SPACE_TRACK',
      sourceRecordTimestamp: epochStr,
      retrievalTimestamp: new Date().toISOString(),
    };
  }

  public clearCache() {
    this.cache.clear();
  }
}

export const spaceTrackClient = new SpaceTrackClient();
