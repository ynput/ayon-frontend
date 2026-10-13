import { createContext, useContext } from 'react'
import type { FeedContextType } from './FeedContext'

export const FeedContext = createContext<FeedContextType | undefined>(undefined)

export const useFeedContext = () => {
  const context = useContext(FeedContext)
  if (!context) {
    throw new Error('useFeedContext must be used within a FeedProvider')
  }
  return context
}
