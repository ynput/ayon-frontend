import { createContext, useContext } from 'react'

export interface DetailsPanelTabHeaderSlots {
  menu: HTMLElement | null
  search: HTMLElement | null
  extra: HTMLElement | null
}

// set around an addon tab: the elements its header items render into
export const DetailsPanelTabHeaderSlotsContext = createContext<DetailsPanelTabHeaderSlots | null>(
  null,
)
export const useDetailsPanelTabHeaderSlots = () => useContext(DetailsPanelTabHeaderSlotsContext)
