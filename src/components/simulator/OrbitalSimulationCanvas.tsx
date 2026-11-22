import React, { useRef, useEffect, useState } from 'react';
import { 
  EARTH_RADIUS_KM, 
  GEO_RADIUS_KM,
  LEO_LIMIT_KM,
  propagateOrbit, 
  type KeplerianElements, 
  type ManoeuvreResult 
} from '../../physics/orbitalPhysics';
import type { 
  OrbitalObjectProfile, 
  ClosestApproachPrediction 
} from '../../types/simulation';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Crosshair,
  Layers,
  Compass
} from 'lucide-react';

interface OrbitalSimulationCanvasProps {
  initialElements: KeplerianElements;
  threatProfile?: OrbitalObjectProfile;
  manoeuvreResult: ManoeuvreResult | null;
  closestApproach?: ClosestApproachPrediction;
  simTimeSeconds: number;
  isSimulating: boolean;
  showReferenceOrbit?: boolean;     // Path A
  showPredictedPath?: boolean;      // Path B
  showManoeuvredOrbit?: boolean;    // Path C
  showThreatOrbit?: boolean;        // Threat trajectory
  showVectors?: boolean;            // r, v, dv vectors
  showAnnotations?: boolean;        // Angles, axes, distance rings, metadata
  showCollisionEnvelope?: boolean;  // R1 + R2 hard body sphere
  onSelectAnomaly?: (nuDeg: number) => void;
}

