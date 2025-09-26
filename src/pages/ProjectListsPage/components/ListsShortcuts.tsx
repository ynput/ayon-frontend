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

      // Handle different key combinations
      if (key === 'n' && !isMeta && !isShift && !isAlt) {
        // 'n' - Create new list
        e.preventDefault()
        openNewList()
        actionExecuted = true
      } else if (key === 'f' && !isMeta && !isShift && !isAlt) {
        // 'f' - Create folder
        e.preventDefault()
        // Don't allow creating folders if user is not admin/manager
        if (isUser) return

        const selectedRowIds = Object.keys(rowSelection)

        if (selectedRowIds.length === 0) {
          // No selection, create root folder
          onOpenFolderList({})
          return
        }

        // Check if first selected row is a folder
        const firstSelectedRow = selectedRowIds[0]
        const selectedFolderId = parseListFolderRowId(firstSelectedRow)

        if (selectedFolderId) {
          // Selected row is a folder, create subfolder
          onOpenFolderList({ parentId: selectedFolderId })
        } else {
          // Selected rows are lists, create folder with these lists
          const selectedListIds = selectedRowIds.filter((rowId) => !parseListFolderRowId(rowId))
          onOpenFolderList({ listIds: selectedListIds })
        }
        actionExecuted = true
      } else if (key === 'f' && isShift) {
        // 'shift+alt+f' - Remove folder/list from parent folder
        e.preventDefault()
        // Don't allow removing from folders if user is not admin/manager
        if (isUser) return

        const selectedRowIds = Object.keys(rowSelection)
        if (selectedRowIds.length === 0) return

        const selectedFolderIds = selectedRowIds
          .map((rowId) => parseListFolderRowId(rowId))
          .filter((id): id is string => !!id)

        if (selectedFolderIds?.length) {
          // remove parents from all selected folders
          onRemoveFoldersFromFolder(selectedFolderIds)
        } else {
          // Selected rows are lists, remove them from their folders
          const selectedListIds = selectedRowIds.filter((rowId) => !parseListFolderRowId(rowId))
          const listsWithFolders = selectedLists.filter(
            (list) => selectedListIds.includes(list.id) && list.entityListFolderId,
          )

          if (listsWithFolders.length > 0) {
            onRemoveListsFromFolder(selectedListIds)
          }
        }
      } else if (key === 'r' && !isMeta && !isShift && !isAlt) {
        // 'r' - Rename selected item
        if (!rowSelection) return
        const firstSelectedRow = Object.keys(rowSelection)[0]

        // Don't allow renaming folders if user is not admin/manager
        if (parseListFolderRowId(firstSelectedRow) && isUser) return

        e.preventDefault()
        openRenameList(firstSelectedRow)
        actionExecuted = true
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
