import { useListsContext } from '../context/ListsContext'
import { CommandEvent } from '@shared/containers/ContextMenu'
import { useCallback, useMemo } from 'react'
import { useAppSelector } from '@state/store'
import useClearListItems from './useClearListItems'
import { useListsDataContext } from '../context/ListsDataContext'
import { parseListFolderRowId } from '../util/buildListsTableData'
import { EntityListFolderModel } from '@shared/api'
import { usePowerpack, useProjectContext } from '@shared/context'
import {
  canEditList,
  canEditAllLists,
  canDeleteAllLists,
  canEditFolder,
  canEditAllFolders,
  canDeleteAllFolders,
  UserPermissions,
} from '../util/listAccessControl'
import {
  SimpleTableRowContextMenuBuilder,
  SimpleTableRowContextMenuContext,
} from '@shared/containers/SimpleTable'

export type ListRowContextMenuContext = SimpleTableRowContextMenuContext
export type ListRowContextMenuBuilder = SimpleTableRowContextMenuBuilder

export const FOLDER_ICON = 'snippet_folder'
export const FOLDER_ICON_ADD = 'create_new_folder'
export const FOLDER_ICON_EDIT = 'folder_managed'
export const FOLDER_ICON_REMOVE = 'folder_off'

// Helper function to prevent circular dependencies (also used by MoveToListDialog)
export const wouldCreateCircularDependency = (
  folderId: string,
  targetParentId: string,
  folders: EntityListFolderModel[],
): boolean => {
  if (folderId === targetParentId) return true

  const folderMap = new Map(folders.map((f) => [f.id, f]))

  // Check if targetParentId is a descendant of folderId
  const isDescendant = (currentId: string, ancestorId: string): boolean => {
    const current = folderMap.get(currentId)
    if (!current || !current.parentId) return false
    if (current.parentId === ancestorId) return true
    return isDescendant(current.parentId, ancestorId)
  }

  return isDescendant(targetParentId, folderId)
}

export interface MoveDialogPayload {
  listIds: string[]
  folderIds: string[]
}

