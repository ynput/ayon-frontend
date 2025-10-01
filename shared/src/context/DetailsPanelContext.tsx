import React, { createContext, useContext, useCallback, ReactNode, useState } from 'react'
import { useLocalStorage } from '@shared/hooks'
import { DetailsPanelEntityType, useGetCurrentUserQuery } from '@shared/api'
import type { UserModel } from '@shared/api'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { SavedAnnotationMetadata } from '@shared/containers'

export type FeedFilters = 'activity' | 'comments' | 'versions' | 'checklists'

export type DetailsPanelTab = FeedFilters | 'details' | 'files'

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

export interface OpenStateByScope {
  [scope: string]: boolean
}

// Create a new interface for managing tab state by scope
export interface TabStateByScope {
  [scope: string]: DetailsPanelTab
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
  onOpenViewer?: (args: any) => void
  onUpdateEntity?: (data: { operations: any[]; entityType: string }) => void
  // route hooks
  useParams: typeof useParams
  useNavigate: typeof useNavigate
  useLocation: typeof useLocation
  useSearchParams: typeof useSearchParams
  feedAnnotationsEnabled?: boolean
}

// Interface for our simplified context
export interface DetailsPanelContextType extends DetailsPanelContextProps {
  // user
  isDeveloperMode: boolean
  // Open state for the panel by scope
  panelOpenByScope: OpenStateByScope
  getOpenForScope: (scope: string) => boolean
  setPanelOpen: (scope: string, isOpen: boolean) => void
  setPanelOpenByScope: (newState: OpenStateByScope) => void

  // Tab preferences by scope
  tabsByScope: TabStateByScope
  getTabForScope: (scope: string) => DetailsPanelTab
  setTab: (scope: string, tab: DetailsPanelTab) => void

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

  // Annotations
  feedAnnotations: SavedAnnotationMetadata[]
  setFeedAnnotations: (annotations: SavedAnnotationMetadata[]) => void
}

// Create the context
const DetailsPanelContext = createContext<DetailsPanelContextType | undefined>(undefined)

// Provider component
export interface DetailsPanelProviderProps extends DetailsPanelContextProps {
  children: ReactNode
  defaultTab?: DetailsPanelTab
}

export const DetailsPanelProvider: React.FC<DetailsPanelProviderProps> = ({
  children,
  defaultTab = 'activity',
  ...forwardedProps
}) => {
  // get current user
  const { data: currentUser } = useGetCurrentUserQuery()
  const isDeveloperMode = currentUser?.attrib?.developerMode ?? false

  // keep track of the currently open panel by scope
  const [panelOpenByScope, setPanelOpenByScope] = useState<OpenStateByScope>({})
  const [feedAnnotations, setFeedAnnotations] = useState<SavedAnnotationMetadata[]>([])

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
  const [tabsByScope, setTabsByScope] = useLocalStorage<TabStateByScope>(
    'details/tabs-by-scope',
    {},
  )

  // Get the current tab for a specific scope
  const getTabForScope = useCallback(
    (scope: string): DetailsPanelTab => {
      // Check if we have a saved preference for this scope
      if (tabsByScope[scope]) {
        return tabsByScope[scope]
      }

      // Fall back to default
      return defaultTab
    },
    [tabsByScope, defaultTab],
  )

  // Set tab for a scope
  const setTab = useCallback(
    (scope: string, tab: DetailsPanelTab) => {
      // Create a new state object based on current tabsByScope
      const newState = { ...tabsByScope }
      newState[scope] = tab

      // Update the state with the new object
      setTabsByScope(newState)
    },
    [tabsByScope, setTabsByScope],
  )

  // is the slide out open?
  const [slideOut, setSlideOut] = useState<null | SlideOut>(null)

  // open the slide out
  const openSlideOut = useCallback<DetailsPanelContextType['openSlideOut']>((params) => {
    setSlideOut(params)
  }, [])

  // close the slide out
  const closeSlideOut = useCallback(() => {
    setSlideOut(null)
    setHighlightedActivities([])
  }, [])

  const [pip, setPip] = useState<DetailsPanelPip | null>(null)

  const openPip = useCallback((pip: DetailsPanelPip) => {
    setPip(pip)
  }, [])
  const closePip = useCallback(() => {
    setPip(null)
  }, [])

  const [highlightedActivities, setHighlightedActivities] = useState<string[]>([])

  const value = {
    // open state for the panel by scope
    panelOpenByScope,
    getOpenForScope,
    setPanelOpen,
    setPanelOpenByScope,
    // tab preferences
    tabsByScope,
    getTabForScope,
    setTab,
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
    feedAnnotations,
    setFeedAnnotations,
    isDeveloperMode,
    ...forwardedProps,
  }

  return <DetailsPanelContext.Provider value={value}>{children}</DetailsPanelContext.Provider>
}

// Custom hook to use the details context
export const useDetailsPanelContext = (): DetailsPanelContextType => {
  const context = useContext(DetailsPanelContext)
  if (context === undefined) {
    throw new Error('useDetailsPanel must be used within a DetailsProvider')
  }
  return context
}

// Add a specialized hook for using a panel in a specific scope
export const useScopedDetailsPanel = (scope: string) => {
  const { getTabForScope, setTab, getOpenForScope, setPanelOpen } = useDetailsPanelContext()

  return {
    isOpen: getOpenForScope(scope),
    setOpen: (isOpen: boolean) => setPanelOpen(scope, isOpen),
    currentTab: getTabForScope(scope),
    setTab: (tab: DetailsPanelTab) => setTab(scope, tab),
    isFeed: ['activity', 'comments', 'versions', 'checklists'].includes(getTabForScope(scope)),
  }
}
