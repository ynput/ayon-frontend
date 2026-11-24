import { createContext, useContext } from 'react'

export interface PanelTabHeaderSlots {
  menu: HTMLElement | null
  search: HTMLElement | null
  extra: HTMLElement | null
  /** the addon has a search bar (`has`) and filters set in it (`active`) */
  setSearchState: (state: TabSearchState) => void
}

export interface TabSearchState {
  has: boolean
  active: boolean
}

// whether the tab headers show their search bar: one choice for every tab of every panel, kept
// per browser (the key is from when only the details panel had tab headers)
export const TAB_SEARCH_OPEN_KEY = 'details-panel-tab-search-open'

// set around an addon tab: the elements its header items render into
export const PanelTabHeaderSlotsContext = createContext<PanelTabHeaderSlots | null>(null)
export const usePanelTabHeaderSlots = () => useContext(PanelTabHeaderSlotsContext)
