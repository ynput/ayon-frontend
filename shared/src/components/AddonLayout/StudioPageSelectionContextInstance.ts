import { createContext, useContext } from 'react'

// The project selection of the studio page being shown, for the host's ProjectList
// (@ynput/ayon-addon). Addon studio pages keep one per page; legacy pages with the `projects` key
// use the dashboard's.
export interface StudioPageSelection {
  selection: string[]
  onSelect: (projectNames: string[]) => void
  onNewProject?: () => void
}

export const StudioPageSelectionContext = createContext<StudioPageSelection | null>(null)

export const useStudioPageSelection = () => useContext(StudioPageSelectionContext)
