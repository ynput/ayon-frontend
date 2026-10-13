import { createContext, useCallback, useContext } from 'react'
import type {
  CommentFrameLink,
  DetailsPanelContextType,
  DetailsPanelTab,
  TabStateByScope,
} from './DetailsPanelContext'
import { useSessionStorage } from '@shared/hooks/useSessionStorage'
import { readLocalStorage, writeLocalStorage } from '@shared/hooks/useLocalStorage'

// Create the context
export const DetailsPanelContext = createContext<DetailsPanelContextType | undefined>(undefined)

const DETAILS_PANEL_TABS: DetailsPanelTab[] = ['feed', 'subtasks', 'details', 'files']

export const isDetailsPanelTab = (tab: unknown): tab is DetailsPanelTab =>
  typeof tab === 'string' && DETAILS_PANEL_TABS.includes(tab as DetailsPanelTab)

// the frame link stored on a comment's data, if it has one
export const getActivityFrameLink = (activity: {
  activityData?: { startFrame?: unknown; endFrame?: unknown } | null
  origin?: { id: string } | null
  entityId?: string | null
}): CommentFrameLink | null => {
  const { startFrame, endFrame } = activity.activityData || {}
  const entityId = activity.origin?.id ?? activity.entityId
  if (!Number.isSafeInteger(startFrame) || !entityId) return null
  const start = startFrame as number
  const end = Number.isSafeInteger(endFrame) ? Math.max(start, endFrame as number) : start
  return { entityId, startFrame: start, endFrame: end }
}

// Custom hook to use the details context
export const useDetailsPanelContext = (): DetailsPanelContextType => {
  const context = useContext(DetailsPanelContext)
  if (context === undefined) {
    throw new Error('useDetailsPanel must be used within a DetailsPanelProvider')
  }
  return context
}

export const TABS_BY_SCOPE_KEY = 'details/tabs-by-scope'

export const setDetailsPanelTabForScope = (scope: string, tab: DetailsPanelTab) => {
  const current = readLocalStorage<TabStateByScope>(TABS_BY_SCOPE_KEY, {})
  writeLocalStorage(TABS_BY_SCOPE_KEY, { ...current, [scope]: tab })
}

// Add a specialized hook for using a panel in a specific scope
export const useScopedDetailsPanel = (scope: string) => {
  const { getOpenForScope, setPanelOpen, getTabForScope } = useDetailsPanelContext()

  const [tabsByScope, setTabsByScope] = useSessionStorage<TabStateByScope>(TABS_BY_SCOPE_KEY, {})

  // derived from localStorage state, which useSessionStorage keeps in sync across hook instances
  const storedTab = tabsByScope[scope]
  const currentTab = isDetailsPanelTab(storedTab) ? storedTab : getTabForScope(scope)

  const updateTab = useCallback(
    (newTab: DetailsPanelTab) => {
      setTabsByScope((prev) => ({ ...prev, [scope]: newTab }))
    },
    [scope, setTabsByScope],
  )

  const isFeed = currentTab === 'feed'

  return {
    isOpen: getOpenForScope(scope),
    setOpen: (isOpen: boolean) => setPanelOpen(scope, isOpen),
    currentTab,
    setTab: updateTab,
    isFeed,
  }
}
