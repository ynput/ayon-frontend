import { useCallback } from 'react'
import { isEqual } from 'lodash'
import { useGetViewQuery, useListViewsQuery } from '@shared/api'
import { useSessionStorage } from '@shared/hooks'
import type { ViewSettings } from '@shared/containers/Views'
import type { PinnableViewType } from './types'

/** at least this access level saves changes into a view (owner, or shared with update rights) */
export const UPDATE_ACCESS = 20

// ---------------------------------------------------------------------------------------------
// drafts: what changed on a pinned tab, for the browser session; never written into a view

/**
 * Changed settings per view id. A cleared field is `null`: session storage is JSON, which would
 * drop an `undefined` and bring the saved value back.
 */
type Drafts = Record<string, ViewSettings>

export const usePinnedViewDrafts = () => {
  const [drafts, setDrafts] = useSessionStorage<Drafts>('pinned-view-drafts', {})
  const mergeDraft = useCallback(
    (id: string, changed: ViewSettings) => {
      const kept = Object.fromEntries(
        Object.entries(changed).map(([key, value]) => [key, value === undefined ? null : value]),
      )
      setDrafts((all) => ({ ...all, [id]: { ...all[id], ...kept } }))
    },
    [setDrafts],
  )
  /** drops the draft (Revert) */
  const clearDraft = useCallback(
    (id: string) =>
      setDrafts((all) => Object.fromEntries(Object.entries(all).filter(([key]) => key !== id))),
    [setDrafts],
  )
  /** drops the draft only if it is still the one that was saved: later edits stay */
  const clearSavedDraft = useCallback(
    (id: string, saved: ViewSettings | undefined) =>
      setDrafts((all) =>
        isEqual(all[id], saved)
          ? Object.fromEntries(Object.entries(all).filter(([key]) => key !== id))
          : all,
      ),
    [setDrafts],
  )
  return { drafts, mergeDraft, clearDraft, clearSavedDraft }
}

/** A view of the page by its id: the one a pinned tab, or a link, opens. */
export const usePinnedView = (
  projectName: string,
  viewType: PinnableViewType,
  viewId: string,
  skip = false,
) => {
  // the list holds only the views the user can read; it also says where the view is stored
  const list = useListViewsQuery({ viewType, projectName }, { skip })
  const listed = list.currentData?.find((view) => view.id === viewId)
  const full = useGetViewQuery(
    { viewType, viewId, projectName: listed?.scope === 'project' ? projectName : undefined },
    { skip: skip || !listed },
  )
  return {
    // data for these arguments only (another view's never shows under this link); a failed
    // refresh keeps what was cached
    views: list.currentData,
    listed,
    view: listed ? full.currentData : undefined,
    isFetching: list.isFetching,
    isError: list.isError || full.isError,
    refetchList: list.refetch,
  }
}
