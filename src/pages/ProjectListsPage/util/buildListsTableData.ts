import { EntityList } from '@shared/api'
import { SimpleTableRow } from '@shared/SimpleTable'
import { getEntityTypeIcon } from '@shared/util'

export const buildListsTableData = (listsData: EntityList[]): SimpleTableRow[] => {
  // Group lists by data.category if available
  const listsByCategory: Record<string, EntityList[]> = {}

  // First pass: categorize lists by category from data
  for (const list of listsData) {
    // Try to parse data to get category
    let category = 'Uncategorized'

    try {
      if (list.data) {
        const data = JSON.parse(list.data)
        if (data.category) {
          category = data.category
        }
      }
    } catch (e) {
      // If parsing fails, use default category
      console.warn('Failed to parse list data:', e)
    }

    if (!listsByCategory[category]) {
      listsByCategory[category] = []
    }

    listsByCategory[category].push(list)
  }

  const tableRows: SimpleTableRow[] = []

  // Second pass: create table rows from the categorized lists
  for (const [category, lists] of Object.entries(listsByCategory)) {
    if (category === 'Uncategorized') {
      // Add uncategorized lists directly to the root
      for (const list of lists) {
        tableRows.push({
          id: list.id,
          name: list.label,
          label: list.label,
          icon: getEntityTypeIcon(list.entityType),
          subRows: [],
          data: {
            id: list.id,
            count: list.count,
            owner: list.owner,
            entityListType: list.entityListType,
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

      // Add child lists to this parent
      for (const list of lists) {
        parentRow.subRows.push({
          id: list.id,
          name: list.label,
          label: list.label,
          icon: getEntityTypeIcon(list.entityType),
          subRows: [],
          data: {
            id: list.id,
            count: list.count,
            owner: list.owner,
            entityListType: list.entityListType,
            parentType: category,
          },
        })
      }

      tableRows.push(parentRow)
    }
  }

  return tableRows
}
