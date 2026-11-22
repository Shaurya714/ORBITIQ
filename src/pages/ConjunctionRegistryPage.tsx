import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConjunction } from '../context/ConjunctionContext';
import { RiskBadge, StatusBadge } from '../components/common/StatusBadge';
import { DataNotice } from '../components/common/DataNotice';
import { formatDistance, formatScientific, formatCountdownTca } from '../utils/formatters';
import { exportConjunctionsToCsv } from '../utils/exportUtils';
import type { ConjunctionEvent } from '../types/conjunction';
import { 
  Search, 
  ArrowUpDown, 
  Download, 
  RotateCcw, 
  ShieldAlert, 
  Database, 
  RefreshCw, 
  ArrowRight 
} from 'lucide-react';

export const ConjunctionRegistryPage: React.FC = () => {
  const { 
    conjunctions, 
    selectConjunction, 
    spaceTrackStatus,
    celestrakStatus,
    setIsConnectModalOpen, 
    screenConjunctions,
    isLoadingData,
    dataError,
    retryFetchData
  } = useConjunction();
  const navigate = useNavigate();

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedTcaWindow, setSelectedTcaWindow] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'URGENCY' | 'RISK' | 'MISS_DISTANCE' | 'VELOCITY'>('URGENCY');
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('ASC');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const isConnected = spaceTrackStatus.status === 'CONNECTED' || celestrakStatus.status === 'CONNECTED';

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedRisk('ALL');
    setSelectedStatus('ALL');
    setSelectedTcaWindow('ALL');
    setSortBy('URGENCY');
    setSortDirection('ASC');
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await screenConjunctions(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  const hasActiveFilters = searchQuery !== '' || selectedRisk !== 'ALL' || selectedStatus !== 'ALL' || selectedTcaWindow !== 'ALL';

  // Filter and sort logic
  const filteredConjunctions = useMemo(() => {
    return conjunctions.filter((c) => {
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchesPrimary = c.primaryObject.name.toLowerCase().includes(query) || c.primaryObject.noradId.toString().includes(query);
        const matchesSecondary = c.secondaryObject.name.toLowerCase().includes(query) || c.secondaryObject.noradId.toString().includes(query);
        const matchesId = c.id.toLowerCase().includes(query) || c.cdmId.toLowerCase().includes(query);
        if (!matchesPrimary && !matchesSecondary && !matchesId) return false;
      }

      if (selectedRisk !== 'ALL' && c.riskLevel !== selectedRisk) return false;
      if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;

      if (selectedTcaWindow === '12H' && c.hoursToTca > 12) return false;
      if (selectedTcaWindow === '24H' && c.hoursToTca > 24) return false;
      if (selectedTcaWindow === '48H' && c.hoursToTca > 48) return false;
      if (selectedTcaWindow === '72H' && c.hoursToTca > 72) return false;

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'URGENCY':
          comparison = a.hoursToTca - b.hoursToTca;
          break;
        case 'RISK':
          comparison = b.collisionProbability - a.collisionProbability;
          break;
        case 'MISS_DISTANCE':
          comparison = a.missDistanceM - b.missDistanceM;
          break;
        case 'VELOCITY':
          comparison = (b.geometry?.relativeVelocityKms ?? 0) - (a.geometry?.relativeVelocityKms ?? 0);
          break;
      }
      return sortDirection === 'ASC' ? comparison : -comparison;
    });
  }, [conjunctions, searchQuery, selectedRisk, selectedStatus, selectedTcaWindow, sortBy, sortDirection]);

  const handleSelectAndAnalyze = (c: ConjunctionEvent) => {
    selectConjunction(c.id);
    navigate(`/conjunctions/${c.id}`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 font-sans">
      {/* Page Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#E2E1DC]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#252A30] font-sans">
              Close Approach Registry
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#EAF0E9] text-[#52745C] border border-[#52745C]/30 rounded-md font-sans">
              {conjunctions.length} Events Screened
            </span>
          </div>
          <p className="text-xs text-[#626A73] mt-1">
            Screened catalog of orbital close-approach events and Conjunction Data Messages (CDMs).
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoadingData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#252A30] bg-[#FFFFFF] hover:bg-[#FAF9F6] border border-[#E2E1DC] rounded-md transition-colors disabled:opacity-50 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isLoadingData ? 'animate-spin text-[#52745C]' : 'text-[#858B92]'}`} />
              <span>{isRefreshing ? 'Screening...' : 'Screen New Pairs'}</span>
            </button>
          )}

          {conjunctions.length > 0 && (
            <button
              type="button"
              onClick={() => exportConjunctionsToCsv(filteredConjunctions)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#252A30] bg-[#FFFFFF] hover:bg-[#FAF9F6] border border-[#E2E1DC] rounded-md transition-colors font-sans shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#858B92]" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Connection Notice */}
      <DataNotice 
        message={
          isConnected
            ? `Active Orbital Screening: Evaluated ${conjunctions.length} close-approach encounters across monitored assets from ${celestrakStatus.status === 'CONNECTED' ? 'CelesTrak' : ''}${celestrakStatus.status === 'CONNECTED' && spaceTrackStatus.status === 'CONNECTED' ? ' and ' : ''}${spaceTrackStatus.status === 'CONNECTED' ? 'Space-Track' : ''}.`
            : "Conjunction registry is operating in standby mode. Connect Space-Track or select a CelesTrak group to screen close approaches."
        } 
      />

      {/* Search & Filter Controls */}
      <div className="bg-[#FFFFFF] rounded-md border border-[#E2E1DC] p-4 space-y-3 font-sans shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#858B92] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search satellite, NORAD ID, or CDM..."
              disabled={conjunctions.length === 0}
              className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E2E1DC] bg-[#FAF9F6] rounded-md font-mono-telemetry text-[#252A30] placeholder-[#858B92] focus:outline-none focus:border-[#52745C] disabled:opacity-50"
            />
          </div>

          {/* Risk Level Filter */}
          <div>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              disabled={conjunctions.length === 0}
              className="w-full px-2.5 py-1.5 text-xs border border-[#E2E1DC] bg-[#FAF9F6] rounded-md font-mono-telemetry text-[#252A30] focus:outline-none focus:border-[#52745C] disabled:opacity-50"
            >
              <option value="ALL">All Risk Levels</option>
              <option value="CRITICAL">Critical (Pc &gt; 10⁻⁴)</option>
              <option value="HIGH">High (10⁻⁵ ≤ Pc &lt; 10⁻⁴)</option>
              <option value="MODERATE">Moderate (10⁻⁶ ≤ Pc &lt; 10⁻⁵)</option>
              <option value="LOW">Low (Pc &lt; 10⁻⁶)</option>
            </select>
          </div>

          {/* Event Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={conjunctions.length === 0}
              className="w-full px-2.5 py-1.5 text-xs border border-[#E2E1DC] bg-[#FAF9F6] rounded-md font-mono-telemetry text-[#252A30] focus:outline-none focus:border-[#52745C] disabled:opacity-50"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING_ANALYSIS">Pending Review</option>
              <option value="MANOEUVRE_PLANNED">Manoeuvre Planned</option>
              <option value="SCREENED_SAFE">Screened Safe</option>
              <option value="MONITORING">Monitoring</option>
            </select>
          </div>

          {/* TCA Window Filter */}
          <div>
            <select
              value={selectedTcaWindow}
              onChange={(e) => setSelectedTcaWindow(e.target.value)}
              disabled={conjunctions.length === 0}
              className="w-full px-2.5 py-1.5 text-xs border border-[#E2E1DC] bg-[#FAF9F6] rounded-md font-mono-telemetry text-[#252A30] focus:outline-none focus:border-[#52745C] disabled:opacity-50"
            >
              <option value="ALL">All TCA Horizons</option>
              <option value="12H">&lt; 12 Hours to TCA</option>
              <option value="24H">&lt; 24 Hours to TCA</option>
              <option value="48H">&lt; 48 Hours to TCA</option>
              <option value="72H">&lt; 72 Hours to TCA</option>
            </select>
          </div>
        </div>

        {/* Secondary Toolbar: Sorting and Active Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E1DC] text-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#626A73] uppercase tracking-wider font-mono-telemetry flex items-center gap-1">
              <ArrowUpDown className="w-3 h-3 text-[#858B92]" />
              <span>Sort:</span>
            </span>
            <div className="inline-flex rounded-md border border-[#E2E1DC] bg-[#FAF9F6] p-0.5 text-xs font-mono-telemetry">
              {[
                { key: 'URGENCY', label: 'TCA Urgency' },
                { key: 'RISK', label: 'Probability (Pc)' },
                { key: 'MISS_DISTANCE', label: 'Miss Distance' },
                { key: 'VELOCITY', label: 'Velocity' },
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  disabled={conjunctions.length === 0}
                  onClick={() => {
                    if (sortBy === s.key) {
                      setSortDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC');
                    } else {
                      setSortBy(s.key as any);
                      setSortDirection('ASC');
                    }
                  }}
                  className={`px-2 py-0.5 rounded transition-colors disabled:opacity-50 cursor-pointer ${
                    sortBy === s.key
                      ? 'bg-[#EAF0E9] text-[#52745C] font-semibold border border-[#52745C]/30'
                      : 'text-[#626A73] hover:text-[#252A30]'
                  }`}
                >
                  {s.label} {sortBy === s.key ? (sortDirection === 'ASC' ? '▲' : '▼') : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 text-xs text-[#626A73] hover:text-[#52745C] font-medium font-mono-telemetry transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading State when initial fetch is running */}
      {isLoadingData && conjunctions.length === 0 ? (
        <div className="bg-[#FFFFFF] rounded-md border border-[#E2E1DC] p-12 text-center space-y-4 shadow-xs">
          <RefreshCw className="w-8 h-8 text-[#52745C] animate-spin mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#252A30] font-mono-telemetry">
              Querying Orbital Gateway & Screening Trajectories...
            </h3>
            <p className="text-xs text-[#626A73] max-w-sm mx-auto">
              Retrieving live ephemeris from active providers and evaluating close-approach geometry.
            </p>
          </div>
        </div>
      ) : dataError && conjunctions.length === 0 ? (
        /* Error State with Retry Mechanism */
        <div className="bg-[#FFFFFF] rounded-md border border-[#C65D5D]/30 p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#C65D5D]/10 border border-[#C65D5D]/30 flex items-center justify-center text-[#C65D5D] mx-auto">
            <ShieldAlert className="w-6 h-6 text-[#C65D5D]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#252A30] font-mono-telemetry">
              Orbital Gateway Connection Error
            </h3>
            <p className="text-xs text-[#C65D5D] max-w-md mx-auto leading-relaxed font-mono-telemetry">
              {dataError}
            </p>
            <p className="text-xs text-[#626A73] max-w-md mx-auto pt-1">
              Ensure the gateway server is active on port 8000. You can retry the connection below.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => retryFetchData()}
              className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#52745C] hover:bg-[#64866D] rounded-md transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Connection</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 text-xs font-medium text-[#252A30] bg-[#FAF9F6] hover:bg-[#F0EFEA] border border-[#E2E1DC] rounded-md transition-colors shadow-xs"
            >
              Return to Overview
            </button>
          </div>
        </div>
      ) : conjunctions.length === 0 ? (
        /* Empty State when no conjunctions are loaded */
        <div className="bg-[#FFFFFF] rounded-md border border-[#E2E1DC] p-8 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#E2E1DC] flex items-center justify-center text-[#52745C] mx-auto">
            <ShieldAlert className="w-6 h-6 text-[#52745C]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#252A30] font-mono-telemetry">
              No Close Approach Events Ingested
            </h3>
            <p className="text-xs text-[#626A73] max-w-md mx-auto leading-relaxed">
              {isConnected
                ? 'Your orbital gateway is active, but no close-approach pairs have been generated yet. Click "Screen New Pairs" above to screen the catalog.'
                : 'The conjunction registry is in standby mode. Connect your Space-Track account or load CelesTrak to screen for close-approach events.'}
            </p>
          </div>

          <div className="p-4 bg-[#FAF9F6] rounded-md border border-[#E2E1DC] max-w-lg mx-auto text-left text-xs font-mono-telemetry space-y-2 text-[#252A30]">
            <div className="font-bold text-[#252A30] uppercase text-xs pb-1 border-b border-[#E2E1DC] flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-[#52745C]" />
              <span>Real Telemetry Parameters Available:</span>
            </div>
            <ul className="space-y-1 text-[#626A73] list-disc list-inside font-sans">
              <li>Primary operational satellite & secondary threat identifiers</li>
              <li>Time of Closest Approach (TCA) and live countdown timer</li>
              <li>Radial, in-track, and cross-track miss distance components</li>
              <li>Collision Probability (Pc) and covariance ellipse geometry</li>
              <li>Direct hand-off to Manoeuvre Simulator for collision avoidance</li>
            </ul>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            {isConnected ? (
              <button
                type="button"
                onClick={handleRefresh}
                className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#52745C] hover:bg-[#64866D] rounded-md transition-colors cursor-pointer shadow-xs"
              >
                Screen Space-Track Catalog
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#52745C] hover:bg-[#64866D] rounded-md transition-colors cursor-pointer shadow-xs"
              >
                Connect Space-Track Now
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-4 py-2 text-xs font-medium text-[#252A30] bg-[#FAF9F6] hover:bg-[#F0EFEA] border border-[#E2E1DC] rounded-md transition-colors shadow-xs"
            >
              Return to Overview
            </button>
          </div>
        </div>
      ) : filteredConjunctions.length === 0 ? (
        /* Empty State when filters exclude all records */
        <div className="bg-[#FFFFFF] rounded-md border border-[#E2E1DC] p-8 text-center space-y-3 shadow-xs font-sans">
          <div className="text-sm font-bold text-[#252A30] font-mono-telemetry">
            No Matching Close Approach Events
          </div>
          <p className="text-xs text-[#626A73] max-w-sm mx-auto">
            No events match the active search criteria or risk/TCA filters.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-3.5 py-1.5 text-xs font-medium text-[#52745C] bg-[#EAF0E9] hover:bg-[#52745C] hover:text-[#FFFFFF] rounded-md transition-colors font-mono-telemetry cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        </div>
      ) : (
        /* Real Conjunctions Table */
        <div className="bg-[#FFFFFF] rounded-md border border-[#E2E1DC] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF9F6] text-[#626A73] font-mono-telemetry uppercase text-xs border-b border-[#E2E1DC]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Event ID</th>
                  <th className="py-2.5 px-3 font-semibold">Primary Object</th>
                  <th className="py-2.5 px-3 font-semibold">Secondary Object</th>
                  <th className="py-2.5 px-3 font-semibold text-right">TCA (Countdown)</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Miss Distance</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Pc</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Risk Level</th>
                  <th className="py-2.5 px-3 font-semibold text-center">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E1DC] font-mono-telemetry text-[#252A30]">
                {filteredConjunctions.map((c) => {
                  const radialDelta = c.geometry?.radialDeltaM ?? 0;
                  const inTrackDelta = c.geometry?.inTrackDeltaM ?? 0;

                  return (
                    <tr
                      key={c.id}
                      onClick={() => handleSelectAndAnalyze(c)}
                      className="hover:bg-[#FAF9F6] cursor-pointer transition-colors group"
                    >
                      <td className="py-2.5 px-3 font-semibold text-[#252A30] group-hover:text-[#52745C] transition-colors">
                        {c.id}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#252A30]">{c.primaryObject.name}</div>
                        <div className="text-[10px] text-[#858B92]">NORAD {c.primaryObject.noradId}</div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-[#252A30]">{c.secondaryObject.name}</div>
                        <div className="text-[10px] text-[#858B92]">NORAD {c.secondaryObject.noradId}</div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="font-bold text-[#252A30]">{formatCountdownTca(c.hoursToTca)}</div>
                        <div className="text-[10px] text-[#858B92]">{c.hoursToTca.toFixed(1)}h remaining</div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="font-semibold text-[#252A30]">{formatDistance(c.missDistanceM)}</div>
                        <div className="text-[10px] text-[#858B92]">
                          Δr: {radialDelta.toFixed(0)}m &bull; Δt: {inTrackDelta.toFixed(0)}m
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`font-bold ${
                          c.riskLevel === 'CRITICAL' ? 'text-[#C65D5D]' :
                          c.riskLevel === 'HIGH' ? 'text-[#C47C61]' :
                          c.riskLevel === 'MODERATE' ? 'text-[#C58A3C]' : 'text-[#52745C]'
                        }`}>
                          {formatScientific(c.collisionProbability)}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <RiskBadge level={c.riskLevel} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectAndAnalyze(c);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#52745C] hover:text-[#FFFFFF] hover:bg-[#52745C] border border-[#52745C]/40 rounded transition-colors cursor-pointer"
                        >
                          <span>Analyze</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
