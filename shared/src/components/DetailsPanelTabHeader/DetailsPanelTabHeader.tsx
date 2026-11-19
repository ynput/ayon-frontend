// The header of a details panel tab: its title on the left, an optional "more" menu on the right,
// then a search button at the far right that shows or hides the search and filter bar below it
// (hidden by default, it takes room on small screens), then any other content of the header.
// Every tab with icon-only buttons (Activity, Subtasks, Files, addon tabs) has one, so the open tab is named
// here and not in its button. Addon tabs fill theirs through the SDK's `DetailsPanelTabHeader`
// (AddonDetailsPanelTabHeader), which renders into the slots this exposes.
import type { ReactNode } from 'react'
import clsx from 'clsx'
import { useLocalStorage } from '@shared/hooks'
import { TAB_SEARCH_OPEN_KEY } from './DetailsPanelTabHeaderContextInstance'
import * as Styled from './DetailsPanelTabHeader.styled'

export interface DetailsPanelTabHeaderProps {
  title?: ReactNode
  /** right of the title, usually a "more" menu button */
  menu?: ReactNode
  /** below the title, a search and filter bar, shown with the search button */
  search?: ReactNode
  /** show the search button without `search`: an addon renders its bar into the slot */
  hasSearch?: boolean
  /** filters or search text are set: the search button shows it while the bar is hidden */
  searchActive?: boolean
  /** below the search bar: anything else the tab puts in its header */
  children?: ReactNode
  /** on the menu slot: the subtasks manager renders its actions into `panel-header-filters` */
  menuClassName?: string
  /** the slot elements, for addons rendering into them */
  slotRefs?: {
    menu?: (el: HTMLDivElement | null) => void
    search?: (el: HTMLDivElement | null) => void
    extra?: (el: HTMLDivElement | null) => void
  }
}

export const DetailsPanelTabHeader = ({
  title,
  menu,
  search,
  hasSearch = !!search,
  searchActive,
  children,
  menuClassName,
  slotRefs,
}: DetailsPanelTabHeaderProps) => {
  const [searchOpen, setSearchOpen] = useLocalStorage(TAB_SEARCH_OPEN_KEY, false)

  return (
    <Styled.Header className="panel-tab-header">
      <Styled.TitleRow>
        <Styled.Title className="panel-header-label">{title}</Styled.Title>
        <Styled.Menu className={menuClassName} ref={slotRefs?.menu}>
          {menu}
        </Styled.Menu>
        {hasSearch && (
          <Styled.SearchButton
            icon="search"
            variant="text"
            selected={searchOpen}
            className={clsx({ active: searchActive && !searchOpen })}
            onClick={() => setSearchOpen(!searchOpen)}
            data-tooltip={searchOpen ? 'Hide search and filter' : 'Search and filter'}
            data-tooltip-delay={0}
            aria-label={searchOpen ? 'Hide search and filter' : 'Search and filter'}
            aria-expanded={searchOpen}
          />
        )}
      </Styled.TitleRow>
      {/* hidden, not unmounted: the bar keeps its chips and filters while closed */}
      <Styled.Search ref={slotRefs?.search} className={clsx({ hidden: !searchOpen })}>
        {search}
      </Styled.Search>
      <Styled.Extra ref={slotRefs?.extra}>{children}</Styled.Extra>
    </Styled.Header>
  )
}
