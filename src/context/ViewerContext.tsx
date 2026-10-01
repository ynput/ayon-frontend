import { useLoadModule } from '@shared/hooks/useLoadModule'
import AnnotationToolsFallback from '@components/AnnotationsTools/AnnotationTools'
import {
  AnnotationsProviderProps,
  AnnotationsEditorProviderProps,
  AnnotationsContextType,
} from '@containers/Viewer'
import {
  createContext,
  useContext,
  ReactNode,
  ElementType,
  useCallback,
  ReactPortal,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-toastify'
import { usePowerpack } from '@shared/context'
import type { CommentFrameLink, CommentFrameLinkApi, FeedFrameLink } from '@shared/context'

type DrawHistory = {
  clear: (page?: number) => void
}

export type UseDrawHistory = () => DrawHistory
export type UseAnnotations = () => AnnotationsContextType

// the video player of the viewer, registered so comments can link to its frames
// (frames are 0-based here, like the player's frame counter internally)
export type FrameLinkPlayer = {
  getFrame: () => number
  seekToFrame: (frame: number) => void
}

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
})

const useDrawHistoryFallback = (): DrawHistory => ({ clear: () => {} })

interface ViewerContextType {
  isLoaded: boolean
  createToolbar: () => ReactPortal | null
  AnnotationsEditorProvider: ({ children }: AnnotationsEditorProviderProps) => JSX.Element
  AnnotationsCanvas: ElementType
  selectedVersionId?: string
  useAnnotations: UseAnnotations
  useDrawHistory: UseDrawHistory
  // links comments to a single frame of the selected version, while a video plays
  commentFrameLink?: CommentFrameLinkApi
  registerFrameLinkPlayer: (player: FrameLinkPlayer | null) => void
  // frame links of the viewer's feed, kept apart from feeds outside the viewer
  feedFrameLinks: FeedFrameLink[]
  setFeedFrameLinks: (links: FeedFrameLink[]) => void
}

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

// Frame links of the viewer: always a single frame (no in/out range, unlike the
// review player). Frames of the links are 1-based, as the frame counter shows them.
const useViewerFrameLink = (selectedVersionId?: string) => {
  const playerRef = useRef<FrameLinkPlayer | null>(null)
  const [hasPlayer, setHasPlayer] = useState(false)
  const [draft, setDraft] = useState<CommentFrameLink | null>(null)
  const [feedFrameLinks, setFeedFrameLinks] = useState<FeedFrameLink[]>([])

  const registerFrameLinkPlayer = useCallback((player: FrameLinkPlayer | null) => {
    playerRef.current = player
    setHasPlayer(!!player)
    // a draft can't be shown or moved without the player
    if (!player) setDraft(null)
  }, [])

  const commentFrameLink = useMemo<CommentFrameLinkApi | undefined>(() => {
    if (!hasPlayer || !selectedVersionId) return undefined
    return {
      draft,
      link: (entityId) => {
        const player = playerRef.current
        if (!player || entityId !== selectedVersionId) return
        const frame = player.getFrame() + 1
        setDraft({ entityId, startFrame: frame, endFrame: frame })
      },
      unlink: () => setDraft(null),
      // a frame range (e.g. from the review player) jumps to its first frame
      goTo: (link) => {
        if (link.entityId !== selectedVersionId) return
        playerRef.current?.seekToFrame(Math.max(0, link.startFrame - 1))
      },
      formatFrame: String,
    }
  }, [hasPlayer, selectedVersionId, draft])

  return { commentFrameLink, registerFrameLinkPlayer, feedFrameLinks, setFeedFrameLinks }
}

const ViewerContext = createContext<ViewerContextType>(defaultViewerContext)

type ViewerProviderProps = {
  children: ReactNode
  selectedVersionId?: string
}

export const ViewerProvider = ({ children, selectedVersionId }: ViewerProviderProps) => {
  const { powerLicense } = usePowerpack()
  const minVersion = '1.0.0'
  // get annotation remotes
  const [AnnotationsProvider, { isLoaded: isLoadedProvider, outdated }] = useLoadModule({
    addon: 'powerpack',
    remote: 'annotations',
    module: 'AnnotationsProvider',
    fallback: FallbackAnnotationsProvider,
    minVersion,
    skip: !powerLicense, // skip loading if powerpack license is not available
  })
  const [AnnotationsEditorProvider, { isLoaded: isLoadedEditorProvider }] = useLoadModule({
    addon: 'powerpack',
    remote: 'annotations',
    module: 'AnnotationsEditorProvider',
    fallback: FallbackAnnotationsEditorProvider,
    minVersion,
    skip: !powerLicense, // skip loading if powerpack license is not available
  })
  const [AnnotationsCanvas, { isLoaded: isLoadedCanvas }] = useLoadModule({
    addon: 'powerpack',
    remote: 'annotations',
    module: 'AnnotationsCanvas',
    fallback: () => null,
    minVersion,
    skip: !powerLicense, // skip loading if powerpack license is not available
  })
  const [useAnnotations, { isLoaded: isLoadedHook }] = useLoadModule({
    addon: 'powerpack',
    remote: 'annotations',
    module: 'useAnnotations',
    fallback: useAnnotationsFallback,
    minVersion,
    skip: !powerLicense, // skip loading if powerpack license is not available
  })
  const [AnnotationTools, { isLoaded: isLoadedTools }] = useLoadModule({
    addon: 'powerpack',
    remote: 'annotations',
    module: 'AnnotationTools',
    fallback: AnnotationToolsFallback,
    minVersion,
    skip: !powerLicense, // skip loading if powerpack license is not available
  })
  const [useDrawHistory] = useLoadModule({
    addon: 'powerpack',
    remote: 'annotations',
    module: 'useDrawHistory',
    fallback: useDrawHistoryFallback,
    minVersion,
    skip: !powerLicense, // skip loading if powerpack license is not available
  })

  // show error message if annotations version is outdated
  useEffect(() => {
    if (outdated) {
      toast.warning(
        `Powerpack addon version incompatible. Required: ${outdated.required}, Current: ${outdated.current}`,
      )
    }
  }, [!!outdated])

  const frameLink = useViewerFrameLink(selectedVersionId)

  const isLoaded =
    isLoadedProvider && isLoadedEditorProvider && isLoadedCanvas && isLoadedHook && isLoadedTools

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
        selectedVersionId,
        ...frameLink,
      }}
    >
      <AnnotationsProvider versionId={selectedVersionId || ''}>{children}</AnnotationsProvider>
    </ViewerContext.Provider>
  )
}

// This hook may be called outside of a ViewerContext.Provider
export const useViewer = () => useContext(ViewerContext)
