import type { Access, Contribution } from '@ynput/ayon-addon'
import { useMemo } from 'react'
import { viewTypes } from '@shared/containers/Views/types'

type PageSlot = 'project.page' | 'studio.page'

// View types AYON uses itself. Views are stored per view type for the whole app, not per page, so
// an addon page using one of these would read and write the built-in page's views.
const BUILT_IN_VIEW_TYPES: string[] = [...viewTypes, 'tasks', 'projects-overview', 'scheduler']
const BUILT_IN_VIEW_TYPE_PREFIXES = ['inbox-', 'import.']

const isBuiltInViewType = (viewType: string) =>
  BUILT_IN_VIEW_TYPES.includes(viewType) ||
  BUILT_IN_VIEW_TYPE_PREFIXES.some((prefix) => viewType.startsWith(prefix))

// one warning per clash, not one per render
const warned = new Set<string>()

const warnOnce = (page: Contribution<PageSlot>, reason: string) => {
  if (warned.has(page.key)) return
  warned.add(page.key)
  console.warn(
    `[addon ${page.addon.name}] page "${page.id}" (${page.slot}) is not shown: ${reason}`,
  )
}

/**
 * A tab AYON always shows (e.g. the project page's Schedule, with a splash screen when the addon is
 * missing) that one addon's page fills: its `id`, the page's `viewType` and the addon's name.
 */
export interface OwnedPage {
  id: string
  viewType?: string
  addon: string
}

/**
 * The page contributions that get a tab. A built-in or legacy page wins over an addon page with
 * the same id or view type, and an earlier addon page over a later one; each clash is logged once.
 */
export const useAddonPages = <S extends PageSlot>(
  contributions: Contribution<S>[],
  reservedIds: string[],
  // view types of the legacy (keyword) pages; AYON's own are always reserved
  reservedViewTypes: (string | undefined)[] = [],
  // AYON's tabs that one addon's page fills: that addon's page may use the reserved id and view type
  ownedPages: OwnedPage[] = [],
): Contribution<S>[] => {
  const reservedKey = [
    reservedIds.join(','),
    reservedViewTypes.join(','),
    ownedPages.map((owned) => `${owned.id}:${owned.viewType}:${owned.addon}`).join(','),
  ].join('|')
  return useMemo(() => {
    const takenIds = new Set(reservedIds)
    const takenViewTypes = new Set(reservedViewTypes.filter(Boolean))
    const filledOwnedIds = new Set<string>()
    return contributions.filter((page) => {
      const owned = ownedPages.find((owned) => owned.id === page.id)
      if (
        owned?.addon === page.addon.name &&
        page.viewType === owned.viewType &&
        !filledOwnedIds.has(page.id)
      ) {
        filledOwnedIds.add(page.id)
        return true
      }
      if (takenIds.has(page.id)) {
        warnOnce(page, 'a built-in page or another addon already uses that id')
        return false
      }
      if (
        page.viewType &&
        (isBuiltInViewType(page.viewType) || takenViewTypes.has(page.viewType))
      ) {
        warnOnce(page, `AYON or another page already uses the view type "${page.viewType}"`)
        return false
      }
      takenIds.add(page.id)
      if (page.viewType) takenViewTypes.add(page.viewType)
      return true
    })
    // reservedIds and reservedViewTypes are compared by content
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contributions, reservedKey])
}

// AppNavLinks hides a tab and redirects away from it when the user lacks one of these
export const pageAccessLevels = (access?: Access) => (access ? [access] : [])

export const hasPageAccess = (
  access: Access | undefined,
  user: { isAdmin?: boolean; isManager?: boolean },
) => !access || !!user.isAdmin || (access === 'manager' && !!user.isManager)
