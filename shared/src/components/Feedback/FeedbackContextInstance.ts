import { createContext } from 'react'
import { FeedbackContextType } from './FeedbackContext'

export const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)
