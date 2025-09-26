import { EntityList, EntityListFolderModel, EntityListModel } from '@shared/api'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { getEntityTypeIcon } from '@shared/util'
import { FOLDER_ICON } from '../hooks/useListContextMenu'

export const LIST_FOLDER_ROW_ID_PREFIX = 'folder'
export const buildListFolderRowId = (folderId: string) => `${LIST_FOLDER_ROW_ID_PREFIX}-${folderId}`
export const parseListFolderRowId = (rowId: string) => {
  if (rowId.startsWith(LIST_FOLDER_ROW_ID_PREFIX + '-')) {
    return rowId.substring((LIST_FOLDER_ROW_ID_PREFIX + '-').length)
  }
  return null
}

export const buildListsTableData = (
  listsData: EntityList[],
  folders: EntityListFolderModel[],
): SimpleTableRow[] => {
  // Create a lookup map for folder attributes
  const foldersMap = new Map<string, EntityListFolderModel>()
  for (const folder of folders) {
    foldersMap.set(String(folder.id), folder)
  }

  // Group lists by data.folder if available
  const listsByFolder: Record<string, EntityList[]> = {}

  // First pass: categorize lists by folder from data
  for (const list of listsData) {
    // Get folder from data field (now guaranteed to be an object)
    let folder = 'Uncategorized'

    const listFolder = list.entityListFolderId
    if (!!listFolder && foldersMap.has(listFolder)) {
      folder = listFolder
    }

    if (!listsByFolder[folder]) {
      listsByFolder[folder] = []
    }

    listsByFolder[folder].push(list)
  }

  const folderRows: SimpleTableRow[] = []
  const rootLists: SimpleTableRow[] = []

  // Second pass: create table rows from the categorized lists
  for (const [folder, lists] of Object.entries(listsByFolder)) {
    if (folder === 'Uncategorized') {
      // Add uncategorized lists to separate array for later sorting
      for (const list of lists) {
        rootLists.push({
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
      // Get folder attributes from the folders data
      const folderAttr = foldersMap.get(folder)
      const folderLabel = folderAttr?.label || folder
      const folderIcon = folderAttr?.data?.icon || FOLDER_ICON
      const folderColor = folderAttr?.data?.color

      // Create a parent row for all folders
      const parentRow: SimpleTableRow = {
        id: buildListFolderRowId(folder),
        name: folderLabel,
        label: folderLabel,
        icon: folderIcon,
        iconFilled: true,
        subRows: [],
        data: {
          id: folder,
          isGroupRow: true,
          count: lists.length,
          type: folder,
          isFolder: true,
          color: folderColor,
        },
      }

      // Sort lists within folder: active first (by createdAt newest first), then inactive (by createdAt newest first)
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
            parentType: folder,
            createdAt: list.createdAt,
          },
        })
      }

      folderRows.push(parentRow)
    }
  }

  // Sort folder rows based on the order in folders array
  folderRows.sort((a, b) => {
    const aIndex = folders.findIndex((folder) => folder.id === a.id)
    const bIndex = folders.findIndex((folder) => folder.id === b.id)

    // If either folder is not found in the folders array, fall back to alphabetical
    if (aIndex === -1 && bIndex === -1) return a.label.localeCompare(b.label)
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1

    return aIndex - bIndex
  })

  // Sort root lists rows: active first (by createdAt newest first), then inactive (by createdAt newest first)
  rootLists.sort((a, b) => {
    // Active lists come first
    if (!a.inactive && a.inactive) return -1
    if (a.inactive && !b.inactive) return 1

    // Both active or both inactive: sort by createdAt (newest first)
    const aDate = new Date(a.data.createdAt || 0)
    const bDate = new Date(b.data.createdAt || 0)
    return bDate.getTime() - aDate.getTime()
  })

  // Combine in the specified order: folder parents first, then uncategorized lists
  return [...folderRows, ...rootLists]
}

export const getListIcon = (list: Pick<EntityListModel, 'entityListType' | 'entityType'>) =>
  list.entityListType === 'review-session' ? 'subscriptions' : getEntityTypeIcon(list.entityType)
