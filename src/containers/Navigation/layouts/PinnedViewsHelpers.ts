import { useCallback } from 'react'
import { useGetViewQuery, useListViewsQuery } from '@shared/api'
import { useSessionStorage } from '@shared/hooks'
import type { ViewSettings } from '@shared/containers/Views'
import type { PinnableViewType } from './types'

/** at least this access level saves changes into a view (owner, or shared with update rights) */
export const UPDATE_ACCESS = 20

// ---------------------------------------------------------------------------------------------
// drafts: what changed on a pinned tab, for the browser session; never written into a view

type Drafts = Record<string, ViewSettings>

export const usePinnedViewDrafts = () => {
  const [drafts, setDrafts] = useSessionStorage<Drafts>('pinned-view-drafts', {})
  const mergeDraft = useCallback(
    (id: string, changed: ViewSettings) =>
      setDrafts((all) => ({ ...all, [id]: { ...all[id], ...changed } })),
    [setDrafts],
  )
  const clearDraft = useCallback(
    (id: string) =>
      setDrafts((all) => Object.fromEntries(Object.entries(all).filter(([key]) => key !== id))),
    [setDrafts],
  )
  return { drafts, mergeDraft, clearDraft }
}

/** A view of the page by its id: the one a pinned tab, or a link, opens. */
export const usePinnedView = (projectName: string, viewType: PinnableViewType, viewId: string) => {
  // the list holds only the views the user can read; it also says where the view is stored
  const {
    currentData: views,
    isFetching,
    refetch: refetchList,
  } = useListViewsQuery({ viewType, projectName })
  const listed = views?.find((view) => view.id === viewId)
  const { currentData: view } = useGetViewQuery(
    { viewType, viewId, projectName: listed?.scope === 'project' ? projectName : undefined },
    { skip: !listed },
  )
  return { views, listed, view: listed ? view : undefined, isFetching, refetchList }
}
