import { createContext } from 'react'
import { ViewsContextValue } from './ViewsContext'

export const ViewsContext = createContext<ViewsContextValue | null>(null)
