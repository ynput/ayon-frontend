import Menu from '@components/Menu/MenuComponents/Menu'
import MenuContainer from '@components/Menu/MenuComponents/MenuContainer'
import ListsSearch from '@pages/ProjectListsPage/components/ListsTable/ListsSearch'
import { Header, HeaderButton } from '@shared/SimpleTable'
import { theme } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { FC } from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'

export const MENU_ID = 'projects-list-menu'

const HeaderStyled = styled(Header)`
  flex-direction: column;
`

const HeaderTop = styled(Header)`
  padding: 0;
  border: none;
`

const StyledTitle = styled.span`
  display: flex;
  align-items: center;
  ${theme.labelLarge}
  height: 32px;
  padding-left: 4px;
  white-space: nowrap;
  overflow: hidden;
  width: 100%;
`

const StyledButtons = styled.div`
  display: flex;
  gap: var(--base-gap-small);
`

interface ButtonCustomization {
  icon?: string
  tooltip?: string
  shortcut?: string
}

interface ButtonsCustomization {
  delete?: ButtonCustomization
  add?: ButtonCustomization
  search?: ButtonCustomization
  filter?: {
    icon?: string
    tooltip?: string
    activeTooltip?: string
    tooltipDelay?: number
  }
}

type ButtonType = 'delete' | 'add' | 'filter' | 'search'

interface ProjectsListTableHeaderProps {
  title: string
  search: string | null
  onSearch: (search: string | null) => void
  selection: string[]
  buttonLabels?: ButtonsCustomization
  hiddenButtons?: ButtonType[]
  onNewProject?: () => void
  showAddProject?: boolean
  toggleMenu?: (open: boolean) => void
  menuItems?: Array<{
    id: string
    label?: string
    icon?: string
    onClick?: () => void
  }>
}

const ProjectsListTableHeader: FC<ProjectsListTableHeaderProps> = ({
  title,
  search,
  onSearch,
  selection,
  buttonLabels = {},
  hiddenButtons = [],
  onNewProject,
  showAddProject = false,
  menuItems = [],
  toggleMenu,
}) => {
  const isOpen = useSelector((state: any) => state.context.menuOpen) === MENU_ID

  const addButton = {
    icon: 'add',
    tooltip: 'Add new project',
    ...buttonLabels.add,
  }

  const searchButton = {
    icon: 'search',
    tooltip: 'Search projects',
    ...buttonLabels.search,
  }

  return (
    <HeaderStyled>
      <HeaderTop>
        <StyledTitle>{title}</StyledTitle>

        <StyledButtons>
          <HeaderButton
            icon="more_horiz"
            onClick={() => toggleMenu?.(true)}
            id={MENU_ID}
            className={clsx({ active: isOpen })}
          />
          {/* @ts-expect-error - non TS file */}
          <MenuContainer targetId={MENU_ID} id={MENU_ID} align="left">
            {/* @ts-expect-error - non TS file */}
            <Menu menu={menuItems} onClose={() => toggleMenu?.(true)} />
          </MenuContainer>
          {/* header button */}
          {showAddProject && (
            <HeaderButton
              icon={addButton.icon}
              data-tooltip={addButton.tooltip}
              data-shortcut={addButton.shortcut}
              onClick={onNewProject}
            />
          )}
          {!hiddenButtons.includes('search') && (
            <HeaderButton
              icon={searchButton.icon}
              data-tooltip={searchButton.tooltip}
              data-shortcut={searchButton.shortcut}
              onClick={() => typeof search !== 'string' && onSearch('')}
            />
          )}
        </StyledButtons>
      </HeaderTop>
      {typeof search === 'string' && (
        <ListsSearch value={search} onChange={onSearch} onClose={() => onSearch(null)} />
      )}
    </HeaderStyled>
  )
}

export default ProjectsListTableHeader
