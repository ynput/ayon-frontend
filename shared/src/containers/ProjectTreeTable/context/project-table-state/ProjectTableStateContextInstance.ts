import { createContext, useContext } from 'react'
import type { ProjectTableState } from '@ynput/ayon-addon'

// what the page's project table shows, for addon slots; only Overview and Products provide it
export const ProjectTableStateContext = createContext<ProjectTableState | undefined>(undefined)

export const useProjectTableState = () => useContext(ProjectTableStateContext)
