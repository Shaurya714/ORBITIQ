/**
 * ORBITIQ - CelesTrak API Client
 * 
 * Implements official CelesTrak GP API access:
 * Endpoint: https://celestrak.org/NORAD/elements/gp.php
 * Format: JSON (CCSDS OMM GP standard)
 * 
 * Supports:
 * - Query by GROUP (stations, active, visual, last-30-days, starlink, etc.)
 * - Query by CATNR (NORAD Catalog ID or comma-separated list)
 * - Query by NAME
 * - Data validation, mathematical derivation, and normalization
 * - In-memory caching with 120-minute TTL to respect CelesTrak service guidelines
 */

import type { UnifiedOrbitalObject, ProviderStatus, ProviderStatusCode } from './types';

const EARTH_RADIUS_KM = 6378.137;
const EARTH_MU_KM3_S2 = 398600.4418; // Standard gravitational parameter

export interface CelesTrakGpRaw {
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
  ELEMENT_SET_NO?: string | number;
  REV_AT_EPOCH?: string | number;
}

interface CacheEntry {
  data: UnifiedOrbitalObject[];
  timestamp: number;
}

export class CelesTrakClient {
  private baseUrl: string = 'https://celestrak.org/NORAD/elements/gp.php';
  private defaultGroup: string = 'stations';
  private currentGroup: string = 'stations';
  private status: ProviderStatusCode = 'STANDBY';
  private statusMessage: string = 'CelesTrak public GP gateway ready. No credentials required.';
  private lastSyncTimeUtc: string | null = null;

  // In-memory cache (TTL: 120 minutes per CelesTrak guidelines)
  private cache: Map<string, CacheEntry> = new Map();
  private cacheTtlMs: number = 120 * 60 * 1000;

  constructor() {
    const envGroup = process.env.CELESTRAK_DEFAULT_GROUP;
    if (envGroup) {
      this.defaultGroup = envGroup.trim().toLowerCase();
      this.currentGroup = this.defaultGroup;
    }
  }

  public getStatus(): ProviderStatus {
    const cachedCount = this.getAllCachedObjectsCount();
    return {
      id: 'celestrak',
      name: 'CelesTrak (Public GP API)',
      status: this.status,
      isConfigured: true, // CelesTrak does not require credentials
      message: this.statusMessage,
      lastSyncUtc: this.lastSyncTimeUtc,
      cachedEntriesCount: cachedCount,
      requiresAuth: false,
      currentGroup: this.currentGroup,
    };
  }

  private getAllCachedObjectsCount(): number {
    const uniqueIds = new Set<number>();
    for (const entry of this.cache.values()) {
      for (const obj of entry.data) {
        uniqueIds.add(obj.noradId);
      }
    }
    return uniqueIds.size;
  }

