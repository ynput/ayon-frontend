// The theme picked in the user menu. It is saved in the user's frontendPreferences, so it follows them
// to other browsers, and mirrored to localStorage, where index.html reads it before the bundle loads.

export type ThemePreference = 'dark' | 'light' | 'system'
export type Theme = 'dark' | 'light'

// index.html reads the same key
const STORAGE_KEY = 'theme'

export const isThemePreference = (value: unknown): value is ThemePreference =>
  value === 'dark' || value === 'light' || value === 'system'

export const getStoredThemePreference = (): ThemePreference => {
  const stored = localStorage.getItem(STORAGE_KEY)
  return isThemePreference(stored) ? stored : 'dark'
}

export const storeThemePreference = (preference: ThemePreference) =>
  localStorage.setItem(STORAGE_KEY, preference)

export const systemLightQuery = () => window.matchMedia('(prefers-color-scheme: light)')

export const resolveTheme = (preference: ThemePreference): Theme =>
  preference === 'system' ? (systemLightQuery().matches ? 'light' : 'dark') : preference

// data-theme switches the ayon-react-components tokens, data-color-mode the third party widgets
export const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme
  document.documentElement.dataset.colorMode = theme
}
