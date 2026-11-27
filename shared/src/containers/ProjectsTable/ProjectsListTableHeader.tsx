import { TableListHeader } from '@shared/components/TableListHeader'
import type { TableListHeaderItem } from '@shared/components/TableListHeader'
import type { MenuItemType } from '@shared/components/Menu'
import type { IconType } from '@ynput/ayon-react-components'
import { FC } from 'react'

export const MENU_ID = 'projects-list-menu'

interface ButtonCustomization {
  icon?: IconType
  tooltip?: string
  shortcut?: string
}

interface ButtonsCustomization {
  delete?: ButtonCustomization
  add?: ButtonCustomization
  search?: ButtonCustomization
  filter?: {
    icon?: IconType
    tooltip?: string
    activeTooltip?: string
    tooltipDelay?: number
  }
}

type ButtonType = 'delete' | 'add' | 'filter' | 'search' | 'select-all'

interface ProjectsListTableHeaderProps {
  title: string
  search: string | null | undefined
  onSearch: (search: string | undefined) => void
  onSelectAll?: () => void
  buttonLabels?: ButtonsCustomization
  hiddenButtons?: ButtonType[]
  onNewProject?: () => void
  showAddProject?: boolean
  toggleMenu?: (open: boolean) => void
  menuItems?: MenuItemType[]
}

const ProjectsListTableHeader: FC<ProjectsListTableHeaderProps> = ({
  title,
  search,
  onSearch,
  onSelectAll,
  buttonLabels = {},
  hiddenButtons = [],
  onNewProject,
  showAddProject = false,
  menuItems = [],
  toggleMenu,
}) => {
  // the menu has every action: these are buttons too, search on the right
  const buttons: Record<string, Partial<TableListHeaderItem>> = {
    search: {
      onClick: () => typeof search !== 'string' && onSearch(''),
      isPinned: !hiddenButtons.includes('search'),
      buttonProps: { icon: 'search', tooltip: 'Search projects', ...buttonLabels.search },
    },
    'select-all': {
      isPinned: !hiddenButtons.includes('select-all') && !!onSelectAll,
      buttonProps: { icon: 'checklist', tooltip: 'Select all' },
    },
    'add-project': {
      onClick: menuItems.find((item) => item.id === 'add-project')?.onClick ?? onNewProject,
      isPinned: showAddProject,
      buttonProps: { icon: 'add', tooltip: 'Add new project', ...buttonLabels.add },
    },
  }

  const items = menuItems.map(
    (item): TableListHeaderItem =>
      buttons[item.id] ? { ...item, ...buttons[item.id], className: item.id } : item,
  )

  return (
    <TableListHeader
      title={title}
      menuItems={items}
      menuId={MENU_ID}
      onMenuToggle={toggleMenu}
      // its menu holds the projectList.menuItem slot (slot inspector)
      moreButtonProps={{ className: 'list-menu', 'data-ayon-trigger': 'projectList.menuItem' }}
      search={search}
      onSearch={onSearch}
    />
  )
}

export default ProjectsListTableHeader
