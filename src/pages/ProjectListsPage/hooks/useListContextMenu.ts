import { useListsContext } from '../context'
import { CommandEvent, ContextMenuItemType } from '@shared/containers/ContextMenu'
import { useMemo } from 'react'
import { useAppSelector } from '@state/store'
import useClearListItems from './useClearListItems'
import { useListsDataContext } from '../context/ListsDataContext'
import { parseListFolderRowId } from '../util'
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

export const FOLDER_ICON = 'snippet_folder'
export const FOLDER_ICON_ADD = 'create_new_folder'
export const FOLDER_ICON_EDIT = 'folder_managed'
export const FOLDER_ICON_REMOVE = 'folder_off'

// Helper function to build hierarchical folder structure for menu
const buildFolderHierarchy = (folders: EntityListFolderModel[]) => {
  const folderMap = new Map<string, EntityListFolderModel & { children: EntityListFolderModel[] }>()
  const rootFolders: (EntityListFolderModel & { children: EntityListFolderModel[] })[] = []

  // Create nodes for all folders
  for (const folder of folders) {
    folderMap.set(folder.id, { ...folder, children: [] })
  }

  // Build parent-child relationships
  for (const folder of folders) {
    const folderNode = folderMap.get(folder.id)!
    if (folder.parentId && folderMap.has(folder.parentId)) {
      folderMap.get(folder.parentId)!.children.push(folderNode)
    } else {
      rootFolders.push(folderNode)
    }
  }

  return { folderMap, rootFolders }
}

