import { useCallback } from 'react'

type Project = { name: string; active: boolean }

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
}

interface MenuItemProps {
  hidden?: Hidden
  projects: Project[]
  onNewProject?: () => void
  pinned: string[]
  multiSelect?: boolean
  showArchived?: boolean
  onPin?: (pinned: string[]) => void
  onSearch?: () => void
  onManage?: (name: string) => void
  onOpen?: (name: string) => void
  onSelectAll?: () => void
  onArchive?: (projectName: string, active: boolean) => void
  onDelete?: (projectName: string) => void
  onShowArchivedToggle?: () => void
}

type BuildMenuItems = (
  selection: string[],
  config?: { command?: boolean; dividers?: boolean; hidden?: Hidden }, // Added dividers to config for flexibility,
) => {
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
}[]

const useProjectsListMenuItems = ({
  hidden = {},
  projects,
  pinned,
  multiSelect,
  showArchived = false,
  onNewProject,
  onSearch,
  onPin,
  onManage,
  onOpen,
  onSelectAll,
  onArchive,
  onDelete,
  onShowArchivedToggle,
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

  const handleArchive = (singleProject: Project | undefined, selection: string[]) => {
    if (selection.length === 1 && singleProject) {
      onArchive?.(singleProject.name, !singleProject.active)
    }
  }

  const handleDelete = (singleProject: Project | undefined, selection: string[]) => {
    if (selection.length === 1 && singleProject?.active === false) {
      onDelete?.(singleProject.name)
    }
  }

  const isMenuItemEnabled = (
    itemId: keyof NonNullable<MenuItemProps['hidden']>,
    hiddenScoped: Hidden,
  ) => {
    return hidden[itemId] !== true && hiddenScoped[itemId] !== true
  }

  const buildMenuItems = useCallback<BuildMenuItems>(
    (selection, config) => {
      const { command, dividers = true, hidden = {} } = config || {}
      const allPinned = selection.every((id) => pinned.includes(id))
      const allSelected = selection.length === projects.length
      const singleProject =
        selection.length === 1 ? projects.find((p) => p.name === selection[0]) : undefined
      const singleActive = singleProject ? singleProject.active : false
      const allItems = [
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
        { id: 'divider' },
        {
          id: 'open-project',
          label: 'Open',
          icon: 'open_in_new',
          [command ? 'command' : 'onClick']: () => singleProject && onOpen?.(singleProject?.name),
        },
        {
          id: 'manage-projects',
          label: 'Manage',
          icon: 'settings',
          [command ? 'command' : 'onClick']: () => singleProject && onManage?.(singleProject.name),
        },
        {
          id: 'show-archived',
          label: 'Show archived',
          icon: 'inventory_2',
          [command ? 'command' : 'onClick']: onShowArchivedToggle,
          selected: showArchived,
          active: showArchived,
        },
        { id: 'divider', label: '' },
        {
          id: 'pin-project',
          label: allPinned ? 'Unpin' : 'Pin',
          icon: 'push_pin',
          [command ? 'command' : 'onClick']: () => handlePin(allPinned, selection),
          disabled: selection.length === 0,
        },
        {
          id: 'archive-project',
          label: `${singleActive ? 'Deactivate' : 'Activate'}`,
          icon: 'archive',
          [command ? 'command' : 'onClick']: () => handleArchive(singleProject, selection),
          disabled: selection.length !== 1,
        },
        {
          id: 'delete-project',
          label: `${singleActive ? 'Deactivate to delete' : 'Delete'}`,
          icon: 'delete',
          [command ? 'command' : 'onClick']: () => handleDelete(singleProject, selection),
          disabled: selection.length !== 1 || singleActive !== false,
          danger: true,
        },
      ]

      return allItems.filter((item) => {
        if (item.id === 'divider') {
          if (!dividers) return false
          return true
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
      multiSelect,
      showArchived,
      isMenuItemEnabled,
      onArchive,
      onDelete,
      onShowArchivedToggle,
    ],
  )

  return buildMenuItems
}

export default useProjectsListMenuItems
