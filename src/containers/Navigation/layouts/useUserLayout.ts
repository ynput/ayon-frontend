import { useCallback, useEffect, useRef, useState } from 'react'
import { isEqual } from 'lodash'
import {
  useCreateViewMutation,
  useGetWorkingViewQuery,
  useUpdateViewMutation,
  viewsQueries,
} from '@shared/api'
import { usePowerpack } from '@shared/context'
import { generateViewId, generateWorkingView } from '@shared/containers/Views'
import { useAppDispatch } from '@state/store'
import { LAYOUT_VIEW_TYPE, type LayoutSettings } from './types'

interface SavedLayout {
  id: string
  layout: LayoutSettings
}

// What this browser tab last saved, for every page that shows it. A refetch can still bring back
// an older layout (creating the working view refreshes it, and that can land after a quick second
// change), so this is shown and built on, and put back into the shared cache once that refetch
// has settled, until the cache has the same.
let lastSaved: SavedLayout | null = null
// writes run one at a time, each from the layout the previous one saved
let queue: Promise<unknown> = Promise.resolve()

export const isNotFound = (error: unknown) => (error as { status?: unknown })?.status === 404

/**
 * The user's own layout: their working view of type `layout`, studio-wide. It holds their pinned
 * views until named layouts exist. Needs the Power Pack licence.
 */
export const useUserLayout = () => {
  const { powerLicense } = usePowerpack()
  const enabled = !!powerLicense
  const dispatch = useAppDispatch()

  const {
    currentData: workingView,
    error,
    isLoading,
    isFetching,
  } = useGetWorkingViewQuery({ viewType: LAYOUT_VIEW_TYPE }, { skip: !enabled })
  const [createView] = useCreateViewMutation()
  const [updateView] = useUpdateViewMutation()

  const cached = workingView?.id
    ? { id: workingView.id, layout: workingView.settings as LayoutSettings }
    : undefined
  if (lastSaved && cached?.id === lastSaved.id && isEqual(cached.layout, lastSaved.layout))
    lastSaved = null
  const current: Partial<SavedLayout> | undefined = lastSaved ?? cached
  const currentRef = useRef(current)
  currentRef.current = current
  const [, rerender] = useState(0)

  // an older refetch landed after a save: the saved layout goes back into the shared cache
  useEffect(() => {
    const saved = lastSaved
    if (!saved || isFetching || cached?.id !== saved.id || isEqual(cached.layout, saved.layout))
      return
    dispatch(
      viewsQueries.util.updateQueryData(
        'getWorkingView',
        { viewType: LAYOUT_VIEW_TYPE },
        (draft) => {
          draft.settings = saved.layout
        },
      ),
    )
  }, [cached?.id, cached?.layout, isFetching, dispatch])

  const update = useCallback(
    (change: (layout: LayoutSettings | undefined) => LayoutSettings) => {
      const write = async () => {
        let base = lastSaved ?? currentRef.current
        if (!base?.id) {
          // the lookup may still be loading, or have failed: ask the server, so an existing layout
          // is updated rather than created again
          try {
            const view = await dispatch(
              viewsQueries.endpoints.getWorkingView.initiate(
                { viewType: LAYOUT_VIEW_TYPE },
                { subscribe: false, forceRefetch: true },
              ),
            ).unwrap()
            base = { id: view.id, layout: view.settings as LayoutSettings }
          } catch (error) {
            if (!isNotFound(error)) throw error
          }
        }
        const next = change(base?.layout)
        if (base?.id) {
          await updateView({
            viewType: LAYOUT_VIEW_TYPE,
            viewId: base.id,
            genericViewPatchModel: { settings: next },
          }).unwrap()
          lastSaved = { id: base.id, layout: next }
        } else {
          const id = generateViewId()
          const view = { ...generateWorkingView(next), id, label: 'My layout' }
          const created = await createView({
            viewType: LAYOUT_VIEW_TYPE,
            genericViewPostModel: view,
          }).unwrap()
          // the id the server kept
          lastSaved = { id: created?.id ?? id, layout: next }
        }
        rerender((count) => count + 1)
        // the layout's id, for picking it after a first change made a copy
        return lastSaved.id
      }
      const result = queue.then(write)
      queue = result.catch(() => undefined)
      return result
    },
    [createView, updateView, dispatch],
  )

  // the lookup has answered: with the layout, or that there is none yet (another error isn't an
  // answer: a change then could replace a layout that exists)
  const ready = enabled && (!!current?.id || isNotFound(error))

  return { enabled, ready, id: current?.id, layout: current?.layout, isLoading, update }
}
