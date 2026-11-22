import React, { useState } from 'react';
import { useConjunction } from '../../context/ConjunctionContext';
import { Modal } from './Modal';
import { 
  Database, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  LogOut, 
  ShieldCheck, 
  Globe2 
} from 'lucide-react';

export const SpaceTrackConnectModal: React.FC = () => {
  const { 
    isConnectModalOpen, 
    setIsConnectModalOpen, 
    spaceTrackStatus,
    celestrakStatus,
    activeGroup,
    selectCelesTrakGroup,
    connectAccount, 
    disconnectAccount, 
    isConnecting,
    refreshAllData,
    isLoadingData
  } = useConjunction();

  const [activeTab, setActiveTab] = useState<'SPACETRACK' | 'CELESTRAK'>('SPACETRACK');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isStConnected = spaceTrackStatus.status === 'CONNECTED';
  const isCtConnected = celestrakStatus.status === 'CONNECTED';

  const celestrakGroups = [
    { id: 'stations', name: 'Space Stations (ISS, Tiangong, Crew Dragon)', desc: 'Human-tended research platforms & support vessels' },
    { id: 'active', name: 'Active Satellites', desc: 'All currently operational Earth-orbiting satellites' },
    { id: 'visual', name: 'Brightest Visual Objects', desc: 'High-visibility visual tracking targets' },
    { id: 'last-30-days', name: 'Recent Launches (Last 30 Days)', desc: 'Newly deployed orbital payloads and upper stages' },
    { id: 'starlink', name: 'Starlink Constellation', desc: 'Mega-constellation LEO communications satellites' },
  ];

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both your Space-Track username and password.');
      return;
    }

    const success = await connectAccount(username, password);
    if (!success) {
      setErrorMessage(spaceTrackStatus.message || 'Authentication failed. Please verify credentials.');
    } else {
      setPassword('');
    }
  };

  const handleDisconnect = async () => {
    await disconnectAccount();
    setUsername('');
    setPassword('');
  };

  return (
    <Modal
      isOpen={isConnectModalOpen}
      onClose={() => setIsConnectModalOpen(false)}
      title="Orbital Data Providers & Credentials"
      subtitle="Configure CelesTrak public GP feed and Space-Track.org authenticated stream"
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs font-sans">
        {/* Provider Selection Tabs */}
        <div className="flex border-b border-[#E2E1DC] -mt-1">
          <button
            type="button"
            onClick={() => setActiveTab('SPACETRACK')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors font-mono-telemetry ${
              activeTab === 'SPACETRACK'
                ? 'border-[#52745C] text-[#52745C] bg-[#EAF0E9]/50 font-semibold'
                : 'border-transparent text-[#626A73] hover:text-[#252A30]'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Space-Track.org</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isStConnected ? 'bg-[#52745C]' : 'bg-[#858B92]'}`}></span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CELESTRAK')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors font-mono-telemetry ${
              activeTab === 'CELESTRAK'
                ? 'border-[#52745C] text-[#52745C] bg-[#EAF0E9]/50 font-semibold'
                : 'border-transparent text-[#626A73] hover:text-[#252A30]'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>CelesTrak (Public GP)</span>
            <span className={`w-1.5 h-1.5 rounded-full ${isCtConnected ? 'bg-[#52745C]' : 'bg-[#858B92]'}`}></span>
          </button>
        </div>

        {/* Tab 1: Space-Track */}
        {activeTab === 'SPACETRACK' && (
          <div className="space-y-4">
            {/* Space-Track Status Card */}
            <div className={`p-3 rounded-md border flex items-start gap-2.5 ${
              isStConnected 
                ? 'bg-[#EAF0E9] border-[#52745C]/30 text-[#52745C]'
                : spaceTrackStatus.status === 'CONNECTION_FAILED'
                ? 'bg-[#C65D5D]/10 border-[#C65D5D]/30 text-[#C65D5D]'
                : 'bg-[#FAF9F6] border-[#E2E1DC] text-[#626A73]'
            }`}>
              {isStConnected ? (
                <CheckCircle2 className="w-4 h-4 text-[#52745C] shrink-0 mt-0.5" />
              ) : spaceTrackStatus.status === 'CONNECTION_FAILED' ? (
                <AlertCircle className="w-4 h-4 text-[#C65D5D] shrink-0 mt-0.5" />
              ) : (
                <Database className="w-4 h-4 text-[#52745C] shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-semibold font-mono-telemetry uppercase text-[11px] text-[#252A30]">
                  Status: {spaceTrackStatus.status}
                </div>
                <p className="text-[11px] text-[#626A73] mt-0.5 leading-snug">
                  {spaceTrackStatus.message}
                </p>
                {isStConnected && spaceTrackStatus.maskedIdentity && (
                  <div className="text-[11px] font-mono-telemetry text-[#52745C] mt-1">
                    Account: {spaceTrackStatus.maskedIdentity} ({spaceTrackStatus.cachedEntriesCount} queries cached)
                  </div>
                )}
              </div>
            </div>

            {isStConnected ? (
              <div className="space-y-3 pt-1">
                <p className="text-[#626A73] leading-relaxed text-xs">
                  Your Space-Track session is active. Live GP orbital elements and catalog data are being queried through your local backend proxy (<code className="text-[#52745C] font-mono-telemetry">http://localhost:8000/api</code>).
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-[#E2E1DC]">
                  <button
                    type="button"
                    onClick={refreshAllData}
                    disabled={isLoadingData}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#252A30] bg-[#FAF9F6] hover:bg-[#F0EFEA] border border-[#E2E1DC] rounded-md transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin text-[#52745C]' : ''}`} />
                    <span>Sync All Catalogs</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleDisconnect}
                      className="px-3 py-1.5 text-xs font-semibold text-[#C65D5D] bg-[#C65D5D]/10 hover:bg-[#C65D5D]/20 border border-[#C65D5D]/30 rounded-md transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Disconnect Session</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConnectModalOpen(false)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#626A73] bg-[#FAF9F6] hover:bg-[#F0EFEA] border border-[#E2E1DC] rounded-md transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="space-y-3">
                <p className="text-[#626A73] text-xs leading-relaxed">
                  Enter your Space-Track.org login credentials. The backend gateway authenticates with <code className="text-[#252A30] font-mono-telemetry">https://www.space-track.org/ajaxauth/login</code> and stores the session cookie strictly in backend memory.
                </p>

                {errorMessage && (
                  <div className="p-2.5 rounded-md bg-[#C65D5D]/10 border border-[#C65D5D]/30 text-[#C65D5D] text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[#252A30] font-semibold mb-1 text-xs">
                    Space-Track Username (Email)
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="operator@aerospace.org"
                    required
                    className="w-full px-3 py-1.5 bg-[#FAF9F6] border border-[#E2E1DC] rounded-md text-[#252A30] text-xs font-mono-telemetry focus:border-[#52745C] focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[#252A30] font-semibold mb-1 text-xs">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    required
                    className="w-full px-3 py-1.5 bg-[#FAF9F6] border border-[#E2E1DC] rounded-md text-[#252A30] text-xs font-mono-telemetry focus:border-[#52745C] focus:outline-hidden"
                  />
                </div>

                <div className="p-2 rounded-md bg-[#FAF9F6] border border-[#E2E1DC] text-[11px] text-[#626A73] flex items-start gap-1.5 leading-snug">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#52745C] shrink-0 mt-0.5" />
                  <span>
                    Alternatively, you can set <code className="text-[#252A30]">SPACETRACK_USER</code> and <code className="text-[#252A30]">SPACETRACK_PASSWORD</code> in your local <code className="text-[#252A30]">.env</code> file.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E1DC]">
                  <button
                    type="button"
                    onClick={() => setIsConnectModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-[#626A73] hover:text-[#252A30]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isConnecting}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#52745C] hover:bg-[#64866D] rounded-md shadow-xs transition-colors disabled:opacity-50 font-mono-telemetry cursor-pointer"
                  >
                    {isConnecting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Key className="w-3.5 h-3.5" />
                    )}
                    <span>{isConnecting ? 'Authenticating...' : 'Connect Space-Track'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Tab 2: CelesTrak */}
        {activeTab === 'CELESTRAK' && (
          <div className="space-y-4">
            <div className="p-3 rounded-md border bg-[#FAF9F6] border-[#E2E1DC] flex items-start gap-2.5">
              <Globe2 className="w-4 h-4 text-[#52745C] shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold font-mono-telemetry uppercase text-[11px] text-[#252A30]">
                  CelesTrak Public GP Stream: {celestrakStatus.status}
                </div>
                <p className="text-[11px] text-[#626A73] mt-0.5 leading-snug">
                  Endpoint: <code className="text-[#52745C] font-mono-telemetry">https://celestrak.org/NORAD/elements/gp.php</code>. No credentials required.
                </p>
                <div className="text-[11px] font-mono-telemetry text-[#52745C] mt-1">
                  Cached: {celestrakStatus.cachedEntriesCount} orbital objects &bull; Current Group: <span className="text-[#252A30] font-bold uppercase">{activeGroup}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[#252A30] font-semibold mb-1.5 text-xs font-mono-telemetry uppercase tracking-wider">
                Select Orbital Group to Ingest:
              </label>
              <div className="space-y-2">
                {celestrakGroups.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => selectCelesTrakGroup(g.id)}
                    className={`w-full p-2.5 rounded-md text-left border transition-all flex items-center justify-between ${
                      activeGroup === g.id
                        ? 'bg-[#EAF0E9] border-[#52745C] text-[#252A30] shadow-xs'
                        : 'bg-[#FAF9F6] border-[#E2E1DC] text-[#626A73] hover:bg-[#F0EFEA]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs font-mono-telemetry flex items-center gap-2">
                        <span>{g.name}</span>
                        {activeGroup === g.id && (
                          <span className="text-[10px] text-[#52745C] bg-[#FFFFFF] border border-[#52745C]/30 px-1.5 py-0.2 rounded font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#626A73] mt-0.5 font-sans">{g.desc}</div>
                    </div>
                    <span className="text-xs text-[#52745C] font-mono-telemetry shrink-0 ml-3">
                      {activeGroup === g.id ? 'Ingested' : 'Switch & Ingest →'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E1DC]">
              <button
                type="button"
                onClick={() => setIsConnectModalOpen(false)}
                className="px-3 py-1.5 text-xs font-semibold text-[#626A73] bg-[#FAF9F6] hover:bg-[#F0EFEA] border border-[#E2E1DC] rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
