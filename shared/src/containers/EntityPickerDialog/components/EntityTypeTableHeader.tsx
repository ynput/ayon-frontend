import { Header, HeaderButton } from '@shared/containers/SimpleTable'
import { theme } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'
import EntityTypeTableSearch from './EntityTypeTableSearch'

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

type ButtonType = 'search' | 'select-all'

interface EntityTypeTableHeaderProps {
  title: string
  search: string | null | undefined
  onSearch: (search: string | undefined) => void
  buttonLabels?: ButtonsCustomization
}

const EntityTypeTableHeader: FC<EntityTypeTableHeaderProps> = ({
  title,
  search,
  onSearch,
  buttonLabels = {},
}) => {
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
          {
            <HeaderButton
              icon={searchButton.icon}
              data-tooltip={searchButton.tooltip}
              data-shortcut={searchButton.shortcut}
              onClick={() => typeof search !== 'string' && onSearch('')}
              className="search-projects"
            />
          }
        </StyledButtons>
      </HeaderTop>
      {typeof search === 'string' && (
        <EntityTypeTableSearch
          value={search}
          onChange={onSearch}
          onClose={() => onSearch(undefined)}
        />
      )}
    </HeaderStyled>
  )
}

export default EntityTypeTableHeader
