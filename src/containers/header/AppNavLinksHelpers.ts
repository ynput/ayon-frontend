import { useSelector } from 'react-redux'
import type { NavLinkItem } from './AppNavLinks'

export type NavLinkAccess = Record<string, boolean>

export const useNavLinkAccess = (): NavLinkAccess => {
  const isManager = useSelector((state: any) => state.user.data.isManager)
  const isAdmin = useSelector((state: any) => state.user.data.isAdmin)

  return {
    manager: isManager || isAdmin,
    admin: isAdmin,
  }
}

export const isNavLinkVisible = (item: NavLinkItem, access: NavLinkAccess) => {
  if (!(item.enabled ?? true)) return false
  if (!item.accessLevels?.length) return true
  return item.accessLevels.every((restriction) => access[restriction])
}
