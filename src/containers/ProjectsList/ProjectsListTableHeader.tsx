import ListsSearch from '@pages/ProjectListsPage/components/ListsTable/ListsSearch'
import { Header, HeaderButton } from '@shared/SimpleTable'
import { theme } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'

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
}) => {
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
