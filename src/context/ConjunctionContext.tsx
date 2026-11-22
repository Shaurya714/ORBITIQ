import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ConjunctionEvent, EventStatus } from '../types/conjunction';
import type { ManoeuvreConfig, SimulationResult, SavedSimulationRecord } from '../types/simulation';
import type { SavedReport } from '../types/report';
import { 
  OrbitalDataService, 
  type UnifiedGatewayStatus, 
  type ProviderStatus, 
  type UnifiedOrbitalObject 
} from '../services/orbitalDataService';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface ConjunctionContextType {
  conjunctions: ConjunctionEvent[];
  catalogObjects: UnifiedOrbitalObject[];
  gpObjects: UnifiedOrbitalObject[]; // Backward compatibility alias
  selectedConjunctionId: string | null;
  selectedConjunction: ConjunctionEvent | null;
  simulationConfig: ManoeuvreConfig;
  simulationResult: SimulationResult | null;
  savedSimulations: SavedSimulationRecord[];
  savedReports: SavedReport[];
  unifiedStatus: UnifiedGatewayStatus;
  spaceTrackStatus: ProviderStatus;
  celestrakStatus: ProviderStatus;
  activeGroup: string;
  isLoadingData: boolean;
  dataError: string | null;
  isConnecting: boolean;
  toasts: ToastItem[];
  isConnectModalOpen: boolean;

  // Actions
  setIsConnectModalOpen: (open: boolean) => void;
  selectConjunction: (id: string | null) => void;
  updateConjunctionStatus: (id: string, status: EventStatus, notes?: string) => void;
  updateSimulationConfig: (config: Partial<ManoeuvreConfig>) => void;
  setSimulationResult: (result: SimulationResult | null) => void;
  saveReport: (report: SavedReport) => void;
  deleteReport: (id: string) => void;
  saveSimulationRecord: (record: SavedSimulationRecord) => void;
  deleteSavedSimulation: (id: string) => void;
  addToast: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  dismissToast: (id: string) => void;
  checkStatus: () => Promise<void>;
  retryFetchData: () => Promise<void>;
  connectAccount: (user: string, pass: string) => Promise<boolean>;
  disconnectAccount: () => Promise<void>;
  refreshSpaceTrackData: () => Promise<void>;
  refreshAllData: () => Promise<void>;
  selectCelesTrakGroup: (group: string) => Promise<void>;
  screenConjunctions: (forceRescreen?: boolean) => Promise<void>;
}

const DEFAULT_MANOEUVRE_CONFIG: ManoeuvreConfig = {
  direction: 'PROGRADE',
  deltaVMps: 0.35,
  timingRevsBeforeTca: 1.0,
  propulsionType: 'CHEMICAL_IMPULSIVE',
  specificImpulseSec: 220,
  dryMassKg: 1200,
};

const DEFAULT_UNIFIED_STATUS: UnifiedGatewayStatus = {
  overallStatus: 'STANDBY',
  message: 'Connecting to orbital gateway...',
  totalCachedObjects: 0,
  providers: {
    spacetrack: {
      id: 'spacetrack',
      name: 'Space-Track.org (18th SDS)',
      status: 'NOT_CONFIGURED',
      isConfigured: false,
      message: 'Awaiting connection test',
      lastSyncUtc: null,
      cachedEntriesCount: 0,
      requiresAuth: true,
    },
    celestrak: {
      id: 'celestrak',
      name: 'CelesTrak (Public GP API)',
      status: 'STANDBY',
      isConfigured: true,
      message: 'Awaiting public GP connection',
      lastSyncUtc: null,
      cachedEntriesCount: 0,
      requiresAuth: false,
      currentGroup: 'stations',
    },
  },
  lastSyncUtc: null,
};

const ConjunctionContext = createContext<ConjunctionContextType | undefined>(undefined);

const LOCAL_STORAGE_REPORTS_KEY = 'orbitiq_reports_v2';
const LOCAL_STORAGE_SIMULATIONS_KEY = 'orbitiq_simulations_v2';
const LOCAL_STORAGE_SELECTED_CONJ_KEY = 'orbitiq_selected_conj_v2';

