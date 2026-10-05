import { createContext, createElement, Fragment, useContext } from 'react'
import type { AnnotationsContextType, AnnotationsEditorProviderProps } from '@containers/Viewer'
import type { DrawHistory, ViewerContextType } from './ViewerContext'

export const FallbackAnnotationsEditorProvider = ({ children }: AnnotationsEditorProviderProps) =>
  createElement(Fragment, null, children)

export const useAnnotationsFallback = (): AnnotationsContextType => ({
  annotations: {},
  removeAnnotation: () => {},
  exportAnnotationComposite: async () => null,
})

export const useDrawHistoryFallback = (): DrawHistory => ({ clear: () => {} })

const defaultViewerContext = {
  isLoaded: false,
  createToolbar: () => null,
  AnnotationsEditorProvider: FallbackAnnotationsEditorProvider,
  AnnotationsCanvas: () => null,
  useAnnotations: useAnnotationsFallback,
  useDrawHistory: useDrawHistoryFallback,
  registerFrameLinkPlayer: () => {},
  feedFrameLinks: [],
  setFeedFrameLinks: () => {},
}

export const ViewerContext = createContext<ViewerContextType>(defaultViewerContext)

// This hook may be called outside of a ViewerContext.Provider
export const useViewer = () => useContext(ViewerContext)
