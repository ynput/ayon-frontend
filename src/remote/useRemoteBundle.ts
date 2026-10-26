import { useCallback } from 'react'
import { useRemoteModules } from '@shared/context'
import { useListBundlesQuery } from '@shared/api'
import type { BundleMode } from '@shared/util'

// set on pages whose addon comes from the staging or dev bundle, not production
export type RemotePageBundle = {
  variant: Exclude<BundleMode, 'production'>
  addonName: string
  addonVersion: string
}

// Which bundle an addon's remote modules were loaded from, when it is not production
export const useRemoteBundle = () => {
  const { modules, variant = 'production' } = useRemoteModules()

  // with no dev bundle the server sends the production modules, so they aren't marked as dev
  const { data: { bundles = [] } = {}, isSuccess: hasCheckedDevBundles } = useListBundlesQuery(
    { archived: false },
    { skip: variant !== 'developer' },
  )
  const hasDevBundle = hasCheckedDevBundles && bundles.some((bundle) => bundle.isDev)
  const bundleVariant = variant === 'developer' && !hasDevBundle ? 'production' : variant

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
