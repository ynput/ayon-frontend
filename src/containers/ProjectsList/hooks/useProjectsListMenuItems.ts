import { useMemo } from 'react'

interface MenuItemProps {
  hidden?: {
    'add-project'?: boolean
    'manage-projects'?: boolean
    'open-project'?: boolean
    'pin-project'?: boolean
    'select-all'?: boolean
  }
  projects: { name: string; active: boolean }[]
  selection: string[]
  onNewProject?: () => void
  pinned: string[]
  onPin?: (pinned: string[]) => void
  onManage?: () => void
  onOpen?: () => void
  onSelect?: (projects: string[]) => void
  onClose?: () => void
  onArchive?: (projectName: string, active: boolean) => void
  onDelete?: (projectName: string) => void
}

const useProjectsListMenuItems = ({
  hidden = {},
  projects,
  selection,
  pinned,
  onNewProject,
  onPin,
  onManage,
  onOpen,
  onSelect,
  onClose,
  onArchive,
  onDelete,
}: MenuItemProps) => {
  const allPinned = selection.every((id) => pinned.includes(id))
  const allSelected = selection.length === projects.length
  const singleProject =
    selection.length === 1 ? projects.find((p) => p.name === selection[0]) : undefined
  const singleActive = singleProject ? singleProject.active : false

  const handleSelectAll = () => {
    onClose?.()
    if (onSelect) {
      if (allSelected) {
        onSelect([])
      } else {
        const allIds = projects.map((p) => p.name)
        onSelect(allIds)
      }
    }
  }

  const handlePin = () => {
    if (onPin) {
      const updatedPinned = allPinned
        ? pinned.filter((p) => !selection.includes(p))
        : [...new Set([...pinned, ...selection])]
      onPin(updatedPinned)
    }
  }

  const handleArchive = () => {
    if (selection.length === 1 && singleProject) {
      onArchive?.(singleProject.name, !singleProject.active)
    }
  }

  const handleDelete = () => {
    if (selection.length === 1 && singleProject?.active === false) {
      onDelete?.(singleProject.name)
    }
  }

  const isMenuItemEnabled = (itemId: keyof NonNullable<MenuItemProps['hidden']>) => {
    return hidden[itemId] !== true
  }

  const menuItems = useMemo(() => {
    const allItems = [
      {
        id: 'add-project',
        label: 'Add new project',
        icon: 'add',
        onClick: onNewProject,
      },
      {
        id: 'select-all',
        label: allSelected ? 'Unselect all' : 'Select all',
        icon: 'checklist',
        onClick: handleSelectAll,
      },
      { id: 'divider' },
      {
        id: 'open-project',
        label: 'Open',
        icon: 'open_in_new',
        link: `/projects/${selection[0]}`,
        disabled: selection.length !== 1,
      },
      {
        id: 'manage-projects',
        label: 'Manage',
        icon: 'settings',
        link: `/manageProjects/anatomy?project=${selection[0]}`,
        disabled: selection.length !== 1,
      },
      { id: 'divider', label: '' },
      {
        id: 'pin-project',
        label: allPinned ? 'Unpin' : 'Pin',
        icon: 'push_pin',
        onClick: handlePin,
        disabled: selection.length === 0 || singleActive,
      },
      {
        id: 'archive-project',
        label: `${singleActive ? 'Deactivate' : 'Activate'}`,
        icon: 'archive',
        onClick: handleArchive,
        disabled: selection.length !== 1,
      },
      {
        id: 'delete-project',
        label: `${singleActive ? 'Deactivate to delete' : 'Delete'}`,
        icon: 'delete',
        onClick: handleDelete,
        disabled: selection.length !== 1 || singleActive !== false,
        danger: true,
      },
    ]

    return allItems.filter((item) => {
      if (item.id === 'divider') return true
      return isMenuItemEnabled(item.id as keyof NonNullable<MenuItemProps['hidden']>)
    })
  }, [
    hidden,
    onNewProject,
    onPin,
    onManage,
    onOpen,
    onSelect,
    selection,
    pinned,
    allPinned,
    allSelected,

    singleProject,
  ])

  return menuItems
}

export default useProjectsListMenuItems
