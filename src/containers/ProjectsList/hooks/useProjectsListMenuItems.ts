import { useCallback } from 'react'
import { parseListFolderRowId } from '@pages/ProjectListsPage/util'
import { EntityListFolderModel, ProjectFolderModel, ListProjectsItemModel } from '@shared/api'
import { FOLDER_ICON, FOLDER_ICON_REMOVE } from '@pages/ProjectListsPage/hooks/useListContextMenu.ts'
import { getPlatformShortcutKey, KeyMode } from '@shared/util'
import { parseProjectFolderRowId } from '@containers/ProjectsList/buildProjectsTableData.ts'

type Hidden = {
  search?: boolean
  'add-project'?: boolean
  'manage-projects'?: boolean
  'open-project'?: boolean
  'pin-project'?: boolean
  'select-all'?: boolean
  'archive-project'?: boolean
  'delete-project'?: boolean
  'show-archived'?: boolean
  'create-folder'?: boolean
  'move-project'?: boolean
}

interface MenuItemProps {
  hidden?: Hidden
  projects: ListProjectsItemModel[]
  folders: ProjectFolderModel[]
  onNewProject?: () => void
  pinned: string[]
  multiSelect?: boolean
  showArchived?: boolean
  userLevel?: number
  onPin?: (pinned: string[]) => void
  onSearch?: () => void
  onManage?: (name: string) => void
  onOpen?: (name: string) => void
  onSelectAll?: () => void
  onArchive?: (projectName: string, active: boolean) => void
  onDelete?: (projectName: string) => void
  onShowArchivedToggle?: () => void
  powerLicense?: boolean
  onCreateFolder?: ({folderId, projectNames}:{folderId?:string, projectNames?:string[]}) => void
  onPutProjectsInFolder?: (projectNames: string[], projectFolderId?: string) => Promise<void>
  onPutFolderInFolder?: (folderId: string, projectFolderId?: string) => Promise<void>
  onRemoveProjectsFromFolder?: (projectNames: string[]) => Promise<void>
  onDeleteFolder?: (folderId: string) => void
  onRenameFolder?: (folderId: string) => void
  onEditFolder?: (folderId: string) => void
}

type MenuItem = {
  id: string
  label?: string
  icon?: string
  onClick?: () => void
  command?: (e: React.MouseEvent<HTMLElement>) => void
  link?: string
  disabled?: boolean
  danger?: boolean
  selected?: boolean
  active?: boolean
  hidden?: boolean
  items?: any[]
  separator?: boolean
  shortcut?: string
}

type BuildMenuItems = (
  selection: string[],
  config?: { command?: boolean; dividers?: boolean; hidden?: Hidden },
) => MenuItem[]

