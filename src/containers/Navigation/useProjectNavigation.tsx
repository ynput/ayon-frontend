import { useMemo } from 'react'
import { useContributions } from '@ynput/ayon-addon'
import type { Contribution } from '@ynput/ayon-addon'
import { contributionTags, useHiddenContributions } from '@ynput/ayon-addon/host'
import { useGetProjectAddonsQuery } from '@shared/api'
import { useGetBundleAddon } from '@shared/hooks'
import { useGlobalContext } from '@shared/context'
import type { RemoteAddonProject } from '@shared/context'
import { useAppSelector } from '@state/store'
import { useLoadRemotePages } from '@/remote/useLoadRemotePages'
import { useAddonPages } from '@/remote/AddonPagesHelpers'
import { RemotePageBundleDot } from '@/remote/RemotePageBundleDot'
import { useRemoteBundle } from '@/remote/useRemoteBundle'
import type { RemotePageBundle } from '@/remote/useRemoteBundle'
import { KNOWN_PROJECT_PAGES } from './knownPages'
import { placePages, type PageEntry } from './placePages'
import type { NavItem } from './types'

export const BROWSER_FLAG = 'enable-legacy-version-browser'

// modules rendered by this repo, they don't need to wait for addon remote modules to load
export const PROJECT_BUILT_IN_MODULES = [
  'overview',
  'tasks',
  'browser',
  'products',
  'lists',
  'reviews',
  'workfiles',
]

/**
 * Tabs AYON always shows for an addon: its project.page with this id (or its legacy remote) fills
 * the tab and sets who sees it; without one the project page shows a fallback.
 */
export interface OwnedProjectPage {
  name: string
  module: string
  viewType?: string
  addon: string
}

export const OWNED_PROJECT_PAGES: OwnedProjectPage[] = [
  { name: 'Schedule', module: 'scheduler', viewType: 'scheduler', addon: 'planner' },
  { name: 'Reports', module: 'reports', viewType: 'reports', addon: 'reports' },
]

const OWNED_PAGES = OWNED_PROJECT_PAGES.map(({ module, viewType, addon }) => ({
  id: module,
  viewType,
  addon,
}))

/** A tab AYON shows for an addon whose page the user's exposure level hides: no tab, no fallback */
export const isHiddenOwnedPage = (hiddenPages: Contribution<'project.page'>[], module: string) =>
  hiddenPages.some((page) =>
    OWNED_PROJECT_PAGES.some(
      (owned) => owned.module === module && page.id === module && owned.addon === page.addon.name,
    ),
  )

/**
 * Everything a project's pages come from: core modules, the addon pages AYON reserves, legacy
 * keyword modules, page contributions and classic iframe addons, and the sidebar items built
 * from them. The project page renders from the same data, so its tabs and pages always agree.
 */
