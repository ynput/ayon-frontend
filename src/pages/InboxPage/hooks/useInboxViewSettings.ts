import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { generateWorkingView, useViewsContext, useViewUpdateHelper } from '@shared/containers'
import { useCreateViewMutation } from '@shared/api'
import type { QueryFilter } from '@shared/api'

export type InboxViewSettings = {
  projectName?: string | null
  filter?: QueryFilter
  unreadOnly?: boolean
}

const EMPTY_FILTER: QueryFilter = { operator: 'and', conditions: [] }

type Return = {
  projectName: string | null
  onUpdateProjectName: (projectName: string | null) => void
  filter: QueryFilter
  onUpdateFilter: (filter: QueryFilter) => void
  unreadOnly: boolean
  onUpdateUnreadOnly: (unreadOnly: boolean) => void
  isLoadingViews: boolean
}

const useInboxViewSettings = (): Return => {
  const { viewType, viewSettings, isLoadingViews, setSelectedView } = useViewsContext()
  const { updateViewSettings } = useViewUpdateHelper()
  const [createView] = useCreateViewMutation()

  const settings = viewSettings as InboxViewSettings | undefined

  // a tab's first visit has no view to write to, and updates abort without a baseline
  const bootstrapped = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!viewType || isLoadingViews || viewSettings !== undefined) return
    if (bootstrapped.current.has(viewType)) return
    bootstrapped.current.add(viewType)

    const workingView = generateWorkingView()
    createView({ viewType, payload: workingView })
      .unwrap()
      .then(() => setSelectedView(workingView.id as string))
      .catch((error) => {
        // drop the mark so it can retry, otherwise nothing ever persists
        bootstrapped.current.delete(viewType)
        console.error('Failed to create inbox working view:', error)
        toast.error('Inbox filters cannot be saved right now')
      })
  }, [viewType, viewSettings, isLoadingViews, createView, setSelectedView])

  // wrapped: updateViewSettings clears local state with null, which a null project also means
  const [localProjectName, setLocalProjectName] = useState<{ value: string | null } | null>(null)
  const [localFilter, setLocalFilter] = useState<QueryFilter | null>(null)
  const [localUnreadOnly, setLocalUnreadOnly] = useState<boolean | null>(null)

  useEffect(() => {
    setLocalProjectName(null)
  }, [settings?.projectName])

  useEffect(() => {
    setLocalFilter(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(settings?.filter)])

  useEffect(() => {
    setLocalUnreadOnly(null)
  }, [settings?.unreadOnly])

  const projectName = localProjectName ? localProjectName.value : settings?.projectName ?? null
  const filter = localFilter ?? settings?.filter ?? EMPTY_FILTER
  const unreadOnly = localUnreadOnly ?? settings?.unreadOnly ?? false

  const onUpdateProjectName = useCallback(
    (newProjectName: string | null) => {
      if (isLoadingViews) return
      void updateViewSettings(
        { projectName: newProjectName },
        setLocalProjectName,
        { value: newProjectName },
        { errorMessage: 'Failed to update selected project' },
      )
    },
    [updateViewSettings, isLoadingViews],
  )

  const onUpdateFilter = useCallback(
    (newFilter: QueryFilter) => {
      if (isLoadingViews) return
      void updateViewSettings({ filter: newFilter }, setLocalFilter, newFilter, {
        errorMessage: 'Failed to update inbox filters',
      })
    },
    [updateViewSettings, isLoadingViews],
  )

  const onUpdateUnreadOnly = useCallback(
    (newUnreadOnly: boolean) => {
      if (isLoadingViews) return
      void updateViewSettings({ unreadOnly: newUnreadOnly }, setLocalUnreadOnly, newUnreadOnly, {
        errorMessage: 'Failed to update unread filter',
      })
    },
    [updateViewSettings, isLoadingViews],
  )

  return {
    projectName,
    onUpdateProjectName,
    filter,
    onUpdateFilter,
    unreadOnly,
    onUpdateUnreadOnly,
    isLoadingViews,
  }
}

export default useInboxViewSettings
