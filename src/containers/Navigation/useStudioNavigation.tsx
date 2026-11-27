import { useMemo } from 'react'
import { useContributions } from '@ynput/ayon-addon'
import { contributionTags } from '@ynput/ayon-addon/host'
import { useGetDashboardAddonsQuery } from '@shared/api'
import { useGetBundleAddon } from '@shared/hooks'
import { useAppSelector } from '@state/store'
import { useLoadRemotePages } from '@/remote/useLoadRemotePages'
import { useAddonPages } from '@/remote/AddonPagesHelpers'
import { RemotePageBundleDot } from '@/remote/RemotePageBundleDot'
import { useRemoteBundle } from '@/remote/useRemoteBundle'
import { KNOWN_STUDIO_PAGES } from './knownPages'
import { placePages, type PageEntry } from './placePages'
import type { NavItem } from './types'

// pages rendered by this repo, they don't need to wait for addon remote modules to load
export const STUDIO_BUILT_IN_MODULES = ['tasks', 'projects']

export interface DashboardAddon {
  name: string
  title: string
  version: string
  settings?: {
    admin?: boolean
    manager?: boolean
  }
}

/**
 * Everything Home's pages come from (built-in pages, the planner splash, classic dashboard addons,
 * legacy Studio modules and studio.page contributions) and the sidebar items built from them.
 */
export const useStudioNavigation = () => {
  const isAdmin = useAppSelector((state) => state.user.data.isAdmin)
  const isManager = useAppSelector((state) => state.user.data.isManager)

  // addons in the bundle the user's addon modules come from (production, staging or dev)
  const { getBundleAddonVersion, isLoading: isLoadingBundleAddons } = useGetBundleAddon()

  const { data: addonsData = [] } = useGetDashboardAddonsQuery(
    { getVersion: getBundleAddonVersion },
    { skip: isLoadingBundleAddons },
  )
  const dashboardAddons = addonsData as DashboardAddon[]

  const { remotePages, isLoading: isLoadingRemotePages } = useLoadRemotePages({
    moduleKey: 'Studio',
    skip: false,
  })

  const hasPlanner = !!getBundleAddonVersion('planner')
  const { getAddonBundle } = useRemoteBundle()

  // pages addons contribute to the studio.page slot; built-in and legacy pages win on an id clash
  const { contributions: studioPageContributions, isLoading: isLoadingContributions } =
    useContributions('studio.page')
  const addonStudioPages = useAddonPages(
    studioPageContributions,
    [
      ...STUDIO_BUILT_IN_MODULES,
      'planner',
      ...dashboardAddons.map((a) => a.name),
      ...remotePages.map((p) => p.module),
    ],
    remotePages.map((p) => p.viewType),
  )

  const items: NavItem[] = useMemo(() => {
    const myWork: NavItem = {
      id: 'my-work',
      label: 'My work',
      icon: 'person',
      section: 'main',
      tabs: [
        {
          name: 'Tasks', // PROTOTYPE (navigation mix): develop's name
          path: '/dashboard/tasks',
          module: 'tasks',
          accessLevels: [],
          shortcut: 'H+H',
        },
        {
          name: 'Projects', // PROTOTYPE (navigation mix): develop's name
          path: '/dashboard/projects',
          module: 'projects',
          viewType: 'projects-overview',
        },
      ],
    }

    const entries: PageEntry[] = [
      // the planner splash when the addon is missing; its own pages handle Home otherwise
      ...(!hasPlanner
        ? [
            {
              id: 'planner',
              tab: {
                name: 'Planner',
                path: '/dashboard/planner',
                module: 'planner',
                accessLevels: [],
              },
            },
          ]
        : []),
      ...dashboardAddons
        .filter((addon) => {
          if (addon?.settings?.admin && !isAdmin) return false
          if (addon?.settings?.manager && !isManager) return false
          return true
        })
        .map((addon) => ({
          id: `classic:${addon.name}`,
          addon: addon.name,
          tab: { name: addon.title, path: `/dashboard/addon/${addon.name}`, module: addon.name },
        })),
      ...remotePages.map((remote) => ({
        id: `remote:${remote.module}`,
        tab: {
          name: remote.name || remote.module,
          path: `/dashboard/${remote.module}`,
          module: remote.module,
          viewType: remote.viewType,
          startContent: <RemotePageBundleDot bundle={remote.remoteBundle} />,
        },
      })),
      ...addonStudioPages.map((page) => {
        // the slot inspector's tags on the tab, while it is on
        const tags = contributionTags(page)
        return {
          id: `addon:${page.addon.name}/${page.id}`,
          addon: page.addon.name,
          meta: page,
          tags,
          tab: {
            name: page.title,
            path: `/dashboard/${page.id}`,
            module: page.id,
            viewType: page.viewType,
            startContent: <RemotePageBundleDot bundle={getAddonBundle(page.addon.name)} />,
            ...tags,
          },
        }
      }),
    ]

    return [myWork, ...placePages(myWork, entries, KNOWN_STUDIO_PAGES)]
  }, [
    hasPlanner,
    dashboardAddons,
    remotePages,
    addonStudioPages,
    getAddonBundle,
    isAdmin,
    isManager,
  ])

  return {
    items,
    dashboardAddons,
    remotePages,
    isLoadingRemotePages,
    addonStudioPages,
    isLoadingContributions,
    hasPlanner,
  }
}
