import { createContext, useContext } from 'react'
import type { FeedbackContextType } from './FeedbackContext'

export const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider')
  }
  return context
}

// Non-throwing variant for shared components that may render outside a FeedbackProvider.
export const useFeedbackSafe = (): FeedbackContextType | undefined => useContext(FeedbackContext)
