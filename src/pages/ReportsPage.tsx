import React, { useState, useMemo } from 'react';
import { useConjunction } from '../context/ConjunctionContext';
import { Breadcrumbs } from '../components/layout/Breadcrumbs';
import { RiskBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { DataNotice } from '../components/common/DataNotice';
import type { SavedReport, ReportType } from '../types/report';
import { 
  formatUtcDateTime 
} from '../utils/formatters';
import { 
  exportReportToJson, 
  exportReportToCdmText 
} from '../utils/exportUtils';
import { 
  FileText, 
  Search, 
  Download, 
  Trash2, 
  Eye, 
  Printer, 
  Plus, 
  Calendar, 
  User,
  ShieldCheck,
  FolderOpen
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { savedReports, saveReport, deleteReport } = useConjunction();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'DATE' | 'RISK' | 'ASSET'>('DATE');
  const [sortOrder, setSortOrder] = useState<'DESC' | 'ASC'>('DESC');

  // Modal states
  const [activeReport, setActiveReport] = useState<SavedReport | null>(null);
  const [reportToDelete, setReportToDelete] = useState<SavedReport | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // New report form state
  const [newTitle, setNewTitle] = useState<string>('');
  const [newReportType, setNewReportType] = useState<ReportType>('CONJUNCTION_ASSESSMENT');
  const [newAuthor, setNewAuthor] = useState<string>('Flight Dynamics Specialist');
  const [newPrimaryName, setNewPrimaryName] = useState<string>('');
  const [newSecondaryName, setNewSecondaryName] = useState<string>('');
  const [newSummary, setNewSummary] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');

  const filteredReports = useMemo(() => {
    return savedReports.filter((r) => {
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesRef = r.referenceCode.toLowerCase().includes(q);
        const matchesAsset = r.primaryObjectName.toLowerCase().includes(q) || r.secondaryObjectName.toLowerCase().includes(q);
        if (!matchesTitle && !matchesRef && !matchesAsset) return false;
      }

      if (selectedType !== 'ALL' && r.reportType !== selectedType) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'DATE') {
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'RISK') {
        const score = { CRITICAL: 4, HIGH: 3, MODERATE: 2, LOW: 1 };
        comparison = score[b.riskLevel] - score[a.riskLevel];
      } else if (sortBy === 'ASSET') {
        comparison = a.primaryObjectName.localeCompare(b.primaryObjectName);
      }
      return sortOrder === 'DESC' ? comparison : -comparison;
    });
  }, [savedReports, searchQuery, selectedType, sortBy, sortOrder]);

  const handleConfirmDelete = () => {
    if (reportToDelete) {
      deleteReport(reportToDelete.id);
      if (activeReport?.id === reportToDelete.id) {
        setActiveReport(null);
      }
      setReportToDelete(null);
    }
  };

  const handleCreateReport = (e: React.FormEvent) => {
    e.preventDefault();
    const primaryName = newPrimaryName.trim() || 'PRIMARY_SATELLITE';
    const secondaryName = newSecondaryName.trim() || 'SECONDARY_OBJECT';

    const newReport: SavedReport = {
      id: `REP-${Date.now().toString().slice(-6)}`,
      referenceCode: `ORB-REP-${Date.now().toString().slice(-6)}`,
      title: newTitle || `${primaryName} Assessment Briefing`,
      reportType: newReportType,
      conjunctionId: `MANUAL-${Date.now().toString().slice(-4)}`,
      primaryObjectName: primaryName,
      secondaryObjectName: secondaryName,
      riskLevel: 'LOW',
      author: newAuthor || 'Flight Dynamics Specialist',
      createdAt: new Date().toISOString(),
      summary: newSummary || `Assessment report compiled for ${primaryName} vs ${secondaryName}.`,
      conjunctionSnapshot: {
        id: `MANUAL-${Date.now().toString().slice(-4)}`,
        cdmId: `CDM-MANUAL-${Date.now().toString().slice(-4)}`,
        primaryObject: {
          id: 'SAT-01',
          name: primaryName,
          noradId: 0,
          intlDes: 'N/A',
          type: 'PAYLOAD',
          regime: 'LEO',
          operator: 'Operator',
          country: 'N/A',
          apogeeKm: 500,
          perigeeKm: 500,
          inclinationDeg: 53.0,
          semiMajorAxisKm: 6878,
          periodMin: 95.0,
          rcsM2: 1.0,
          isManoeuvrable: true,
          spanMeters: 2.0,
        },
        secondaryObject: {
          id: 'SAT-02',
          name: secondaryName,
          noradId: 0,
          intlDes: 'N/A',
          type: 'DEBRIS',
          regime: 'LEO',
          operator: 'N/A',
          country: 'N/A',
          apogeeKm: 500,
          perigeeKm: 500,
          inclinationDeg: 53.0,
          semiMajorAxisKm: 6878,
          periodMin: 95.0,
          rcsM2: 0.1,
          isManoeuvrable: false,
          spanMeters: 0.5,
        },
        tcaUtc: new Date().toISOString(),
        daysToTca: 0,
        hoursToTca: 0,
        missDistanceM: 0,
        collisionProbability: 0,
        maxCollisionProbability: 0,
        riskLevel: 'LOW',
        status: 'SCREENED_SAFE',
        geometry: {
          missDistanceTotalM: 0,
          radialDeltaM: 0,
          inTrackDeltaM: 0,
          crossTrackDeltaM: 0,
          relativeVelocityKms: 0,
          approachAngleDeg: 0,
          bPlaneXiM: 0,
          bPlaneZetaM: 0,
          primaryVelocityVector: [0, 0, 0],
          secondaryVelocityVector: [0, 0, 0],
        },
        covariance: {
          sigma1SemiMajorM: 0,
          sigma1SemiMinorM: 0,
          orientationAngleDeg: 0,
          positionUncertaintyPrimaryM: 0,
          positionUncertaintySecondaryM: 0,
          realismScorePercent: 100,
        },
        atmosphericDragIndex: 'NOMINAL',
        solarFluxIndex: 140,
        lastUpdatedUtc: new Date().toISOString(),
        screeningDataSource: 'Operator Ephemeris',
        operatorNotes: newNotes,
        recommendation: 'Documented in manual assessment.',
      },
      operatorNotes: newNotes || 'Nominal assessment log.',
      recommendedAction: 'Archive assessment record.',
      approvalStatus: 'DRAFT',
    };

    saveReport(newReport);
    setIsCreateModalOpen(false);
    // Reset form
    setNewTitle('');
    setNewPrimaryName('');
    setNewSecondaryName('');
    setNewSummary('');
    setNewNotes('');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: 'Overview', to: '/' }, { label: 'Reports & Archive' }]} />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#E2E1DC]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#252A30] font-mono-telemetry uppercase">
              Reports & Archive
            </h1>
            <span className="px-2 py-0.5 text-xs font-semibold bg-[#FAF9F6] text-[#52745C] border border-[#E2E1DC] rounded font-mono-telemetry">
              {savedReports.length} Reports
            </span>
          </div>
          <p className="text-xs text-[#626A73] mt-1 font-mono-telemetry">
            Archive of verified conjunction assessments, manoeuvre plans, and secondary screening audits.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#52745C] hover:bg-[#64866D] text-[#FFFFFF] font-bold rounded shadow-xs transition-colors font-mono-telemetry"
        >
          <Plus className="w-4 h-4 text-[#FFFFFF]" />
          <span>New Assessment Report</span>
        </button>
      </div>

      <DataNotice message="The reports workspace starts clean with zero seeded or fabricated test entries. User-created reports and exported plans persist locally in your browser storage." />

      {/* Filter and Search Bar when reports exist */}
      {savedReports.length > 0 && (
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E2E1DC] p-4 shadow-xs space-y-3 font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#858B92] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reports by title, ID, satellite..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E2E1DC] bg-[#FAF9F6] rounded-md font-mono-telemetry text-[#252A30] placeholder-slate-500 focus:outline-none focus:border-[#52745C]"
              />
            </div>

            <div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-[#E2E1DC] bg-[#FAF9F6] rounded-md font-mono-telemetry text-[#252A30] focus:outline-none focus:border-[#52745C]"
              >
                <option value="ALL">All Report Types</option>
                <option value="CONJUNCTION_ASSESSMENT">Conjunction Assessment</option>
                <option value="MANOEUVRE_PLAN">Manoeuvre Plan</option>
                <option value="SECONDARY_RISK_AUDIT">Secondary Risk Audit</option>
                <option value="EXECUTIVE_BRIEFING">Executive Briefing</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#626A73] font-mono-telemetry uppercase">Sort:</span>
              <div className="inline-flex rounded-md border border-[#E2E1DC] bg-[#FAF9F6] p-0.5 text-xs font-mono-telemetry flex-1">
                {[
                  { key: 'DATE', label: 'Date' },
                  { key: 'RISK', label: 'Risk' },
                  { key: 'ASSET', label: 'Asset' },
                ].map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      if (sortBy === s.key) {
                        setSortOrder(prev => prev === 'DESC' ? 'ASC' : 'DESC');
                      } else {
                        setSortBy(s.key as any);
                        setSortOrder('DESC');
                      }
                    }}
                    className={`flex-1 py-0.5 text-center rounded transition-colors ${
                      sortBy === s.key
                        ? 'bg-[#E2E1DC] text-[#52745C] font-semibold shadow-xs'
                        : 'text-[#626A73] hover:text-[#252A30]'
                    }`}
                  >
                    {s.label} {sortBy === s.key ? (sortOrder === 'DESC' ? '▼' : '▲') : ''}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State when no reports exist */}
      {savedReports.length === 0 ? (
        <div className="bg-[#FFFFFF] rounded-lg border border-[#E2E1DC] p-8 text-center space-y-4 shadow-xs font-sans">
          <div className="w-12 h-12 rounded-full bg-[#FAF9F6] border border-[#E2E1DC] flex items-center justify-center text-[#626A73] mx-auto">
            <FolderOpen className="w-6 h-6 text-[#52745C]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#252A30] font-mono-telemetry">
              No Reports in Archive
            </h3>
            <p className="text-xs text-[#626A73] max-w-md mx-auto leading-relaxed">
              You have not created or archived any conjunction assessment briefings or manoeuvre plans yet. All reports drafted by operators or generated from simulations persist across browser sessions.
            </p>
          </div>

          <div className="p-4 bg-[#FAF9F6] rounded-md border border-[#E2E1DC] max-w-lg mx-auto text-left text-xs font-mono-telemetry space-y-2 text-[#626A73]">
            <div className="font-bold text-[#252A30] uppercase text-[11px] pb-1 border-b border-[#E2E1DC] flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#52745C]" />
              <span>Report Features & Export Capabilities:</span>
            </div>
            <ul className="space-y-1 text-[#626A73] list-disc list-inside font-sans">
              <li>Standards-compliant NASA/CCSDS CDM briefing export (.txt)</li>
              <li>Complete JSON telemetry payload download</li>
              <li>Print-ready stylesheets for operational Go/No-Go reviews</li>
              <li>Local browser persistence with confirmation-protected deletion</li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#52745C] hover:bg-[#64866D] text-[#FFFFFF] font-bold rounded-md shadow-xs transition-colors font-mono-telemetry cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#FFFFFF]" />
              <span>Draft New Assessment Report</span>
            </button>
          </div>
        </div>
      ) : filteredReports.length === 0 ? (
        <EmptyState
          title="No Matching Reports"
          description="No archived reports match your current search criteria. Try modifying your search or clearing your filters."
          actionText="Clear Search"
          onAction={() => {
            setSearchQuery('');
            setSelectedType('ALL');
          }}
        />
      ) : (
        /* Report Cards List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-[#FFFFFF] rounded-lg border border-[#E2E1DC] p-4 shadow-xs hover:border-[#E2E1DC] transition-colors flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#E2E1DC]">
                  <div>
                    <span className="text-[10px] font-mono-telemetry font-bold text-[#52745C] uppercase tracking-wider block">
                      {report.referenceCode} &bull; {report.reportType.replace(/_/g, ' ')}
                    </span>
                    <h3 className="text-sm font-bold text-[#252A30] mt-0.5 leading-snug group-hover:text-[#52745C] transition-colors">
                      {report.title}
                    </h3>
                  </div>
                  <RiskBadge level={report.riskLevel} size="sm" />
                </div>

                <p className="text-xs text-[#626A73] mt-2.5 line-clamp-2 leading-relaxed">
                  {report.summary}
                </p>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#E2E1DC] text-[11px] font-mono-telemetry text-[#626A73]">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="w-3.5 h-3.5 text-[#858B92] shrink-0" />
                    <span className="truncate">{report.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Calendar className="w-3.5 h-3.5 text-[#858B92] shrink-0" />
                    <span>{formatUtcDateTime(report.createdAt).slice(0, 10)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#E2E1DC]">
                <button
                  type="button"
                  onClick={() => setActiveReport(report)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#252A30] bg-[#FAF9F6] hover:bg-[#F0EFEA] border border-[#E2E1DC] rounded transition-colors font-mono-telemetry"
                >
                  <Eye className="w-3.5 h-3.5 text-[#52745C]" />
                  <span>View Details</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => exportReportToCdmText(report)}
                    className="p-1.5 text-[#626A73] hover:text-[#52745C] hover:bg-[#FAF9F6] rounded transition-colors"
                    title="Export CDM Briefing (.txt)"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => exportReportToJson(report)}
                    className="p-1.5 text-[#626A73] hover:text-[#52745C] hover:bg-[#FAF9F6] rounded transition-colors"
                    title="Export JSON"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setReportToDelete(report)}
                    className="p-1.5 text-[#C65D5D] hover:text-[#C65D5D] hover:bg-rose-950/40 rounded transition-colors"
                    title="Delete report"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Full Report View Modal */}
      {activeReport && (
        <Modal
          isOpen={!!activeReport}
          onClose={() => setActiveReport(null)}
          title={activeReport.title}
          subtitle={`Reference: ${activeReport.referenceCode} • Timestamp: ${formatUtcDateTime(activeReport.createdAt)}`}
          maxWidth="4xl"
          footer={
            <div className="flex items-center justify-between w-full">
              <div className="text-[11px] font-mono-telemetry text-[#626A73]">
                Classification: UNCLASSIFIED / OPERATIONAL SAFETY
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-medium text-[#252A30] bg-[#FAF9F6] hover:bg-[#F0EFEA] border border-[#E2E1DC] rounded shadow-xs inline-flex items-center gap-1.5 font-mono-telemetry"
                >
                  <Printer className="w-3.5 h-3.5 text-[#626A73]" />
                  <span>Print</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportReportToCdmText(activeReport)}
                  className="px-3 py-1.5 text-xs font-medium text-[#252A30] bg-[#FAF9F6] hover:bg-[#F0EFEA] border border-[#E2E1DC] rounded shadow-xs inline-flex items-center gap-1.5 font-mono-telemetry"
                >
                  <Download className="w-3.5 h-3.5 text-[#626A73]" />
                  <span>Download Briefing (.txt)</span>
                </button>

                <button
                  type="button"
                  onClick={() => exportReportToJson(activeReport)}
                  className="px-3 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#52745C] hover:bg-[#64866D] text-[#FFFFFF] font-bold rounded shadow-xs inline-flex items-center gap-1.5 font-mono-telemetry"
                >
                  <span>Export JSON</span>
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 font-mono-telemetry text-xs">
            <div className="p-3 rounded bg-[#FAF9F6] border border-[#E2E1DC] space-y-1">
              <div className="font-bold text-[#252A30] uppercase text-[11px] tracking-wider">
                1. Executive Summary & Directives
              </div>
              <p className="text-[#626A73] leading-relaxed font-sans text-xs">
                {activeReport.summary}
              </p>
              <div className="pt-2 flex items-center justify-between text-[11px] text-[#626A73]">
                <span>Author: <strong className="text-[#252A30]">{activeReport.author}</strong></span>
                <span>Approval: <strong className="text-[#52745C]">{activeReport.approvalStatus}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded bg-[#FAF9F6] border border-[#E2E1DC] space-y-1">
                <div className="text-[10px] font-bold text-[#52745C] uppercase">Primary Satellite</div>
                <div className="font-bold text-[#252A30] text-sm">{activeReport.primaryObjectName}</div>
              </div>
              <div className="p-3 rounded bg-[#FAF9F6] border border-[#E2E1DC] space-y-1">
                <div className="text-[10px] font-bold text-[#C65D5D] uppercase">Secondary Threat</div>
                <div className="font-bold text-[#252A30] text-sm">{activeReport.secondaryObjectName}</div>
              </div>
            </div>

            <div className="p-3 rounded bg-[#FAF9F6] border border-[#E2E1DC] space-y-1">
              <div className="font-bold text-[#252A30] uppercase text-[11px]">
                2. Recommendations & Operator Directives
              </div>
              <div className="text-[#626A73] font-sans text-xs">
                {activeReport.recommendedAction}
              </div>
              {activeReport.operatorNotes && (
                <div className="text-[#626A73] text-[11px] pt-1">
                  Analyst Log: {activeReport.operatorNotes}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {reportToDelete && (
        <Modal
          isOpen={!!reportToDelete}
          onClose={() => setReportToDelete(null)}
          title="Confirm Report Deletion"
          maxWidth="sm"
          footer={
            <>
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                className="px-3 py-1.5 text-xs font-medium text-[#626A73] hover:text-[#252A30] hover:bg-[#FAF9F6] rounded font-mono-telemetry"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 text-xs font-bold text-white bg-[#C65D5D] hover:bg-[#C65D5D]/90 rounded shadow-xs font-mono-telemetry"
              >
                Delete Report
              </button>
            </>
          }
        >
          <p className="text-xs text-[#626A73] leading-relaxed font-mono-telemetry">
            Are you sure you want to permanently delete report <strong className="text-[#252A30]">{reportToDelete.referenceCode}</strong>? This action will remove the record from your local storage.
          </p>
        </Modal>
      )}

      {/* Create New Report Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Draft New Conjunction Assessment Report"
          subtitle="Compile verified flight dynamics analysis into persistent mission archive"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateReport} className="space-y-3 font-mono-telemetry text-xs">
            <div>
              <label className="block text-[#626A73] font-bold mb-1">Report Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Sentinel-6A vs Cosmos 2251 Debris Mitigation Assessment"
                className="w-full px-2.5 py-1.5 border border-[#E2E1DC] bg-[#FAF9F6] rounded text-[#252A30] placeholder-slate-500 focus:outline-none focus:border-[#52745C]"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#626A73] font-bold mb-1">Primary Satellite Name</label>
                <input
                  type="text"
                  value={newPrimaryName}
                  onChange={(e) => setNewPrimaryName(e.target.value)}
                  placeholder="e.g. SENTINEL-6A"
                  className="w-full px-2.5 py-1.5 border border-[#E2E1DC] bg-[#FAF9F6] rounded text-[#252A30] placeholder-slate-500 focus:outline-none focus:border-[#52745C]"
                  required
                />
              </div>

              <div>
                <label className="block text-[#626A73] font-bold mb-1">Secondary Threat Name</label>
                <input
                  type="text"
                  value={newSecondaryName}
                  onChange={(e) => setNewSecondaryName(e.target.value)}
                  placeholder="e.g. COSMOS 2251 DEBRIS"
                  className="w-full px-2.5 py-1.5 border border-[#E2E1DC] bg-[#FAF9F6] rounded text-[#252A30] placeholder-slate-500 focus:outline-none focus:border-[#52745C]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#626A73] font-bold mb-1">Report Classification</label>
                <select
                  value={newReportType}
                  onChange={(e) => setNewReportType(e.target.value as ReportType)}
                  className="w-full px-2.5 py-1.5 border border-[#E2E1DC] bg-[#FAF9F6] rounded text-[#252A30] focus:outline-none focus:border-[#52745C]"
                >
                  <option value="CONJUNCTION_ASSESSMENT">Conjunction Assessment</option>
                  <option value="MANOEUVRE_PLAN">Manoeuvre Plan</option>
                  <option value="SECONDARY_RISK_AUDIT">Secondary Risk Audit</option>
                  <option value="EXECUTIVE_BRIEFING">Executive Briefing</option>
                </select>
              </div>

              <div>
                <label className="block text-[#626A73] font-bold mb-1">Author / Analyst</label>
                <input
                  type="text"
                  value={newAuthor}
                  onChange={(e) => setNewAuthor(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-[#E2E1DC] bg-[#FAF9F6] rounded text-[#252A30] focus:outline-none focus:border-[#52745C]"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[#626A73] font-bold mb-1">Executive Summary</label>
              <textarea
                rows={3}
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                placeholder="Summarize close approach findings, collision probability, covariance quality, and operational decisions..."
                className="w-full p-2 border border-[#E2E1DC] bg-[#FAF9F6] rounded text-[#252A30] placeholder-slate-500 focus:outline-none focus:border-[#52745C]"
                required
              />
            </div>

            <div>
              <label className="block text-[#626A73] font-bold mb-1">Operator Directives & Notes</label>
              <textarea
                rows={2}
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Ground station uplink passes, thruster fuel budget, sensor tracking windows..."
                className="w-full p-2 border border-[#E2E1DC] bg-[#FAF9F6] rounded text-[#252A30] placeholder-slate-500 focus:outline-none focus:border-[#52745C]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E1DC]">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[#626A73] hover:text-[#252A30] hover:bg-[#FAF9F6] rounded font-mono-telemetry"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs font-bold text-[#FFFFFF] bg-[#52745C] hover:bg-[#64866D] text-[#FFFFFF] font-bold rounded shadow-xs font-mono-telemetry"
              >
                Archive Report
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