  /**
   * Fetch GP orbital elements from CelesTrak
   */
  public async fetchGpData(options: {
    group?: string;
    catnr?: number | string;
    name?: string;
    bypassCache?: boolean;
  } = {}): Promise<UnifiedOrbitalObject[]> {
    const group = options.group || (!options.catnr && !options.name ? this.currentGroup : undefined);
    const catnr = options.catnr ? options.catnr.toString().trim() : undefined;
    const name = options.name ? options.name.trim() : undefined;

    // Build URL query parameters
    const params = new URLSearchParams();
    if (group) params.set('GROUP', group.toLowerCase());
    if (catnr) params.set('CATNR', catnr);
    if (name) params.set('NAME', name);
    params.set('FORMAT', 'json');

    const cacheKey = params.toString();
    const now = Date.now();

    // Check cache
    if (!options.bypassCache && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (now - cached.timestamp < this.cacheTtlMs) {
        return cached.data;
      }
    }

    const queryUrl = `${this.baseUrl}?${params.toString()}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(queryUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'ORBITIQ-Aerospace-Platform/2.1 (contact: orbitiq@flight-ops.space)',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        this.status = 'RATE_LIMITED';
        this.statusMessage = 'CelesTrak rate limit reached. Serving cached entries.';
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!.data;
        throw new Error('CelesTrak rate limited (HTTP 429). Please wait before querying again.');
      }

      if (!response.ok) {
        this.status = 'NETWORK_ERROR';
        this.statusMessage = `CelesTrak HTTP error ${response.status} (${response.statusText})`;
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!.data;
        throw new Error(`CelesTrak query failed: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      let rawList: any;
      try {
        rawList = JSON.parse(text);
      } catch (parseErr) {
        // CelesTrak returns plain text "No GP data found" when no matching records exist
        if (text.includes('No GP data found') || text.trim() === '') {
          this.status = 'CONNECTED';
          this.statusMessage = `Query executed successfully (0 objects found for query).`;
          return [];
        }
        throw new Error(`Invalid JSON returned from CelesTrak: ${text.slice(0, 100)}`);
      }

      if (!Array.isArray(rawList)) {
        if (typeof rawList === 'object' && rawList !== null && rawList.NORAD_CAT_ID) {
          rawList = [rawList];
        } else {
          return [];
        }
      }

      // Validate and normalize all records
      const normalizedList: UnifiedOrbitalObject[] = [];
      const retrievalTime = new Date().toISOString();

      for (const item of rawList) {
        const norm = this.normalizeRecord(item, retrievalTime);
        if (norm) {
          normalizedList.push(norm);
        }
      }

      // Update cache & status
      this.cache.set(cacheKey, { data: normalizedList, timestamp: now });
      if (group) this.currentGroup = group;
      this.status = 'CONNECTED';
      this.statusMessage = `CelesTrak online. Ingested ${normalizedList.length} objects for query.`;
      this.lastSyncTimeUtc = retrievalTime;

      return normalizedList;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        this.status = 'NETWORK_ERROR';
        this.statusMessage = 'CelesTrak query timed out after 15 seconds.';
      } else {
        this.status = 'NETWORK_ERROR';
        this.statusMessage = err.message || 'CelesTrak connection error.';
      }

