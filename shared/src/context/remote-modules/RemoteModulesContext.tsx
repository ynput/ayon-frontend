import { ReactNode, useEffect, useRef, useState } from 'react'
import { loadRemote, registerRemotes } from '@module-federation/enhanced/runtime'
import { MANIFEST_MODULE, registerManifest, setManifestsLoading } from '@ynput/ayon-addon/host'
import { toast } from 'react-toastify'
import { RefreshToast } from '@shared/components/RefreshToast/RefreshToast'
import { useListFrontendModulesQuery } from '@shared/api'
import type { FrontendModuleListItem } from '@shared/api'
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
}

type Props = {
  children: ReactNode
  skip?: boolean
}

// Addons that list a `manifest` module declare their contributions to slots in it
// (@ynput/ayon-addon). It holds descriptions only, so every manifest loads at startup; the
// contributions' code loads when their slot needs it.
const loadManifests = async (remotes: Module[]) => {
  await Promise.all(
    remotes
      .filter((r) => r.modules.includes(MANIFEST_MODULE))
      .map(async (r) => {
        try {
          const manifest = await loadRemote<{ default: unknown }>(
            `${r.remote}/${MANIFEST_MODULE}`,
            { from: 'runtime' },
          )
          registerManifest({ name: r.addon, version: r.version, remote: r.remote }, manifest?.default)
        } catch (error) {
          console.error(`[addon ${r.addon}] its manifest failed to load`, error)
        }
      }),
  )
  setManifestsLoading(false)
}

export const RemoteModulesProvider = ({ children, skip }: Props) => {
  // only load if logged in
  const {
    data: addonRemoteModules = [],
    isLoading,
    isFetching,
  } = useListFrontendModulesQuery(undefined, {
    skip,
  })

  const {
    siteInfo,
    isLoading: { siteInfo: isLoadingInfo },
  } = useGlobalContext()

  const [remotesInitialized, setRemotesInitialized] = useState(false)
  // addon versions the remotes were registered with
  const registeredVersions = useRef<Record<string, string>>({})

  // Module federation can't swap a remote once registered, so after an addon update
  // (server restart or bundle change) the page would keep running the old addon build
  // against the new server. Ask the user to refresh so the new remotes get registered.
  useEffect(() => {
    if (!remotesInitialized || isFetching) return

    const updatedAddons = addonRemoteModules.filter(({ addonName, addonVersion }) => {
      const registeredVersion = registeredVersions.current[addonName]
      return registeredVersion !== undefined && registeredVersion !== addonVersion
    })

    const toastId = 'addon-versions-changed'

    // versions changed back to the loaded ones, the page is current again
    if (!updatedAddons.length) {
      toast.dismiss(toastId)
      return
    }

    const names = updatedAddons.map((a) => `${a.addonName} ${a.addonVersion}`).join(', ')
    const render = <RefreshToast message={`Addons updated (${names}). Refresh to load them.`} />

    if (toast.isActive(toastId)) {
      toast.update(toastId, { render })
    } else {
      toast.info(render, { toastId, autoClose: false, closeOnClick: false })
    }
  }, [addonRemoteModules, isFetching, remotesInitialized])

  useEffect(() => {
    // waiting for loading or it has already been initialized
    if (isLoading || isLoadingInfo || remotesInitialized) return

    // no remotes found, nothing to do
    if (!addonRemoteModules.length) {
      setRemotesInitialized(true)
      setManifestsLoading(false)
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
    loadManifests(allRemotes)
  }, [addonRemoteModules, isLoading, isLoadingInfo, remotesInitialized])

  return (
    <RemoteModulesContext.Provider
      value={{
        isLoading,
        modules: addonRemoteModules,
        remotesInitialized,
      }}
    >
      {children}
    </RemoteModulesContext.Provider>
  )
}
