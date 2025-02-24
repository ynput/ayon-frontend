import useLoadModule from '@/remote/useLoadModule'
import AnnotationToolsFallback from '@components/AnnotationsTools/AnnotationTools'
import {
  AnnotationsProviderProps,
  AnnotationsEditorProviderProps,
  AnnotationsContextType,
} from '@containers/Viewer'
import { createContext, useContext, ReactNode, ElementType, useCallback, ReactPortal, useMemo } from 'react'
import { createPortal } from 'react-dom'

type DrawHistory = {
  clear: (page?: number) => void
}

export type UseDrawHistory = () => DrawHistory
export type UseAnnotations = () => AnnotationsContextType

const FallbackAnnotationsProvider = ({ children }: AnnotationsProviderProps) => {
  return <>{children}</>
}

const FallbackAnnotationsEditorProvider = ({ children }: AnnotationsEditorProviderProps) => {
  return <>{children}</>
}

const useAnnotationsFallback = (): AnnotationsContextType => ({
  annotations: {},
  removeAnnotation: () => {},
  exportAnnotationComposite: async () => null,
});

const useDrawHistoryFallback = (): DrawHistory => ({ clear: () => {} });

interface ViewerContextType {
  isLoaded: boolean
  createToolbar: () => ReactPortal | null
  AnnotationsEditorProvider: ({ children }: AnnotationsEditorProviderProps) => JSX.Element
  AnnotationsCanvas: ElementType,
  selectedVersionId?: string,
  useAnnotations: UseAnnotations,
  useDrawHistory: UseDrawHistory,
}

const defaultViewerContext = {
  isLoaded: false,
  createToolbar: () => null,
  AnnotationsEditorProvider: FallbackAnnotationsEditorProvider,
  AnnotationsCanvas: () => null,
  useAnnotations: useAnnotationsFallback,
  useDrawHistory: useDrawHistoryFallback,
};

const ViewerContext = createContext<ViewerContextType>(defaultViewerContext)

type ViewerProviderProps = {
  children: ReactNode
  selectedVersionId?: string,
}

export const ViewerProvider = ({
  children,
  selectedVersionId,
}: ViewerProviderProps) => {
  // get annotation remotes
  const [AnnotationsProvider, { isLoaded: isLoadedProvider }] = useLoadModule({
    addon: 'powerpack',
    remote: 'annotations',
    module: 'AnnotationsProvider',
    fallback: FallbackAnnotationsProvider,
  })
  const [AnnotationsEditorProvider, { isLoaded: isLoadedEditorProvider }] = useLoadModule({
    addon: 'powerpack',
    remote: 'annotations',
    module: 'AnnotationsEditorProvider',
    fallback: FallbackAnnotationsEditorProvider,
  })
  const [AnnotationsCanvas, { isLoaded: isLoadedCanvas }] = useLoadModule({
    addon: 'powerpack',
    remote: 'annotations',
    module: 'AnnotationsCanvas',
    fallback: () => null,
  })
  const [useAnnotations, { isLoaded: isLoadedHook }] = useLoadModule({
    addon: 'powerpack',
    remote: 'annotations',
    module: 'useAnnotations',
    fallback: useAnnotationsFallback,
  })
  const [AnnotationTools, { isLoaded: isLoadedTools }] = useLoadModule({
    addon: 'powerpack',
    remote: 'annotations',
    module: 'AnnotationTools',
    fallback: AnnotationToolsFallback,
  })
  const [useDrawHistory] = useLoadModule({
    addon: 'powerpack',
    remote: 'annotations',
    module: 'useDrawHistory',
    fallback: useDrawHistoryFallback,
  })

  const isLoaded = isLoadedProvider && isLoadedEditorProvider && isLoadedCanvas && isLoadedHook && isLoadedTools

  // get annotations-tools dom element for portal
  const createToolbar = useCallback(() => {
    const container = document.getElementById('annotation-tools')
    return container ? createPortal(<AnnotationTools />, container) : null
  }, [isLoaded])

  return (
    <ViewerContext.Provider
      value={{
        isLoaded,
        createToolbar,
        AnnotationsEditorProvider,
        AnnotationsCanvas,
        useAnnotations,
        useDrawHistory,
      }}
    >
      <AnnotationsProvider versionId={selectedVersionId || ''}>
        {children}
      </AnnotationsProvider>
    </ViewerContext.Provider>
  )
}

// This hook may be called outside of a ViewerContext.Provider
export const useViewer = () => useContext(ViewerContext);
