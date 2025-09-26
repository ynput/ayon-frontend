import { RowSelectionState } from '@tanstack/react-table'
import { useListsContext } from '../context'
import { CommandEvent, useCreateContextMenu } from '@shared/containers/ContextMenu'
import { useCallback } from 'react'
import { useAppSelector } from '@state/store'
import useClearListItems from './useClearListItems'
import { useProjectDataContext } from '@shared/containers/ProjectTreeTable'
import { useListsDataContext } from '../context/ListsDataContext'
import { parseListFolderRowId } from '../util'

export const FOLDER_ICON = 'snippet_folder'
export const FOLDER_ICON_ADD = 'create_new_folder'
export const FOLDER_ICON_EDIT = 'folder_managed'
export const FOLDER_ICON_REMOVE = 'folder_off'

const useListContextMenu = () => {
  const user = useAppSelector((state) => state.user)
  const developerMode = user?.attrib.developerMode
  const isUser = !user.data?.isAdmin && !user.data?.isManager
  const { projectName } = useProjectDataContext()
  const { listsData, listFolders } = useListsDataContext()
  const {
    rowSelection,
    setRowSelection,
    openRenameList,
    setListDetailsOpen,
    deleteLists,
    createReviewSessionList,
    isReview,
    onPutListsInFolder,
    onRemoveListsFromFolder,
    onOpenFolderList,
  } = useListsContext()

  const { clearListItems } = useClearListItems({ projectName })
  // create the ref and model
  const [ctxMenuShow] = useCreateContextMenu()

  const handleCreateReviewSessionList: (listId: string) => void = useCallback(
    async (listId) => {
      await createReviewSessionList?.(listId, {
        showToast: true,
        navigateOnSuccess: true,
      })
    },
    [createReviewSessionList, projectName],
  )

  const openContext = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault()
      e.stopPropagation()

      let newSelection: RowSelectionState = { ...rowSelection }
      // if we are selecting a row outside of the selection (or none), set the selection to the row
      if (!newSelection[e.currentTarget.id]) {
        newSelection = { [e.currentTarget.id]: true }
        setRowSelection(newSelection)
      }
      const newSelectedRows = Object.entries(newSelection)
        .filter(([_k, v]) => v)
        .map(([k]) => k)
      const newSelectedLists = listsData.filter((list) =>
        newSelectedRows.some((selected) => list?.id === selected),
      )
      const selectedList = newSelectedLists[0]
      const firstSelectedRow = Object.keys(newSelection)[0]
      const multipleSelected = Object.keys(newSelection).length > 1
      // some rows are folders
      const allSelectedRowsAreLists = newSelectedRows.every((selected) =>
        newSelectedLists.some((list) => list?.id === selected),
      )

      // Create folder submenu items
      const createFolderSubmenu = () => {
        if (!allSelectedRowsAreLists || newSelectedLists.length === 0) {
          return []
        }

        const submenuItems: any[] = []
        const selectedListIds = newSelectedLists.map((list) => list.id)

        // Add "Create folder" option at the top
        submenuItems.push({
          label: 'Create folder',
          icon: FOLDER_ICON_ADD,
          command: () => onOpenFolderList({ listIds: selectedListIds }),
          disabled: isUser, // only admins and managers can create listFolders
        })

        // For multiple selections, show "Unset folder" if any list has a folder
        // For single selection, show "Unset folder" only if that list has a folder
        const hasAnyFolder = newSelectedLists.some((list) => list.entityListFolderId)
        if (hasAnyFolder) {
          submenuItems.push({
            label: 'Unset folder',
            icon: FOLDER_ICON_REMOVE,
            command: () => {
              onRemoveListsFromFolder(selectedListIds)
            },
          })
        }

        // Get listFolders that are not already assigned to ALL selected lists
        const availableFolders = listFolders.filter((cat) => {
          if (multipleSelected) {
            // For multiple selections, show listFolders that are not assigned to ALL lists
            return !newSelectedLists.every((list) => list.data?.folder === cat.id)
          } else {
            // For single selection, show listFolders that are not assigned to this list
            return newSelectedLists[0]?.data?.folder !== cat.id
          }
        })

        if (availableFolders.length > 0) {
          if (submenuItems.length > 0) {
            submenuItems.push({ separator: true })
          }

          availableFolders.forEach((folder) => {
            submenuItems.push({
              label: folder.label,
              icon: folder.data?.icon || FOLDER_ICON,
              command: () => {
                onPutListsInFolder(selectedListIds, folder.id)
              },
            })
          })
        }

        return submenuItems
      }

      const folderSubmenu = createFolderSubmenu()

      // Check if the first selected row is a folder
      const selectedFolderId = parseListFolderRowId(firstSelectedRow)

      const menuItems: any[] = [
        {
          label: 'Rename',
          icon: 'edit',
          command: () => openRenameList(firstSelectedRow),
          disabled: multipleSelected || (selectedFolderId && isUser),
          hidden: !allSelectedRowsAreLists,
        },
        {
          label: 'Edit folder',
          icon: FOLDER_ICON_EDIT,
          command: () => {
            if (!selectedFolderId) return
            onOpenFolderList({ folderId: selectedFolderId })
          },
          hidden: !selectedFolderId || multipleSelected,
          disabled: isUser, // only admins and managers can edit listFolders
        },
        {
          label: 'Create review',
          icon: 'subscriptions',
          command: () => handleCreateReviewSessionList(selectedList.id),
          disabled: multipleSelected || !allSelectedRowsAreLists,
          hidden: !allSelectedRowsAreLists || isReview || !createReviewSessionList,
        },
        {
          label: 'Folder',
          icon: FOLDER_ICON,
          items: folderSubmenu,
          disabled: !allSelectedRowsAreLists,
          hidden: !allSelectedRowsAreLists || folderSubmenu.length === 0,
        },
        {
          label: 'Details',
          icon: 'info',
          command: () => setListDetailsOpen(true),
          disabled: multipleSelected,
          hidden: !allSelectedRowsAreLists,
          shortcut: 'Double click',
        },
        {
          label: 'Clear list',
          icon: 'close',
          developer: true,
          command: () => clearListItems(firstSelectedRow),
          hidden: !developerMode || multipleSelected || !allSelectedRowsAreLists,
        },
        {
          label: 'Delete',
          icon: 'delete',
          danger: true,
          command: (e: CommandEvent) =>
            deleteLists(Object.keys(newSelection), {
              force: e.originalEvent.metaKey || e.originalEvent.ctrlKey,
            }),
          hidden: !allSelectedRowsAreLists,
        },
      ]

      ctxMenuShow(e, menuItems)
    },
    [
      ctxMenuShow,
      rowSelection,
      listsData,
      listFolders,
      setRowSelection,
      openRenameList,
      setListDetailsOpen,
      deleteLists,
      createReviewSessionList,
      onPutListsInFolder,
    ],
  )

  return {
    openContext,
  }
}

export default useListContextMenu
