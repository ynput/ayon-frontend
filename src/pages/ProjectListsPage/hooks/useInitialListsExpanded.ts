import { useEffect, useRef } from 'react'
import { ExpandedState } from '@tanstack/react-table'
import { EntityListFolderModel, EntityList } from '@shared/api'
import { buildListFolderRowId, parseListFolderRowId } from '../util/buildListsTableData'

interface useInitialListsExpandedProps {
  selectedRows: string[]
  lists: EntityList[]
  listFolders: EntityListFolderModel[]
  setExpanded: React.Dispatch<React.SetStateAction<ExpandedState>>
}

/**
 * Expands all ancestor folders of any selected lists/folders on the initial load.
 *
 * Behaviour:
 *  - Runs only once (first time both selections and folders are available).
 *  - For every selected list, all parent folders up to root are expanded.
 *  - For every selected folder, its parent chain is expanded.
 */
const useInitialListsExpanded = ({
  selectedRows,
  lists,
  listFolders,
  setExpanded,
}: useInitialListsExpandedProps) => {
  const initialLoad = useRef(true)

  useEffect(() => {
    // Defer until we have something selected and folders fetched
    if (!initialLoad.current) return
    if (selectedRows.length === 0) return
    if (listFolders.length === 0) return

    initialLoad.current = false

    // Build quick lookup map to avoid repeated Array.find calls
    const folderById = new Map<string, EntityListFolderModel>(listFolders.map((f) => [f.id, f]))

    const foldersToExpand = new Set<string>()

    const collectParentChain = (folderId?: string | null) => {
      if (!folderId) return
      let current = folderById.get(folderId)
      while (current) {
        if (foldersToExpand.has(current.id)) break // already processed this branch
        foldersToExpand.add(current.id)
        current = current.parentId ? folderById.get(current.parentId) : undefined
      }
    }

    // Distinguish selected folder rows vs list rows based on parse result
    const selectedFolderIds: string[] = []
    const selectedListIds: string[] = []

    for (const rowId of selectedRows) {
      const folderId = parseListFolderRowId(rowId)
      if (folderId) selectedFolderIds.push(folderId)
      else selectedListIds.push(rowId)
    }

    // Process selected lists: expand their parent folder chain
    if (selectedListIds.length) {
      for (const listId of selectedListIds) {
        const list = lists.find((l) => l.id === listId)
        if (list) collectParentChain(list.entityListFolderId)
      }
    }

    // Process selected folders: expand their parent chain (not the folder itself)
    if (selectedFolderIds.length) {
      for (const folderId of selectedFolderIds) {
        const folder = folderById.get(folderId)
        if (folder) collectParentChain(folder.parentId)
      }
    }

    if (foldersToExpand.size === 0) return

    const newExpanded: Record<string, boolean> = {}
    for (const id of foldersToExpand) newExpanded[buildListFolderRowId(id)] = true

    setExpanded((prev) => ({ ...(prev as Record<string, boolean>), ...newExpanded }))
  }, [selectedRows, lists, listFolders, setExpanded])
}

export default useInitialListsExpanded
