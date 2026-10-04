import React, { ReactNode, useCallback, useEffect, useState } from 'react'
import type { QueryFilter, UserModel, DetailsPanelEntityType } from '@shared/api'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { SavedAnnotationMetadata } from '@shared/containers/Feed'
import { PowerpackFeature } from './PowerpackContext'
import { usePowerpack } from './PowerpackContextInstance'
import { useURIContext } from './UriContextInstance'
import { useSessionStorage } from '@shared/hooks/useSessionStorage'
import type { SubtasksManagerProps } from '@shared/components/SubtasksManager/SubtasksManagerWrapper'
import {
  DetailsPanelContext,
  isDetailsPanelTab,
  TABS_BY_SCOPE_KEY,
} from './DetailsPanelContextInstance'
import { BundleMode, getBundleModeFromUser } from '@shared/util'

// High-level tabs for the details panel
export type DetailsPanelTab = 'feed' | 'subtasks' | 'details' | 'files'

// Filters within the feed tab
export type FeedFilter = QueryFilter

export type SlideOut = {
  entityId: string
  entityType: DetailsPanelEntityType
  projectName: string
}

export type DetailsPanelPip = {
  entityType: DetailsPanelEntityType
  entities: { id: string; projectName: string }[]
  scope: string
}

export type Entities = {
  entityType: DetailsPanelEntityType
  entities: { id: string; projectName: string }[]
  entitySubTypes?: string[]
  source?: 'uri' | 'url' | 'related' // uri = ayon+entity://..., url = ?project=...&type=...&id=...
}

export interface OpenStateByScope {
  [scope: string]: boolean
}

// Create a new interface for managing tab state by scope
export interface TabStateByScope {
  [scope: string]: DetailsPanelTab
}

// Frame links: a comment linked to a frame or frame range of a version.
// Frames are 1-based and relative to the version's media, like annotation ranges.
export type CommentFrameRange = { startFrame: number; endFrame: number }
export type CommentFrameLink = CommentFrameRange & { entityId: string }
export type FeedFrameLink = CommentFrameLink & { activityId: string }
export type FeedFrameLinkPreview = {
  activityId: string
  link: CommentFrameLink | null
}

// Provided by a host with a player (e.g. the review addon) so comments can be
// linked to frames. Without it, the comment editor shows no frame link button.
export interface CommentFrameLinkApi {
  // the link of the comment being written, if any
  draft: CommentFrameLink | null
  setDraft: (link: CommentFrameLink | null) => void
  // temporary replacement for the frame link of a comment being edited
  editPreview: FeedFrameLinkPreview | null
  setEditPreview: (preview: FeedFrameLinkPreview | null) => void
  // links the comment being written to the player's current frame
  link: (entityId: string) => void
  unlink: () => void
  // jumps to a comment's frame; a frame range also sets the in/out points
  goTo: (link: CommentFrameLink) => void
  // formats a frame for display, e.g. with the host's frame offset setting
  formatFrame?: (frame: number) => string
}

// these props get forwarded to the details panel value
// it's mainly redux callbacks that cannot be used in shared library
export interface DetailsPanelContextProps {
  dispatch?: any // this is a redux dispatch function and it's quite annoying we need to do this
  user: UserModel
  viewer?: {
    reviewableIds: string[]
    taskId?: string | null
    folderId?: string | null
  }
  // redux callback actions
  onOpenImage?: (args: any) => void
  onGoToFrame?: (frame: number) => void
  commentFrameLink?: CommentFrameLinkApi
  onOpenViewer?: (args: any) => void
  onUpdateEntity?: (data: { operations: any[]; entityType: string }) => void
  // route hooks
  useParams: typeof useParams
  useNavigate: typeof useNavigate
  useLocation: typeof useLocation
  useSearchParams: typeof useSearchParams
  feedAnnotationsEnabled?: boolean
  hasLicense?: boolean
  // SubtasksManager component
  SubtasksManager?: React.ComponentType<SubtasksManagerProps>
  // debugging used to simulate different values
  debug?: {
    isDeveloperMode?: boolean
    isGuest?: boolean
    hasLicense?: boolean
  }
}

