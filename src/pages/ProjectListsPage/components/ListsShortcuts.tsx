import { FC, useCallback, useEffect } from 'react'
import { useListsContext } from '../context'
import { useListsDataContext } from '../context/ListsDataContext'
import { useAppSelector } from '@state/store'
import { shouldBlockShortcuts } from '@shared/util'
import { parseListFolderRowId } from '../util'

interface ListsShortcutsProps {}

const ListsShortcuts: FC<ListsShortcutsProps> = ({}) => {
  const {
    openNewList,
    rowSelection,
    onOpenFolderList,
    onRemoveListsFromFolder,
    onRemoveFoldersFromFolder,
    selectedLists,
  } = useListsContext()
  const { listFolders } = useListsDataContext()
  const user = useAppSelector((state) => state.user)
  const isUser = !user.data?.isAdmin && !user.data?.isManager

  // review open
  const reviewOpen = useAppSelector((state) => state.viewer.isOpen)

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (shouldBlockShortcuts(e)) return
      // if review is open, don't allow shortcuts
      if (reviewOpen) return

      const key = e.key.toLowerCase()
      const isMeta = e.metaKey || e.ctrlKey
      const isShift = e.shiftKey
      const isAlt = e.altKey

      let actionExecuted = false

      const selectedRowIds = Object.keys(rowSelection)
      const selectedFolderIds = selectedRowIds
        .map((rowId) => parseListFolderRowId(rowId))
        .filter((id): id is string => !!id)
      const selectedListIds = selectedRowIds.filter((rowId) => !parseListFolderRowId(rowId))

      // Categorize selection types
      const allSelectedRowsAreLists =
        selectedRowIds.length > 0 &&
        selectedRowIds.every((selected) => selectedLists.some((list) => list?.id === selected))
      const allSelectedRowsAreFolders =
        selectedRowIds.length > 0 &&
        selectedRowIds.every((selected) => parseListFolderRowId(selected))

      // Handle different key combinations
      if (key === 'n' && !isMeta && !isShift && !isAlt) {
        // 'n' - Create new list
        e.preventDefault()
        openNewList()
        actionExecuted = true
      } else if (key === 'f' && !isMeta && !isShift && !isAlt) {
        // 'f' - Create folder
        e.preventDefault()
        onOpenFolderList({})
        actionExecuted = true
      } else if (key === 'f' && isShift && !isAlt) {
        // 'shift+f' - Remove folder/list from parent folder
        // Don't allow removing from folders if user is not admin/manager
        if (isUser) return

        if (selectedRowIds.length === 0) return

        e.preventDefault()

        if (allSelectedRowsAreFolders) {
          // Remove parent from all selected folders
          onRemoveFoldersFromFolder(selectedFolderIds)
          actionExecuted = true
        } else if (allSelectedRowsAreLists) {
          // Selected rows are lists, remove them from their folders
          const listsWithFolders = selectedLists.filter(
            (list) => selectedListIds.includes(list.id) && list.entityListFolderId,
          )

          if (listsWithFolders.length > 0) {
            onRemoveListsFromFolder(listsWithFolders.map((list) => list.id))
            actionExecuted = true
          }
        }
        // Mixed selection - no action
      }

      if (actionExecuted) {
        e.stopPropagation()
      }
    },
    [
      reviewOpen,
      openNewList,
      rowSelection,
      onOpenFolderList,
      onRemoveListsFromFolder,
      onRemoveFoldersFromFolder,
      selectedLists,
      listFolders,
      isUser,
    ],
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

  // This component doesn't render anything
  return null
}

export default ListsShortcuts
