import useLoadRemote from '@/remote/useLoadRemote'
import {
  AnnotationsProviderProps,
  useViewerAnnotations,
  ViewAnnotationsProps,
  ViewerAnnotations,
} from '@containers/Viewer'
import { createContext, useContext, ReactNode, ElementType, useCallback, ReactPortal } from 'react'
import { createPortal } from 'react-dom'

const FallbackAnnotationsProvider = ({ children }: AnnotationsProviderProps) => {
  return <>{children}</>
}

interface ViewerContextType {
  isLoaded: boolean
  createToolbar: () => ReactPortal | null
  AnnotationsProvider: ({ children }: AnnotationsProviderProps) => JSX.Element
  AnnotationsCanvas: ElementType
  state: ViewerAnnotations
}

const ViewerContext = createContext<ViewerContextType | undefined>(undefined)

type ViewerProviderProps = {
  children: ReactNode
  reviewable?: ViewAnnotationsProps['reviewable']
  selectedVersionId?: ViewAnnotationsProps['selectedVersionId']
}

export const ViewerProvider = ({
  children,
  reviewable,
  selectedVersionId,
}: ViewerProviderProps) => {
  // get annotation remotes
  const [AnnotationsProvider, { isLoaded: isLoadedProvider }] = useLoadRemote({
    remote: 'annotations',
    module: 'AnnotationsProvider',
    fallback: FallbackAnnotationsProvider,
  })
  const [AnnotationsCanvas, { isLoaded: isLoadedCanvas }] = useLoadRemote({
    remote: 'annotations',
    module: 'AnnotationsCanvas',
    fallback: () => null,
  })
  // get annotation remotes
  const [AnnotationTools, { isLoaded: isLoadedTools }] = useLoadRemote({
    remote: 'annotations',
    module: 'AnnotationTools',
    fallback: () => null,
  })

  const isLoaded = isLoadedProvider && isLoadedCanvas && isLoadedTools

  // get annotations-tools dom element for portal
  const createToolbar = useCallback(() => {
    const container = document.getElementById('annotation-tools')
    return container ? createPortal(<AnnotationTools />, container) : null
  }, [isLoaded])

  const state = useViewerAnnotations({
    reviewable,
    selectedVersionId,
  })

  return (
    <ViewerContext.Provider
      value={{
        isLoaded,
        createToolbar,
        AnnotationsProvider,
        AnnotationsCanvas,
        state,
      }}
    >
      {children}
    </ViewerContext.Provider>
  )
}

export const useViewer = () => {
  const context = useContext(ViewerContext)
  if (!context) {
    throw new Error('useViewer must be used within a ViewerProvider')
  }
  return context
}
