import { ReactNode, useEffect, useRef, useState } from 'react'
import { registerRemotes } from '@module-federation/enhanced/runtime'
import { toast } from 'react-toastify'
import { RefreshToast } from '@shared/components/RefreshToast/RefreshToast'
import { useListFrontendModulesQuery } from '@shared/api'
import type { FrontendModuleListItem } from '@shared/api'
import { getBundleModeFromUser } from '@shared/util'
import type { BundleMode } from '@shared/util'
import { useGlobalContext } from '../global/GlobalContextInstance'
import { RemoteModulesContext } from './RemoteModulesContextInstance'

type Module = {
  remote: string
  addon: string
  version: string
  modules: string[]
}

export type RemoteModulesContextType = {
  isLoading: boolean
  modules: FrontendModuleListItem[]
  remotesInitialized: boolean
  // bundle the registered modules come from, set once the remotes are registered
  variant?: BundleMode
}

type Registered = {
  variant: BundleMode
  modules: FrontendModuleListItem[]
}

type Props = {
  children: ReactNode
  skip?: boolean
}

export const RemoteModulesProvider = ({ children, skip }: Props) => {
  const {
    siteInfo,
    user,
    isLoading: { siteInfo: isLoadingInfo, user: isLoadingUser },
  } = useGlobalContext()

  // the modules of the bundle the user is on (production, staging or their dev bundle)
  const variant = getBundleModeFromUser(user)

  // only load if logged in, and once we know the bundle the user is on
  const {
    data: addonRemoteModules = [],
    isLoading,
    isFetching,
  } = useListFrontendModulesQuery(
    { variant },
    {
      skip: skip || isLoadingUser,
    },
  )

  const [remotesInitialized, setRemotesInitialized] = useState(false)
  // what the remotes were registered with. Federation keeps running these until a refresh,
  // so consumers get this snapshot, and the live list is only used to ask for the refresh.
  const [registered, setRegistered] = useState<Registered>()
  // addon versions and bundle variant the remotes were registered with
  const registeredVersions = useRef<Record<string, string>>({})
  const registeredVariant = useRef<string | undefined>(undefined)

  // Module federation can't swap a remote once registered, so after an addon update
  // (server restart or bundle change) the page would keep running the old addon build
  // against the new server. Ask the user to refresh so the new remotes get registered.
  // Switching bundle (e.g. turning on developer mode) needs the same refresh.
  useEffect(() => {
    if (!remotesInitialized || isFetching) return

    const updatedAddons = addonRemoteModules.filter(({ addonName, addonVersion }) => {
      const registeredVersion = registeredVersions.current[addonName]
      return registeredVersion !== undefined && registeredVersion !== addonVersion
    })

    const variantChanged = variant !== registeredVariant.current

    const toastId = 'addon-versions-changed'

    // versions changed back to the loaded ones, the page is current again
    if (!updatedAddons.length && !variantChanged) {
      toast.dismiss(toastId)
      return
    }

    const names = updatedAddons.map((a) => `${a.addonName} ${a.addonVersion}`).join(', ')
    const message = variantChanged
      ? 'Bundle changed. Refresh to load its addon modules.'
      : `Addons updated (${names}). Refresh to load them.`
    const render = <RefreshToast message={message} />

    if (toast.isActive(toastId)) {
      toast.update(toastId, { render })
    } else {
      toast.info(render, { toastId, autoClose: false, closeOnClick: false })
    }
  }, [addonRemoteModules, isFetching, remotesInitialized, variant])

  useEffect(() => {
    // waiting for loading or it has already been initialized
    if (isLoading || isLoadingInfo || isLoadingUser || remotesInitialized) return

    // no remotes found, nothing to do
    if (!addonRemoteModules.length) {
      registeredVariant.current = variant
      setRegistered({ variant, modules: addonRemoteModules })
      setRemotesInitialized(true)
      return
    }

    // create a flat map of modules to load
    const allRemotes: Module[] = []

    addonRemoteModules.forEach((addon) => {
      const { addonName, addonVersion, modules = {} } = addon

      Object.entries(modules).forEach(([remote, modules]) => {
        allRemotes.push({
          remote,
          addon: addonName,
          version: addonVersion,
          modules,
        })
      })
    })

    registeredVersions.current = Object.fromEntries(allRemotes.map((r) => [r.addon, r.version]))
    registeredVariant.current = variant
    setRegistered({ variant, modules: addonRemoteModules })

    registerRemotes(
      allRemotes.map((r) => ({
        name: r.remote,
        alias: r.remote,
        entry: `/addons/${r.addon || r.remote}/${r.version}/frontend/modules/${
          r.remote
        }/remoteEntry.js?server=${siteInfo?.releaseInfo?.version || siteInfo?.releaseInfo}-${
          siteInfo?.releaseInfo?.buildDate
        }-${new Date().getTime()}`,
        type: 'module',
      })),
    )

    setRemotesInitialized(true)
  }, [addonRemoteModules, isLoading, isLoadingInfo, isLoadingUser, remotesInitialized, variant])

  return (
    <RemoteModulesContext.Provider
      value={{
        isLoading,
        modules: registered?.modules ?? addonRemoteModules,
        remotesInitialized,
        variant: registered?.variant,
      }}
    >
      {children}
    </RemoteModulesContext.Provider>
  )
}
