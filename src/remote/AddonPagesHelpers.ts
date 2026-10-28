import type { Access, Contribution } from '@ynput/ayon-addon'
import { useMemo } from 'react'

type PageSlot = 'project.page' | 'studio.page'

// one warning per clash, not one per render
const warned = new Set<string>()

/**
 * The page contributions that get a tab: a built-in or legacy page with the same id wins, and
 * the clash is logged once.
 */
export const useAddonPages = <S extends PageSlot>(
  contributions: Contribution<S>[],
  reservedIds: string[],
): Contribution<S>[] => {
  const reservedKey = reservedIds.join(',')
  return useMemo(() => {
    const taken = new Set(reservedIds)
    return contributions.filter((page) => {
      if (!taken.has(page.id)) {
        taken.add(page.id)
        return true
      }
      if (!warned.has(page.key)) {
        warned.add(page.key)
        console.warn(
          `[addon ${page.addon.name}] page "${page.id}" (${page.slot}) is not shown: ` +
            'a built-in page or another addon already uses that id',
        )
      }
      return false
    })
    // reservedIds is compared by content
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contributions, reservedKey])
}

// AppNavLinks hides a tab and redirects away from it when the user lacks one of these
export const pageAccessLevels = (access?: Access) => (access ? [access] : [])

export const hasPageAccess = (
  access: Access | undefined,
  user: { isAdmin?: boolean; isManager?: boolean },
) => !access || !!user.isAdmin || (access === 'manager' && !!user.isManager)
