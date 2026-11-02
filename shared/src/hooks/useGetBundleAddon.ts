// a hook that checks if an addon is in the bundle the user's addon modules come from
import { useCallback } from 'react'
import semver from 'semver'
import { useRemoteModules } from '@shared/context'
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
  // the bundle as it was when the remotes were registered: it stays until a refresh, like the
  // code that runs, and a change to the bundle only asks for that refresh
  const { bundle } = useRemoteModules()

  const getBundleAddonVersion = useCallback(
    (addonName: string, options?: VersionOptions): string | undefined => {
      const version = bundle?.versions[addonName]
      if (!version || !matchesVersion(version, options)) return undefined
      return version
    },
    [bundle],
  )

  const bundleVariant: BundleMode = bundle?.variant ?? 'production'

  return {
    getBundleAddonVersion,
    bundleVariant,
    isLoading: !bundle,
  }
}

export default useGetBundleAddon
