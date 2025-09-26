import { RowSelectionState } from '@tanstack/react-table'
import { useListsContext } from '../context'
import { CommandEvent, useCreateContextMenu } from '@shared/containers/ContextMenu'
import { useCallback } from 'react'
import { useAppSelector } from '@state/store'
import useClearListItems from './useClearListItems'
import { useProjectDataContext } from '@shared/containers/ProjectTreeTable'
import { useListsDataContext } from '../context/ListsDataContext'
import { parseListFolderRowId } from '../util'
import { EntityListFolderModel } from '@shared/api'
import { getPlatformShortcutKey, KeyMode } from '@shared/util'

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
    onDeleteListFolder,
    onPutFolderInFolder,
    onRemoveFolderFromFolder,
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

      // Check if the first selected row is a folder
      const selectedFolderId = parseListFolderRowId(firstSelectedRow)
      const isSelectedRowFolder = !!selectedFolderId
      const selectedFolder = isSelectedRowFolder
        ? listFolders.find((f) => f.id === selectedFolderId)
        : null

      // some rows are folders
      const allSelectedRowsAreLists = newSelectedRows.every((selected) =>
        newSelectedLists.some((list) => list?.id === selected),
      )
      const allSelectedRowsAreFolders = newSelectedRows.every((selected) =>
        parseListFolderRowId(selected),
      )

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
              ? () => onPutFolderInFolder(selectedFolderId!, folder.id)
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

        // Add "Create folder" option at the top
        submenuItems.push({
          label: 'Create folder',
          icon: FOLDER_ICON_ADD,
          command: () => onOpenFolderList({ listIds: selectedListIds }),
          disabled: isUser, // only admins and managers can create listFolders
          shortcut: 'F',
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
            shortcut: getPlatformShortcutKey('f', [KeyMode.Shift, KeyMode.Alt]),
          })
        }

        if (listFolders.length > 0) {
          if (submenuItems.length > 0) {
            submenuItems.push({ separator: true })
          }

          const { rootFolders } = buildFolderHierarchy(listFolders)
          const hierarchyItems = createFolderHierarchy(rootFolders)
          submenuItems.push(...hierarchyItems)
        }

        return submenuItems
      }

      // Create folder submenu items for folders
      const createFolderFolderSubmenu = () => {
        if (!allSelectedRowsAreFolders || !selectedFolder) {
          return []
        }

        const submenuItems: any[] = []

        // Add "Create subfolder" option at the top
        submenuItems.push({
          label: 'Create subfolder',
          icon: FOLDER_ICON_ADD,
          command: () => onOpenFolderList({ parentId: selectedFolderId || undefined }),
          disabled: isUser, // only admins and managers can create listFolders
          shortcut: 'F',
        })

        // Show "Unset parent folder" if folder has a parent
        if (selectedFolder.parentId) {
          submenuItems.push({
            label: 'Make root folder',
            icon: FOLDER_ICON_REMOVE,
            command: () => onRemoveFolderFromFolder(selectedFolderId!),
            shortcut: getPlatformShortcutKey('f', [KeyMode.Shift, KeyMode.Alt]),
          })
        }

        // Show available parent folders (excluding self and its descendants)
        const availableParents = listFolders.filter(
          (folder) =>
            folder.id !== selectedFolderId &&
            !wouldCreateCircularDependency(selectedFolderId!, folder.id, listFolders),
        )

        if (availableParents.length > 0) {
          if (submenuItems.length > 0) {
            submenuItems.push({ separator: true })
          }

          const { rootFolders } = buildFolderHierarchy(availableParents)
          const hierarchyItems = createFolderHierarchy(rootFolders, selectedFolderId || undefined)
          submenuItems.push(...hierarchyItems)
        }

        return submenuItems
      }

      const listFolderSubmenu = createListFolderSubmenu()
      const folderFolderSubmenu = createFolderFolderSubmenu()

      const menuItems: any[] = [
        {
          label: 'Rename',
          icon: 'edit',
          command: () => openRenameList(firstSelectedRow),
          disabled: multipleSelected || (isSelectedRowFolder && isUser),
          hidden: !allSelectedRowsAreLists && !isSelectedRowFolder,
        },
        {
          label: 'Edit folder',
          icon: FOLDER_ICON_EDIT,
          command: () => {
            const folderId = firstSelectedRow.replace('folder-', '')
            onOpenFolderList({ folderId })
          },
          hidden: !isSelectedRowFolder || multipleSelected,
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
          items: allSelectedRowsAreLists ? listFolderSubmenu : folderFolderSubmenu,
          disabled: !allSelectedRowsAreLists && !allSelectedRowsAreFolders,
          hidden:
            (!allSelectedRowsAreLists && !allSelectedRowsAreFolders) ||
            (allSelectedRowsAreLists && listFolderSubmenu.length === 0) ||
            (allSelectedRowsAreFolders && folderFolderSubmenu.length === 0),
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
          command: (e: CommandEvent) => {
            const forceDelete = e.originalEvent.metaKey || e.originalEvent.ctrlKey

            if (allSelectedRowsAreFolders) {
              // Delete folders
              newSelectedRows.forEach((rowId) => {
                const folderId = parseListFolderRowId(rowId)
                if (folderId) {
                  onDeleteListFolder(folderId)
                }
              })
            } else if (allSelectedRowsAreLists) {
              // Delete lists
              deleteLists(Object.keys(newSelection), { force: forceDelete })
            }
          },
          hidden: !allSelectedRowsAreLists && !allSelectedRowsAreFolders,
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
      onRemoveListsFromFolder,
      onOpenFolderList,
      onDeleteListFolder,
      onPutFolderInFolder,
      onRemoveFolderFromFolder,
      isUser,
      developerMode,
      handleCreateReviewSessionList,
      clearListItems,
      isReview,
    ],
  )

  return {
    openContext,
  }
}

export default useListContextMenu
