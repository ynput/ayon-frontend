// The header of a details panel tab: its title on the left, an optional "more" menu on the right,
// an optional search and filter bar below, then any other content of the tab's header. Every tab
// with icon-only buttons (Activity, Subtasks, Files, addon tabs) has one, so the open tab is named
// here and not in its button. Addon tabs fill theirs through the SDK's `DetailsPanelTabHeader`
// (AddonDetailsPanelTabHeader), which renders into the slots this exposes.
import type { ReactNode } from 'react'
import * as Styled from './DetailsPanelTabHeader.styled'

export interface DetailsPanelTabHeaderProps {
  title?: ReactNode
  /** right of the title, usually a "more" menu button */
  menu?: ReactNode
  /** below the title, a search and filter bar */
  search?: ReactNode
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
  children,
  menuClassName,
  slotRefs,
}: DetailsPanelTabHeaderProps) => (
  <Styled.Header className="panel-tab-header">
    <Styled.TitleRow>
      <Styled.Title className="panel-header-label">{title}</Styled.Title>
      <Styled.Menu className={menuClassName} ref={slotRefs?.menu}>
        {menu}
      </Styled.Menu>
    </Styled.TitleRow>
    <Styled.Search ref={slotRefs?.search}>{search}</Styled.Search>
    <Styled.Extra ref={slotRefs?.extra}>{children}</Styled.Extra>
  </Styled.Header>
)