export const OrbitalSimulationCanvas: React.FC<OrbitalSimulationCanvasProps> = ({
  initialElements,
  threatProfile,
  manoeuvreResult,
  closestApproach,
  simTimeSeconds,
  showReferenceOrbit = true,
  showPredictedPath = true,
  showManoeuvredOrbit = true,
  showThreatOrbit = true,
  showVectors = true,
  showAnnotations = true,
  showCollisionEnvelope = true,
  onSelectAnomaly,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Viewport / Camera state
  const [zoom, setZoom] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [trackSpacecraft, setTrackSpacecraft] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'GEOCENTRIC' | 'ENCOUNTER_FRAME'>('GEOCENTRIC');

  // Pre-generate high-density authentic starfield
  const starsRef = useRef<{ x: number; y: number; r: number; alpha: number; color: string }[]>([]);
  useEffect(() => {
    const stars: { x: number; y: number; r: number; alpha: number; color: string }[] = [];
    const colors = ['#ffffff', '#F7F6F2', '#E2E1DC', '#FAF9F6', '#C47C61'];
    for (let i = 0; i < 400; i++) {
      stars.push({
        x: Math.random() * 2600 - 1300,
        y: Math.random() * 2600 - 1300,
        r: Math.random() < 0.85 ? Math.random() * 0.7 + 0.3 : Math.random() * 0.9 + 0.8,
        alpha: Math.random() * 0.65 + 0.2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    starsRef.current = stars;
  }, []);

  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.25, 8.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.25, 0.15));
  const handleResetView = () => {
    setZoom(1.0);
    setPanOffset({ x: 0, y: 0 });
    setTrackSpacecraft(false);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.15 : 0.87;
    setZoom(prev => Math.min(Math.max(prev * factor, 0.15), 8.0));
  };

  // Mouse drag panning
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Click on canvas to select true anomaly
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isDragging || !onSelectAnomaly || !canvasRef.current || viewMode !== 'GEOCENTRIC') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvasRef.current.clientWidth;
    const height = canvasRef.current.clientHeight;
    const centerX = width / 2 + panOffset.x;
    const centerY = height / 2 + panOffset.y;

    // Angle relative to coordinate center (with Y inverted)
    const dx = clickX - centerX;
    const dy = -(clickY - centerY);
    let angleRad = Math.atan2(dy, dx);
    if (angleRad < 0) angleRad += 2 * Math.PI;

    // Subtract argument of perigee to get true anomaly relative to periapsis
    const omegaRad = (initialElements.argOfPericenterDeg * Math.PI) / 180;
    let nuRad = angleRad - omegaRad;
    if (nuRad < 0) nuRad += 2 * Math.PI;

    const nuDeg = ((nuRad * 180) / Math.PI) % 360;
    onSelectAnomaly(nuDeg);
  };

  // Main high-precision render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // =========================================================================
    // 1. COSMIC BACKGROUND & AUTHENTIC STARFIELD
    // =========================================================================
    ctx.fillStyle = '#141820'; // Deep authentic space canvas
    ctx.fillRect(0, 0, width, height);

    // Draw Subtle Starfield
    ctx.save();
    for (const star of starsRef.current) {
      const sx = (star.x * zoom + width / 2 + panOffset.x * 0.15) % width;
      const sy = (star.y * zoom + height / 2 + panOffset.y * 0.15) % height;
      const finalX = sx < 0 ? sx + width : sx;
      const finalY = sy < 0 ? sy + height : sy;

      ctx.beginPath();
      ctx.arc(finalX, finalY, star.r, 0, 2 * Math.PI);
      ctx.fillStyle = star.color;
      ctx.globalAlpha = star.alpha;
      ctx.fill();
    }
    ctx.restore();

    // Propagate primary spacecraft
    const activeElements = manoeuvreResult && simTimeSeconds > 0
      ? manoeuvreResult.postBurnElements
      : initialElements;
    const pProp = propagateOrbit(activeElements, simTimeSeconds);
    const scPos = pProp.state;

    // Propagate threat if provided
    const threatProp = threatProfile 
      ? propagateOrbit(threatProfile.elements, simTimeSeconds) 
      : null;
    const thPos = threatProp?.state;

    // =========================================================================
    // VIEW MODE 1: GEOCENTRIC INERTIAL ORBIT PLANE (DEFAULT)
    // =========================================================================
    if (viewMode === 'GEOCENTRIC') {
      const maxA = Math.max(
        initialElements.semiMajorAxisKm * (1 + initialElements.eccentricity),
        threatProfile ? threatProfile.elements.semiMajorAxisKm * (1 + threatProfile.elements.eccentricity) : 0,
        manoeuvreResult ? manoeuvreResult.postBurnElements.semiMajorAxisKm * (1 + manoeuvreResult.postBurnElements.eccentricity) : 0,
        10000
      );

      const baseScale = (Math.min(width, height) * 0.38) / maxA;
      const scale = baseScale * zoom;

      let centerX = width / 2 + panOffset.x;
      let centerY = height / 2 + panOffset.y;

      if (trackSpacecraft) {
        centerX = width / 2 - scPos.x * scale;
        centerY = height / 2 + scPos.y * scale;
      }

      // --- Reference Rings & Scales ---
      if (showAnnotations) {
        ctx.save();
        const outerRadiusPx = Math.min(width, height) * 0.46;
        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadiusPx, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Ticks
        for (let deg = 0; deg < 360; deg += 30) {
          const rad = (deg * Math.PI) / 180;
          const x1 = centerX + (outerRadiusPx - 6) * Math.cos(rad);
          const y1 = centerY - (outerRadiusPx - 6) * Math.sin(rad);
          const x2 = centerX + outerRadiusPx * Math.cos(rad);
          const y2 = centerY - outerRadiusPx * Math.sin(rad);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Polar Distance Rings (LEO & GEO)
        const rangeRadiiKm = [LEO_LIMIT_KM, 15000, GEO_RADIUS_KM];
        for (const rKm of rangeRadiiKm) {
          const pxR = rKm * scale;
          if (pxR > 15 && pxR < Math.max(width, height) * 2) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, pxR, 0, 2 * Math.PI);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.setLineDash([3, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        }
        ctx.restore();
      }

      // --- Earth Reference ---
      const earthRadiusPx = EARTH_RADIUS_KM * scale;
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, earthRadiusPx, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#52745C';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(centerX - 4, centerY); ctx.lineTo(centerX + 4, centerY);
      ctx.moveTo(centerX, centerY - 4); ctx.lineTo(centerX, centerY + 4);
      ctx.stroke();
      ctx.restore();

      // --- PATH A: Primary Baseline Orbit ---
      if (showReferenceOrbit && manoeuvreResult) {
        ctx.save();
        ctx.strokeStyle = '#858B92';
        ctx.lineWidth = 1.2;
        const refPoints = manoeuvreResult.referenceOrbitPoints;
        ctx.beginPath();
        for (let i = 0; i < refPoints.length; i++) {
          const pt = refPoints[i];
          const cx = centerX + pt.x * scale;
          const cy = centerY - pt.y * scale;
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // --- THREAT TRAJECTORY (Dashed Terracotta Line) ---
      if (showThreatOrbit && threatProfile) {
        ctx.save();
        ctx.strokeStyle = '#C47C61'; // Terracotta
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 4]);
        
        // Sample points along threat orbit
        ctx.beginPath();
        for (let i = 0; i <= 180; i++) {
          const prop = propagateOrbit(threatProfile.elements, i * 40);
          const tx = centerX + prop.state.x * scale;
          const ty = centerY - prop.state.y * scale;
          if (i === 0) ctx.moveTo(tx, ty);
          else ctx.lineTo(tx, ty);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }

      // --- PATH C: Post-Burn Modified Orbit (Forest Green) ---
      if (showManoeuvredOrbit && manoeuvreResult) {
        ctx.save();
        ctx.strokeStyle = '#52745C';
        ctx.lineWidth = 2.0;
        ctx.setLineDash([6, 4]);
        const manPoints = manoeuvreResult.manoeuvredPathPoints;
        ctx.beginPath();
        for (let i = 0; i < manPoints.length; i++) {
          const pt = manPoints[i];
          const cx = centerX + pt.x * scale;
          const cy = centerY - pt.y * scale;
          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        if (!manoeuvreResult.isHyperbolicEscape) ctx.closePath();
        ctx.stroke();
        ctx.restore();
      }

      // --- Closest Approach Point Marker ---
      if (closestApproach) {
        const caX = centerX + closestApproach.closestApproachPositionKm.x * scale;
        const caY = centerY - closestApproach.closestApproachPositionKm.y * scale;

        ctx.save();
        ctx.strokeStyle = closestApproach.isCollisionEnvelopeOverlap 
          ? '#C65D5D' 
          : closestApproach.predictedMissDistanceM < 2000 
            ? '#C58A3C' 
            : '#52745C';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(caX, caY, 6, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = ctx.strokeStyle;
        ctx.textAlign = 'left';
        ctx.fillText(`TCA (${closestApproach.predictedMissDistanceM}m)`, caX + 9, caY - 3);
        ctx.restore();
      }

      // --- Primary Spacecraft Drawing ---
      const scX = centerX + scPos.x * scale;
      const scY = centerY - scPos.y * scale;
      const scSpeed = Math.sqrt(scPos.vx * scPos.vx + scPos.vy * scPos.vy);

      // Hard-body collision envelope indicator (if enabled)
      if (showCollisionEnvelope && closestApproach) {
        ctx.save();
        const envelopePx = Math.max(8, (closestApproach.combinedHardBodyRadiusM / 1000) * scale * 40);
        ctx.beginPath();
        ctx.arc(scX, scY, envelopePx, 0, 2 * Math.PI);
        ctx.strokeStyle = closestApproach.isCollisionEnvelopeOverlap ? 'rgba(198, 93, 93, 0.7)' : 'rgba(82, 116, 92, 0.4)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        ctx.stroke();
        ctx.restore();
      }

      // Primary Spacecraft Body
      ctx.save();
      const heading = Math.atan2(-scPos.vy, scPos.vx);
      ctx.translate(scX, scY);
      ctx.rotate(heading);
      // Panels
      ctx.fillStyle = '#252A30';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(-2, -11, 4, 8);
      ctx.strokeRect(-2, -11, 4, 8);
      ctx.fillRect(-2, 3, 4, 8);
      ctx.strokeRect(-2, 3, 4, 8);
      // Bus
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, 3.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.restore();

      // Spacecraft Tag
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(initialElements.objectName || 'PRIMARY', scX + 12, scY - 6);
      ctx.restore();

      // --- Threat Object Drawing ---
      if (thPos && threatProfile) {
        const thX = centerX + thPos.x * scale;
        const thY = centerY - thPos.y * scale;

        // Threat Body (Hazard diamond / red marker)
        ctx.save();
        ctx.fillStyle = '#C47C61';
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(thX, thY - 5);
        ctx.lineTo(thX + 5, thY);
        ctx.lineTo(thX, thY + 5);
        ctx.lineTo(thX - 5, thY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#C47C61';
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(threatProfile.name, thX + 10, thY - 6);

        // --- Distance Line between Primary and Threat ---
        ctx.beginPath();
        ctx.moveTo(scX, scY);
        ctx.lineTo(thX, thY);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);
        ctx.stroke();

        // Line-of-sight distance label
        const midX = (scX + thX) / 2;
        const midY = (scY + thY) / 2;
        const distKm = Math.sqrt(Math.pow(thPos.x - scPos.x, 2) + Math.pow(thPos.y - scPos.y, 2));
        ctx.fillStyle = '#E2E1DC';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          distKm < 100 ? `${(distKm * 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} m` : `${distKm.toFixed(1)} km`,
          midX,
          midY - 5
        );

        ctx.restore();
      }

      // --- Primary Velocity Vector ---
      if (showVectors) {
        ctx.save();
        const vLen = 30;
        const vUnitX = scPos.vx / Math.max(scSpeed, 1e-4);
        const vUnitY = scPos.vy / Math.max(scSpeed, 1e-4);
        ctx.beginPath();
        ctx.moveTo(scX, scY);
        ctx.lineTo(scX + vUnitX * vLen, scY - vUnitY * vLen);
        ctx.strokeStyle = '#64866D';
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.restore();
      }

    } else {
      // =========================================================================
      // VIEW MODE 2: RELATIVE MOTION (ENCOUNTER FRAME)
      // =========================================================================
      // Centered on Primary Spacecraft at (width/2, height/2).
      // Shows relative trajectory r_rel(t) entering and exiting.
      const centerX = width / 2 + panOffset.x;
      const centerY = height / 2 + panOffset.y;

      // Coordinate Scale: 5 km window
      const rangeWindowKm = 10;
      const relScale = (Math.min(width, height) * 0.42) / rangeWindowKm * zoom;

      // Concentric Safety Distance Rings (1 km, 2 km safety buffer, 5 km)
      ctx.save();
      const ringDistancesKm = [1, 2, 5, 8];
      for (const d of ringDistancesKm) {
        const rPx = d * relScale;
        ctx.beginPath();
        ctx.arc(centerX, centerY, rPx, 0, 2 * Math.PI);
        ctx.strokeStyle = d === 2 ? '#C58A3C' : 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = d === 2 ? 1.5 : 1;
        if (d === 2) ctx.setLineDash([4, 4]);
        else ctx.setLineDash([2, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = d === 2 ? '#C58A3C' : 'rgba(255, 255, 255, 0.3)';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(d === 2 ? `2.0 km Safety Buffer` : `${d} km`, centerX + rPx + 4, centerY - 2);
      }

      // Crosshairs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - 150, centerY); ctx.lineTo(centerX + 150, centerY);
      ctx.moveTo(centerX, centerY - 150); ctx.lineTo(centerX, centerY + 150);
      ctx.stroke();

      // Primary Spacecraft at Center (0,0)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Collision Envelope Ring around primary
      if (closestApproach) {
        ctx.strokeStyle = closestApproach.isCollisionEnvelopeOverlap ? '#C65D5D' : '#52745C';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 8, 0, 2 * Math.PI);
        ctx.stroke();
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${initialElements.objectName || 'PRIMARY'} [FRAME ORIGIN]`, centerX, centerY + 20);

      // Threat Relative Trajectory
      if (threatProfile) {
        ctx.strokeStyle = '#C47C61';
        ctx.lineWidth = 1.8;
        ctx.beginPath();

        // Sample relative path over encounter window (-1800s to +1800s around TCA)
        const tca = closestApproach?.timeToClosestApproachSec || 1800;
        const windowSec = 1200;
        const numSteps = 80;

        for (let i = 0; i <= numSteps; i++) {
          const t = Math.max(0, tca - windowSec / 2 + (i * windowSec) / numSteps);
          const p = propagateOrbit(activeElements, t).state;
          const th = propagateOrbit(threatProfile.elements, t).state;

          const relX = th.x - p.x;
          const relY = th.y - p.y;

          const cx = centerX + relX * relScale;
          const cy = centerY - relY * relScale;

          if (i === 0) ctx.moveTo(cx, cy);
          else ctx.lineTo(cx, cy);
        }
        ctx.stroke();

        // Current Threat Relative Position
        if (thPos) {
          const curRelX = thPos.x - scPos.x;
          const curRelY = thPos.y - scPos.y;
          const thRelPxX = centerX + curRelX * relScale;
          const thRelPxY = centerY - curRelY * relScale;

          ctx.fillStyle = '#C47C61';
          ctx.beginPath();
          ctx.arc(thRelPxX, thRelPxY, 5, 0, 2 * Math.PI);
          ctx.fill();

          ctx.fillStyle = '#C47C61';
          ctx.font = '10px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText(`THREAT (${threatProfile.name})`, thRelPxX + 8, thRelPxY - 4);
        }
      }

      ctx.restore();
    }

    ctx.restore();
  }, [
    initialElements,
    threatProfile,
    manoeuvreResult,
    closestApproach,
    simTimeSeconds,
    showReferenceOrbit,
    showPredictedPath,
    showManoeuvredOrbit,
    showThreatOrbit,
    showVectors,
    showAnnotations,
    showCollisionEnvelope,
    zoom,
    panOffset,
    trackSpacecraft,
    viewMode,
    onSelectAnomaly,
  ]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-[560px] bg-[#141820] rounded-md border border-[#E2E1DC] overflow-hidden select-none shadow-xs"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleCanvasClick}
    >
      {/* 2D Simulation HTML5 Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Floating Canvas Camera Controls (Top-Left) */}
      <div className="absolute top-3 left-3 flex items-center gap-1 bg-[#FFFFFF]/90 backdrop-blur-xs border border-[#E2E1DC] rounded-md p-1 shadow-sm z-10 font-mono-telemetry text-xs">
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1.5 text-[#626A73] hover:text-[#52745C] hover:bg-[#F0EFEA] rounded transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1.5 text-[#626A73] hover:text-[#52745C] hover:bg-[#F0EFEA] rounded transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="w-[1px] h-3.5 bg-[#E2E1DC]"></div>
        <button
          type="button"
          onClick={handleResetView}
          className="p-1.5 text-[#626A73] hover:text-[#52745C] hover:bg-[#F0EFEA] rounded transition-colors cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setTrackSpacecraft(prev => !prev)}
          className={`px-2 py-1 text-[11px] font-semibold rounded flex items-center gap-1 transition-colors cursor-pointer ${
            trackSpacecraft
              ? 'bg-[#EAF0E9] text-[#52745C] border border-[#52745C]/40'
              : 'text-[#626A73] hover:text-[#252A30]'
          }`}
          title="Lock camera to follow spacecraft"
        >
          <Crosshair className="w-3 h-3" />
          <span>Track</span>
        </button>
      </div>

      {/* View Mode Switcher (Top-Center) */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center bg-[#FFFFFF]/95 backdrop-blur-xs border border-[#E2E1DC] rounded-md p-0.5 shadow-sm z-10 font-mono-telemetry text-xs">
        <button
          type="button"
          onClick={() => setViewMode('GEOCENTRIC')}
          className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            viewMode === 'GEOCENTRIC'
              ? 'bg-[#EAF0E9] text-[#52745C] border border-[#52745C]/30'
              : 'text-[#626A73] hover:text-[#252A30]'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Geocentric Orbit</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('ENCOUNTER_FRAME')}
          className={`px-3 py-1 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            viewMode === 'ENCOUNTER_FRAME'
              ? 'bg-[#EAF0E9] text-[#52745C] border border-[#52745C]/30'
              : 'text-[#626A73] hover:text-[#252A30]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Relative Encounter</span>
        </button>
      </div>

      {/* Trajectory Legend (Top-Right) */}
      <div className="absolute top-3 right-3 bg-[#FFFFFF]/90 backdrop-blur-xs border border-[#E2E1DC] rounded-md px-3 py-2 shadow-sm z-10 font-mono-telemetry text-[11px] space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-[2px] bg-[#858B92] inline-block"></span>
          <span className="text-[#626A73]">Primary Orbit</span>
        </div>
        {threatProfile && (
          <div className="flex items-center gap-2">
            <span className="w-3.5 border-b-2 border-dashed border-[#C47C61] inline-block"></span>
            <span className="text-[#C47C61] font-semibold">Threat Path</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="w-3.5 border-b-2 border-dashed border-[#52745C] inline-block"></span>
          <span className="text-[#52745C] font-semibold">Post-Burn Orbit</span>
        </div>
      </div>
    </div>
  );
};
