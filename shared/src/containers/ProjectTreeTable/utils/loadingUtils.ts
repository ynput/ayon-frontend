import { TableRow } from '../types/table'
import { FolderNodeMap } from '../types/table'
import { LoadingTasks } from '../types'
import type { AttributeModel } from '@shared/api'

/**
 * Generates an array of placeholder rows for loading state
 * @param count - Number of loading rows to generate (default: 50)
 * @param attrib - Attribute values for the placeholder rows
 * @param key - Makes the ids unique within the table, e.g. the id of the row they load under.
 * The ids must stay the same across renders: the table reports its visible row ids, and new ids
 * every render make the page re-render (and rebuild these rows) in a loop until loading ends.
 * @returns Array of TableRow objects with loading state
 */
export const generateLoadingRows = (count = 50, attrib = {}, key = 'table'): TableRow[] => {
  return new Array(count).fill(0).map((_, index) => ({
    id: `loading-${key}-${index}`,
    primary: {
      id: `loading-${index}`,
      entityType: 'folder',
      name: '',
      label: '',
      subType: '',
      attrib,
    },
    isLoading: true,
  }))
}

/**
 * Generates an array of dummy attribute models for loading states
 * @param count - Number of dummy attributes to generate (default: 10)
 * @returns Array of AttributeModel objects
 */
export const generateDummyAttributes = (count = 10): AttributeModel[] => {
  return Array(count)
    .fill(null)
    .map((_, i): AttributeModel => {
      return {
        name: `loading-attribute${i}`,
        scope: ['folder', 'task'],
        data: {
          type: 'string',
        },
        position: i,
      }
    })
}

/**
 * Parameters for determineLoadingTaskFolders function
 */
export type DetermineLoadingTaskFoldersParams = {
  expandedFoldersTasks: { folderId: string | null }[]
  expandedParentIds: string[]
  foldersMap: FolderNodeMap
}

/**
 * Determines which folders are currently loading tasks
 * @param params - Object containing parameters for determining loading folders
 * @returns Array of folder IDs that are in loading state
 */
export const determineLoadingTaskFolders = ({
  expandedFoldersTasks,
  expandedParentIds,
  foldersMap,
}: DetermineLoadingTaskFoldersParams): LoadingTasks => {
  // find the folderIds that are being fetched (not the ones that are already loaded)
  const folderIds = expandedFoldersTasks.map((task) => task.folderId)
  const expandedParentIdsThatHaveTasks = expandedParentIds.filter(
    (id) => foldersMap.get(id)?.hasTasks,
  )
  const folderIdsSet = new Set(folderIds)
  const loadingParentIds = new Set<string>()
  for (const folderId of expandedParentIdsThatHaveTasks) {
    if (!folderIdsSet.has(folderId)) {
      loadingParentIds.add(folderId)
    }
  }

  const loadingTasks: LoadingTasks = {}
  for (const folderId of loadingParentIds) {
    // find the folder by id
    const folder = foldersMap.get(folderId)
    if (folder) {
      loadingTasks[folderId] = folder.taskNames?.length || 0
    }
  }

  return loadingTasks
}
