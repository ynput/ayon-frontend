import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { isEqual } from 'lodash'
import { useGetViewQuery, useListViewsQuery } from '@shared/api'
import { useSessionStorage } from '@shared/hooks'
import type { ViewSettings, ViewsProviderProps } from '@shared/containers/Views'
import { applyDraft } from './pins'
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
      setDrafts((all) => {
        const next = { ...all[id], ...kept }
        // nothing changed: no new draft, so a page that repeats the same change doesn't loop
        return isEqual(all[id], next) ? all : { ...all, [id]: next }
      })
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

/**
 * The settings a pinned view's page runs on (a controlled views provider), or null when no pinned
 * view is open or it hasn't loaded. They are held here instead of in the user's selected view:
 * changes stay a draft for the session until saved, and the page's own view doesn't change.
 */
export const usePinnedViewSettings = (
  projectName: string,
  pinned: { viewType: PinnableViewType; viewId: string } | null,
  fallbackPath: string,
): ViewsProviderProps['controlled'] | null => {
  const navigate = useNavigate()
  const viewId = pinned?.viewId ?? ''
  const { views, listed, view, isFetching, isError } = usePinnedView(
    projectName,
    pinned?.viewType ?? 'overview',
    viewId,
    !pinned,
  )
  const { drafts, mergeDraft } = usePinnedViewDrafts()
  const draft = pinned ? drafts[viewId] : undefined

  useEffect(() => {
    if (!pinned) return
    // a view just saved may not be in the list yet; a failed request only matters when there is
    // nothing to show
    const failed = isError && !view
    if (failed || (views && !listed && !isFetching && !isError)) {
      toast.warning(failed ? "Couldn't open this view" : "You can't open this view")
      navigate(fallbackPath, { replace: true })
    }
  }, [pinned, views, listed, view, isFetching, isError, fallbackPath, navigate])

  // pages keep some settings in their own state (Products' grid, grouping, columns): the key tells
  // them to start again from the view on another view, and when the draft is reverted or saved
  const [resets, setResets] = useState(0)
  const hadDraft = useRef(!!draft)
  useEffect(() => {
    if (hadDraft.current && !draft) setResets((count) => count + 1)
    hadDraft.current = !!draft
  }, [draft])

  const settings = useMemo(
    () => (view ? applyDraft(view.settings as ViewSettings, draft) : undefined),
    [view, draft],
  )
  const onChange = useCallback(
    (changed: ViewSettings) => mergeDraft(viewId, changed),
    [mergeDraft, viewId],
  )
  // "Reset filters" on a pinned tab clears the filters in its draft
  const onReset = useCallback(
    () => mergeDraft(viewId, { filter: undefined, folderFilter: undefined } as ViewSettings),
    [mergeDraft, viewId],
  )

  return useMemo(
    () => (pinned && settings ? { settings, onChange, onReset, key: `${viewId}:${resets}` } : null),
    [pinned, settings, onChange, onReset, viewId, resets],
  )
}
