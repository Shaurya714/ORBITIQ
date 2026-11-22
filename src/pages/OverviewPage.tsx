import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConjunction } from '../context/ConjunctionContext';
import { 
  ShieldAlert, 
  Sliders, 
  Layers, 
  FileText, 
  ArrowRight, 
  RefreshCw, 
  Satellite, 
  AlertCircle, 
  ExternalLink, 
  Globe2, 
  Search,
  Radio,
  CheckCircle2,
  Key
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    unifiedStatus,
    spaceTrackStatus, 
    celestrakStatus, 
    catalogObjects, 
    activeGroup,
    selectCelesTrakGroup,
    setIsConnectModalOpen, 
    refreshAllData,
    conjunctions,
    savedReports,
    isLoadingData
  } = useConjunction();

  const [searchFilter, setSearchFilter] = useState('');
  const [selectedRegime, setSelectedRegime] = useState('ALL');

  const isStConnected = spaceTrackStatus.status === 'CONNECTED';
  const isCtConnected = celestrakStatus.status === 'CONNECTED';

  const celestrakGroups = [
    { id: 'stations', label: 'Space Stations' },
    { id: 'active', label: 'Active Satellites' },
    { id: 'visual', label: 'Brightest Targets' },
    { id: 'last-30-days', label: 'Recent Launches' },
    { id: 'starlink', label: 'Starlink' },
  ];

  const filteredObjects = useMemo(() => {
    return catalogObjects.filter((obj) => {
      if (searchFilter.trim() !== '') {
        const q = searchFilter.toLowerCase().trim();
        const matchesName = obj.name.toLowerCase().includes(q);
        const matchesId = obj.noradId.toString().includes(q);
        const matchesIntl = obj.intlDes.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesIntl) return false;
      }
      if (selectedRegime !== 'ALL' && obj.orbitRegime !== selectedRegime) {
        return false;
      }
      return true;
    });
  }, [catalogObjects, searchFilter, selectedRegime]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12 font-sans">
      
      {/* ===================================================================== */}
      {/* 1. OPERATIONS CONSOLE HEADER — CLEAN SANS-SERIF HIERARCHY             */}
      {/* ===================================================================== */}
      <div 
        className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b"
        style={{ borderColor: 'var(--border-default)' }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span 
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider font-sans"
              style={{ color: 'var(--accent-primary)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--accent-primary)' }}></span>
              Orbital Safety & Conjunction Gateway
            </span>
          </div>

          <h1 
            className="text-2xl sm:text-3xl font-bold tracking-tight font-sans"
            style={{ color: 'var(--text-primary)' }}
          >
            Operations Console
          </h1>

          <p className="text-xs font-sans max-w-2xl" style={{ color: 'var(--text-secondary)' }}>
            Real-time orbital tracking, multi-catalog conjunction screening, and physical collision avoidance decision support.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={refreshAllData}
            disabled={isLoadingData}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium font-sans border rounded-md transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-surface-panel)',
              borderColor: 'var(--border-default)',
              color: 'var(--text-primary)',
            }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} style={{ color: 'var(--accent-primary)' }} />
            <span>{isLoadingData ? 'Syncing...' : 'Sync Feeds'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsConnectModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold font-sans text-white rounded-md transition-colors shadow-2xs cursor-pointer"
            style={{
              backgroundColor: 'var(--accent-primary)',
            }}
          >
            <span>Manage Providers</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. DUAL ORBITAL DATA PROVIDER LAYER — FLATTENED & UNNESTED            */}
      {/* ===================================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
            <h2 
              className="text-xs font-bold uppercase tracking-wider font-sans"
              style={{ color: 'var(--text-primary)' }}
            >
              Orbital Data Providers
            </h2>
            <span 
              className="text-[11px] font-sans font-medium px-2 py-0.5 rounded border inline-flex items-center gap-1"
              style={{
                backgroundColor: 'var(--accent-soft)',
                borderColor: 'var(--accent-primary)',
                color: 'var(--accent-primary)',
              }}
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>{unifiedStatus.overallStatus}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsConnectModalOpen(true)}
            className="text-xs font-sans hover:underline inline-flex items-center gap-1 cursor-pointer font-medium"
            style={{ color: 'var(--accent-primary)' }}
          >
            <span>Configure APIs</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Clean Two-Column Horizontal Feed Grid (No Nested Card-in-Card) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Provider 1: CelesTrak */}
          <div 
            className="p-4 rounded-md border space-y-3 transition-colors"
            style={{
              backgroundColor: 'var(--bg-surface-panel)',
              borderColor: 'var(--border-default)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                <span className="font-semibold text-xs font-sans" style={{ color: 'var(--text-primary)' }}>
                  CelesTrak (Public GP API)
                </span>
              </div>

              <span 
                className="inline-flex items-center gap-1.5 text-[11px] font-sans font-medium px-2 py-0.5 rounded border"
                style={{
                  backgroundColor: isCtConnected ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                  borderColor: isCtConnected ? 'var(--accent-primary)' : 'var(--border-default)',
                  color: isCtConnected ? 'var(--accent-primary)' : 'var(--text-secondary)',
                }}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isCtConnected ? 'bg-[#52745C]' : 'bg-[#858B92]'}`}></span>
                <span>{isCtConnected ? 'Live Feed' : celestrakStatus.status}</span>
              </span>
            </div>

            <p className="text-xs font-sans leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              Automated ingest of General Perturbations (GP) Keplerian element sets. No authentication credentials required.
            </p>

            {/* Ingest Group Selector */}
            <div className="pt-2 border-t flex flex-wrap items-center gap-1.5" style={{ borderColor: 'var(--border-subtle)' }}>
              <span className="text-[10px] uppercase font-sans font-semibold mr-1" style={{ color: 'var(--text-muted)' }}>
                Target Group:
              </span>
              {celestrakGroups.map((g) => {
                const isActive = activeGroup === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => selectCelesTrakGroup(g.id)}
                    className={`px-2.5 py-1 rounded text-xs font-sans transition-colors cursor-pointer ${
                      isActive ? 'font-semibold border shadow-2xs' : 'hover:opacity-80'
                    }`}
                    style={{
                      backgroundColor: isActive ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                      borderColor: isActive ? 'var(--accent-primary)' : 'var(--border-default)',
                      color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Provider 2: Space-Track.org */}
          <div 
            className="p-4 rounded-md border space-y-3 transition-colors flex flex-col justify-between"
            style={{
              backgroundColor: 'var(--bg-surface-panel)',
              borderColor: 'var(--border-default)',
            }}
          >
            <div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  <span className="font-semibold text-xs font-sans" style={{ color: 'var(--text-primary)' }}>
                    Space-Track.org (18th SDS)
                  </span>
                </div>

                <span 
                  className="inline-flex items-center gap-1.5 text-[11px] font-sans font-medium px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: isStConnected ? 'var(--accent-soft)' : 'rgba(197, 138, 60, 0.1)',
                    borderColor: isStConnected ? 'var(--accent-primary)' : 'rgba(197, 138, 60, 0.3)',
                    color: isStConnected ? 'var(--accent-primary)' : 'var(--status-warning)',
                  }}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isStConnected ? 'bg-[#52745C]' : 'bg-[#C58A3C]'}`}></span>
                  <span>{isStConnected ? 'Session Active' : 'Credentials Required'}</span>
                </span>
              </div>

              <p className="text-xs font-sans leading-relaxed mt-2" style={{ color: 'var(--text-secondary)' }}>
                Official USSPACECOM satellite catalog and Conjunction Data Messages (CDMs) with authenticated credentials.
              </p>
            </div>

            <div 
              className="pt-2 border-t flex items-center justify-between text-xs font-sans"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                {isStConnected ? `${spaceTrackStatus.cachedEntriesCount} queries cached` : 'Credentials stored in local session'}
              </span>

              <button
                type="button"
                onClick={() => setIsConnectModalOpen(true)}
                className="px-2.5 py-1 text-xs font-sans font-medium rounded border transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--accent-primary)',
                }}
              >
                {isStConnected ? 'Account Details' : 'Connect Account'}
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* ===================================================================== */}
      {/* 3. OPERATIONAL WORKSPACES — ASYMMETRIC, PURPOSE-BUILT ENTRY SURFACES   */}
      {/* ===================================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 
            className="text-xs font-bold uppercase tracking-wider font-sans"
            style={{ color: 'var(--text-primary)' }}
          >
            Mission Operations Workspaces
          </h2>
          <span className="text-xs font-sans" style={{ color: 'var(--text-muted)' }}>
            Direct access to screening, simulation, and mission documentation
          </span>
        </div>

        {/* Primary Asymmetric Workspaces */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Workspace A: Close Encounters & Conjunction Registry */}
          <div 
            onClick={() => navigate('/conjunctions')}
            className="p-5 rounded-md border transition-all cursor-pointer group flex flex-col justify-between shadow-2xs hover:shadow-xs"
            style={{
              backgroundColor: 'var(--bg-surface-panel)',
              borderColor: 'var(--border-default)',
            }}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-md flex items-center justify-center border"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-sans uppercase font-bold tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                      Detection & Screening
                    </span>
                    <h3 className="text-base font-bold font-sans group-hover:text-[#52745C] transition-colors" style={{ color: 'var(--text-primary)' }}>
                      Close Approach Registry
                    </h3>
                  </div>
                </div>

                <span 
                  className="px-2.5 py-1 rounded text-xs font-mono-telemetry font-bold border"
                  style={{
                    backgroundColor: conjunctions.length > 0 ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                    borderColor: conjunctions.length > 0 ? 'var(--accent-primary)' : 'var(--border-default)',
                    color: conjunctions.length > 0 ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                >
                  {conjunctions.length > 0 ? `${conjunctions.length} Screened Events` : 'Ready to Screen'}
                </span>
              </div>

              <p className="text-xs font-sans leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Screen detected close approaches, evaluate 3D miss distance vectors (B-plane & RTN), and monitor collision probabilities across active satellites.
              </p>

              {/* Telemetry highlights */}
              <div className="flex items-center gap-4 text-[11px] font-mono-telemetry pt-1" style={{ color: 'var(--text-muted)' }}>
                <span>&bull; B-plane Miss Vectors</span>
                <span>&bull; Collision Probability (Pc)</span>
                <span>&bull; Time to Closest Approach</span>
              </div>
            </div>

            <div 
              className="pt-4 mt-4 border-t flex items-center justify-between text-xs font-sans"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <span className="text-[11px] font-mono-telemetry" style={{ color: 'var(--text-muted)' }}>Route: /conjunctions</span>
              <span className="font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform" style={{ color: 'var(--accent-primary)' }}>
                <span>Open Registry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Workspace B: Orbital Collision Simulator & Manoeuvre Engine */}
          <div 
            onClick={() => navigate('/simulator')}
            className="p-5 rounded-md border transition-all cursor-pointer group flex flex-col justify-between shadow-2xs hover:shadow-xs"
            style={{
              backgroundColor: 'var(--bg-surface-panel)',
              borderColor: 'var(--border-default)',
            }}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-9 h-9 rounded-md flex items-center justify-center border"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      borderColor: 'var(--border-default)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-sans uppercase font-bold tracking-wider block" style={{ color: 'var(--text-muted)' }}>
                      Mitigation & Avoidance Engine
                    </span>
                    <h3 className="text-base font-bold font-sans group-hover:text-[#52745C] transition-colors" style={{ color: 'var(--text-primary)' }}>
                      Orbital Collision Simulator
                    </h3>
                  </div>
                </div>

                <span 
                  className="px-2.5 py-1 rounded text-xs font-mono-telemetry font-bold border"
                  style={{
                    backgroundColor: 'var(--accent-soft)',
                    borderColor: 'var(--accent-primary)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  RK4 Physics Integrator
                </span>
              </div>

              <p className="text-xs font-sans leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Model two-object relative encounters, estimate hypervelocity impact kinetic energy (Ek in MJ/TNT), and calculate optimal avoidance burn vectors.
              </p>

              {/* Telemetry highlights */}
              <div className="flex items-center gap-4 text-[11px] font-mono-telemetry pt-1" style={{ color: 'var(--text-muted)' }}>
                <span>&bull; Two-Object Relative Frame</span>
                <span>&bull; Impact Energy (Ek)</span>
                <span>&bull; Phasing vs Radial Burns</span>
              </div>
            </div>

            <div 
              className="pt-4 mt-4 border-t flex items-center justify-between text-xs font-sans"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <span className="text-[11px] font-mono-telemetry" style={{ color: 'var(--text-muted)' }}>Route: /simulator</span>
              <span className="font-semibold inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform" style={{ color: 'var(--accent-primary)' }}>
                <span>Launch Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

        </div>

        {/* Secondary Utility Workspaces Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Secondary Risk */}
          <div
            onClick={() => navigate('/secondary-risk')}
            className="p-3.5 rounded-md border flex items-center justify-between transition-colors cursor-pointer group shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-surface-panel)',
              borderColor: 'var(--border-default)',
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-7 h-7 rounded flex items-center justify-center border"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--accent-primary)',
                }}
              >
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold font-sans group-hover:text-[#52745C] transition-colors" style={{ color: 'var(--text-primary)' }}>
                  Secondary Risk Screening
                </h4>
                <p className="text-[11px] font-sans" style={{ color: 'var(--text-secondary)' }}>
                  Screen post-burn orbits for secondary conjunctions across forward 48h.
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#858B92] group-hover:text-[#52745C] transition-colors shrink-0" />
          </div>

          {/* Reports Archive */}
          <div
            onClick={() => navigate('/reports')}
            className="p-3.5 rounded-md border flex items-center justify-between transition-colors cursor-pointer group shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-surface-panel)',
              borderColor: 'var(--border-default)',
            }}
          >
            <div className="flex items-center gap-3">
              <div 
                className="w-7 h-7 rounded flex items-center justify-center border"
                style={{
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--accent-primary)',
                }}
              >
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold font-sans group-hover:text-[#52745C] transition-colors" style={{ color: 'var(--text-primary)' }}>
                  Decision Reports Archive
                </h4>
                <p className="text-[11px] font-sans" style={{ color: 'var(--text-secondary)' }}>
                  Export formal Go/No-Go avoidance documentation and CCSDS CDMs ({savedReports.length} saved).
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-[#858B92] group-hover:text-[#52745C] transition-colors shrink-0" />
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* 4. MONITORED ORBITAL CATALOG TABLE — OPEN SCIENTIFIC LAYOUT           */}
      {/* ===================================================================== */}
      <section className="space-y-3">
        <div 
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b"
          style={{ borderColor: 'var(--border-default)' }}
        >
          <div>
            <h2 
              className="text-xs font-bold uppercase tracking-wider font-sans flex items-center gap-2"
              style={{ color: 'var(--text-primary)' }}
            >
              <Satellite className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
              <span>Monitored Orbital Catalog</span>
              <span className="text-xs font-normal font-sans" style={{ color: 'var(--text-muted)' }}>
                ({catalogObjects.length} active objects retrieved)
              </span>
            </h2>
            <p className="text-xs font-sans mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Live orbital elements populated from {activeGroup ? `CelesTrak "${activeGroup}" feed` : 'orbital providers'}.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/conjunctions')}
            className="inline-flex items-center gap-1.5 text-xs font-sans hover:underline font-medium cursor-pointer self-start sm:self-auto"
            style={{ color: 'var(--accent-primary)' }}
          >
            <span>Screen Catalog for Conjunctions</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 text-[#858B92] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search by satellite name, NORAD ID, or international designator..."
              className="w-full pl-8 pr-3 py-1.5 border rounded-md font-sans text-xs focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-surface-panel)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            />
          </div>

          <div className="relative">
            <select
              value={selectedRegime}
              onChange={(e) => setSelectedRegime(e.target.value)}
              className="w-full px-2.5 py-1.5 border rounded-md font-sans text-xs focus:outline-none"
              style={{
                backgroundColor: 'var(--bg-surface-panel)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-primary)',
              }}
            >
              <option value="ALL">All Orbit Regimes</option>
              <option value="LEO">LEO (Low Earth Orbit)</option>
              <option value="MEO">MEO (Medium Earth Orbit)</option>
              <option value="GEO">GEO (Geostationary)</option>
              <option value="HEO">HEO (Highly Elliptical)</option>
            </select>
          </div>
        </div>

        {/* Table of Ingested Real Objects */}
        {filteredObjects.length > 0 ? (
          <div 
            className="rounded-md border overflow-x-auto shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-surface-panel)',
              borderColor: 'var(--border-default)',
            }}
          >
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr 
                  className="border-b text-xs font-sans uppercase tracking-wider"
                  style={{
                    backgroundColor: 'var(--bg-surface-elevated)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <th className="py-2.5 px-3">Object Name</th>
                  <th className="py-2.5 px-3">NORAD ID</th>
                  <th className="py-2.5 px-3">Source Provider</th>
                  <th className="py-2.5 px-3">Inclination</th>
                  <th className="py-2.5 px-3">Period</th>
                  <th className="py-2.5 px-3">Perigee / Apogee</th>
                  <th className="py-2.5 px-3">Regime</th>
                  <th className="py-2.5 px-3">Epoch</th>
                </tr>
              </thead>
              <tbody 
                className="divide-y text-xs"
                style={{ borderColor: 'var(--border-subtle)' }}
              >
                {filteredObjects.slice(0, 8).map((obj) => (
                  <tr 
                    key={obj.noradId} 
                    className="transition-colors hover:bg-[var(--bg-surface-elevated)]"
                  >
                    <td className="py-2.5 px-3 font-semibold font-sans" style={{ color: 'var(--text-primary)' }}>
                      <div>{obj.name}</div>
                      <span className="text-[10px] font-mono-telemetry" style={{ color: 'var(--text-muted)' }}>
                        {obj.intlDes || 'N/A'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono-telemetry font-bold" style={{ color: 'var(--accent-primary)' }}>
                      {obj.noradId}
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span 
                        className="px-2 py-0.5 rounded text-[10px] font-bold border"
                        style={{
                          backgroundColor: obj.sourceProvider === 'CELESTRAK' ? 'var(--accent-soft)' : 'var(--bg-surface-elevated)',
                          borderColor: obj.sourceProvider === 'CELESTRAK' ? 'var(--accent-primary)' : 'var(--border-default)',
                          color: obj.sourceProvider === 'CELESTRAK' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {obj.sourceProvider}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono-telemetry" style={{ color: 'var(--text-primary)' }}>
                      {obj.inclinationDeg.toFixed(2)}&deg;
                    </td>
                    <td className="py-2.5 px-3 font-mono-telemetry" style={{ color: 'var(--text-primary)' }}>
                      {obj.periodMin.toFixed(1)} min
                    </td>
                    <td className="py-2.5 px-3 font-mono-telemetry" style={{ color: 'var(--text-primary)' }}>
                      {Math.round(obj.perigeeKm)} &times; {Math.round(obj.apogeeKm)} km
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span 
                        className="px-2 py-0.5 rounded text-[10px] border"
                        style={{
                          backgroundColor: 'var(--bg-surface-elevated)',
                          borderColor: 'var(--border-default)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {obj.orbitRegime}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-xs font-mono-telemetry" style={{ color: 'var(--text-muted)' }}>
                      {obj.epochUtc ? new Date(obj.epochUtc).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredObjects.length > 8 && (
              <div 
                className="py-2.5 text-center text-xs font-sans border-t"
                style={{
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-muted)',
                }}
              >
                Showing 8 of {filteredObjects.length} active objects. Screen for orbital collision hazards in the{' '}
                <button 
                  onClick={() => navigate('/conjunctions')}
                  className="font-medium hover:underline cursor-pointer"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  Conjunction Registry
                </button>.
              </div>
            )}
          </div>
        ) : (
          <div className="py-10 text-center space-y-3">
            <div 
              className="w-10 h-10 rounded-full border flex items-center justify-center mx-auto"
              style={{
                backgroundColor: 'var(--bg-surface-elevated)',
                borderColor: 'var(--border-default)',
                color: 'var(--text-muted)',
              }}
            >
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold font-sans" style={{ color: 'var(--text-primary)' }}>
              No Matching Catalog Objects Found
            </h3>
            <p className="text-xs font-sans max-w-lg mx-auto leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              No orbital elements matched your current filter. Try resetting search filters or switching the CelesTrak group above.
            </p>
          </div>
        )}
      </section>

    </div>
  );
};