// Interface for our simplified context
export interface DetailsPanelContextType extends DetailsPanelContextProps {
  // user
  bundleMode: BundleMode
  isGuest: boolean
  // Open state for the panel by scope
  panelOpenByScope: OpenStateByScope
  getOpenForScope: (scope: string) => boolean
  setPanelOpen: (scope: string, isOpen: boolean) => void
  setPanelOpenByScope: (newState: OpenStateByScope) => void

  // Tab preferences by scope
  tabsByScope: TabStateByScope
  getTabForScope: (scope: string) => DetailsPanelTab

  // Slide out state
  slideOut: null | SlideOut
  openSlideOut: (slideOut: SlideOut) => void
  closeSlideOut: () => void

  // Highlighted activities
  highlightedActivities: string[]
  setHighlightedActivities: (activities: string[]) => void

  // PiP state
  pip: DetailsPanelPip | null
  openPip: (pip: DetailsPanelPip) => void
  closePip: () => void

  // Entities state
  entities: Entities | null
  setEntities: (entities: Entities | null) => void

  // Annotations
  feedAnnotations: SavedAnnotationMetadata[]
  setFeedAnnotations: (annotations: SavedAnnotationMetadata[]) => void

  // Frame links of the comments in the feed
  feedFrameLinks: FeedFrameLink[]
  setFeedFrameLinks: (links: FeedFrameLink[]) => void

  // powerpack
  onPowerFeature: (feature: PowerpackFeature) => void
}

// Provider component
export interface DetailsPanelProviderProps extends DetailsPanelContextProps {
  children: ReactNode
  defaultTab?: DetailsPanelTab
}

