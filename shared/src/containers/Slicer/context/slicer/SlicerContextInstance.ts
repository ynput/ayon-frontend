import { createContext, useContext } from 'react'
import type { SlicerConfig, SlicerContextValue } from './SlicerContext'

export const SlicerContext = createContext<SlicerContextValue | undefined>(undefined)

export const SLICER_PAGES_CONFIG: SlicerConfig = {
  progress: {
    fields: [
      { value: 'hierarchy' },
      { value: 'assignees' },
      { value: 'status' },
      { value: 'taskType' },
    ],
  },
  overview: {
    fields: [
      { value: 'hierarchy' },
      { value: 'assignees' },
      { value: 'status' },
      { value: 'type' },
      { value: 'taskType' },
      { value: 'attributes' },
      { value: 'entityList' },
    ],
  },
  versions: {
    fields: [
      { value: 'hierarchy' },
      { value: 'assignees', label: 'Task assignee' },
      { value: 'status', label: 'Version status' },
      { value: 'author', label: 'Version author' },
      { value: 'productType' },
      { value: 'taskType' },
      { value: 'entityList' },
    ],
  },
}

export const useSlicerContext = () => {
  const context = useContext(SlicerContext)
  if (context === undefined) {
    throw new Error('useSlicerContext must be used within a SlicerProvider')
  }
  return context
}

export const useOptionalSlicerContext = () => useContext(SlicerContext)
