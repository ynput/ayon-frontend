import { createContext } from 'react'
import { DetailsPanelContextType } from './DetailsPanelContext'

// Create the context
export const DetailsPanelContext = createContext<DetailsPanelContextType | undefined>(undefined)
