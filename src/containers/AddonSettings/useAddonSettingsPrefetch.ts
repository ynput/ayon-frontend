import { useCallback, useEffect, useRef } from 'react'
import { usePrefetchAddonSettings } from '@queries/addonSettings'

// Long enough to skip rows the pointer only passes over on its way somewhere else
const HOVER_DELAY = 80

type PrefetchArgs = {
  addonName: string
  addonVersion: string
  variant: string
  projectName?: string | null
}

/**
 * Starts loading an addon's settings (schema, values, overrides) while the pointer rests
 * on its row, so they are usually cached by the time it is clicked. The arguments must
 * match the queries in AddonSettingsPanel, or the cache misses.
 */
export const useAddonSettingsPrefetch = () => {
  const prefetchSchema = usePrefetchAddonSettings('getAddonSettingsSchema')
  const prefetchSettings = usePrefetchAddonSettings('getAddonSettings')
  const prefetchOverrides = usePrefetchAddonSettings('getAddonSettingsOverrides')
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const cancel = useCallback(() => clearTimeout(timer.current), [])

  const prefetch = useCallback(
    ({ addonName, addonVersion, variant, projectName }: PrefetchArgs) => {
      clearTimeout(timer.current)
      timer.current = setTimeout(() => {
        const args = {
          addonName,
          addonVersion,
          variant,
          projectName: projectName ?? null,
          siteId: null,
        }
        prefetchSchema(args)
        prefetchSettings(args)
        prefetchOverrides(args)
      }, HOVER_DELAY)
    },
    [prefetchSchema, prefetchSettings, prefetchOverrides],
  )

  useEffect(() => cancel, [cancel])

  return { prefetch, cancel }
}
