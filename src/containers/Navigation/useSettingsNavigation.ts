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

    return { id: 'settings', label: 'Settings', icon: 'settings', section: 'admin', tabs }
  }, [addonsData, isManager])

  return { item, addonsData: addonsData as SettingsAddon[] | undefined, isManager }
}