export const DetailsPanelProvider: React.FC<DetailsPanelProviderProps> = ({
  children,
  defaultTab = 'feed',
  hasLicense: hasLicenseProp,
  debug = {},
  ...forwardedProps
}) => {
  const user = forwardedProps.user
  const bundleMode = getBundleModeFromUser(user)
  const isGuest = 'isGuest' in debug ? (debug.isGuest as boolean) : user?.data?.isGuest

  // get license from powerpack or forwarded down from props
  const { powerLicense, setPowerpackDialog } = usePowerpack()
  const hasLicense =
    'hasLicense' in debug ? (debug.hasLicense as boolean) : !!powerLicense || hasLicenseProp

  // keep track of the currently open panel by scope
  const [panelOpenByScope, setPanelOpenByScope] = useState<OpenStateByScope>({})
  const [feedAnnotations, setFeedAnnotations] = useState<SavedAnnotationMetadata[]>([])
  const [feedFrameLinks, setFeedFrameLinks] = useState<FeedFrameLink[]>([])

  //  get the current open state for a specific scope
  const getOpenForScope = useCallback(
    (scope: string): boolean => {
      // Check if we have a saved preference for this scope
      if (panelOpenByScope[scope]) {
        return panelOpenByScope[scope]
      }

      // Fall back to default
      return false
    },
    [panelOpenByScope],
  )
  // Set open state for a scope
  const setPanelOpen = useCallback(
    (scope: string, isOpen: boolean) => {
      // Create a new state object based on current open state
      const newState = { ...panelOpenByScope }
      newState[scope] = isOpen

      // Update the state with the new object
      setPanelOpenByScope(newState)
    },
    [panelOpenByScope],
  )

  // Use localStorage to persist tab preferences by scope
  const [tabsByScope, setTabByScope] = useSessionStorage<TabStateByScope>(TABS_BY_SCOPE_KEY, {})

  // Get the current tab for a specific scope
  const getTabForScope = useCallback(
    (scope: string): DetailsPanelTab => {
      // Check if we have a saved preference for this scope
      const tab = tabsByScope[scope]
      if (isDetailsPanelTab(tab)) {
        return tab
      }

      // Fall back to default
      return defaultTab
    },
    [tabsByScope, defaultTab],
  )

  // Set tab for a scope

  // is the slide out open?
  const [slideOut, setSlideOut] = useState<null | SlideOut>(null)

  // open the slide out
  const openSlideOut = useCallback<DetailsPanelContextType['openSlideOut']>((params) => {
    setSlideOut(params)
  }, [])

  // close the slide out
  const closeSlideOut = useCallback(() => {
    setSlideOut(null)
    if (slideOut) {
      setHighlightedActivities([])
    }
  }, [])

  // close slide out whenever the page changes
  useEffect(() => {
    closeSlideOut()
  }, [forwardedProps.useLocation().pathname])

  const [pip, setPip] = useState<DetailsPanelPip | null>(null)

  const openPip = useCallback((pip: DetailsPanelPip) => {
    setPip(pip)
  }, [])
  const closePip = useCallback(() => {
    setPip(null)
  }, [])

  const [entities, setEntities] = useState<Entities | null>(null)

  const [highlightedActivities, setHighlightedActivities] = useState<string[]>([])

  const { uriType, uri, entity, getUriEntities } = useURIContext()
  const [searchParams] = forwardedProps.useSearchParams()

  const project = searchParams.get('project')
  const type = searchParams.get('type')
  const id = searchParams.get('id')
  const activity = searchParams.get('activity')

  // on first load or URL param change, check if there is a uri or URL params and open details panel if present
  useEffect(() => {
    // closing the panel deletes these params; bail so the stale uri state below can't reopen it
    if (!project && !type && !id) return

    // Priority 1: Check for 'uri' parameter (ayon+entity://...)
    if (uriType === 'entity' && entity && entity.entityType !== 'product') {
      getUriEntities()
        .then((result) => {
          if (result.length === 0) return

          const entityUriData = result.find((r) => r.uri === uri)
          const entityData = entityUriData?.entities?.[0]

          if (!entityUriData || !entityData) return
          const projectName = entityData?.projectName || entity.projectName || ''
          const id =
            entityData.representationId ||
            entityData.versionId ||
            entityData.productId ||
            entityData.taskId ||
            entityData.folderId

          if (!projectName || !id) return

          const newEntities: Entities = {
            entityType: entity.entityType as DetailsPanelEntityType,
            entities: [
              {
                id: id,
                projectName: projectName,
              },
            ],
            source: 'uri',
          }

          setEntities(newEntities)
        })
        .catch((err) => {
          console.warn('Failed to get URI entities:', err)
        })
      return
    }

    // Priority 2: Check for URL params (project, type, id)
    if (project && type && id) {
      const newEntities: Entities = {
        entityType: type as DetailsPanelEntityType,
        entities: [
          {
            id,
            projectName: project,
          },
        ],
        source: 'url',
      }

      setEntities(newEntities)

      // if there is an activity param, open the feed tab (activity is shown by default)

      if (activity) {
        setHighlightedActivities([activity])
        setTabByScope({
          ...tabsByScope,
          overview: 'feed',
        })
      }
    }
  }, [project, type, id])

  const value = {
    // open state for the panel by scope
    panelOpenByScope,
    getOpenForScope,
    setPanelOpen,
    setPanelOpenByScope,
    // tab preferences
    tabsByScope,
    getTabForScope,
    // slide out state
    slideOut,
    openSlideOut,
    closeSlideOut,
    // highlighted activities
    highlightedActivities,
    setHighlightedActivities,
    // PiP state
    pip,
    openPip,
    closePip,
    // entities state
    entities,
    setEntities,
    feedAnnotations,
    setFeedAnnotations,
    feedFrameLinks,
    setFeedFrameLinks,
    bundleMode,
    isGuest,
    hasLicense,
    onPowerFeature: setPowerpackDialog,
    ...forwardedProps,
  }

  return <DetailsPanelContext.Provider value={value}>{children}</DetailsPanelContext.Provider>
}
