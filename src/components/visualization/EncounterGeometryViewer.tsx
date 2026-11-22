import React, { useState } from 'react';
import type { ConjunctionEvent } from '../../types/conjunction';
import { ZoomIn, ZoomOut, RotateCcw, Eye, Compass, Layers } from 'lucide-react';

interface EncounterGeometryViewerProps {
  conjunction: ConjunctionEvent;
  className?: string;
}

type ViewMode = 'B_PLANE' | 'RELATIVE_PROFILE' | 'PERSPECTIVE_3D';

export const EncounterGeometryViewer: React.FC<EncounterGeometryViewerProps> = ({
  conjunction,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('B_PLANE');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showCovariance, setShowCovariance] = useState<boolean>(true);
  const [showVectors, setShowVectors] = useState<boolean>(true);

  const { geometry, covariance, primaryObject, secondaryObject } = conjunction;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 2.5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setZoomLevel(1);

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 360;
  const centerX = svgWidth / 2;
  const centerY = svgHeight / 2;

  // Scale calculations for B-plane
  // Scale so that combined 3*sigma or 500m fits nicely
  const maxRange = Math.max(geometry.missDistanceTotalM * 1.5, covariance.sigma1SemiMajorM * 3, 300);
  const scale = (120 / maxRange) * zoomLevel;

  const secX = centerX + geometry.bPlaneXiM * scale;
  const secY = centerY - geometry.bPlaneZetaM * scale; // invert Y for SVG

  return (
    <div className={`bg-[#FFFFFF] border border-[#E2E1DC] rounded overflow-hidden flex flex-col ${className}`}>
      {/* Viewer Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-2 border-b border-[#E2E1DC] bg-[#FAF9F6] text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-[#626A73] uppercase tracking-wider mr-2 font-mono-telemetry flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-[#52745C]" />
            <span>ENCOUNTER GEOMETRY</span>
          </span>

          {/* View Mode Buttons */}
          <div className="inline-flex rounded bg-[#FFFFFF] p-0.5 border border-[#E2E1DC]">
            <button
              type="button"
              onClick={() => setViewMode('B_PLANE')}
              className={`px-2 py-1 text-[11px] rounded transition-colors ${
                viewMode === 'B_PLANE'
                  ? 'bg-[#52745C] text-[#FAF9F6] font-semibold shadow-xs'
                  : 'text-[#626A73] hover:text-[#252A30]'
              }`}
            >
              B-Plane Coordinate
            </button>
            <button
              type="button"
              onClick={() => setViewMode('RELATIVE_PROFILE')}
              className={`px-2 py-1 text-[11px] rounded transition-colors ${
                viewMode === 'RELATIVE_PROFILE'
                  ? 'bg-[#52745C] text-[#FAF9F6] font-semibold shadow-xs'
                  : 'text-[#626A73] hover:text-[#252A30]'
              }`}
            >
              Radial / In-Track Profile
            </button>
            <button
              type="button"
              onClick={() => setViewMode('PERSPECTIVE_3D')}
              className={`px-2 py-1 text-[11px] rounded transition-colors ${
                viewMode === 'PERSPECTIVE_3D'
                  ? 'bg-[#52745C] text-[#FAF9F6] font-semibold shadow-xs'
                  : 'text-[#626A73] hover:text-[#252A30]'
              }`}
            >
              3D Orbital Crossing
            </button>
          </div>
        </div>

        {/* Visibility Toggles & Zoom Controls */}
        <div className="flex items-center gap-2 mt-1 sm:mt-0">
          <button
            type="button"
            onClick={() => setShowCovariance(!showCovariance)}
            className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded border transition-colors ${
              showCovariance
                ? 'bg-[#EAF0E9] text-[#52745C] border-[#E2E1DC]'
                : 'bg-[#FFFFFF] text-[#858B92] border-[#E2E1DC]'
            }`}
            title="Toggle Covariance Ellipsoid 1σ/2σ/3σ"
          >
            <Layers className="w-3 h-3" />
            <span>Covariance</span>
          </button>

          <button
            type="button"
            onClick={() => setShowVectors(!showVectors)}
            className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded border transition-colors ${
              showVectors
                ? 'bg-[#EAF0E9] text-[#52745C] border-[#E2E1DC]'
                : 'bg-[#FFFFFF] text-[#858B92] border-[#E2E1DC]'
            }`}
            title="Toggle Velocity Vectors"
          >
            <Eye className="w-3 h-3" />
            <span>Vectors</span>
          </button>

          <div className="h-4 w-px bg-[#E2E1DC] mx-1" />

          <div className="inline-flex items-center gap-0.5 bg-[#FFFFFF] border border-[#E2E1DC] rounded p-0.5">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 text-[#626A73] hover:text-[#252A30] rounded hover:bg-[#EAF0E9]"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 text-[#626A73] hover:text-[#252A30] rounded hover:bg-[#EAF0E9]"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1 text-[#626A73] hover:text-[#252A30] rounded hover:bg-[#EAF0E9]"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full h-[360px] bg-[#FAF9F6] flex items-center justify-center overflow-hidden select-none">
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: `radial-gradient(circle, #52745C 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full"
          style={{ cursor: 'crosshair' }}
        >
          <defs>
            <linearGradient id="primaryGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#52745C" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#52745C" stopOpacity="0.9" />
            </linearGradient>
            <radialGradient id="secThreatGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#C65D5D" stopOpacity="1" />
              <stop offset="100%" stopColor="#991b1b" stopOpacity="0.3" />
            </radialGradient>
            <marker
              id="arrowhead-sky"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#52745C" />
            </marker>
            <marker
              id="arrowhead-rose"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#C65D5D" />
            </marker>
          </defs>

          {/* VIEW 1: B-PLANE COORDINATES */}
          {viewMode === 'B_PLANE' && (
            <g>
              {/* Axes */}
              <line
                x1={20}
                y1={centerY}
                x2={svgWidth - 20}
                y2={centerY}
                stroke="#E2E1DC"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <line
                x1={centerX}
                y1={20}
                x2={centerX}
                y2={svgHeight - 20}
                stroke="#E2E1DC"
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              {/* Axis labels */}
              <text x={svgWidth - 45} y={centerY - 8} fill="#858B92" fontSize="10" fontFamily="monospace">
                +ξ (Xi)
              </text>
              <text x={centerX + 8} y={35} fill="#858B92" fontSize="10" fontFamily="monospace">
                +ζ (Zeta)
              </text>

              {/* Range rings (e.g. 100m, 200m, 500m) */}
              {[100, 250, 500].map((radiusM) => {
                const r = radiusM * scale;
                if (r > 190) return null;
                return (
                  <g key={radiusM}>
                    <circle
                      cx={centerX}
                      cy={centerY}
                      r={r}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="1"
                    />
                    <text
                      x={centerX + r + 3}
                      y={centerY + 12}
                      fill="#E2E1DC"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {radiusM}m
                    </text>
                  </g>
                );
              })}

              {/* Covariance Ellipses centered at primary or secondary */}
              {showCovariance && (
                <g transform={`rotate(${covariance.orientationAngleDeg}, ${secX}, ${secY})`}>
                  {/* 3-sigma ellipse */}
                  <ellipse
                    cx={secX}
                    cy={secY}
                    rx={covariance.sigma1SemiMajorM * 3 * scale}
                    ry={covariance.sigma1SemiMinorM * 3 * scale}
                    fill="rgba(244, 63, 94, 0.04)"
                    stroke="rgba(244, 63, 94, 0.25)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  {/* 2-sigma ellipse */}
                  <ellipse
                    cx={secX}
                    cy={secY}
                    rx={covariance.sigma1SemiMajorM * 2 * scale}
                    ry={covariance.sigma1SemiMinorM * 2 * scale}
                    fill="rgba(244, 63, 94, 0.08)"
                    stroke="rgba(244, 63, 94, 0.5)"
                    strokeWidth="1.2"
                  />
                  {/* 1-sigma ellipse */}
                  <ellipse
                    cx={secX}
                    cy={secY}
                    rx={covariance.sigma1SemiMajorM * scale}
                    ry={covariance.sigma1SemiMinorM * scale}
                    fill="rgba(244, 63, 94, 0.18)"
                    stroke="#C65D5D"
                    strokeWidth="1.5"
                  />
                </g>
              )}

              {/* Miss Distance Vector Line */}
              <line
                x1={centerX}
                y1={centerY}
                x2={secX}
                y2={secY}
                stroke="#52745C"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />

              {/* Miss distance annotation badge */}
              <rect
                x={(centerX + secX) / 2 - 35}
                y={(centerY + secY) / 2 - 12}
                width="70"
                height="18"
                rx="3"
                fill="#FFFFFF"
                stroke="#52745C"
                strokeWidth="1"
              />
              <text
                x={(centerX + secX) / 2}
                y={(centerY + secY) / 2 + 1}
                fill="#52745C"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                {Math.round(geometry.missDistanceTotalM)} m
              </text>

              {/* Primary Object at Origin (0,0) */}
              <circle
                cx={centerX}
                cy={centerY}
                r={9}
                fill="url(#primaryGlow)"
                stroke="#bae6fd"
                strokeWidth="1.5"
              />
              <text
                x={centerX - 10}
                y={centerY + 22}
                fill="#52745C"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                PRI: {primaryObject.name.split(' ')[0]}
              </text>

              {/* Secondary Object piercing B-Plane */}
              <circle
                cx={secX}
                cy={secY}
                r={7}
                fill="url(#secThreatGlow)"
                stroke="#fca5a5"
                strokeWidth="1.5"
              />
              <text
                x={secX}
                y={secY - 12}
                fill="#C65D5D"
                fontSize="10"
                fontFamily="monospace"
                fontWeight="bold"
                textAnchor="middle"
              >
                SEC: {secondaryObject.name.split(' ')[0]}
              </text>

              {/* B-plane Coordinates text */}
              <text
                x={secX}
                y={secY + 18}
                fill="#626A73"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                ξ:{geometry.bPlaneXiM.toFixed(1)}m, ζ:{geometry.bPlaneZetaM.toFixed(1)}m
              </text>
            </g>
          )}

          {/* VIEW 2: RELATIVE PROFILE (Radial vs Along-track) */}
          {viewMode === 'RELATIVE_PROFILE' && (
            <g>
              {/* Axes: Horizontal = In-track (ΔT), Vertical = Radial (ΔR) */}
              <line
                x1={30}
                y1={centerY}
                x2={svgWidth - 30}
                y2={centerY}
                stroke="#E2E1DC"
                strokeWidth="1"
              />
              <line
                x1={centerX}
                y1={30}
                x2={centerX}
                y2={svgHeight - 30}
                stroke="#E2E1DC"
                strokeWidth="1"
              />

              <text x={svgWidth - 75} y={centerY - 8} fill="#858B92" fontSize="10" fontFamily="monospace">
                +In-Track (ΔT)
              </text>
              <text x={centerX + 8} y={45} fill="#858B92" fontSize="10" fontFamily="monospace">
                +Radial (ΔR)
              </text>

              {/* Simulated relative trajectory track */}
              <path
                d={`M 40,${centerY + 60} Q ${centerX},${centerY - geometry.radialDeltaM * scale * 0.8} ${svgWidth - 40},${centerY - 100}`}
                fill="none"
                stroke="#C65D5D"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* TCA Point */}
              <circle
                cx={centerX + geometry.inTrackDeltaM * scale * 0.5}
                cy={centerY - geometry.radialDeltaM * scale * 0.8}
                r={7}
                fill="#C65D5D"
                stroke="#fca5a5"
                strokeWidth="1.5"
              />

              {/* Primary at center */}
              <circle cx={centerX} cy={centerY} r={8} fill="#52745C" stroke="#bae6fd" strokeWidth="1.5" />
              <text x={centerX} y={centerY + 20} fill="#52745C" fontSize="10" fontFamily="monospace" textAnchor="middle">
                {primaryObject.name.split(' ')[0]} (Orbit Center)
              </text>

              {/* Labels for separation */}
              <text x={30} y={svgHeight - 20} fill="#626A73" fontSize="10" fontFamily="monospace">
                Radial Separation: ΔR = {geometry.radialDeltaM} m | In-Track: ΔT = {geometry.inTrackDeltaM} m
              </text>
            </g>
          )}

          {/* VIEW 3: 3D ORBITAL CROSSING */}
          {viewMode === 'PERSPECTIVE_3D' && (
            <g>
              {/* Earth limb curve representation at bottom */}
              <path
                d={`M -50,${svgHeight + 90} Q ${centerX},${svgHeight - 20} ${svgWidth + 50},${svgHeight + 90}`}
                fill="#FFFFFF"
                stroke="#1e3a8a"
                strokeWidth="2"
              />
              <text x={centerX} y={svgHeight - 5} fill="#1d4ed8" fontSize="9" fontFamily="monospace" textAnchor="middle">
                EARTH REFERENCE (LEO ALTITUDE: {primaryObject.apogeeKm} KM)
              </text>

              {/* Primary Orbit Plane wireframe */}
              <ellipse
                cx={centerX}
                cy={centerY + 20}
                rx={240 * zoomLevel}
                ry={65 * zoomLevel}
                fill="none"
                stroke="#52745C"
                strokeWidth="1.8"
                strokeDasharray="5 3"
              />
              <text x={centerX + 180} y={centerY + 10} fill="#52745C" fontSize="9" fontFamily="monospace">
                Primary Orbit (i = {primaryObject.inclinationDeg}°)
              </text>

              {/* Secondary Crossing Plane wireframe */}
              <ellipse
                cx={centerX}
                cy={centerY + 20}
                rx={230 * zoomLevel}
                ry={85 * zoomLevel}
                transform={`rotate(${geometry.approachAngleDeg - 90}, ${centerX}, ${centerY + 20})`}
                fill="none"
                stroke="#C65D5D"
                strokeWidth="1.8"
                strokeDasharray="4 3"
              />
              <text x={centerX - 190} y={centerY - 40} fill="#C65D5D" fontSize="9" fontFamily="monospace">
                Debris Orbit (i = {secondaryObject.inclinationDeg}°)
              </text>

              {/* Intersection Node / Conjunction point */}
              <circle cx={centerX + 20} cy={centerY - 25} r={8} fill="#52745C" stroke="#fef08a" strokeWidth="2" />
              <text x={centerX + 32} y={centerY - 25} fill="#52745C" fontSize="10" fontFamily="monospace" fontWeight="bold">
                ENCOUNTER NODE (v_rel = {geometry.relativeVelocityKms} km/s)
              </text>

              {showVectors && (
                <g>
                  {/* Primary velocity vector */}
                  <line
                    x1={centerX + 20}
                    y1={centerY - 25}
                    x2={centerX + 75}
                    y2={centerY - 35}
                    stroke="#52745C"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead-sky)"
                  />
                  {/* Secondary velocity vector */}
                  <line
                    x1={centerX + 20}
                    y1={centerY - 25}
                    x2={centerX - 40}
                    y2={centerY - 65}
                    stroke="#C65D5D"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead-rose)"
                  />
                </g>
              )}
            </g>
          )}
        </svg>

        {/* Bottom overlay badge info */}
        <div className="absolute bottom-2 left-3 text-[11px] font-mono-telemetry text-[#626A73] bg-[#FFFFFF]/90 border border-[#E2E1DC] px-2.5 py-1 rounded backdrop-blur-xs flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#52745C]" />
            <span className="text-[#252A30]">Object 1: {primaryObject.name.split(' ')[0]}</span>
          </span>
          <span className="text-[#858B92]">|</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C65D5D]" />
            <span className="text-[#252A30]">Object 2: {secondaryObject.name.split(' ')[0]}</span>
          </span>
          <span className="text-[#858B92]">|</span>
          <span className="text-[#52745C] font-semibold">
            Miss: {geometry.missDistanceTotalM}m
          </span>
        </div>
      </div>
    </div>
  );
};
