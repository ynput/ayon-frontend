import type { ReactNode } from 'react'
import { getHost } from './hostBridge'
import type { AddonMenuItem } from './slots'
import { useMenuErrorHandler } from './useContextMenu'

/** A filter the user can add in a tab header's search bar, with the values to pick from. */
export interface TabHeaderFilterOption {
  id: string
  label: string
  /** a Material Symbols icon name */
  icon?: string
  values: { id: string; label: string; icon?: string; color?: string }[]
  /** one value at a time */
  singleSelect?: boolean
}

/** A filter the user set: the option's `id` and the ids of the values picked. */
export interface TabHeaderFilter {
  id: string
  values: string[]
  /** "is not" */
  inverted?: boolean
}

/** AYON's search and filter bar under the tab's title. */
export interface TabHeaderSearch {
  /** the search text when the user confirms it (Enter) or removes it; `''` when cleared */
  onSearch: (text: string) => void
  /** filters the user can add; search only when not set */
  options?: TabHeaderFilterOption[]
  /** the filters set now (controlled) */
  filters?: TabHeaderFilter[]
  onFiltersChange?: (filters: TabHeaderFilter[]) => void
}

export interface DetailsPanelTabHeaderProps {
  /** the "more" (…) menu right of the title: the items a `menu` piece returns */
  menu?: AddonMenuItem[]
  /** AYON's search and filter bar under the title, shown and hidden with the header's search button */
  search?: TabHeaderSearch
  /** anything else for the header, under the search bar (counts, a toggle, a summary) */
  children?: ReactNode
}

/** What the host's `DetailsPanelTabHeader` gets: the addon's props and where to report a failing menu item. */
export interface HostDetailsPanelTabHeaderProps extends DetailsPanelTabHeaderProps {
  onError: (error: unknown) => void
}

/**
 * Fills the header of a `detailsPanel.tab`: AYON shows the tab's `label` as its title and puts
 * these in the header, so every tab looks alike. Render it once, anywhere in the tab's component;
 * it takes no room where it is rendered. Without it, the header has the title only. An AYON older
 * than this component has no such export (`undefined`): an addon that supports one checks
 * `DetailsPanelTabHeader &&` before rendering it.
 *
 * ```tsx
 * const [search, setSearch] = useState('')
 * <DetailsPanelTabHeader
 *   menu={[{ id: 'add', label: 'Add time', icon: 'more_time', onClick: add }]}
 *   search={{ onSearch: setSearch }}
 * >
 *   <Total logs={logs} />
 * </DetailsPanelTabHeader>
 * ```
 */
export const DetailsPanelTabHeader = (props: DetailsPanelTabHeaderProps) => {
  const onError = useMenuErrorHandler()
  const Host = getHost().components?.DetailsPanelTabHeader
  return Host ? <Host {...props} onError={onError} /> : <>{props.children}</>
}
