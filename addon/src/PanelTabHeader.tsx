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

/** AYON's search bar under the tab's title. */
export interface TabHeaderSearch {
  /**
   * `filter` (default): AYON's search and filter bar. `text`: a plain text input, like the search of
   * AYON's own Details tabs, without `options` and `filters`. An AYON older than `text` shows the
   * search and filter bar.
   */
  variant?: 'filter' | 'text'
  /**
   * the search text when the user confirms it (Enter) or removes it, as it is typed for `text`; `''`
   * when cleared
   */
  onSearch: (text: string) => void
  /** the text input's placeholder (`text`) */
  placeholder?: string
  /** filters the user can add; search only when not set */
  options?: TabHeaderFilterOption[]
  /** the filters set now (controlled) */
  filters?: TabHeaderFilter[]
  onFiltersChange?: (filters: TabHeaderFilter[]) => void
}

export interface PanelTabHeaderProps {
  /** the "more" (…) menu right of the title: the items a `menu` piece returns */
  menu?: AddonMenuItem[]
  /**
   * AYON's search and filter bar, or a plain text search (`variant: 'text'`), under the title, shown
   * and hidden with the header's search button
   */
  search?: TabHeaderSearch
  /** anything else for the header, under the search bar (counts, a toggle, a summary) */
  children?: ReactNode
}

/** What the host's `PanelTabHeader` gets: the addon's props and where to report a failing menu item. */
export interface HostPanelTabHeaderProps extends PanelTabHeaderProps {
  onError: (error: unknown) => void
}

/**
 * Fills the header of a panel tab (`detailsPanel.tab`, `listDetails.tab`): AYON shows the tab's
 * `label` as its title and puts these in the header, so every tab looks alike. Render it once, anywhere in the tab's component;
 * it takes no room where it is rendered. Without it, the header has the title only. An AYON older
 * than this component has no such export (`undefined`): an addon that supports one checks
 * `PanelTabHeader &&` before rendering it.
 *
 * ```tsx
 * const [search, setSearch] = useState('')
 * <PanelTabHeader
 *   menu={[{ id: 'add', label: 'Add time', icon: 'more_time', onClick: add }]}
 *   search={{ onSearch: setSearch }}
 * >
 *   <Total logs={logs} />
 * </PanelTabHeader>
 * ```
 */
export const PanelTabHeader = (props: PanelTabHeaderProps) => {
  const onError = useMenuErrorHandler()
  const Host = getHost().components?.PanelTabHeader
  return Host ? <Host {...props} onError={onError} /> : <>{props.children}</>
}

/** @deprecated renamed `PanelTabHeader`: it fills the header of any panel tab */
export const DetailsPanelTabHeader = PanelTabHeader
/** @deprecated renamed `PanelTabHeaderProps` */
export type DetailsPanelTabHeaderProps = PanelTabHeaderProps
