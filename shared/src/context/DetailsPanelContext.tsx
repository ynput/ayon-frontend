import React, {
  createContext,
  useContext,
  useCallback,
  ReactNode,
  useState,
  useEffect,
} from 'react'
import { useLocalStorage } from '@shared/hooks'
import { DetailsPanelEntityType, useGetCurrentUserQuery } from '@shared/api'
import type { UserModel } from '@shared/api'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useSearchParams } from 'react-router-dom'
import { SavedAnnotationMetadata } from '@shared/containers'
import { PowerpackFeature, usePowerpack } from './PowerpackContext'
import { useURIContext } from './UriContext'

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

export type Entities = {
  entityType: DetailsPanelEntityType
  entities: { id: string; projectName: string }[]
  entitySubTypes?: string[]
  source?: string // 'uri' | 'related'
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
  hasLicense?: boolean
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
  isDeveloperMode: boolean
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

  // powerpack
  onPowerFeature: (feature: PowerpackFeature) => void
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
  hasLicense: hasLicenseProp,
  debug = {},
  ...forwardedProps
}) => {
  // get current user
  const { data: currentUser } = useGetCurrentUserQuery()
  const isDeveloperMode =
    'isDeveloperMode' in debug
      ? (debug.isDeveloperMode as boolean)
      : currentUser?.attrib?.developerMode ?? false
  const isGuest = 'isGuest' in debug ? (debug.isGuest as boolean) : currentUser?.data?.isGuest

  // get license from powerpack or forwarded down from props
  const { powerLicense, setPowerpackDialog } = usePowerpack()
  const hasLicense =
    'hasLicense' in debug ? (debug.hasLicense as boolean) : !!powerLicense || hasLicenseProp

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
  const [tabsByScope] = useLocalStorage<TabStateByScope>('details/tabs-by-scope', {})

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
  // on first load, check if there is a uri and open details panel if there is
  useEffect(() => {
    // check uri type is entity
    if (uriType !== 'entity' || !entity || entity.entityType === 'product') return

    getUriEntities()
      .then((result) => {
        if (result.length === 0) return

        const entityUriData = result.find((r) => r.uri === uri)
        const entityData = entityUriData?.entities?.[0]

        // http://localhost:3000/dashboard/tasks?uri=ayon%2Bentity%3A%2F%2Fdemo_Commercial%2Fassets%2Fprops%2F07_drandauett_typangoects%3Ftask%3Dlookdev

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
  }, [setEntities])

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
    isDeveloperMode,
    isGuest,
    hasLicense,
    onPowerFeature: setPowerpackDialog,
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
  const { getOpenForScope, setPanelOpen, getTabForScope } = useDetailsPanelContext()

  const [tabsByScope, setTabsByScope] = useLocalStorage<TabStateByScope>(
    'details/tabs-by-scope',
    {},
  )

  const [tab, setTab] = useState<DetailsPanelTab>(() => tabsByScope[scope] ?? getTabForScope(scope))

  // Keep localStorage and local state in sync
  const updateTab = useCallback(
    (newTab: DetailsPanelTab) => {
      setTab(newTab)
      setTabsByScope({ ...tabsByScope, [scope]: newTab })
    },
    [scope, setTabsByScope],
  )

  const currentTab = tab
  const isFeed = ['activity', 'comments', 'versions', 'checklists'].includes(currentTab)

  return {
    isOpen: getOpenForScope(scope),
    setOpen: (isOpen: boolean) => setPanelOpen(scope, isOpen),
    currentTab,
    setTab: updateTab,
    isFeed,
  }
}
