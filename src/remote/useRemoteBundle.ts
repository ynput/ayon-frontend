import { useCallback } from 'react'
import { useRemoteModules } from '@shared/context'
import { useGetBundleAddon } from '@shared/hooks'
import type { BundleMode } from '@shared/util'

// set on pages whose addon comes from the staging or dev bundle, not production
export type RemotePageBundle = {
  variant: Exclude<BundleMode, 'production'>
  addonName: string
  addonVersion: string
}

// Which bundle an addon's remote modules were loaded from, when it is not production
export const useRemoteBundle = () => {
  // the registered modules, so the version is the one that runs until a refresh
  const { modules } = useRemoteModules()
  const { bundleVariant } = useGetBundleAddon()

  const getAddonBundle = useCallback(
    (addonName: string): RemotePageBundle | undefined => {
      if (bundleVariant === 'production') return undefined
      const addonVersion = modules.find((m) => m.addonName === addonName)?.addonVersion
      if (!addonVersion) return undefined
      return { variant: bundleVariant, addonName, addonVersion }
    },
    [modules, bundleVariant],
  )

  return { getAddonBundle }
}