// Helper function to prevent circular dependencies
const wouldCreateCircularDependency = (
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

const useListContextMenu = () => {
  const user = useAppSelector((state) => state.user)
  const developerMode = user?.attrib.developerMode
  const { projectName } = useProjectContext()
  const { listsData, listFolders } = useListsDataContext()
  const {
    rowSelection,
    openRenameList,
    setListDetailsOpen,
    deleteLists,
    createReviewSessionList,
    isReview,
    onPutListsInFolder,
    onRemoveListsFromFolder,
    onOpenFolderList,
    openNewList,
    onDeleteListFolders,
    onPutFoldersInFolder,
    onRemoveFoldersFromFolder,
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

  // Build menu items based on current selection
  const menuItems: ContextMenuItemType[] = useMemo(() => {
    const newSelectedRows = Object.entries(rowSelection)
      .filter(([_k, v]) => v)
      .map(([k]) => k)
    const newSelectedLists = listsData.filter((list) =>
      newSelectedRows.some((selected) => list?.id === selected),
    )
    const selectedList = newSelectedLists[0]
    const firstSelectedRow = Object.keys(rowSelection)[0]
    const multipleSelected = Object.keys(rowSelection).length > 1

      // Check if the first selected row is a folder
      const selectedFolderId = parseListFolderRowId(firstSelectedRow)
      const isSelectedRowFolder = !!selectedFolderId
      const selectedFolder = isSelectedRowFolder
        ? listFolders.find((f) => f.id === selectedFolderId)
        : null
      const selectedFolderIds = newSelectedRows
        .map((id) => parseListFolderRowId(id))
        .filter((id): id is string => !!id)

      // some rows are folders
      const allSelectedRowsAreLists = newSelectedRows.every((selected) =>
        newSelectedLists.some((list) => list?.id === selected),
      )
      const allSelectedRowsAreFolders = newSelectedRows.every((selected) =>
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
      const userCanEditList = selectedList ? canEditList(selectedList, userPermissions) : false
      const userCanEditFolder = selectedFolder
        ? canEditFolder(selectedFolder, userPermissions)
        : false

      // Create recursive folder submenu
      const createFolderHierarchy = (
        folders: (EntityListFolderModel & { children: EntityListFolderModel[] })[],
        excludeFolderId?: string,
        depth = 0,
      ): any[] => {
        const items: any[] = []

        for (const folder of folders) {
          if (folder.id === excludeFolderId) continue

          const hasChildren = folder.children.length > 0
          const childItems = hasChildren
            ? createFolderHierarchy(
                folder.children as (EntityListFolderModel & {
                  children: EntityListFolderModel[]
                })[],
                excludeFolderId,
                depth + 1,
              )
            : []

          items.push({
            label: folder.label,
            icon: folder.data?.icon || FOLDER_ICON,
            command: allSelectedRowsAreFolders
              ? () => onPutFoldersInFolder(selectedFolderIds, folder.id)
              : () =>
                  onPutListsInFolder(
                    newSelectedLists.map((l) => l.id),
                    folder.id,
                  ),
            disabled:
              allSelectedRowsAreFolders &&
              wouldCreateCircularDependency(selectedFolderId!, folder.id, listFolders),
            ...(hasChildren && { items: childItems }),
          })
        }

        return items
      }

      // Create folder submenu items for lists
      const createListFolderSubmenu = () => {
        if (!allSelectedRowsAreLists || newSelectedLists.length === 0) {
          return []
        }

        const submenuItems: any[] = []
        const selectedListIds = newSelectedLists.map((list) => list.id)

        // Add hierarchy items first (available destination folders)
        if (listFolders.length > 0) {
          const { rootFolders } = buildFolderHierarchy(listFolders)
          const hierarchyItems = createFolderHierarchy(rootFolders)
          submenuItems.push(...hierarchyItems)
        }

        // For multiple selections, show "Unset folder" if any list has a folder
        // For single selection, show "Unset folder" only if that list has a folder
        const hasAnyFolder = newSelectedLists.some((list) => list.entityListFolderId)
        if (hasAnyFolder) {
          if (submenuItems.length > 0) submenuItems.push({ separator: true })
          submenuItems.push({
            label: 'Unset folder',
            icon: FOLDER_ICON_REMOVE,
            command: () => {
              onRemoveListsFromFolder(selectedListIds)
            },
            shortcut: getPlatformShortcutKey('f', [KeyMode.Shift, KeyMode.Alt]),
          })
        }

        return submenuItems
      }

      // Create folder submenu items for folders
      const createFolderFolderSubmenu = () => {
        if (!allSelectedRowsAreFolders || !selectedFolder) {
          return []
        }

        const submenuItems: any[] = []

        // Show available parent folders (excluding self and its descendants) first
        const availableParents = listFolders.filter(
          (folder) =>
            folder.id !== selectedFolderId &&
            !wouldCreateCircularDependency(selectedFolderId!, folder.id, listFolders),
        )

        if (availableParents.length > 0) {
          const { rootFolders } = buildFolderHierarchy(availableParents)
          const hierarchyItems = createFolderHierarchy(rootFolders, selectedFolderId || undefined)
          submenuItems.push(...hierarchyItems)
        }

        // Show "Unset parent" (make root) at bottom if folder has a parent
        if (selectedFolder.parentId) {
          if (submenuItems.length > 0) submenuItems.push({ separator: true })
          submenuItems.push({
            label: 'Make root folder',
            icon: FOLDER_ICON_REMOVE,
            command: () => onRemoveFoldersFromFolder(selectedFolderIds),
            shortcut: getPlatformShortcutKey('f', [KeyMode.Shift, KeyMode.Alt]),
          })
        }

        return submenuItems
      }

      const listFolderSubmenu = createListFolderSubmenu()
      const folderFolderSubmenu = createFolderFolderSubmenu()

      // Build move submenu (formerly "Folder")
      const moveMenuItems: any[] = []
      if (powerLicense) {
        moveMenuItems.push({
          label: allSelectedRowsAreFolders ? 'Move folder' : 'Move list',
          icon: FOLDER_ICON,
          items: allSelectedRowsAreLists ? listFolderSubmenu : folderFolderSubmenu,
          // Structural disabling only (no selection); ownership handled via hidden
          disabled: !allSelectedRowsAreLists && !allSelectedRowsAreFolders,
          hidden:
            (!allSelectedRowsAreLists && !allSelectedRowsAreFolders) ||
            (allSelectedRowsAreLists && listFolderSubmenu.length === 0) ||
            (allSelectedRowsAreFolders && folderFolderSubmenu.length === 0) ||
            // Hide if user doesn't have edit permission on all selected items
            (allSelectedRowsAreLists && !userCanEditAllLists) ||
            (allSelectedRowsAreFolders && !userCanEditAllFolders),
        })
      }

      const menuItems: any[] = [
        {
          label: 'Rename',
          icon: 'edit',
          command: () => openRenameList(firstSelectedRow),
          // Disable for multi-select
          disabled: multipleSelected,
          // Hide if not a list/folder OR user doesn't have edit permission
          hidden:
            (!allSelectedRowsAreLists && !isSelectedRowFolder) ||
            (isSelectedRowFolder && !userCanEditFolder) ||
            (!isSelectedRowFolder && !userCanEditList),
        },
        {
          label: 'Create review',
          icon: 'subscriptions',
          command: async () => {
            await createReviewSessionList?.(selectedList.id, {
              showToast: true,
              navigateOnSuccess: true,
            })
          },
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
                command: () => onOpenFolderList({}),
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
          command: () => selectAllLists({ rowIds: Object.keys(rowSelection) }),
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
              const folderIds = newSelectedRows
                .map((rowId) => parseListFolderRowId(rowId))
                .filter((id): id is string => !!id)

              // Delete folders
              onDeleteListFolders(folderIds)
            } else if (allSelectedRowsAreLists) {
              // Delete lists
              deleteLists(Object.keys(rowSelection), { force: forceDelete })
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
  }, [
    rowSelection,
    listsData,
    listFolders,
    openRenameList,
    setListDetailsOpen,
    deleteLists,
    createReviewSessionList,
    onPutListsInFolder,
    onRemoveListsFromFolder,
    onOpenFolderList,
    openNewList,
    onDeleteListFolders,
    onPutFoldersInFolder,
    onRemoveFoldersFromFolder,
    selectAllLists,
    developerMode,
    clearListItems,
    isReview,
    powerLicense,
    userPermissions,
  ])

  return { menuItems }
}

export default useListContextMenu