export const useProjectNavigation = (projectName: string) => {
  const { siteInfo } = useGlobalContext()
  // null in the generated type, a default value only covers undefined
  const frontendFlags = siteInfo?.frontendFlags ?? []
  const isManager = useAppSelector((state) => state.user.data.isManager)
  const isAdmin = useAppSelector((state) => state.user.data.isAdmin)

  // addons in the bundle the user's addon modules come from (production, staging or dev)
  const { getBundleAddonVersion, isLoading: addonsListLoading } = useGetBundleAddon()

  const {
    data: addonsData = [],
    isLoading: addonsLoading,
    isError: addonsIsError,
  } = useGetProjectAddonsQuery(
    { getVersion: getBundleAddonVersion },
    { skip: !projectName || addonsListLoading },
  )
  const hasReview = !!getBundleAddonVersion('review')

  // remote modules don't depend on the project, so load them alongside it
  const { remotePages, isLoading: isLoadingModules } = useLoadRemotePages({
    moduleKey: 'Project',
    skip: !projectName,
  }) as {
    remotePages: (RemoteAddonProject & { remoteBundle?: RemotePageBundle })[]
    isLoading: boolean
  }

  // built in tabs that render addon remote modules are marked like remote pages
  const { getAddonBundle } = useRemoteBundle()

  // pages addons contribute to the project.page slot; built-in and legacy pages win on an id clash
  const { contributions: pageContributions, isLoading: isLoadingContributions } =
    useContributions('project.page')
  const addonPages = useAddonPages(
    pageContributions,
    [
      ...PROJECT_BUILT_IN_MODULES,
      ...OWNED_PROJECT_PAGES.map((p) => p.module),
      ...remotePages.map((p) => p.module),
      ...addonsData.map((a) => a.name),
    ],
    [...OWNED_PROJECT_PAGES.map((p) => p.viewType), ...remotePages.map((p) => p.viewType)],
    OWNED_PAGES,
  )
  // the addon pages the user's exposure level hides (minExposureLevel, access)
  const hiddenPages = useHiddenContributions('project.page')

  const showBrowser = frontendFlags.includes(BROWSER_FLAG)

  const items: NavItem[] = useMemo(() => {
    const path = (module: string) => `/projects/${projectName}/${module}`

    const production: NavItem = {
      id: 'production',
      label: 'Production',
      icon: 'table_rows',
      section: 'main',
      tabs: [
        { name: 'Overview', path: path('overview'), module: 'overview', viewType: 'overview', uriSync: true },
        { name: 'Task progress', path: path('tasks'), module: 'tasks', viewType: 'taskProgress', uriSync: true },
        {
          name: 'Browser',
          path: path('browser'),
          module: 'browser',
          uriSync: true,
          deprecated: true,
          enabled: showBrowser,
        },
        { name: 'Products', path: path('products'), module: 'products', viewType: 'versions', uriSync: true },
        { name: 'Lists', path: path('lists'), module: 'lists', viewType: 'lists' },
      ],
    }

    const review: NavItem = {
      id: 'reviews',
      label: 'Review',
      icon: 'play_circle',
      section: 'review',
      tabs: [
        {
          name: 'Review',
          path: path('reviews'),
          module: 'reviews',
          viewType: 'reviews',
          startContent: <RemotePageBundleDot bundle={getAddonBundle('review')} />,
        },
      ],
    }

    const owned: PageEntry[] = OWNED_PROJECT_PAGES.filter(
      (owned) => !isHiddenOwnedPage(hiddenPages, owned.module),
    ).map(({ name, module, viewType, addon }) => {
      const page = addonPages.find((p) => p.id === module)
      // the slot inspector's tags on the tab, as for other addon pages: the page itself has none
      const tags = page && contributionTags(page)
      return {
        id: module,
        addon,
        meta: page,
        tags,
        tab: {
          name,
          path: path(module),
          module,
          viewType,
          startContent: (
            <RemotePageBundleDot
              bundle={
                remotePages.find((remote) => remote.module === module)?.remoteBundle ??
                getAddonBundle(addon)
              }
            />
          ),
          ...tags,
        },
      }
    })

    const workfiles: NavItem = {
      id: 'workfiles',
      label: 'Workfiles',
      icon: 'description',
      section: 'pipeline',
      tabs: [{ name: 'Workfiles', path: path('workfiles'), module: 'workfiles', uriSync: true }],
    }

    const remotes: PageEntry[] = remotePages
      .filter((remote) => !OWNED_PROJECT_PAGES.some((p) => p.module === remote.module))
      .map((remote) => ({
        id: `remote:${remote.module}`,
        tab: {
          name: remote.name || remote.module,
          module: remote.module,
          path: path(remote.module),
          viewType: remote.viewType,
          startContent: <RemotePageBundleDot bundle={remote.remoteBundle} />,
        },
      }))

    const contributed: PageEntry[] = addonPages
      .filter((page) => !OWNED_PAGES.some((p) => p.id === page.id))
      .map((page) => {
        // the slot inspector's tags on the tab, while it is on
        const tags = contributionTags(page)
        return {
          id: `addon:${page.addon.name}/${page.id}`,
          addon: page.addon.name,
          meta: page,
          tags,
          tab: {
            name: page.title,
            module: page.id,
            path: path(page.id),
            viewType: page.viewType,
            startContent: <RemotePageBundleDot bundle={getAddonBundle(page.addon.name)} />,
            ...tags,
          },
        }
      })

    const classic: PageEntry[] = addonsData
      .filter((addon) => {
        if (addon.settings.admin && !isAdmin) return false
        if (addon.settings.manager && !isManager) return false
        return true
      })
      .map((addon) => ({
        id: `classic:${addon.name}`,
        addon: addon.name,
        tab: {
          name: addon.title,
          path: `/projects/${projectName}/addon/${addon.name}`,
          module: addon.name,
        },
      }))

    // one pass, so one addon's group spans its reserved and contributed pages
    const placed = placePages(
      production,
      [...owned, ...remotes, ...contributed, ...classic],
      KNOWN_PROJECT_PAGES,
    )
    // Workfiles after the reserved pages' items: today's tab order for the flattened tabs
    const ownedModules = owned.map((entry) => entry.tab.module)
    let afterOwned = 0
    placed.forEach((item, index) => {
      if (item.tabs.some((tab) => ownedModules.includes(tab.module))) afterOwned = index + 1
    })
    return [
      production,
      review,
      ...placed.slice(0, afterOwned),
      workfiles,
      ...placed.slice(afterOwned),
    ]
  }, [
    projectName,
    showBrowser,
    hiddenPages,
    addonPages,
    remotePages,
    addonsData,
    getAddonBundle,
    isAdmin,
    isManager,
  ])

  return {
    items,
    addonsData,
    addonsLoading,
    addonsIsError,
    addonsListLoading,
    hasReview,
    remotePages,
    isLoadingModules,
    addonPages,
    isLoadingContributions,
    hiddenPages,
  }
}
