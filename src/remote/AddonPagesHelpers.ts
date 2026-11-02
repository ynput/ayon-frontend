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

/**
 * Built-in project pages an addon may take over with its own `project.page`: page id → view type.
 * The id is also the owning addon's name, so only that addon can claim it. While the addon's page
 * is registered it replaces the built-in tab (same tab, URL and views); without it (an older
 * version of the addon, or not installed) the built-in page stays.
 */
export const OWNED_BUILT_IN_PAGES: Readonly<Record<string, string>> = { reports: 'reports' }

/** Whether a project page id is a built-in page an addon may take over (`OWNED_BUILT_IN_PAGES`). */
export const isOwnableBuiltInId = (id: string) =>
  Object.prototype.hasOwnProperty.call(OWNED_BUILT_IN_PAGES, id)

/**
 * Whether the page is its addon's own claim on a built-in project page (`OWNED_BUILT_IN_PAGES`).
 * Only `project.page`: a studio page with the same id is an ordinary addon page.
 */
export const isOwnedBuiltInPage = (page: Contribution<PageSlot>) =>
  page.slot === 'project.page' && isOwnableBuiltInId(page.id) && page.addon.name === page.id

// one warning per clash, not one per render
const warned = new Set<string>()

const warnOnce = (page: Contribution<PageSlot>, reason: string) => {
  if (warned.has(page.key)) return
  warned.add(page.key)
  console.warn(`[addon ${page.addon.name}] page "${page.id}" (${page.slot}) is not shown: ${reason}`)
}

/**
 * The page contributions that get a tab. A built-in or legacy page wins over an addon page with
 * the same id or view type, and an earlier addon page over a later one; each clash is logged once.
 * An addon's claim on its own built-in page (`OWNED_BUILT_IN_PAGES`) passes the built-in id and
 * view type: the caller renders it in place of the built-in page.
 */
export const selectAddonPages = <S extends PageSlot>(
  contributions: Contribution<S>[],
  reservedIds: string[],
  // view types of the legacy (keyword) pages; AYON's own are always reserved
  reservedViewTypes: (string | undefined)[] = [],
): Contribution<S>[] => {
  const takenIds = new Set(reservedIds)
  const takenViewTypes = new Set(reservedViewTypes.filter(Boolean))
  // ids and view types addon pages took: an owned claim may take only what no addon page has
  const addonIds = new Set<string>()
  const addonViewTypes = new Set<string>()
  return contributions.filter((page) => {
    const owned = isOwnedBuiltInPage(page)
    const ownsViewType = owned && page.viewType === OWNED_BUILT_IN_PAGES[page.id]
    if (owned ? addonIds.has(page.id) : takenIds.has(page.id)) {
      warnOnce(page, 'a built-in page or another addon already uses that id')
      return false
    }
    const viewTypeTaken = page.viewType
      ? ownsViewType
        ? addonViewTypes.has(page.viewType)
        : isBuiltInViewType(page.viewType) || takenViewTypes.has(page.viewType)
      : false
    if (viewTypeTaken) {
      warnOnce(page, `AYON or another page already uses the view type "${page.viewType}"`)
      return false
    }
    takenIds.add(page.id)
    addonIds.add(page.id)
    if (page.viewType) {
      takenViewTypes.add(page.viewType)
      addonViewTypes.add(page.viewType)
    }
    return true
  })
}

/** `selectAddonPages`, memoized: the reserved lists are compared by content. */
export const useAddonPages = <S extends PageSlot>(
  contributions: Contribution<S>[],
  reservedIds: string[],
  reservedViewTypes: (string | undefined)[] = [],
): Contribution<S>[] => {
  const reservedKey = `${reservedIds.join(',')}|${reservedViewTypes.join(',')}`
  return useMemo(
    () => selectAddonPages(contributions, reservedIds, reservedViewTypes),
    // reservedIds and reservedViewTypes are compared by content
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contributions, reservedKey],
  )
}

// AppNavLinks hides a tab and redirects away from it when the user lacks one of these
export const pageAccessLevels = (access?: Access) => (access ? [access] : [])

export const hasPageAccess = (
  access: Access | undefined,
  user: { isAdmin?: boolean; isManager?: boolean },
) => !access || !!user.isAdmin || (access === 'manager' && !!user.isManager)
