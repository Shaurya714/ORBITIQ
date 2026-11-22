import type { RiskLevel, EventStatus } from '../types/conjunction';

export function formatScientific(val: number, decimals: number = 2): string {
  if (val === 0) return '0';
  if (Math.abs(val) < 0.01 || Math.abs(val) >= 1e4) {
    const expStr = val.toExponential(decimals);
    const [mantissa, exponent] = expStr.split('e');
    const expNum = parseInt(exponent, 10);
    return `${mantissa} × 10${toSuperscript(expNum)}`;
  }
  return val.toFixed(decimals);
}

export function formatScientificCompact(val: number): string {
  if (val === 0) return '0.00e0';
  return val.toExponential(2);
}

function toSuperscript(num: number): string {
  const chars: Record<string, string> = {
    '-': '⁻',
    '+': '⁺',
    '0': '⁰',
    '1': '¹',
    '2': '²',
    '3': '³',
    '4': '⁴',
    '5': '⁵',
    '6': '⁶',
    '7': '⁷',
    '8': '⁸',
    '9': '⁹',
  };
  return num.toString().split('').map(c => chars[c] || c).join('');
}

export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} km`;
  }
  return `${Math.round(meters).toLocaleString('en-US')} m`;
}

export function formatUtcDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).replace(',', '') + ' IST';
  } catch {
    return isoString;
  }
}

export const formatIstDateTime = formatUtcDateTime;

export function formatCountdownTca(val: number | string): string {
  let hours: number;
  if (typeof val === 'string') {
    const targetMs = new Date(val).getTime();
    const nowMs = Date.now();
    if (isNaN(targetMs)) return 'UNKNOWN';
    hours = (targetMs - nowMs) / (1000 * 60 * 60);
  } else {
    hours = val;
  }
  if (hours <= 0) return 'PAST TCA';
  const h = Math.floor(hours);
  const m = Math.floor((hours - h) * 60);
  const s = Math.floor((((hours - h) * 60) - m) * 60);
  return `T-${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
}

export function getRiskLevelMeta(level: RiskLevel): {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
} {
  switch (level) {
    case 'CRITICAL':
      return {
        label: 'CRITICAL',
        badgeBg: 'bg-[#C65D5D]/10',
        badgeText: 'text-[#C65D5D]',
        badgeBorder: 'border-[#C65D5D]/25',
        dotColor: 'bg-[#C65D5D]',
      };
    case 'HIGH':
      return {
        label: 'HIGH',
        badgeBg: 'bg-[#C47C61]/10',
        badgeText: 'text-[#C47C61]',
        badgeBorder: 'border-[#C47C61]/25',
        dotColor: 'bg-[#C47C61]',
      };
    case 'MODERATE':
      return {
        label: 'MODERATE',
        badgeBg: 'bg-[#C58A3C]/10',
        badgeText: 'text-[#C58A3C]',
        badgeBorder: 'border-[#C58A3C]/25',
        dotColor: 'bg-[#C58A3C]',
      };
    case 'LOW':
    default:
      return {
        label: 'LOW',
        badgeBg: 'bg-[#EAF0E9]',
        badgeText: 'text-[#52745C]',
        badgeBorder: 'border-[#52745C]/25',
        dotColor: 'bg-[#52745C]',
      };
  }
}

export function getEventStatusMeta(status: EventStatus): {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
} {
  switch (status) {
    case 'PENDING_ANALYSIS':
      return {
        label: 'Pending Analysis',
        badgeBg: 'bg-[#C58A3C]/10',
        badgeText: 'text-[#C58A3C]',
        badgeBorder: 'border-[#C58A3C]/25',
      };
    case 'MANOEUVRE_PLANNED':
      return {
        label: 'Manoeuvre Planned',
        badgeBg: 'bg-[#EAF0E9]',
        badgeText: 'text-[#52745C]',
        badgeBorder: 'border-[#52745C]/25',
      };
    case 'SCREENED_SAFE':
      return {
        label: 'Screened Safe',
        badgeBg: 'bg-[#EAF0E9]',
        badgeText: 'text-[#52745C]',
        badgeBorder: 'border-[#52745C]/25',
      };
    case 'EXECUTED':
      return {
        label: 'Executed',
        badgeBg: 'bg-[#FAF9F6]',
        badgeText: 'text-[#626A73]',
        badgeBorder: 'border-[#E2E1DC]',
      };
    case 'MONITORING':
      return {
        label: 'Monitoring',
        badgeBg: 'bg-[#FAF9F6]',
        badgeText: 'text-[#626A73]',
        badgeBorder: 'border-[#E2E1DC]',
      };
    default:
      return {
        label: status,
        badgeBg: 'bg-[#FAF9F6]',
        badgeText: 'text-[#626A73]',
        badgeBorder: 'border-[#E2E1DC]',
      };
  }
}
