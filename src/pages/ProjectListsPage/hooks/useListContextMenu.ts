import { useListsContext } from '../context/ListsContext'
import { CommandEvent } from '@shared/containers/ContextMenu'
import { useCallback, useMemo } from 'react'
import { useAppSelector } from '@state/store'
import useClearListItems from './useClearListItems'
import { useListsDataContext } from '../context/ListsDataContext'
import { parseListFolderRowId } from '../util/buildListsTableData'
import { buildFolderMap, wouldCreateCircularDependency } from '../util/listFolders'
import { EntityListFolderModel } from '@shared/api'
import { getPlatformShortcutKey, KeyMode } from '@shared/util'
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

// enabled=false in picker mode: the table renders no row menu there
const useListContextMenu = (extraBuilders: ListRowContextMenuBuilder[] = [], enabled = true) => {
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
    onRemoveFoldersFromFolder,
    openMoveToFolder,
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

      const selectedListIds = newSelectedLists.map((list) => list.id)
      const moveIds = allSelectedRowsAreFolders ? selectedFolderIds : selectedListIds

      // is there anywhere the selection can actually go? (a folder can't move into itself or its own subtree)
      const folderMap = buildFolderMap(listFolders)
      const hasTargetFolders = allSelectedRowsAreFolders
        ? listFolders.some(
            (folder) =>
              !selectedFolderIds.includes(folder.id) &&
              !selectedFolderIds.some((id) =>
                wouldCreateCircularDependency(id, folder.id, folderMap),
              ),
          )
        : listFolders.length > 0

      // lists already in a folder can still open the picker to unset it there
      const hasAnyFolder = newSelectedLists.some((list) => list.entityListFolderId)

      // Move opens the folder picker dialog, which also hosts the unset action
      const moveMenuItems: any[] = []
      if (powerLicense) {
        moveMenuItems.push(
          {
            label: allSelectedRowsAreFolders ? 'Move folder' : 'Move list',
            icon: FOLDER_ICON,
            command: () =>
              openMoveToFolder({
                moving: allSelectedRowsAreFolders ? 'folders' : 'lists',
                ids: moveIds,
              }),
            hidden:
              (!allSelectedRowsAreLists && !allSelectedRowsAreFolders) ||
              moveIds.length === 0 ||
              (!hasTargetFolders && !hasAnyFolder) ||
              // Hide if user doesn't have edit permission on all selected items
              (allSelectedRowsAreLists && !userCanEditAllLists) ||
              (allSelectedRowsAreFolders && !userCanEditAllFolders),
          },
          {
            label: 'Make root folder',
            icon: FOLDER_ICON_REMOVE,
            command: () => onRemoveFoldersFromFolder(selectedFolderIds).catch(() => {}),
            shortcut: getPlatformShortcutKey('f', [KeyMode.Shift, KeyMode.Alt]),
            hidden:
              !allSelectedRowsAreFolders ||
              !selectedFoldersAll.some((folder) => folder.parentId) ||
              !userCanEditAllFolders,
          },
        )
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
      onRemoveFoldersFromFolder,
      openMoveToFolder,
      developerMode,
      handleCreateReviewSessionList,
      clearListItems,
      isReview,
      powerLicense,
    ],
  )

  return useMemo(
    () => (enabled ? [buildContextMenu, ...extraBuilders] : []),
    [enabled, buildContextMenu, extraBuilders],
  )
}

export default useListContextMenu
