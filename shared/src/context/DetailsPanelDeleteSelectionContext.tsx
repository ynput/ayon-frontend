import { createContext, useContext } from 'react'
import type { DeletableEntity } from './DeleteEntitiesContext'


const DetailsPanelDeleteSelectionContext = createContext<DeletableEntity[] | undefined>(undefined)

export { DetailsPanelDeleteSelectionContext }

export const useDetailsPanelDeleteSelection = (): DeletableEntity[] | undefined =>
  useContext(DetailsPanelDeleteSelectionContext)
