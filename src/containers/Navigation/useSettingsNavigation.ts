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

/** Managers (exactly 700) don't get Global, Addons and Bundles. */
const useIsManager = () => {
  const { user } = useGlobalContext()
  return (user?.uiExposureLevel ?? 0) === 700
}

/** Studio settings' own sub-pages. */
const settingsTabs = (isManager: boolean): NavLinkItem[] => [
  ...(isManager
    ? []
    : [
        { name: 'Global', path: '/settings/server', module: 'server', accessLevels: ['admin'] },
        { name: 'Addons', path: '/settings/addons', module: 'addons', accessLevels: ['manager'] },
        {
          name: 'Bundles',
          path: '/settings/bundles',
          module: 'bundles',
          accessLevels: ['manager'],
          shortcut: 'B+B',
        },
      ]),
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
]

const settingsItem = (tabs: NavLinkItem[]): NavItem => ({
  id: 'settings',
  label: 'Settings',
  icon: 'settings',
  section: 'admin',
  // Studio settings; regular users get Site settings, the only tab they can open
  landing: 'studio',
  // addons' settings pages too, which only the settings page lists
  match: ['/settings'],
  tabs,
})

/** Studio settings: its sub-pages, and the classic addons' settings pages after them. */
export const useSettingsNavigation = () => {
  const isManager = useIsManager()
  const { data: addonsData } = useGetSettingsAddonsQuery({})

  const item = useMemo(
    () =>
      settingsItem([
        ...settingsTabs(isManager),
        ...((addonsData || []) as SettingsAddon[]).map((addon) => ({
          name: addon.title,
          path: `/settings/addon/${addon.name}`,
          module: addon.name,
          accessLevels: ['manager'],
        })),
      ]),
    [addonsData, isManager],
  )

  return { item, addonsData: addonsData as SettingsAddon[] | undefined, isManager }
}

/**
 * The admin pages, at the sidebar's bottom: who sees an item is who could open its page from the
 * old apps menu. In a project, Projects opens that project's settings. The Project manager draws
 * its own tab row.
 */
export const useAdminNavigation = (projectName?: string): NavItem[] => {
  const isManager = useIsManager()

  return useMemo(
    () => [
      settingsItem(settingsTabs(isManager)),
      {
        id: 'projects',
        label: 'Projects',
        icon: 'folder_managed',
        section: 'admin',
        match: ['/manageProjects'],
        tabs: [
          {
            name: 'Projects',
            path: projectName
              ? `/manageProjects/projectSettings?project=${encodeURIComponent(projectName)}`
              : '/manageProjects/projectSettings',
            module: 'projectSettings',
            shortcut: 'P+P',
          },
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
      {
        id: 'market',
        label: 'Market',
        icon: 'store',
        section: 'admin',
        tabs: [
          { name: 'Market', path: '/market', module: 'market', accessLevels: ['admin'], shortcut: 'M+M' },
        ],
      },
    ],
    [isManager, projectName],
  )
}
