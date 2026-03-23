import { useCallback, useMemo } from 'react'
import { SimpleTableRow } from '@shared/containers/SimpleTable'
import { useGetListsInfiniteInfiniteQuery } from '@shared/api/queries/entityLists/getLists'
import { useGetEntityListFoldersQuery } from '@shared/api'
import { useProjectContext, usePowerpack } from '@shared/context'
import {
  getEntityTypeIcon,
  buildHierarchicalTableRows,
  HierarchicalFolderNode,
} from '@shared/util'
import type { EntityList, EntityListFolderModel } from '@shared/api'

const FOLDER_ICON = 'snippet_folder'

const LIST_FOLDER_ROW_ID_PREFIX = 'folder'
export const buildListFolderRowId = (folderId: string) =>
  `${LIST_FOLDER_ROW_ID_PREFIX}-${folderId}`

const getListIcon = (list: Pick<EntityList, 'entityListType' | 'entityType'>) =>
  list.entityListType === 'review-session' ? 'subscriptions' : getEntityTypeIcon(list.entityType)

export const useEntityListsSlice = () => {
  const { projectName } = useProjectContext()
  const { powerLicense } = usePowerpack()

  const {
    data: listsData,
    isLoading,
    isFetching,
  } = useGetListsInfiniteInfiniteQuery(
    { projectName: projectName || '' },
    {
      initialPageParam: { cursor: '' },
      skip: !projectName,
    },
  )

  const { data: listFolders = [], isLoading: isLoadingFolders } = useGetEntityListFoldersQuery(
    { projectName: projectName || '' },
    { skip: !projectName || !powerLicense },
  )

  const tableData: SimpleTableRow[] = useMemo(() => {
    if (!listsData?.pages) return []

    const allLists = listsData.pages.flatMap((page) => page.lists)

    // If we have power license and folders, build hierarchical structure
    if (powerLicense && listFolders.length > 0) {
      type FolderNode = HierarchicalFolderNode<EntityListFolderModel, EntityList>

      const folderNodes = new Map<string, FolderNode>()
      const rootFolderIds = new Set<string>()

      // Create all folder nodes
      for (const folder of listFolders) {
        folderNodes.set(folder.id, {
          id: folder.id,
          folder,
          children: new Map(),
          items: [],
          hasAnyItems: false,
        })
        if (!folder.parentId) {
          rootFolderIds.add(folder.id)
        }
      }

      // Build parent-child relationships
      for (const folder of listFolders) {
        if (folder.parentId && folderNodes.has(folder.parentId)) {
          const parentNode = folderNodes.get(folder.parentId)!
          const childNode = folderNodes.get(folder.id)!
          parentNode.children.set(folder.id, childNode)
        }
      }

      // Assign lists to folders
      const rootLists: EntityList[] = []
      for (const list of allLists) {
        const listFolderId = list.entityListFolderId
        if (listFolderId && folderNodes.has(listFolderId)) {
          const folderNode = folderNodes.get(listFolderId)!
          folderNode.items.push(list)
          folderNode.hasAnyItems = true
        } else {
          rootLists.push(list)
        }
      }

      // Mark parent folders that contain lists (directly or indirectly)
      for (const node of folderNodes.values()) {
        if (node.hasAnyItems) {
          let currentFolder = node.folder
          while (currentFolder.parentId) {
            const parentNode = folderNodes.get(currentFolder.parentId)
            if (parentNode) {
              parentNode.hasAnyItems = true
              currentFolder = parentNode.folder
            } else {
              break
            }
          }
        }
      }

      const createListRow = (list: EntityList, _parentType?: string, parents: string[] = []): SimpleTableRow => ({
        id: list.id,
        name: list.label,
        label: list.label,
        ...(parents.length > 0 && { parents }),
        icon: getListIcon(list),
        subRows: [],
        data: {
          id: list.id,
          name: list.label,
          label: list.label,
          entityType: list.entityType,
          listId: list.id,
        },
      })

      const sortFolderNodes = (nodes: FolderNode[]): FolderNode[] => {
        return nodes.sort((a, b) => {
          const aIndex = listFolders.findIndex((folder) => folder.id === a.id)
          const bIndex = listFolders.findIndex((folder) => folder.id === b.id)
          if (aIndex === -1 && bIndex === -1) return a.folder.label.localeCompare(b.folder.label)
          if (aIndex === -1) return 1
          if (bIndex === -1) return -1
          return aIndex - bIndex
        })
      }

      // Collect all list IDs under each folder for selection resolution
      const collectChildListIds = (node: FolderNode): string[] => {
        const ids: string[] = node.items.map((item) => item.id)
        for (const child of node.children.values()) {
          ids.push(...collectChildListIds(child))
        }
        return ids
      }

      const folderRows = buildHierarchicalTableRows({
        folderNodes,
        rootFolderIds,
        showEmptyFolders: false,
        buildFolderRowId: buildListFolderRowId,
        createItemRow: createListRow,
        sortFolderNodes,
        sortItems: (items: EntityList[]) => items,
        getFolderLabel: (folder) => folder.label,
        getFolderIcon: (folder) => folder.data?.icon || FOLDER_ICON,
        getFolderColor: (folder) => folder.data?.color,
        getItemCount: (node) =>
          node.items.length +
          Array.from(node.children.values()).reduce((acc, child) => acc + child.items.length, 0),
      })

      // Post-process folder rows: add childListIds to folder row data
      for (const row of folderRows) {
        if (row.id.startsWith(LIST_FOLDER_ROW_ID_PREFIX + '-')) {
          const folderId = row.id.substring((LIST_FOLDER_ROW_ID_PREFIX + '-').length)
          const node = folderNodes.get(folderId)
          if (node) {
            row.data = { ...row.data, childListIds: collectChildListIds(node) }
          }
        }
        // Also process nested subRows
        const queue = [...(row.subRows || [])]
        while (queue.length > 0) {
          const subRow = queue.shift()!
          if (subRow.id.startsWith(LIST_FOLDER_ROW_ID_PREFIX + '-')) {
            const folderId = subRow.id.substring((LIST_FOLDER_ROW_ID_PREFIX + '-').length)
            const node = folderNodes.get(folderId)
            if (node) {
              subRow.data = { ...subRow.data, childListIds: collectChildListIds(node) }
            }
          }
          if (subRow.subRows) queue.push(...subRow.subRows)
        }
      }

      const rootListRows = rootLists.map((list) => createListRow(list))
      return [...folderRows, ...rootListRows]
    }

    // Flat list fallback (no power license or no folders)
    return allLists.map((list) => ({
      id: list.id,
      name: list.label,
      label: `${list.label} (${list.entityType})`,
      icon: getListIcon(list),
      subRows: [],
      data: {
        id: list.id,
        name: list.label,
        label: `${list.label} (${list.entityType})`,
        entityType: list.entityType,
        listId: list.id,
      },
    }))
  }, [listsData, powerLicense, listFolders])

  const isExpandable = powerLicense && listFolders.length > 0

  const getData = useCallback(async () => {
    return tableData
  }, [tableData])

  return {
    getData,
    isLoading: isLoading || isFetching || isLoadingFolders,
    isExpandable,
  }
}
