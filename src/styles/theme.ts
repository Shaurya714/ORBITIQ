/**
 * ORBITIQ - Centralized Design System Tokens
 * Exact HEX Color Values for Light Mode and Dark Mode
 */

export type ThemeMode = 'light' | 'dark';

export const LIGHT_THEME = {
  bg: {
    page: '#F7F6F2',          // Main warm-white background
    secondary: '#F0EFEA',     // Secondary neutral background
    panel: '#FFFFFF',         // Clean white panel surface
    elevated: '#FAF9F6',      // Subtle elevated surface
  },
  border: {
    default: '#E2E1DC',       // Standard subtle border
    subtle: '#EAE9E4',        // Hairline divider
  },
  text: {
    primary: '#252A30',       // Dark neutral charcoal text
    secondary: '#626A73',     // Muted secondary text
    muted: '#858B92',         // Subtle tertiary text
  },
  accent: {
    primary: '#52745C',       // Primary accent: muted forest green
    hover: '#64866D',         // Accent hover
    soft: '#EAF0E9',          // Soft accent background
    secondary: '#C47C61',     // Secondary accent: muted terracotta
  },
  status: {
    warning: '#C58A3C',       // Muted amber
    critical: '#C65D5D',      // Muted red
    success: '#52745C',       // Forest green
  },
} as const;

export const DARK_THEME = {
  bg: {
    page: '#171A1D',          // Main background
    secondary: '#202428',     // Secondary background
    panel: '#252A2E',         // Main panel/surface
    elevated: '#2C3236',      // Elevated surface
  },
  border: {
    default: '#383F42',       // Borders
    subtle: '#2C3236',        // Subtle divider
  },
  text: {
    primary: '#E8E9E6',       // Main text
    secondary: '#B0B6B4',     // Secondary text
    muted: '#858D8B',         // Muted text
  },
  accent: {
    primary: '#8BA893',       // Primary accent
    hover: '#A0B9A5',         // Accent hover
    soft: '#303B34',          // Soft accent background
    secondary: '#D19A80',     // Secondary accent
  },
  status: {
    warning: '#D6A45B',       // Warning
    critical: '#D57878',      // Critical
    success: '#8BA893',       // Success
  },
} as const;

// Default alias to preserve existing imports
export const THEME = LIGHT_THEME;
