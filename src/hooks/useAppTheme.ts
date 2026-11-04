import { useEffect } from 'react'
import { useAppSelector } from '@state/store'
import {
  applyTheme,
  getStoredThemePreference,
  isThemePreference,
  resolveTheme,
  storeThemePreference,
  systemLightQuery,
  ThemePreference,
} from '@helpers/theme'

// the user's theme preference; without one (logged out, never picked) this browser's last choice
export const useThemePreference = (): ThemePreference => {
  const saved = useAppSelector(
    (state) => (state.user?.data?.frontendPreferences as { theme?: unknown } | undefined)?.theme,
  )
  return isThemePreference(saved) ? saved : getStoredThemePreference()
}

// applies the theme preference and follows the OS while it is 'system'
export const useAppTheme = () => {
  const preference = useThemePreference()

  useEffect(() => {
    storeThemePreference(preference)
    applyTheme(resolveTheme(preference))
    if (preference !== 'system') return

    const query = systemLightQuery()
    const onChange = () => applyTheme(resolveTheme('system'))
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [preference])
}