      // Preserve last-known-good cache
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!.data;
      }
      return [];
    }
  }

  /**
   * Validate raw CelesTrak OMM/GP record and compute missing physical orbital parameters
   */
  private normalizeRecord(raw: CelesTrakGpRaw, retrievalTimestamp: string): UnifiedOrbitalObject | null {
    if (!raw.NORAD_CAT_ID || !raw.OBJECT_NAME || !raw.EPOCH) {
      return null;
    }

    const noradId = parseInt(raw.NORAD_CAT_ID.toString(), 10);
    if (isNaN(noradId) || noradId <= 0) return null;

    const meanMotion = parseFloat(raw.MEAN_MOTION?.toString() || '0');
    const eccentricity = parseFloat(raw.ECCENTRICITY?.toString() || '0');
    const inclination = parseFloat(raw.INCLINATION?.toString() || '0');
    const raan = parseFloat(raw.RA_OF_ASC_NODE?.toString() || '0');
    const argOfPericenter = parseFloat(raw.ARG_OF_PERICENTER?.toString() || '0');
    const meanAnomaly = parseFloat(raw.MEAN_ANOMALY?.toString() || '0');
    const bstar = parseFloat(raw.BSTAR?.toString() || '0');

    if (meanMotion <= 0) return null;

    // Calculate Semi-Major Axis (km): a = (mu / n^2)^(1/3)
    let semiMajorAxisKm: number;
    if (raw.SEMIMAJOR_AXIS) {
      semiMajorAxisKm = parseFloat(raw.SEMIMAJOR_AXIS.toString());
    } else {
      const meanMotionRadSec = (meanMotion * 2 * Math.PI) / 86400;
      semiMajorAxisKm = Math.pow(EARTH_MU_KM3_S2 / Math.pow(meanMotionRadSec, 2), 1 / 3);
    }

    // Calculate Apogee & Perigee Altitudes (km)
    let apogeeKm: number;
    let perigeeKm: number;
    if (raw.APOAPSIS && raw.PERIAPSIS) {
      apogeeKm = parseFloat(raw.APOAPSIS.toString());
      perigeeKm = parseFloat(raw.PERIAPSIS.toString());
    } else {
      apogeeKm = semiMajorAxisKm * (1 + eccentricity) - EARTH_RADIUS_KM;
      perigeeKm = semiMajorAxisKm * (1 - eccentricity) - EARTH_RADIUS_KM;
    }

    // Period in minutes
    const periodMin = raw.PERIOD ? parseFloat(raw.PERIOD.toString()) : 1440 / meanMotion;

    // Determine Orbit Regime
    let regime: 'LEO' | 'MEO' | 'GEO' | 'HEO' = 'LEO';
    if (perigeeKm < 2000) {
      regime = 'LEO';
    } else if (perigeeKm >= 35000 && eccentricity < 0.05) {
      regime = 'GEO';
    } else if (eccentricity > 0.25) {
      regime = 'HEO';
    } else {
      regime = 'MEO';
    }

    // Determine Object Type from name and standard ID
    let objectType: 'PAYLOAD' | 'ROCKET_BODY' | 'DEBRIS' | 'UNKNOWN' = 'PAYLOAD';
    const nameUpper = raw.OBJECT_NAME.toUpperCase();
    if (nameUpper.includes('DEB') || nameUpper.includes('DEBRIS') || nameUpper.includes('FRAGMENT')) {
      objectType = 'DEBRIS';
    } else if (nameUpper.includes('R/B') || nameUpper.includes('ROCKET') || nameUpper.includes('STAGE')) {
      objectType = 'ROCKET_BODY';
    } else if (raw.OBJECT_TYPE) {
      const typeStr = raw.OBJECT_TYPE.toUpperCase();
      if (typeStr.includes('PAYLOAD')) objectType = 'PAYLOAD';
      else if (typeStr.includes('ROCKET')) objectType = 'ROCKET_BODY';
      else if (typeStr.includes('DEBRIS')) objectType = 'DEBRIS';
    }

    // Calculate Days Since Epoch
    let daysSinceEpoch = 0;
    try {
      const epochTime = new Date(raw.EPOCH).getTime();
      const now = Date.now();
      daysSinceEpoch = Math.max(0, (now - epochTime) / (1000 * 60 * 60 * 24));
    } catch {
      daysSinceEpoch = 0;
    }

    return {
      noradId,
      name: raw.OBJECT_NAME.trim(),
      intlDes: (raw.OBJECT_ID || '').trim(),
      objectType,
      epochUtc: raw.EPOCH,
      semiMajorAxisKm: Number(semiMajorAxisKm.toFixed(3)),
      apogeeKm: Number(apogeeKm.toFixed(2)),
      perigeeKm: Number(perigeeKm.toFixed(2)),
      inclinationDeg: Number(inclination.toFixed(4)),
      eccentricity: Number(eccentricity.toFixed(7)),
      periodMin: Number(periodMin.toFixed(2)),
      raanDeg: Number(raan.toFixed(4)),
      argOfPericenterDeg: Number(argOfPericenter.toFixed(4)),
      meanAnomalyDeg: Number(meanAnomaly.toFixed(4)),
      meanMotionRevsPerDay: Number(meanMotion.toFixed(8)),
      bstar: Number(bstar.toExponential(4)),
      rcsSize: 'MEDIUM',
      orbitRegime: regime,
      isManoeuvrable: objectType === 'PAYLOAD' && regime !== 'HEO',
      daysSinceEpoch: Number(daysSinceEpoch.toFixed(2)),
      sourceProvider: 'CELESTRAK',
      sourceRecordTimestamp: raw.EPOCH,
      retrievalTimestamp,
    };
  }

  public clearCache() {
    this.cache.clear();
    this.status = 'STANDBY';
    this.statusMessage = 'CelesTrak cache cleared.';
  }
}
