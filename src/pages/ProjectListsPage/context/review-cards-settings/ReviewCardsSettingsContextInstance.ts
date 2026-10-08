import { createContext, useContext } from 'react'
import type { ReviewCardsSettingsContextValue } from './ReviewCardsSettingsContext'

export const ReviewCardsContext = createContext<ReviewCardsSettingsContextValue | null>(null)

export const useReviewCardsSettingsContext = () => {
  const context = useContext(ReviewCardsContext)
  if (!context) {
    throw new Error('useReviewCardsSettingsContext must be used within ReviewCardsSettingsProvider')
  }
  return context
}
