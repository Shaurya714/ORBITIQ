import type { SavedReport } from '../types/report';
import type { ConjunctionEvent } from '../types/conjunction';

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportReportToJson(report: SavedReport) {
  const jsonContent = JSON.stringify(report, null, 2);
  const filename = `${report.referenceCode}_${new Date().toISOString().slice(0, 10)}.json`;
  downloadFile(jsonContent, filename, 'application/json');
}

export function exportReportToCdmText(report: SavedReport) {
  const c = report.conjunctionSnapshot;
  const text = `================================================================================
ORBITIQ ORBITAL CONJUNCTION ASSESSMENT & MITIGATION REPORT
Reference Code: ${report.referenceCode}
Generated At:   ${new Date().toISOString()} (UTC)
Classification: UNCLASSIFIED / OPERATIONAL FLIGHT SAFETY
================================================================================

1. EXECUTIVE SUMMARY
--------------------------------------------------------------------------------
Title:          ${report.title}
Report Type:    ${report.reportType}
Event ID:       ${report.conjunctionId}
CDM Reference:  ${c.cdmId}
Risk Level:     ${report.riskLevel}
Approval Status:${report.approvalStatus}
Author:         ${report.author}

Summary Notes:
${report.summary}

2. PRIMARY ASSET TELEMETRY (OBJECT 1)
--------------------------------------------------------------------------------
Name:               ${c.primaryObject.name}
NORAD Catalog ID:   ${c.primaryObject.noradId}
Intl Designator:    ${c.primaryObject.intlDes}
Object Class:       ${c.primaryObject.type}
Operator / Nation:  ${c.primaryObject.operator} (${c.primaryObject.country})
Orbit Regime:       ${c.primaryObject.regime}
Apogee / Perigee:   ${c.primaryObject.apogeeKm} km / ${c.primaryObject.perigeeKm} km
Inclination:        ${c.primaryObject.inclinationDeg} deg
Semi-Major Axis:    ${c.primaryObject.semiMajorAxisKm} km
Orbital Period:     ${c.primaryObject.periodMin} min
Manoeuvrable:       ${c.primaryObject.isManoeuvrable ? 'YES' : 'NO'}

3. SECONDARY OBJECT TELEMETRY (OBJECT 2)
--------------------------------------------------------------------------------
Name:               ${c.secondaryObject.name}
NORAD Catalog ID:   ${c.secondaryObject.noradId}
Intl Designator:    ${c.secondaryObject.intlDes}
Object Class:       ${c.secondaryObject.type}
Origin Country:     ${c.secondaryObject.country}
Apogee / Perigee:   ${c.secondaryObject.apogeeKm} km / ${c.secondaryObject.perigeeKm} km
Inclination:        ${c.secondaryObject.inclinationDeg} deg
Radar Cross Section:${c.secondaryObject.rcsM2} m^2
Estimated Span:     ${c.secondaryObject.spanMeters} m

4. CLOSE APPROACH METRICS
--------------------------------------------------------------------------------
Time of Closest Approach (TCA): ${c.tcaUtc}
Hours to TCA:                   ${c.hoursToTca} hours
Overall Miss Distance:          ${c.missDistanceM} meters
  - Radial Delta (ΔR):          ${c.geometry.radialDeltaM} meters
  - In-Track Delta (ΔT):        ${c.geometry.inTrackDeltaM} meters
  - Cross-Track Delta (ΔN):     ${c.geometry.crossTrackDeltaM} meters
Relative Velocity:              ${c.geometry.relativeVelocityKms} km/s
Encounter Angle:                ${c.geometry.approachAngleDeg} deg
Collision Probability (Pc):     ${c.collisionProbability.toExponential(4)}
Maximum Probability (P_max):    ${c.maxCollisionProbability.toExponential(4)}
Screening Data Source:          ${c.screeningDataSource}
Covariance Realism Score:       ${c.covariance.realismScorePercent}%

5. MITIGATION / SIMULATION OUTCOME
--------------------------------------------------------------------------------
${report.simulationSnapshot ? `
Manoeuvre Strategy:
  - Direction:        ${report.simulationSnapshot.config.direction}
  - Delta-V (Δv):     ${report.simulationSnapshot.config.deltaVMps} m/s
  - Execution Timing: ${report.simulationSnapshot.config.timingRevsBeforeTca} revs prior to TCA
  - Propulsion:       ${report.simulationSnapshot.config.propulsionType}
  - Propellant Used:  ${report.simulationSnapshot.propellantUsedKg} kg

Clearance Results:
  - New Miss Distance:   ${report.simulationSnapshot.newMissDistanceM} meters (+${report.simulationSnapshot.missDistanceGainM} m gain)
  - New Pc:              ${report.simulationSnapshot.newPc.toExponential(4)}
  - Post-Burn Risk Level:${report.simulationSnapshot.newRiskLevel}
  - Safety Boundary:     ${report.simulationSnapshot.safetyEllipsoidCleared ? 'CLEARED (>2.0 km)' : 'INSIDE SCREENING BUFFER'}
  - Evaluation Verdict:  ${report.simulationSnapshot.verdict}
` : 'No manoeuvre simulation record attached. Assessment performed on baseline tracking data.'}

6. OPERATOR DIRECTIVES & ACTION PLAN
--------------------------------------------------------------------------------
Recommended Action:
${report.recommendedAction}

Operator Directives:
${report.operatorNotes || 'None recorded.'}

================================================================================
END OF REPORT — ORBITIQ FLIGHT DYNAMICS PLATFORM (PHASE 1 DEMO SPECIFICATION)
================================================================================`;

  const filename = `${report.referenceCode}_BRIEFING.txt`;
  downloadFile(text, filename, 'text/plain');
}

export function exportConjunctionsToCsv(conjunctions: ConjunctionEvent[]) {
  const headers = [
    'Event ID',
    'Primary Object',
    'Primary NORAD',
    'Secondary Object',
    'Secondary NORAD',
    'TCA (UTC)',
    'Hours to TCA',
    'Miss Distance (m)',
    'Collision Probability (Pc)',
    'Risk Level',
    'Event Status',
    'Data Source'
  ];

  const rows = conjunctions.map(c => [
    `"${c.id}"`,
    `"${c.primaryObject.name}"`,
    c.primaryObject.noradId,
    `"${c.secondaryObject.name}"`,
    c.secondaryObject.noradId,
    `"${c.tcaUtc}"`,
    c.hoursToTca,
    c.missDistanceM,
    c.collisionProbability,
    `"${c.riskLevel}"`,
    `"${c.status}"`,
    `"${c.screeningDataSource}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const filename = `ORBITIQ_CONJUNCTIONS_${new Date().toISOString().slice(0, 10)}.csv`;
  downloadFile(csvContent, filename, 'text/csv');
}