export const ConjunctionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conjunctions, setConjunctions] = useState<ConjunctionEvent[]>([]);
  const [catalogObjects, setCatalogObjects] = useState<UnifiedOrbitalObject[]>([]);
  const [activeGroup, setActiveGroup] = useState<string>('stations');
  
  const [selectedConjunctionId, setSelectedConjunctionId] = useState<string | null>(() => {
    return localStorage.getItem(LOCAL_STORAGE_SELECTED_CONJ_KEY) || null;
  });

  const [simulationConfig, setSimulationConfig] = useState<ManoeuvreConfig>(DEFAULT_MANOEUVRE_CONFIG);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const [savedSimulations, setSavedSimulations] = useState<SavedSimulationRecord[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_SIMULATIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [savedReports, setSavedReports] = useState<SavedReport[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_REPORTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [unifiedStatus, setUnifiedStatus] = useState<UnifiedGatewayStatus>(DEFAULT_UNIFIED_STATUS);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Sync reports
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_REPORTS_KEY, JSON.stringify(savedReports));
    } catch (e) {
      console.warn('Failed to persist reports', e);
    }
  }, [savedReports]);

  // Sync simulations
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SIMULATIONS_KEY, JSON.stringify(savedSimulations));
    } catch (e) {
      console.warn('Failed to persist simulations', e);
    }
  }, [savedSimulations]);

  // Sync selected conjunction
  useEffect(() => {
    try {
      if (selectedConjunctionId) {
        localStorage.setItem(LOCAL_STORAGE_SELECTED_CONJ_KEY, selectedConjunctionId);
      } else {
        localStorage.removeItem(LOCAL_STORAGE_SELECTED_CONJ_KEY);
      }
    } catch (e) {
      console.warn('Failed to sync selected conjunction ID', e);
    }
  }, [selectedConjunctionId]);

  const addToast = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newToast: ToastItem = {
      id: `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      message,
      type,
    };
    setToasts(prev => [...prev.slice(-4), newToast]);
  };

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Check Unified Status and load live data
  const checkStatus = useCallback(async () => {
    try {
      setIsLoadingData(true);
      setDataError(null);
      const status = await OrbitalDataService.getUnifiedStatus();
      setUnifiedStatus(status);

      // Fetch unified catalog and screened close approaches
      const [objects, conjList] = await Promise.all([
        OrbitalDataService.fetchUnifiedCatalog({ group: activeGroup, limit: 60 }),
        OrbitalDataService.fetchConjunctions(),
      ]);

      setCatalogObjects(objects);
      setConjunctions(conjList);
      setDataError(null);
    } catch (err: any) {
      console.warn('[ConjunctionContext] Status check notice:', err.message);
      setDataError(err.message || 'Failed to connect to orbital data gateway.');
    } finally {
      setIsLoadingData(false);
    }
  }, [activeGroup]);

  // Initial load
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  // Switch CelesTrak Group
  const selectCelesTrakGroup = async (group: string) => {
    setIsLoadingData(true);
    setActiveGroup(group);
    try {
      const objects = await OrbitalDataService.fetchCelesTrakGroup(group);
      setCatalogObjects(objects);
      // Re-screen conjunctions with the new group objects
      const conjList = await OrbitalDataService.fetchConjunctions(true);
      setConjunctions(conjList);
      const updatedStatus = await OrbitalDataService.getUnifiedStatus();
      setUnifiedStatus(updatedStatus);
      addToast('Catalog Updated', `Ingested ${objects.length} objects from CelesTrak group "${group}"`, 'success');
    } catch (err: any) {
      addToast('Group Update Error', err.message, 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Connect Space-Track with credentials
  const connectAccount = async (user: string, pass: string): Promise<boolean> => {
    setIsConnecting(true);
    try {
      const result = await OrbitalDataService.connectSpaceTrack(user, pass);
      setIsConnecting(false);

      if (result.success) {
        addToast('Space-Track Connected', `Authenticated successfully as ${result.status.maskedIdentity || 'operator'}`, 'success');
        setIsConnectModalOpen(false);
        // Refresh catalog across both providers
        await refreshAllData();
        return true;
      } else {
        addToast('Connection Failed', result.message, 'error');
        return false;
      }
    } catch (err: any) {
      setIsConnecting(false);
      addToast('Connection Error', err.message, 'error');
      return false;
    }
  };

  const disconnectAccount = async () => {
    try {
      await OrbitalDataService.disconnectSpaceTrack();
      await checkStatus();
      addToast('Space-Track Disconnected', 'Session cleared. Operating on CelesTrak public feed.', 'info');
    } catch (err: any) {
      addToast('Error', err.message, 'error');
    }
  };

  // Full Catalog Sync
  const refreshAllData = async () => {
    setIsLoadingData(true);
    try {
      const syncResult = await OrbitalDataService.syncUnifiedCatalog();
      if (syncResult.success) {
        const [objects, conjList, updatedStatus] = await Promise.all([
          OrbitalDataService.fetchUnifiedCatalog({ group: activeGroup, limit: 60 }),
          OrbitalDataService.fetchConjunctions(true),
          OrbitalDataService.getUnifiedStatus(),
        ]);
        setCatalogObjects(objects);
        setConjunctions(conjList);
        setUnifiedStatus(updatedStatus);
        addToast('Orbital Providers Synchronized', syncResult.message, 'success');
      } else {
        addToast('Sync Notice', syncResult.message, 'warning');
      }
    } catch (err: any) {
      addToast('Sync Failed', err.message, 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  const screenConjunctions = async (forceRescreen: boolean = true) => {
    setIsLoadingData(true);
    try {
      const conjList = await OrbitalDataService.fetchConjunctions(forceRescreen);
      setConjunctions(conjList);
      addToast('Screening Complete', `Evaluated ${conjList.length} close-approach encounters`, 'info');
    } catch (err: any) {
      addToast('Screening Error', err.message, 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  const selectedConjunction = conjunctions.find(c => c.id === selectedConjunctionId) || null;

  const selectConjunction = (id: string | null) => {
    setSelectedConjunctionId(id);
    if (id) {
      const found = conjunctions.find(c => c.id === id);
      if (found) {
        addToast('Encounter Loaded', `${found.primaryObject.name} vs ${found.secondaryObject.name}`, 'info');
      }
    }
  };

  const updateConjunctionStatus = (id: string, status: EventStatus, notes?: string) => {
    setConjunctions(prev =>
      prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status,
            operatorNotes: notes !== undefined ? notes : c.operatorNotes,
            lastUpdatedUtc: new Date().toISOString(),
          };
        }
        return c;
      })
    );
    addToast('Status Updated', `Encounter status set to ${status}`, 'success');
  };

  const updateSimulationConfig = (updates: Partial<ManoeuvreConfig>) => {
    setSimulationConfig(prev => ({ ...prev, ...updates }));
  };

  const saveSimulationRecord = (record: SavedSimulationRecord) => {
    setSavedSimulations(prev => [record, ...prev]);
    addToast('Simulation Plan Saved', `Plan "${record.name}" saved to archive`, 'success');
  };

  const deleteSavedSimulation = (id: string) => {
    setSavedSimulations(prev => prev.filter(s => s.id !== id));
    addToast('Plan Removed', 'Simulation record deleted', 'info');
  };

  const saveReport = (report: SavedReport) => {
    setSavedReports(prev => {
      const idx = prev.findIndex(r => r.id === report.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = report;
        return updated;
      }
      return [report, ...prev];
    });
    addToast('Report Saved', `Report "${report.title}" archived successfully`, 'success');
  };

  const deleteReport = (id: string) => {
    setSavedReports(prev => prev.filter(r => r.id !== id));
    addToast('Report Removed', 'Report record removed from archive', 'info');
  };

  return (
    <ConjunctionContext.Provider
      value={{
        conjunctions,
        catalogObjects,
        gpObjects: catalogObjects, // Backward compatibility
        selectedConjunctionId,
        selectedConjunction,
        simulationConfig,
        simulationResult,
        savedSimulations,
        savedReports,
        unifiedStatus,
        spaceTrackStatus: unifiedStatus.providers.spacetrack,
        celestrakStatus: unifiedStatus.providers.celestrak,
        activeGroup,
        isLoadingData,
        dataError,
        isConnecting,
        toasts,
        isConnectModalOpen,
        setIsConnectModalOpen,
        selectConjunction,
        updateConjunctionStatus,
        updateSimulationConfig,
        setSimulationResult,
        saveReport,
        deleteReport,
        saveSimulationRecord,
        deleteSavedSimulation,
        addToast,
        dismissToast,
        checkStatus,
        retryFetchData: checkStatus,
        connectAccount,
        disconnectAccount,
        refreshSpaceTrackData: refreshAllData,
        refreshAllData,
        selectCelesTrakGroup,
        screenConjunctions,
      }}
    >
      {children}
    </ConjunctionContext.Provider>
  );
};

export const useConjunction = () => {
  const context = useContext(ConjunctionContext);
  if (!context) {
    throw new Error('useConjunction must be used within a ConjunctionProvider');
  }
  return context;
};

export const useConjunctions = useConjunction;