const useListContextMenu = (
  extraBuilders: ListRowContextMenuBuilder[] = [],
  onOpenMoveDialog?: (payload: MoveDialogPayload) => void,
) => {
  const user = useAppSelector((state) => state.user)
  const developerMode = user?.attrib.developerMode
  const { projectName } = useProjectContext()
  const { listsData, listFolders } = useListsDataContext()
  const {
    openRenameList,
    setListDetailsOpen,
    deleteLists,
    createReviewSessionList,
    isReview,
    onOpenFolderList,
    openNewList,
    onDeleteListFolders,
    selectAllLists,
  } = useListsContext()
  const { powerLicense } = usePowerpack()

  // Create user permissions object for access control checks
  const userPermissions: UserPermissions = {
    isAdmin: !!user.data?.isAdmin,
    isManager: !!user.data?.isManager,
    userName: (user as any)?.data?.name || (user as any)?.data?.username || (user as any)?.name,
  }

  const { clearListItems } = useClearListItems({ projectName })

  const handleCreateReviewSessionList: (listId: string) => void = useCallback(
    async (listId) => {
      await createReviewSessionList?.(listId, {
        showToast: true,
        navigateOnSuccess: true,
      })
    },
    [createReviewSessionList, projectName],
  )

  const buildContextMenu = useCallback(
    (_e: React.MouseEvent<HTMLTableRowElement>, context: ListRowContextMenuContext) => {
      const { selectedRows } = context

      const newSelectedLists = listsData.filter((list) =>
        selectedRows.some((selected) => list?.id === selected),
      )
      const selectedList = newSelectedLists[0]
      const firstSelectedRow = selectedRows[0]
      const multipleSelected = selectedRows.length > 1

      // Check if the first selected row is a folder
      const selectedFolderId = parseListFolderRowId(firstSelectedRow)
      const isSelectedRowFolder = !!selectedFolderId
      const selectedFolder = isSelectedRowFolder
        ? listFolders.find((f) => f.id === selectedFolderId)
        : null
      const selectedFolderIds = selectedRows
        .map((id) => parseListFolderRowId(id))
        .filter((id): id is string => !!id)

      // some rows are folders
      const allSelectedRowsAreLists = selectedRows.every((selected) =>
        newSelectedLists.some((list) => list?.id === selected),
      )
      const allSelectedRowsAreFolders = selectedRows.every((selected) =>
        parseListFolderRowId(selected),
      )

      // Get selected folders as full objects
      const selectedFoldersAll: EntityListFolderModel[] = selectedFolderIds
        .map((id) => listFolders.find((f) => f.id === id))
        .filter((f): f is EntityListFolderModel => !!f)

      // Access control checks using helper functions
      const userCanEditAllLists = canEditAllLists(newSelectedLists, userPermissions)
      const userCanDeleteAllLists = canDeleteAllLists(newSelectedLists, userPermissions)
      const userCanEditAllFolders = canEditAllFolders(selectedFoldersAll, userPermissions)
      const userCanDeleteAllFolders = canDeleteAllFolders(selectedFoldersAll, userPermissions)

      // Single item access checks
      const userCanEditFolder = selectedFolder
        ? canEditFolder(selectedFolder, userPermissions)
        : false
      const userCanEditList = selectedList ? canEditList(selectedList, userPermissions) : false

      // ✨ YN-0974: "Move" opens the MoveToListDialog (single-select folder picker)
      // instead of the hard-to-navigate nested folder submenus.
      const hasFoldersToShow = listFolders.length > 0
      const hasUnsetOption = allSelectedRowsAreLists
        ? newSelectedLists.some((l) => l.entityListFolderId)
        : selectedFoldersAll.some((f) => f.parentId)

      const moveMenuItems: any[] = []
      if (powerLicense) {
        moveMenuItems.push({
          label: allSelectedRowsAreFolders ? 'Move folder' : 'Move list',
          icon: FOLDER_ICON,
          command: () =>
            onOpenMoveDialog?.({
              listIds: allSelectedRowsAreLists ? newSelectedLists.map((l) => l.id) : [],
              folderIds: allSelectedRowsAreFolders ? selectedFolderIds : [],
            }),
          // Structural disabling only (no selection); ownership handled via hidden
          disabled: !allSelectedRowsAreLists && !allSelectedRowsAreFolders,
          hidden:
            (!allSelectedRowsAreLists && !allSelectedRowsAreFolders) ||
            (!hasFoldersToShow && !hasUnsetOption) ||
            // Hide if user doesn't have edit permission on all selected items
            (allSelectedRowsAreLists && !userCanEditAllLists) ||
            (allSelectedRowsAreFolders && !userCanEditAllFolders),
        })
      }

      const menuItems: any[] = [
        {
          label: `Rename ${allSelectedRowsAreFolders ? 'folder' : 'list'}`,
          icon: 'edit',
          command: () => openRenameList(firstSelectedRow),
          // Disable for multi-select
          disabled: multipleSelected,
          shortcut: 'R',
          // Hide if not a list/folder OR user doesn't have edit permission
          hidden:
            (!allSelectedRowsAreLists && !isSelectedRowFolder) ||
            (isSelectedRowFolder && !userCanEditFolder) ||
            (!isSelectedRowFolder && !userCanEditList),
        },
        {
          label: 'Create review',
          icon: 'subscriptions',
          command: () => handleCreateReviewSessionList(selectedList.id),
          disabled: multipleSelected || !allSelectedRowsAreLists,
          hidden: !allSelectedRowsAreLists || isReview || !createReviewSessionList,
        },
        {
          label: 'Edit folder',
          icon: FOLDER_ICON_EDIT,
          command: () => {
            const folderId = firstSelectedRow.replace('folder-', '')
            onOpenFolderList({ folderId })
          },
          hidden: !isSelectedRowFolder || multipleSelected || !userCanEditFolder,
        },
        {
          label: 'Create list',
          icon: 'add',
          command: () => {
            // If a single folder is selected, create list inside that folder
            if (selectedFolderIds.length === 1) {
              openNewList({ entityListFolderId: selectedFolderIds[0] })
            } else {
              openNewList()
            }
          },
          shortcut: 'N',
          hidden: !isSelectedRowFolder,
          disabled: selectedFolderIds.length > 1,
        },
        // Root level Create folder (lists selection) / gated if no power license
        {
          label: 'Create folder',
          icon: FOLDER_ICON_ADD,
          command: () => onOpenFolderList({}),
          shortcut: 'F',
          hidden: !allSelectedRowsAreLists,
          powerFeature: powerLicense ? undefined : 'listFolders',
        },
        // Root level Create subfolder (single folder selection)
        ...(powerLicense
          ? [
              {
                label: 'Create subfolder',
                icon: FOLDER_ICON_ADD,
                command: () => onOpenFolderList({ parentId: selectedFolderIds[0] }),
                shortcut: 'F',
                hidden: !allSelectedRowsAreFolders || selectedFolderIds.length !== 1,
              },
            ]
          : []),
        ...moveMenuItems,
        {
          label: 'Select all lists',
          icon: 'checklist',
          hidden: !selectedFolderIds.length, // hide if no folders selected per spec
          command: () => selectAllLists({ rowIds: selectedRows }),
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
          label: `Delete ${allSelectedRowsAreFolders ? '(folder only)' : ''}`,
          icon: 'delete',
          danger: true,
          command: (e: CommandEvent) => {
            const forceDelete = e.originalEvent.metaKey || e.originalEvent.ctrlKey

            if (allSelectedRowsAreFolders) {
              const folderIds = selectedRows
                .map((rowId) => parseListFolderRowId(rowId))
                .filter((id): id is string => !!id)

              // Delete folders
              onDeleteListFolders(folderIds)
            } else if (allSelectedRowsAreLists) {
              // Delete lists
              deleteLists(selectedRows, { force: forceDelete })
            }
          },
          // Hide if not lists/folders OR user doesn't have delete permission
          hidden:
            (!allSelectedRowsAreLists && !allSelectedRowsAreFolders) ||
            (allSelectedRowsAreLists && !userCanDeleteAllLists) ||
            (allSelectedRowsAreFolders && !userCanDeleteAllFolders),
        },
      ]

      return menuItems
    },
    [
      listsData,
      listFolders,
      openRenameList,
      setListDetailsOpen,
      deleteLists,
      createReviewSessionList,
      onOpenFolderList,
      onDeleteListFolders,
      developerMode,
      handleCreateReviewSessionList,
      clearListItems,
      isReview,
      powerLicense,
      selectAllLists,
      onOpenMoveDialog,
    ],
  )

  return useMemo(() => [buildContextMenu, ...extraBuilders], [buildContextMenu, extraBuilders])
}

export default useListContextMenu
