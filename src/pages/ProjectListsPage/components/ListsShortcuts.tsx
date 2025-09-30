import { FC, useCallback, useEffect } from 'react'
import { useListsContext } from '../context'
import { useListsDataContext } from '../context/ListsDataContext'
import { useAppSelector } from '@state/store'
import { parseListFolderRowId } from '../util'

interface ListsShortcutsProps {}

const ListsShortcuts: FC<ListsShortcutsProps> = ({}) => {
  const {
    openNewList,
    openRenameList,
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
      // check target isn't an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      // or has blocked shortcuts className
      if ((e.target as HTMLElement)?.classList.contains('block-shortcuts')) return
      // or any of its parents
      if ((e.target as HTMLElement)?.closest('.block-shortcuts')) return
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
      const hasMultipleSelected = selectedRowIds.length > 1
      const firstSelectedRow = selectedRowIds[0]
      const isFirstRowFolder = !!parseListFolderRowId(firstSelectedRow)

      // Handle different key combinations
      if (key === 'n' && !isMeta && !isShift && !isAlt) {
        // 'n' - Create new list
        // Only allow if no selection, single folder selected, or only folders selected
        if (selectedRowIds.length === 0) {
          // No selection, create list at root level
          e.preventDefault()
          openNewList()
          actionExecuted = true
        } else if (allSelectedRowsAreFolders && !hasMultipleSelected) {
          // Single folder selected, create list inside that folder
          e.preventDefault()
          openNewList({ entityListFolderId: selectedFolderIds[0] })
          actionExecuted = true
        }
      } else if (key === 'f' && !isMeta && !isShift && !isAlt) {
        // 'f' - Create folder
        e.preventDefault()
        // Don't allow creating folders if user is not admin/manager
        if (isUser) return
        onOpenFolderList({})
        actionExecuted = true
        // Mixed selection - no action
      } else if (key === 'f' && isShift && !isAlt) {
        // 'shift+f' - Remove folder/list from parent folder
        e.preventDefault()
        // Don't allow removing from folders if user is not admin/manager
        if (isUser) return

        if (selectedRowIds.length === 0) return

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
            onRemoveListsFromFolder(selectedListIds)
            actionExecuted = true
          }
        }
        // Mixed selection - no action
      } else if (key === 'r' && !isMeta && !isShift && !isAlt) {
        // 'r' - Rename selected item (only works with single selection)
        if (!rowSelection || hasMultipleSelected) return

        // Don't allow renaming folders if user is not admin/manager
        if (isFirstRowFolder && isUser) return

        // Only allow renaming if it's a single list or single folder
        if (allSelectedRowsAreLists || allSelectedRowsAreFolders) {
          e.preventDefault()
          openRenameList(firstSelectedRow)
          actionExecuted = true
        }
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
      openRenameList,
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
