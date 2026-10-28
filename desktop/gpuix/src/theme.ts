/**
 * Bagrry design tokens and warm paper color system.
 * Replicates desktop/tauri/src/index.css tokens with precision.
 */

export interface BagrryColors {
  bg: string
  surface: string
  surface2: string
  elevated: string
  sidebar: string
  border: string
  borderStrong: string
  text: string
  textMuted: string
  textSubtle: string
  accent: string
  accentFg: string
  accentSubtle: string
  danger: string
  dangerFg: string
  dangerSubtle: string
  success: string
  warning: string
  solid: string
  solidFg: string
  hover: string
  selected: string
  active: string
}

export const DARK_THEME: BagrryColors = {
  bg: '#252523',
  surface: '#2b2b29',
  surface2: '#323230',
  elevated: '#3a3a37',
  sidebar: '#1d1d1c',
  border: '#3a3a37',
  borderStrong: '#4a4a46',
  text: '#e8e6e1',
  textMuted: '#9b978f',
  textSubtle: '#75726b',
  accent: '#c3dd4f', // Electric chartreuse/lime
  accentFg: '#1f2405',
  accentSubtle: '#2b3310',
  danger: '#e5595b',
  dangerFg: '#ffffff',
  dangerSubtle: '#3b1c1d',
  success: '#6cc38a',
  warning: '#d9a445',
  solid: '#ededea',
  solidFg: '#1c1b19',
  hover: '#323230',
  selected: '#353532',
  active: '#3e3e3b',
}

export const LIGHT_THEME: BagrryColors = {
  bg: '#f6f5f2',
  surface: '#fbfaf8',
  surface2: '#f2f0eb',
  elevated: '#ffffff',
  sidebar: '#efeeea',
  border: '#e3e1db',
  borderStrong: '#cfccc3',
  text: '#1c1b19',
  textMuted: '#6f6c65',
  textSubtle: '#949086',
  accent: '#59700a',
  accentFg: '#ffffff',
  accentSubtle: '#e8f0c5',
  danger: '#c23b38',
  dangerFg: '#ffffff',
  dangerSubtle: '#fce8e8',
  success: '#2f855a',
  warning: '#b7791f',
  solid: '#1c1b19',
  solidFg: '#ffffff',
  hover: '#eae8e1',
  selected: '#e4e1d8',
  active: '#dedad0',
}

export const FONT_DISPLAY = 'Georgia, "Times New Roman", serif'
export const FONT_SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
export const FONT_MONO = '"JetBrains Mono", "Cascadia Code", Consolas, monospace'

export const SIDEBAR_WIDTH = 240
