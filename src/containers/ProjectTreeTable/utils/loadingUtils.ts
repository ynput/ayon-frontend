import { TableRow } from './types'
import { AttributeModel } from '@api/rest/attributes'
import { FolderNodeMap } from '../utils/types'
import { LoadingTasks } from '../hooks/useFetchOverviewData'

/**
 * Generates an array of placeholder rows for loading state
 * @param attribs - Attribute models used to populate empty attribute fields
 * @param count - Number of loading rows to generate (default: 50)
 * @returns Array of TableRow objects with loading state
 */
export const generateLoadingRows = (
  attribs: { name: string }[],
  count = 50,
  { type = 'folder', parentId }: { type?: string; parentId?: string } = {},
): TableRow[] => {
  return new Array(count).fill(0).map(
    (_, index): TableRow => ({
      id: `loading-${type}-${index}-${parentId}`,
      name: 'Loading...',
      parentId: parentId,
      isLoading: true,
      label: 'Loading...',
      color: null,
      icon: null,
      img: null,
      type: type,
      ownAttrib: [],
      tags: [],
      subRows: [],
      path: '',
      attrib: attribs.reduce((acc: { [key: string]: null }, attrib) => {
        acc[attrib.name] = null
        return acc
      }, {}),
      data: { type: type, id: `loading-${index}` },
    }),
  )
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
