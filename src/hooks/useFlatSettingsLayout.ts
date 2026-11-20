import { useAppSelector } from '@state/store'

// a preference saved on the user's record, not in the user slice's defaults
type FlatLayoutPreference = { flatSettingsLayout?: boolean } | undefined

/** The user's choice of the flat settings layout (Profile > Flat settings layout) */
export const useFlatSettingsLayout = (): boolean =>
  useAppSelector(
    (state) =>
      !!(state.user?.data?.frontendPreferences as FlatLayoutPreference)?.flatSettingsLayout,
  )
