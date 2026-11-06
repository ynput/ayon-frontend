import { useLoadModule } from '@shared/hooks/useLoadModule'
import AnnotationToolsFallback from '@components/AnnotationsTools/AnnotationTools'
import {
  AnnotationsProviderProps,
  AnnotationsEditorProviderProps,
  AnnotationsContextType,
} from '@containers/Viewer'
import {
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
import type {
  CommentFrameLink,
  CommentFrameLinkApi,
  FeedFrameLink,
  FeedFrameLinkPreview,
} from '@shared/context'
import {
  FallbackAnnotationsEditorProvider,
  useAnnotationsFallback,
  useDrawHistoryFallback,
  ViewerContext,
} from './ViewerContextInstance'

export type DrawHistory = {
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

export interface ViewerContextType {
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

// Frame links of the viewer: always a single frame (no in/out range, unlike the
// review player). Frames of the links are 1-based, as the frame counter shows them.
const useViewerFrameLink = (selectedVersionId?: string) => {
  const playerRef = useRef<FrameLinkPlayer | null>(null)
  const [hasPlayer, setHasPlayer] = useState(false)
  const [draft, setDraft] = useState<CommentFrameLink | null>(null)
  const [editPreview, setEditPreview] = useState<FeedFrameLinkPreview | null>(null)
  const [feedFrameLinks, setFeedFrameLinks] = useState<FeedFrameLink[]>([])

  const registerFrameLinkPlayer = useCallback((player: FrameLinkPlayer | null) => {
    playerRef.current = player
    setHasPlayer(!!player)
    // a draft can't be shown or moved without the player
    if (!player) {
      setDraft(null)
      setEditPreview(null)
    }
  }, [])

  const commentFrameLink = useMemo<CommentFrameLinkApi | undefined>(() => {
    if (!hasPlayer || !selectedVersionId) return undefined
    return {
      draft,
      setDraft,
      editPreview,
      setEditPreview,
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
  }, [hasPlayer, selectedVersionId, draft, editPreview])

  return { commentFrameLink, registerFrameLinkPlayer, feedFrameLinks, setFeedFrameLinks }
}

// The powerpack annotation modules. They wrap the whole viewer and their hooks are called by it, so
// the viewer waits for them (`isLoading`): swapping the fallbacks for the loaded modules once it is
// open would remount it, which reloads the video and autoplays it again (undoing a pause).
export const useAnnotationModules = () => {
  const { powerLicense, isLoading: isLoadingLicense } = usePowerpack()
  const minVersion = '1.0.0'
  // get annotation remotes
  const [
    AnnotationsProvider,
    { isLoaded: isLoadedProvider, isLoading: isLoadingProvider, outdated },
  ] = useLoadModule({
    addon: 'powerpack',
    remote: 'annotations',
    module: 'AnnotationsProvider',
    fallback: FallbackAnnotationsProvider,
    minVersion,
    defer: isLoadingLicense, // wait for the license check (reported as loading)
    skip: !isLoadingLicense && !powerLicense, // skip loading if powerpack license is not available
  })
  const [
    AnnotationsEditorProvider,
    { isLoaded: isLoadedEditorProvider, isLoading: isLoadingEditorProvider },
  ] = useLoadModule({
    addon: 'powerpack',
    remote: 'annotations',
    module: 'AnnotationsEditorProvider',
    fallback: FallbackAnnotationsEditorProvider,
    minVersion,
    defer: isLoadingLicense, // wait for the license check (reported as loading)
    skip: !isLoadingLicense && !powerLicense, // skip loading if powerpack license is not available
  })
  const [AnnotationsCanvas, { isLoaded: isLoadedCanvas, isLoading: isLoadingCanvas }] =
    useLoadModule({
      addon: 'powerpack',
      remote: 'annotations',
      module: 'AnnotationsCanvas',
      fallback: () => null,
      minVersion,
      defer: isLoadingLicense, // wait for the license check (reported as loading)
      skip: !isLoadingLicense && !powerLicense, // skip loading if powerpack license is not available
    })
  const [useAnnotations, { isLoaded: isLoadedHook, isLoading: isLoadingHook }] = useLoadModule({
    addon: 'powerpack',
    remote: 'annotations',
    module: 'useAnnotations',
    fallback: useAnnotationsFallback,
    minVersion,
    defer: isLoadingLicense, // wait for the license check (reported as loading)
    skip: !isLoadingLicense && !powerLicense, // skip loading if powerpack license is not available
  })
  const [AnnotationTools, { isLoaded: isLoadedTools, isLoading: isLoadingTools }] = useLoadModule({
    addon: 'powerpack',
    remote: 'annotations',
    module: 'AnnotationTools',
    fallback: AnnotationToolsFallback,
    minVersion,
    defer: isLoadingLicense, // wait for the license check (reported as loading)
    skip: !isLoadingLicense && !powerLicense, // skip loading if powerpack license is not available
  })
  const [useDrawHistory, { isLoading: isLoadingDrawHistory }] = useLoadModule({
    addon: 'powerpack',
    remote: 'annotations',
    module: 'useDrawHistory',
    fallback: useDrawHistoryFallback,
    minVersion,
    defer: isLoadingLicense, // wait for the license check (reported as loading)
    skip: !isLoadingLicense && !powerLicense, // skip loading if powerpack license is not available
  })

  const isLoaded =
    isLoadedProvider && isLoadedEditorProvider && isLoadedCanvas && isLoadedHook && isLoadedTools
  const isLoading =
    isLoadingLicense ||
    isLoadingProvider ||
    isLoadingEditorProvider ||
    isLoadingCanvas ||
    isLoadingHook ||
    isLoadingTools ||
    isLoadingDrawHistory

  return {
    AnnotationsProvider,
    AnnotationsEditorProvider,
    AnnotationsCanvas,
    useAnnotations,
    AnnotationTools,
    useDrawHistory,
    isLoaded,
    isLoading,
    outdated,
  }
}

export type AnnotationModules = ReturnType<typeof useAnnotationModules>

type ViewerProviderProps = {
  children: ReactNode
  selectedVersionId?: string
  annotationModules: AnnotationModules
}

export const ViewerProvider = ({
  children,
  selectedVersionId,
  annotationModules,
}: ViewerProviderProps) => {
  const {
    AnnotationsProvider,
    AnnotationsEditorProvider,
    AnnotationsCanvas,
    useAnnotations,
    AnnotationTools,
    useDrawHistory,
    isLoaded,
    outdated,
  } = annotationModules

  // show error message if annotations version is outdated
  useEffect(() => {
    if (outdated) {
      toast.warning(
        `Powerpack addon version incompatible. Required: ${outdated.required}, Current: ${outdated.current}`,
      )
    }
  }, [!!outdated])

  const frameLink = useViewerFrameLink(selectedVersionId)

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