const buildProjectFolderHierarchy = (folders: ProjectFolderModel[]) => {
  const folderMap = new Map<string, ProjectFolderModel & { children: ProjectFolderModel[] }>()
  const rootFolders: (ProjectFolderModel & { children: ProjectFolderModel[] })[] = []

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

const useProjectsListMenuItems = ({
  hidden = {},
  projects,
  folders,
  pinned,
  multiSelect,
  showArchived = false,
  userLevel = 0,
  onNewProject,
  onSearch,
  onPin,
  onManage,
  onOpen,
  onSelectAll,
  onArchive,
  onDelete,
  onShowArchivedToggle,
  powerLicense,
  onCreateFolder,
  onPutProjectsInFolder,
  onPutFolderInFolder,
  onRemoveProjectsFromFolder,
  onDeleteFolder,
  onEditFolder,
  onRenameFolder,

}: MenuItemProps): BuildMenuItems => {
  // Remove allPinned, singleProject from hook scope, move to buildMenuItems
  const handlePin = (allPinned: boolean, selection: string[]) => {
    if (onPin) {
      const updatedPinned = allPinned
        ? pinned.filter((p) => !selection.includes(p))
        : [...new Set([...pinned, ...selection])]
      onPin(updatedPinned)
    }
  }

  const handleArchive = (singleProject: ListProjectsItemModel | undefined, selection: string[]) => {
    if (selection.length === 1 && singleProject) {
      onArchive?.(singleProject.name, !singleProject.active)
    }
  }

  const handleDelete = (singleProject: ListProjectsItemModel | undefined, selection: string[]) => {
    if (selection.length === 1 && singleProject?.active === false) {
      onDelete?.(singleProject.name)
    }
  }
  const handleDeleteFolder = (selection: string[]) => {
    if (selection.length === 1) {
      const folderId = parseProjectFolderRowId(selection[0])
      if (folderId) {
        onDeleteFolder?.(folderId)
      }
    }
  }

  const isMenuItemEnabled = (
    itemId: keyof NonNullable<MenuItemProps['hidden']>,
    hiddenScoped: Hidden,
  ) => {
    return hidden[itemId] !== true && hiddenScoped[itemId] !== true
  }

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

  const buildMenuItems = useCallback<BuildMenuItems>(
    (selection, config) => {
      const { command, dividers = true, hidden = {} } = config || {}
      const allPinned = selection.every((id) => pinned.includes(id))
      const allSelected = selection.length === projects.length
      const singleProject =
        selection.length === 1 ? projects.find((p) => p.name === selection[0]) : undefined
      const singleActive = singleProject ? singleProject.active : false
      const firstSelectedRow = selection[0]
      const selectedFolderId = parseProjectFolderRowId(firstSelectedRow)
      const isSelectedRowFolder = !!selectedFolderId
      const isSelectedProject = !!singleProject
      const selectedFolder = isSelectedRowFolder
        ? folders.find((f) => f.id === selectedFolderId)
        : null

      const newSelectedRows = selection

      const newSelectedProjects = projects.filter((project) =>
        newSelectedRows.includes(project.name),
      )
      const allSelectedRowsAreProjects = newSelectedRows.every((selected) =>
        newSelectedProjects.some((project) => project?.name === selected),
      )

      const allSelectedRowsAreFolders = selection.every((selected) =>
        parseListFolderRowId(selected),
      )
      // Create recursive folder submenu
      const createFolderHierarchy = (
        folders: (ProjectFolderModel & { children: ProjectFolderModel[] })[],
        excludeFolderId?: string,
        depth = 0,
      ): any[] => {
        const items: any[] = []

        for (const folder of folders) {
          if (folder.id === excludeFolderId) continue

          const hasChildren = folder.children.length > 0
          const childItems = hasChildren
            ? createFolderHierarchy(
              folder.children as (ProjectFolderModel & {
                children: ProjectFolderModel[]
              })[],
              excludeFolderId,
              depth + 1,
            )
            : []
          items.push({
            label: folder.label,
            icon: folder.data?.icon || FOLDER_ICON,
            command: allSelectedRowsAreFolders
              ? () => onPutFolderInFolder?.(selectedFolderId as string, folder.id)
              : () =>
                onPutProjectsInFolder?.(
                  newSelectedProjects.map((p) => p.name),
                  folder.id,
                ),
            disabled:
              allSelectedRowsAreFolders &&
              wouldCreateCircularDependency(selectedFolderId!, folder.id, folders),
            ...(hasChildren && { items: childItems }),
          })
        }

        return items
      }
      const createFolderFolderSubmenu = () => {
        if (!allSelectedRowsAreFolders || !selectedFolder) {
          return []
        }

        const submenuItems: any[] = []

        // Show available parent folders (excluding self and its descendants) first
        const availableParents = folders.filter(
          (folder) =>
            folder.id !== selectedFolderId &&
            !wouldCreateCircularDependency(selectedFolderId!, folder.id, folders as any),
        )

        if (availableParents.length > 0) {
          const { rootFolders } = buildProjectFolderHierarchy(availableParents)
          const hierarchyItems = createFolderHierarchy(rootFolders, selectedFolderId || undefined)
          submenuItems.push(...hierarchyItems)
        }

        // Show "Unset parent" (make root) at bottom if folder has a parent
        if (selectedFolder.parentId) {
          if (submenuItems.length > 0) submenuItems.push({ separator: true })
          submenuItems.push({
            label: 'Make root folder',
            icon: FOLDER_ICON_REMOVE,
            command: () => onPutFolderInFolder?.(selectedFolder.id),
            shortcut: getPlatformShortcutKey('f', [KeyMode.Shift, KeyMode.Alt]),
          })
        }

        return submenuItems
      }
      const createProjectFolderSubmenu = () => {
        if (!allSelectedRowsAreProjects || newSelectedProjects.length === 0) {
          return []
        }

        const submenuItems: any[] = []
        const selectedProjectNames = newSelectedProjects.map((project) => project.name)

        // Add hierarchy items first (available destination folders)
        if (folders.length > 0) {
          const { rootFolders } = buildProjectFolderHierarchy(folders)
          const hierarchyItems = createFolderHierarchy(rootFolders)
          submenuItems.push(...hierarchyItems)
        }

        // For multiple selections, show "Unset folder" if any project has a folder
        // For single selection, show "Unset folder" only if that project has a folder
        const hasAnyFolder = newSelectedProjects.some((project) => project.name)
        if (hasAnyFolder) {
          if (submenuItems.length > 0) submenuItems.push({ separator: true })
          submenuItems.push({
            label: 'Unset folder',
            icon: FOLDER_ICON_REMOVE,
            command: () => {
              onRemoveProjectsFromFolder?.(selectedProjectNames)
            },
            shortcut: getPlatformShortcutKey('f', [KeyMode.Shift, KeyMode.Alt]),
          })
        }

        return submenuItems
      }

      const projectFolderSubmenu = createProjectFolderSubmenu()
      const folderFolderSubmenu = createFolderFolderSubmenu()

      const moveMenuItem: MenuItem | null = powerLicense ? {
        id: 'move-project',
        label: allSelectedRowsAreFolders ? 'Move folder' : 'Move project',
        icon: FOLDER_ICON,
        items: allSelectedRowsAreProjects ? projectFolderSubmenu : folderFolderSubmenu,
        disabled: !allSelectedRowsAreProjects && !allSelectedRowsAreFolders,
        hidden:
          (!allSelectedRowsAreProjects && !allSelectedRowsAreFolders) ||
          (allSelectedRowsAreProjects && projectFolderSubmenu.length === 0) ||
          (allSelectedRowsAreFolders && folderFolderSubmenu.length === 0)
      } : null

      const allItems: MenuItem[] = [
        {
          id: 'search',
          label: 'Search',
          icon: 'search',
          [command ? 'command' : 'onClick']: () => onSearch?.(),
        },
        {
          id: 'select-all',
          label: allSelected ? 'Unselect all' : 'Select all',
          icon: 'checklist',
          [command ? 'command' : 'onClick']: onSelectAll,
          hidden: multiSelect !== true,
        },
        {
          id: 'add-project',
          label: 'Add new project',
          icon: 'add',
          [command ? 'command' : 'onClick']: onNewProject,
        },
        {
          id: 'create-folder',
          label: isSelectedRowFolder? 'Create subfolder': 'Create folder',
          icon: 'create_new_folder',
          [command ? 'command' : 'onClick']: isSelectedRowFolder? ()=> onCreateFolder?.({folderId: selectedFolder?.id})  : isSelectedProject ? () =>onCreateFolder?.({projectNames:newSelectedProjects.map((project)=> project.name)}) : onCreateFolder,
        },
        {
          id: 'rename-folder',
          label: 'Rename',
          icon: 'create_new_folder',
          [command ? 'command' : 'onClick']: () => onRenameFolder?.(selectedFolderId as string),
          hidden: !isSelectedRowFolder
        },
        {
          id: 'edit-folder',
          label: 'Edit folder',
          icon: '',
          [command ? 'command' : 'onClick']: () => onEditFolder?.(selectedFolderId as string),
          hidden: !isSelectedRowFolder
        },
        ...(moveMenuItem ? [moveMenuItem] : []),
        { id: 'divider' },
        {
          id: 'open-project',
          label: 'Open',
          icon: 'open_in_new',
          [command ? 'command' : 'onClick']: () => singleProject && onOpen?.(singleProject?.name),
          hidden: userLevel < 500 || isSelectedRowFolder,
        },
        {
          id: 'manage-projects',
          label: 'Manage',
          icon: 'settings',
          [command ? 'command' : 'onClick']: () => singleProject && onManage?.(singleProject.name),
          hidden: userLevel < 500 || isSelectedRowFolder,
        },
        {
          id: 'show-archived',
          label: 'Show archived',
          icon: 'inventory_2',
          [command ? 'command' : 'onClick']: onShowArchivedToggle,
          selected: showArchived,
          active: showArchived,
          hidden: command || userLevel < 500, // hide on context menu
        },
        { id: 'divider', label: '', hidden: userLevel < 500 },
        {
          id: 'pin-project',
          label: allPinned ? 'Unpin' : 'Pin',
          icon: 'push_pin',
          [command ? 'command' : 'onClick']: () => handlePin(allPinned, selection),
          disabled: selection.length === 0,
          hidden: isSelectedRowFolder
        },
        {
          id: 'archive-project',
          label: `${singleActive ? 'Deactivate' : 'Activate'}`,
          icon: 'archive',
          [command ? 'command' : 'onClick']: () => handleArchive(singleProject, selection),
          disabled: selection.length !== 1,
          hidden: isSelectedRowFolder
        },
        {
          id: 'delete-project',
          label: `${singleActive ? 'Deactivate to delete' : 'Delete'}`,
          icon: 'delete',
          [command ? 'command' : 'onClick']: () =>  handleDelete(singleProject, selection),
          disabled: selection.length !== 1 || singleActive,
          danger: true,
          hidden: isSelectedRowFolder
        },
        {
          id: 'delete-folder',
          label: 'Delete folder',
          icon: 'delete',
          [command ? 'command' : 'onClick']: () =>  handleDeleteFolder(selection),
          danger: true,
          hidden: !isSelectedRowFolder
        },
      ]

      return allItems.filter((item) => {
        if (item.id === 'divider') {
          return dividers
        }
        return isMenuItemEnabled(item.id as keyof NonNullable<MenuItemProps['hidden']>, hidden)
      })
    },
    [
      hidden,
      onNewProject,
      onPin,
      onManage,
      onOpen,
      onSelectAll,
      onSearch,
      pinned,
      projects,
      folders,
      multiSelect,
      showArchived,
      userLevel,
      isMenuItemEnabled,
      onArchive,
      onDelete,
      onShowArchivedToggle,
      powerLicense,
      onCreateFolder,
      onPutProjectsInFolder,
      onPutFolderInFolder,
      onRemoveProjectsFromFolder,
      handlePin,
      handleArchive,
      handleDelete,
      handleDeleteFolder,
      onDeleteFolder,
      wouldCreateCircularDependency,
      onRenameFolder,
      onEditFolder
    ],
  )

  return buildMenuItems
}

export default useProjectsListMenuItems
