import { ReactNode, useEffect, useMemo, useState } from 'react'
import { loadRemote, registerRemotes } from '@module-federation/enhanced/runtime'
import { MANIFEST_MODULE, registerManifest, setManifestsLoading } from '@ynput/ayon-addon/host'
import { toast } from 'react-toastify'
import { RefreshToast } from '@shared/components/RefreshToast/RefreshToast'
import { useListAddonsQuery, useListBundlesQuery, useListFrontendModulesQuery } from '@shared/api'
import type { FrontendModuleListItem } from '@shared/api'
import { getBundleModeFromUser } from '@shared/util'
import type { BundleMode } from '@shared/util'
import { useGlobalContext } from '../global/GlobalContextInstance'
import { RemoteModulesContext } from './RemoteModulesContextInstance'
import { getAddonChanges, resolveBundleAddons } from './bundleAddons'
import type { BundleAddons } from './bundleAddons'
import { addonDevUserProblem, fetchAddonDevInfo, readAddonDevRequest } from './addonDevOverride'
import type { AddonDevInfo, AddonDevOverride } from './addonDevOverride'
import { AddonDevBanner } from './AddonDevBanner'

type Module = {
  remote: string
  addon: string
  version: string
  modules: string[]
}

// an addon loaded from its dev server (?addonDev=...); every way it can fail is shown in the banner
export type AddonDevState =
  | { status: 'off' }
  // the request can't be used: a malformed or non-local URL, or a user without developer mode
  | { status: 'rejected'; request: string; reason: string }
  | { status: 'loading'; override: AddonDevOverride }
  // error: it was registered, but its manifest failed to load
  | { status: 'active'; override: AddonDevOverride; info: AddonDevInfo; error?: string }
  | { status: 'error'; override: AddonDevOverride; error: string }

export type RemoteModulesContextType = {
  isLoading: boolean
  modules: FrontendModuleListItem[]
  remotesInitialized: boolean
  // bundle the registered modules come from, set once the remotes are registered
  variant?: BundleMode
  // the addons of that bundle, set once they have loaded. Fixed until a refresh, like the modules.
  bundle?: BundleAddons
  addonDev: AddonDevState
}

type Registered = {
  variant: BundleMode
  modules: FrontendModuleListItem[]
}

type Props = {
  children: ReactNode
  skip?: boolean
}

