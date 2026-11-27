import { createContext, useContext } from 'react'

/** A saved view, as much as a pin needs of it. */
export interface PinnableView {
  id: string
  label: string
  viewType: string
  scope?: 'project' | 'studio'
}

/**
 * Pinning saved views as tabs, provided by the app around the pages whose views can be pinned.
 * Without a provider the views menu shows no pin buttons.
 */
export interface ViewPins {
  /** the view types whose saved views can be pinned */
  viewTypes: string[]
  isPinned: (viewId: string) => boolean
  togglePin: (view: PinnableView) => void
}

const ViewPinsContext = createContext<ViewPins | null>(null)

export const ViewPinsProvider = ViewPinsContext.Provider

export const useViewPins = () => useContext(ViewPinsContext)
