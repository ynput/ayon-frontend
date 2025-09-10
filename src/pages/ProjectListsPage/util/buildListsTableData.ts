import { EntityList, EntityListModel } from '@shared/api'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { getEntityTypeIcon } from '@shared/util'

export const buildListsTableData = (listsData: EntityList[]): SimpleTableRow[] => {
  // Group lists by data.category if available
  const listsByCategory: Record<string, EntityList[]> = {}

  // First pass: categorize lists by category from data
  for (const list of listsData) {
    // Get category from data field (now guaranteed to be an object)
    let category = 'Uncategorized'

    if (list.data && list.data.category) {
      category = list.data.category
    }

    if (!listsByCategory[category]) {
      listsByCategory[category] = []
    }

    listsByCategory[category].push(list)
  }

  const categoryRows: SimpleTableRow[] = []
  const uncategorizedRows: SimpleTableRow[] = []

  // Second pass: create table rows from the categorized lists
  for (const [category, lists] of Object.entries(listsByCategory)) {
    if (category === 'Uncategorized') {
      // Add uncategorized lists to separate array for later sorting
      for (const list of lists) {
        uncategorizedRows.push({
          id: list.id,
          name: list.label,
          label: list.label,
          icon: getListIcon(list),
          inactive: !list.active,
          subRows: [],
          data: {
            id: list.id,
            count: list.count,
            owner: list.owner,
            entityListType: list.entityListType,
            createdAt: list.createdAt,
          },
        })
      }
    } else {
      // Create a parent row for all categories
      const parentRow: SimpleTableRow = {
        id: `category-${category}`,
        name: category,
        label: category,
        icon: 'folder',
        subRows: [],
        data: {
          id: category,
          isGroupRow: true,
          count: lists.length,
          type: category,
          isFolder: true,
        },
      }

      // Sort lists within category: active first (by createdAt newest first), then inactive (by createdAt newest first)
      const sortedLists = [...lists].sort((a, b) => {
        // Active lists come first
        if (a.active && !b.active) return -1
        if (!a.active && b.active) return 1

        // Both active or both inactive: sort by createdAt (newest first)
        const aDate = new Date(a.createdAt || 0)
        const bDate = new Date(b.createdAt || 0)
        return bDate.getTime() - aDate.getTime()
      })

      // Add child lists to this parent
      for (const list of sortedLists) {
        parentRow.subRows.push({
          id: list.id,
          name: list.label,
          label: list.label,
          icon: getListIcon(list),
          inactive: !list.active,
          subRows: [],
          data: {
            id: list.id,
            count: list.count,
            owner: list.owner,
            entityListType: list.entityListType,
            parentType: category,
            createdAt: list.createdAt,
          },
        })
      }

      categoryRows.push(parentRow)
    }
  }

  // Sort category rows alphabetically
  categoryRows.sort((a, b) => a.label.localeCompare(b.label))

  // Sort uncategorized rows: active first (by createdAt newest first), then inactive (by createdAt newest first)
  uncategorizedRows.sort((a, b) => {
    // Active lists come first
    if (!a.inactive && a.inactive) return -1
    if (a.inactive && !b.inactive) return 1

    // Both active or both inactive: sort by createdAt (newest first)
    const aDate = new Date(a.data.createdAt || 0)
    const bDate = new Date(b.data.createdAt || 0)
    return bDate.getTime() - aDate.getTime()
  })

  // Combine in the specified order: category parents first, then uncategorized lists
  return [...categoryRows, ...uncategorizedRows]
}

export const getListIcon = (list: Pick<EntityListModel, 'entityListType' | 'entityType'>) =>
  list.entityListType === 'review-session' ? 'subscriptions' : getEntityTypeIcon(list.entityType)
