/**
 * ORBITIQ - Centralized API & Orbital Data Provider Configuration
 * 
 * Prepares the frontend for future integration of our two primary orbital data providers:
 * 1. CelesTrak (Orbital object data, catalog info, orbital elements / GP data)
 * 2. Space-Track (Orbital catalog, CDM conjunction messages)
 * 
 * Note: Credentials and external API queries will be securely proxied through the
 * backend API gateway (VITE_API_BASE_URL). No private secrets are exposed to the browser.
 */

export type ProviderConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'ERROR';

export interface DataProviderInfo {
  id: string;
  name: string;
  role: string;
  status: ProviderConnectionStatus;
  statusMessage: string;
  endpointUrl: string;
  documentationUrl: string;
  supportedFormats: string[];
}

export const API_CONFIG = {
  // Backend API Gateway
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',

  // Provider 1: CelesTrak
  celestrak: {
    name: 'CelesTrak',
    role: 'Satellite Catalog, General Perturbations (GP), and Orbital Elements',
    defaultBaseUrl: 'https://celestrak.org',
    documentationUrl: 'https://celestrak.org/NORAD/documentation/',
    formats: ['JSON', 'CSV', 'TLE', 'XML'],
  },

  // Provider 2: Space-Track
  spaceTrack: {
    name: 'Space-Track.org',
    role: 'Conjunction Data Messages (CDMs), SATCAT, and Trajectory Covariance',
    defaultBaseUrl: 'https://www.space-track.org',
    documentationUrl: 'https://www.space-track.org/documentation',
    formats: ['CCSDS CDM 508.0-B-1', 'JSON', 'XML', 'CSV'],
  },
} as const;

export const INITIAL_DATA_PROVIDERS: DataProviderInfo[] = [
  {
    id: 'spacetrack',
    name: API_CONFIG.spaceTrack.name,
    role: API_CONFIG.spaceTrack.role,
    status: 'DISCONNECTED',
    statusMessage: 'Awaiting backend gateway configuration. No credentials stored on client.',
    endpointUrl: `${API_CONFIG.baseUrl}/spacetrack/cdm`,
    documentationUrl: API_CONFIG.spaceTrack.documentationUrl,
    supportedFormats: [...API_CONFIG.spaceTrack.formats],
  },
  {
    id: 'celestrak',
    name: API_CONFIG.celestrak.name,
    role: API_CONFIG.celestrak.role,
    status: 'DISCONNECTED',
    statusMessage: 'Awaiting backend gateway configuration.',
    endpointUrl: `${API_CONFIG.baseUrl}/celestrak/gp`,
    documentationUrl: API_CONFIG.celestrak.documentationUrl,
    supportedFormats: [...API_CONFIG.celestrak.formats],
  },
];
