// a hook that checks if an addon is in the bundle the user's addon modules come from
import { useCallback } from 'react'
import semver from 'semver'
import { useListAddonsQuery, useListBundlesQuery } from '@shared/api'
import { useGlobalContext, useRemoteModules } from '@shared/context'
import { getBundleModeFromUser } from '@shared/util'
import type { BundleMode } from '@shared/util'

type VersionOptions = { version?: string; minVersion?: string }

const matchesVersion = (version: string, { version: exact, minVersion }: VersionOptions = {}) => {
  if (exact && version !== exact) return false
  if (!minVersion) return true
  try {
    return (
      semver.gte(version, minVersion) || semver.gte(semver.coerce(version) || '0.0.0', minVersion)
    )
  } catch {
    return false
  }
}

export const useGetBundleAddon = () => {
  const { user } = useGlobalContext()
  // the bundle the remotes were registered from, or the user's mode before that
  const { variant: registeredVariant } = useRemoteModules()
  const mode = registeredVariant ?? getBundleModeFromUser(user)

  const { data: addonsData, isLoading: isLoadingAddons } = useListAddonsQuery({})
  const { data: { bundles = [] } = {}, isLoading: isLoadingBundles } = useListBundlesQuery(
    { archived: false },
    { skip: mode !== 'developer' },
  )

  // only the user's own dev bundle counts. Without one the server sends production.
  const devBundle =
    mode === 'developer'
      ? bundles.find((bundle) => bundle.isDev && bundle.activeUser === user?.name)
      : undefined
  const bundleVariant: BundleMode = mode === 'developer' && !devBundle ? 'production' : mode

  const getBundleAddonVersion = useCallback(
    (addonName: string, options?: VersionOptions): string | undefined => {
      const addon = addonsData?.addons?.find((a) => a.name === addonName)
      const version =
        bundleVariant === 'developer'
          ? devBundle?.addons?.[addonName] ?? undefined
          : bundleVariant === 'staging'
          ? addon?.stagingVersion
          : addon?.productionVersion

      if (!version || !matchesVersion(version, options)) return undefined
      return version
    },
    [addonsData, bundleVariant, devBundle],
  )

  return {
    getBundleAddonVersion,
    bundleVariant,
    isLoading: isLoadingAddons || (mode === 'developer' && isLoadingBundles),
  }
}

export default useGetBundleAddon
