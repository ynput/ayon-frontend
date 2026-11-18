import { ReactNode, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { loadRemote, registerRemotes } from '@module-federation/enhanced/runtime'
import { EXPOSURE, setExposureLevel, setManifestsLoading } from '@ynput/ayon-addon/host'
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
import {
  addonDevRequestKey,
  addonDevStateKey,
  addonDevUserProblem,
  fetchAddonDevInfo,
  readAddonDevRequests,
} from './addonDevOverride'
import type { AddonDevInfo, AddonDevOverride } from './addonDevOverride'
import { AddonDevBanner } from './AddonDevBanner'
import { loadManifests } from './loadManifests'

type Module = {
  remote: string
  addon: string
  version: string
  modules: string[]
}

// an addon loaded from its dev server (?addonDev=...), one per addon; every way it can fail is
// shown in the banner
export type AddonDevState =
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
  // one per ?addonDev= entry, empty when none
  addonDev: AddonDevState[]
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

  // who sees which addon contributions (minExposureLevel): the registry hides the rest before any
  // of their code loads. Service users are admins on the server (src/helpers/serviceUser.ts).
  const exposureLevel =
    user?.uiExposureLevel ?? (user?.data?.isService ? EXPOSURE.admin : undefined)
  // a layout effect: before the effects below register manifests and surfaces read the registry
  useLayoutEffect(() => {
    setExposureLevel(exposureLevel)
  }, [exposureLevel])

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

  // the dev overrides, read once: the remotes can only be registered once anyway
  const [requests] = useState(() => readAddonDevRequests())
  const [addonDev, setAddonDev] = useState<AddonDevState[]>(() =>
    requests.map((request) =>
      'override' in request
        ? { status: 'loading', override: request.override }
        : { status: 'rejected', ...request },
    ),
  )
  // each entry on its own: one dev server down doesn't keep the others from loading
  const setEntry = useCallback(
    (key: string, state: AddonDevState) =>
      setAddonDev((current) =>
        current.map((entry) => (addonDevStateKey(entry) === key ? state : entry)),
      ),
    [],
  )
  useEffect(() => {
    if (isLoadingUser) return
    const overrides = requests.flatMap((request) =>
      'override' in request ? [request.override] : [],
    )
    if (!overrides.length) return
    const userProblem = addonDevUserProblem(user as Parameters<typeof addonDevUserProblem>[0])
    if (userProblem) console.warn(`[addon dev] ignored: ${userProblem}`)
    for (const override of overrides) {
      const key = addonDevRequestKey({ override })
      if (userProblem) {
        setEntry(key, { status: 'rejected', request: key, reason: userProblem })
        continue
      }
      fetchAddonDevInfo(override).then(
        (info) => setEntry(key, { status: 'active', override, info }),
        (error: Error) => setEntry(key, { status: 'error', override, error: error.message }),
      )
    }
  }, [requests, isLoadingUser, user, setEntry])

  const activeDev = useMemo(
    () =>
      addonDev.filter(
        (entry): entry is Extract<AddonDevState, { status: 'active' }> => entry.status === 'active',
      ),
    [addonDev],
  )
  // the server's list, with the dev addons in place of their installed versions (or added)
  const effectiveModules = useMemo<FrontendModuleListItem[]>(() => {
    if (!activeDev.length) return addonRemoteModules
    const devNames = new Set(activeDev.map(({ override }) => override.addon))
    return [
      ...addonRemoteModules.filter((addon) => !devNames.has(addon.addonName)),
      ...activeDev.map(({ override, info }) => ({
        addonName: override.addon,
        addonVersion: `${info.version}+dev`,
        modules: { [info.remote]: info.modules },
      })),
    ]
  }, [addonRemoteModules, activeDev])

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
      addonDev.some((entry) => entry.status === 'loading')
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

    const devAddons = new Map(activeDev.map((entry) => [entry.override.addon, entry]))
    registerRemotes(
      allRemotes.map((r) => {
        const devAddon = devAddons.get(r.addon)
        return {
          name: r.remote,
          alias: r.remote,
          entry: devAddon
            ? `${devAddon.override.url}/remoteEntry.js?build=${devAddon.info.buildId}`
            : `/addons/${r.addon || r.remote}/${r.version}/frontend/modules/${
                r.remote
              }/remoteEntry.js?server=${siteInfo?.releaseInfo?.version || siteInfo?.releaseInfo}-${
                siteInfo?.releaseInfo?.buildDate
              }-${new Date().getTime()}`,
          type: 'module',
        }
      }),
    )

    setRemotesInitialized(true)
    loadManifests(allRemotes, (id) =>
      loadRemote<{ default: unknown }>(id, { from: 'runtime' }),
    ).then((failed) => {
      for (const devAddon of devAddons.values()) {
        const devError = failed[devAddon.override.addon]
        if (devError)
          setEntry(addonDevStateKey(devAddon), {
            ...devAddon,
            error: `its manifest failed to load (${devError})`,
          })
      }
    })
  }, [
    effectiveModules,
    isLoading,
    isLoadingInfo,
    isLoadingUser,
    remotesInitialized,
    addonDev,
    activeDev,
    variant,
    setEntry,
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
      {addonDev.length > 0 && <AddonDevBanner states={addonDev} />}
    </RemoteModulesContext.Provider>
  )
}
