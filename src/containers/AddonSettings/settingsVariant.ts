import { writeSessionStorage } from '@shared/hooks'

// the settings variant chosen in this browser tab
export const SETTINGS_VARIANT_KEY = 'variant-type'

// turning developer mode on opens the settings on the user's dev bundle, turning it off on production
export const setSettingsVariantForDeveloperMode = (developerMode: boolean) =>
  writeSessionStorage(SETTINGS_VARIANT_KEY, {
    variant: developerMode ? 'dev' : 'production',
    bundleName: null,
  })
