import { createContext, useContext } from 'react'
import type { ViewsContextValue } from './ViewsContext'
import { isViewStudioScope } from '../utils/isViewStudioScope'

export const ViewsContext = createContext<ViewsContextValue | null>(null)

export const useViewsContext = (): ViewsContextValue => {
  const context = useContext(ViewsContext)
  if (!context) {
    throw new Error('useViewsContext must be used within a ViewsProvider')
  }
  return context
}

export { isViewStudioScope }
