import Menu from '@components/Menu/MenuComponents/Menu'
import MenuContainer from '@components/Menu/MenuComponents/MenuContainer'
import ListsSearch from '@pages/ProjectListsPage/components/ListsTable/ListsSearch'
import { Header, HeaderButton } from '@shared/containers/SimpleTable'
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

  container-type: inline-size;

  /* when this container gets smaller than */
  /* 188px remove add-project button  */
  @container (max-width: 188px) {
    .add-project {
      display: none;
    }
  }
  /* 155px remove select all button */
  @container (max-width: 155px) {
    .select-all {
      display: none;
    }
  }

  /* 125px remove search */
  @container (max-width: 125px) {
    .search-projects {
      display: none;
    }
  }
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
  onSelectAll,
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
    <HeaderStyled className="projects-list-header">
      <HeaderTop className="projects-list-header-top">
        <StyledTitle>{title}</StyledTitle>

        <StyledButtons className="projects-list-header-buttons">
          <HeaderButton
            icon="more_horiz"
            onClick={() => toggleMenu?.(true)}
            id={MENU_ID}
            className={clsx('list-menu', { active: isOpen })}
          />
          {/* @ts-expect-error - non TS file */}
          <MenuContainer targetId={MENU_ID} id={MENU_ID} align="left">
            {/* @ts-expect-error - non TS file */}
            <Menu menu={menuItems} onClose={() => toggleMenu?.(false)} />
          </MenuContainer>

          {/* header button */}
          {showAddProject && (
            <HeaderButton
              icon={addButton.icon}
              data-tooltip={addButton.tooltip}
              data-shortcut={addButton.shortcut}
              onClick={onNewProject}
              className="add-project"
            />
          )}

          {/* select all button */}
          {!hiddenButtons.includes('select-all') && onSelectAll && (
            <HeaderButton
              icon="checklist"
              data-tooltip="Select all"
              onClick={onSelectAll}
              className="select-all"
            />
          )}

          {!hiddenButtons.includes('search') && (
            <HeaderButton
              icon={searchButton.icon}
              data-tooltip={searchButton.tooltip}
              data-shortcut={searchButton.shortcut}
              onClick={() => typeof search !== 'string' && onSearch('')}
              className="search-projects"
            />
          )}
        </StyledButtons>
      </HeaderTop>
      {typeof search === 'string' && (
        <ListsSearch value={search} onChange={onSearch} onClose={() => onSearch(undefined)} />
      )}
    </HeaderStyled>
  )
}

export default ProjectsListTableHeader
