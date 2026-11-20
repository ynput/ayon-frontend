import clsx from 'clsx'
import { useAppSelector } from '@state/store'

// preferences saved on the user's record, not in the user slice's defaults
type FlatLayoutPreferences =
  | { flatSettingsLayout?: boolean; fullWidthSettings?: boolean; outlineFitsTitles?: boolean }
  | undefined

/** The user's choice of the flat settings layout (Profile > Flat settings layout) */
export const useFlatSettingsLayout = (): boolean =>
  useAppSelector(
    (state) =>
      !!(state.user?.data?.frontendPreferences as FlatLayoutPreferences)?.flatSettingsLayout,
  )

/**
 * The classes of the flat layout's grid (`.settings-flat-layout`), with the user's width choices:
 * the sheet filling the panel (Profile > Full width settings) and the outline as wide as its
 * longest title (Profile > Outline fits titles)
 */
export const useFlatSettingsLayoutClassName = (): string =>
  useAppSelector((state) => {
    const preferences = state.user?.data?.frontendPreferences as FlatLayoutPreferences
    return clsx(
      'settings-flat-layout',
      preferences?.fullWidthSettings && 'is-full-width',
      preferences?.outlineFitsTitles && 'outline-fits-titles',
    )
  })