// Addons that list a `manifest` module declare their contributions to slots in it
// (@ynput/ayon-addon). It holds descriptions only, so every manifest loads at startup; the
// contributions' code loads when their slot needs it.
// Returns the addons whose manifest failed.
const loadManifests = async (remotes: Module[]) => {
  const failed: Record<string, string> = {}
  await Promise.all(
    remotes
      .filter((r) => r.modules.includes(MANIFEST_MODULE))
      .map(async (r) => {
        try {
          const manifest = await loadRemote<{ default: unknown }>(
            `${r.remote}/${MANIFEST_MODULE}`,
            { from: 'runtime' },
          )
          const definition = manifest?.default as { contributes?: unknown } | undefined
          if (!Array.isArray(definition?.contributes)) {
            throw new Error('the manifest has no "contributes" list: export default defineAddon({ contributes })')
          }
          registerManifest({ name: r.addon, version: r.version, remote: r.remote }, manifest?.default)
        } catch (error) {
          console.error(`[addon ${r.addon}] its manifest failed to load`, error)
          failed[r.addon] = String(error)
        }
      }),
  )
  setManifestsLoading(false)
  return failed
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

  // the versions of every addon in the bundle, classic addon pages included
  const { data: addonsData, isFetching: isFetchingAddons } = useListAddonsQuery(
    {},
    { skip: skip || isLoadingUser },
  )
  const { data: bundlesData, isFetching: isFetchingBundles } = useListBundlesQuery(
    { archived: false },
    { skip: skip || isLoadingUser || variant !== 'developer' },
  )
  const addons = useMemo(() => addonsData?.addons ?? [], [addonsData])
  const bundles = useMemo(() => bundlesData?.bundles ?? [], [bundlesData])
  const liveBundle = useMemo(
    () => resolveBundleAddons(addons, bundles, variant, user?.name),
    [addons, bundles, variant, user?.name],
  )
  const isFetchingBundle = isFetchingAddons || isFetchingBundles

  // the dev override, read once: the remotes can only be registered once anyway
  const [request] = useState(readAddonDevRequest)
  const requestedOverride = request && 'override' in request ? request.override : undefined
  const [addonDev, setAddonDev] = useState<AddonDevState>(
    !request
      ? { status: 'off' }
      : 'override' in request
      ? { status: 'loading', override: request.override }
      : { status: 'rejected', ...request },
  )
  useEffect(() => {
    if (!requestedOverride || isLoadingUser) return
    const userProblem = addonDevUserProblem(user as Parameters<typeof addonDevUserProblem>[0])
    if (userProblem) {
      console.warn(`[addon dev] ignored: ${userProblem}`)
      setAddonDev({
        status: 'rejected',
        request: `${requestedOverride.addon}@${requestedOverride.url}`,
        reason: userProblem,
      })
      return
    }
    fetchAddonDevInfo(requestedOverride).then(
      (info) => setAddonDev({ status: 'active', override: requestedOverride, info }),
      (error: Error) =>
        setAddonDev({ status: 'error', override: requestedOverride, error: error.message }),
    )
  }, [requestedOverride, isLoadingUser, user])

  // the server's list, with the dev addon in place of its installed version (or added)
  const effectiveModules = useMemo<FrontendModuleListItem[]>(() => {
    if (addonDev.status !== 'active') return addonRemoteModules
    const { override, info } = addonDev
    return [
      ...addonRemoteModules.filter((addon) => addon.addonName !== override.addon),
      {
        addonName: override.addon,
        addonVersion: `${info.version}+dev`,
        modules: { [info.remote]: info.modules },
      },
    ]
  }, [addonRemoteModules, addonDev])

  const [remotesInitialized, setRemotesInitialized] = useState(false)
  // what the remotes were registered with. Federation keeps running these until a refresh,
  // so consumers get this snapshot, and the live list is only used to ask for the refresh.
  const [registered, setRegistered] = useState<Registered>()
  const [registeredBundle, setRegisteredBundle] = useState<BundleAddons>()

  // Doesn't hold up registering the remotes: only pages that need the versions wait for it
  useEffect(() => {
    if (skip || isLoadingUser || registeredBundle || !registered || isFetchingBundle) return
    setRegisteredBundle(liveBundle)
  }, [skip, isLoadingUser, registeredBundle, registered, isFetchingBundle, liveBundle])

  // Module federation can't swap a remote once registered, so after an addon update
  // (server restart or bundle change) the page would keep running the old addon build
  // against the new server. Ask the user to refresh so the new remotes get registered.
  // Switching bundle (e.g. turning on developer mode) needs the same refresh.
  useEffect(() => {
    if (!remotesInitialized || !registered || isFetching || isFetchingBundle) return

    const changes = getAddonChanges(
      { modules: registered.modules, bundle: registeredBundle },
      { modules: effectiveModules, bundle: liveBundle, addons },
    )

    const variantChanged = variant !== registered.variant

    const toastId = 'addon-versions-changed'

    // versions changed back to the loaded ones, the page is current again
    if (!changes.length && !variantChanged) {
      toast.dismiss(toastId)
      return
    }

    const message = variantChanged
      ? 'Bundle changed. Refresh to load its addon modules.'
      : `Addons updated (${changes.join(', ')}). Refresh to load them.`
    const render = <RefreshToast message={message} />

    if (toast.isActive(toastId)) {
      toast.update(toastId, { render })
    } else {
      toast.info(render, { toastId, autoClose: false, closeOnClick: false })
    }
  }, [
    effectiveModules,
    isFetching,
    isFetchingBundle,
    remotesInitialized,
    variant,
    registered,
    registeredBundle,
    liveBundle,
    addons,
  ])

  useEffect(() => {
    // waiting for loading or it has already been initialized
    if (
      isLoading ||
      isLoadingInfo ||
      isLoadingUser ||
      remotesInitialized ||
      addonDev.status === 'loading'
    )
      return

    // no remotes found, nothing to do
    if (!effectiveModules.length) {
      setRegistered({ variant, modules: effectiveModules })
      setRemotesInitialized(true)
      setManifestsLoading(false)
      return
    }

    // create a flat map of modules to load
    const allRemotes: Module[] = []

    effectiveModules.forEach((addon) => {
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

    setRegistered({ variant, modules: effectiveModules })

    const devAddon = addonDev.status === 'active' ? addonDev : undefined
    registerRemotes(
      allRemotes.map((r) => ({
        name: r.remote,
        alias: r.remote,
        entry:
          devAddon && r.addon === devAddon.override.addon
            ? `${devAddon.override.url}/remoteEntry.js?build=${devAddon.info.buildId}`
            : `/addons/${r.addon || r.remote}/${r.version}/frontend/modules/${
                r.remote
              }/remoteEntry.js?server=${siteInfo?.releaseInfo?.version || siteInfo?.releaseInfo}-${
                siteInfo?.releaseInfo?.buildDate
              }-${new Date().getTime()}`,
        type: 'module',
      })),
    )

    setRemotesInitialized(true)
    loadManifests(allRemotes).then((failed) => {
      const devError = devAddon && failed[devAddon.override.addon]
      if (devError)
        setAddonDev({ ...devAddon, error: `its manifest failed to load (${devError})` })
    })
  }, [
    effectiveModules,
    isLoading,
    isLoadingInfo,
    isLoadingUser,
    remotesInitialized,
    addonDev,
    variant,
  ])

  return (
    <RemoteModulesContext.Provider
      value={{
        isLoading,
        modules: registered?.modules ?? effectiveModules,
        remotesInitialized,
        variant: registered?.variant,
        bundle: registeredBundle,
        addonDev,
      }}
    >
      {children}
      {addonDev.status !== 'off' && <AddonDevBanner state={addonDev} />}
    </RemoteModulesContext.Provider>
  )
}
