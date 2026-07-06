import { createContext } from 'react'
import { SlicerContextValue } from './SlicerContext'

export const SlicerContext = createContext<SlicerContextValue | undefined>(undefined)
