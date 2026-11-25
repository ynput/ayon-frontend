import { useMemo } from 'react'
import { useGetSettingsAddonsQuery } from '@shared/api'
import { useGlobalContext } from '@shared/context'
import type { NavLinkItem } from '@containers/header/AppNavLinks'
import type { NavItem } from './types'

interface SettingsAddon {
  name: string
  title: string
  version: string
  settings: { sidebar?: string }
}

/** Studio settings: its sub-pages, and the classic addons' settings pages after them. */
export const useSettingsNavigation = () => {
  const { user } = useGlobalContext()
  const { uiExposureLevel: level = 0 } = user || {}
  // managers (exactly 700) don't get Global, Addons and Bundles
  const isManager = level === 700

  const { data: addonsData } = useGetSettingsAddonsQuery({})

  const item: NavItem = useMemo(() => {
    const adminExtras: NavLinkItem[] = [
      { name: 'Global', path: '/settings/server', module: 'server', accessLevels: ['admin'] },
      { name: 'Addons', path: '/settings/addons', module: 'addons', accessLevels: ['manager'] },
      {
        name: 'Bundles',
        path: '/settings/bundles',
        module: 'bundles',
        accessLevels: ['manager'],
        shortcut: 'B+B',
      },
    ]

    const tabs: NavLinkItem[] = [
      ...(isManager ? [] : adminExtras),
      {
        name: 'Studio settings',
        path: '/settings/studio',
        module: 'studio',
        accessLevels: ['manager'],
        shortcut: 'S+S',
      },
      { name: 'Site settings', path: '/settings/site', module: 'site', accessLevels: [] },
      {
        name: 'Anatomy presets',
        path: '/settings/anatomyPresets',
        module: 'anatomyPresets',
        accessLevels: ['manager'],
      },
      {
        name: 'Attributes',
        path: '/settings/attributes',
        module: 'attributes',
        accessLevels: ['manager'],
      },
      {
        name: 'Users',
        path: '/settings/users',
        module: 'users',
        accessLevels: ['manager'],
        shortcut: 'U+U',
      },
      {
        name: 'Permissions',
        path: '/settings/accessGroups',
        module: 'accessGroups',
        accessLevels: ['manager'],
      },
      { name: 'Secrets', path: '/settings/secrets', module: 'secrets', accessLevels: ['manager'] },
      ...((addonsData || []) as SettingsAddon[]).map((addon) => ({
        name: addon.title,
        path: `/settings/addon/${addon.name}`,
        module: addon.name,
        accessLevels: ['manager'],
      })),
    ]

    return {
      id: 'settings',
      label: 'Settings',
      icon: 'settings',
      section: 'admin',
      // where the apps menu's Studio settings went; regular users get Site settings
      landing: 'studio',
      tabs,
    }
  }, [addonsData, isManager])

  return { item, addonsData: addonsData as SettingsAddon[] | undefined, isManager }
}

/**
 * Home's admin section, which replaces the apps menu's links: who sees an item is who could open
 * its page from the menu. The Project manager draws its own tab row.
 */
export const useAdminNavigation = (): NavItem[] => {
  const { item: settings } = useSettingsNavigation()

  return useMemo(
    () => [
      {
        id: 'projects',
        label: 'Projects',
        icon: 'category',
        section: 'admin',
        match: ['/manageProjects'],
        tabs: [
          {
            name: 'Projects',
            path: '/manageProjects/projectSettings',
            module: 'projectSettings',
            shortcut: 'P+P',
          },
        ],
      },
      settings,
      {
        id: 'market',
        label: 'Market',
        icon: 'store',
        section: 'admin',
        tabs: [
          { name: 'Market', path: '/market', module: 'market', accessLevels: ['admin'], shortcut: 'M+M' },
        ],
      },
      {
        id: 'events',
        label: 'Events',
        icon: 'history',
        section: 'admin',
        tabs: [
          { name: 'Events', path: '/events', module: 'events', accessLevels: ['manager'], shortcut: 'E+E' },
        ],
      },
      {
        id: 'services',
        label: 'Services',
        icon: 'home_repair_service',
        section: 'admin',
        tabs: [
          {
            name: 'Services',
            path: '/services',
            module: 'services',
            accessLevels: ['manager'],
            shortcut: 'V+V',
          },
        ],
      },
    ],
    [settings],
  )
}
