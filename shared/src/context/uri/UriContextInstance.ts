import { createContext, useContext } from 'react'
import type { URIContextValue } from './UriContext'

export const URIContext = createContext<URIContextValue | undefined>(undefined)

export const useURIContext = (): URIContextValue => {
  const context = useContext(URIContext)
  if (context === undefined) {
    throw new Error('useURIContext must be used within a URIProvider')
  }
  return context
}
