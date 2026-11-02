import { useCallback, useEffect, useState } from 'react'
import { useViewsContext, useViewUpdateHelper } from '@shared/containers'
import type { QueryFilter } from '@shared/api'

export type InboxViewSettings = {
  filter?: QueryFilter
  unreadOnly?: boolean
}

const EMPTY_FILTER: QueryFilter = { operator: 'and', conditions: [] }

type Return = {
  filter: QueryFilter
  onUpdateFilter: (filter: QueryFilter) => void
  unreadOnly: boolean
  onUpdateUnreadOnly: (unreadOnly: boolean) => void
  isLoadingViews: boolean
}

const useInboxViewSettings = (): Return => {
  const { viewSettings, isLoadingViews } = useViewsContext()
  const { updateViewSettings } = useViewUpdateHelper()

  const settings = viewSettings as InboxViewSettings | undefined

  const [localFilter, setLocalFilter] = useState<QueryFilter | null>(null)
  const [localUnreadOnly, setLocalUnreadOnly] = useState<boolean | null>(null)

  useEffect(() => {
    setLocalFilter(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(settings?.filter)])

  useEffect(() => {
    setLocalUnreadOnly(null)
  }, [settings?.unreadOnly])

  const filter = localFilter ?? settings?.filter ?? EMPTY_FILTER
  const unreadOnly = localUnreadOnly ?? settings?.unreadOnly ?? false

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
    filter,
    onUpdateFilter,
    unreadOnly,
    onUpdateUnreadOnly,
    isLoadingViews,
  }
}

export default useInboxViewSettings
