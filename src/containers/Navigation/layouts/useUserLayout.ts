import { useCallback, useRef } from 'react'
import { useCreateViewMutation, useGetWorkingViewQuery, useUpdateViewMutation } from '@shared/api'
import { usePowerpack } from '@shared/context'
import { generateWorkingView } from '@shared/containers/Views'
import { LAYOUT_VIEW_TYPE, type LayoutSettings } from './types'

/**
 * The user's own layout: their working view of type `layout`, studio-wide. It holds their pinned
 * views until named layouts exist. Needs the Power Pack licence.
 */
export const useUserLayout = () => {
  const { powerLicense } = usePowerpack()
  const enabled = !!powerLicense

  const {
    currentData: workingView,
    isLoading,
    refetch: refetchWorking,
  } = useGetWorkingViewQuery({ viewType: LAYOUT_VIEW_TYPE }, { skip: !enabled })
  const [createView] = useCreateViewMutation()
  const [updateView] = useUpdateViewMutation()
  const layout = workingView?.settings as LayoutSettings | undefined

  // Writes run one at a time, each from the layout the previous one left: quick changes (two pins
  // in a row) neither overwrite each other nor create a second working view.
  // `latest` is the last layout a write saved; it follows the cache once nothing is pending and
  // the cache has caught up (a just-created working view isn't in it until it refetches)
  const pending = useRef(0)
  const latest = useRef<{ id?: string; layout?: LayoutSettings }>({})
  if (!pending.current && (workingView?.id || !latest.current.id))
    latest.current = { id: workingView?.id, layout }
  const queue = useRef<Promise<unknown>>(Promise.resolve())

  const update = useCallback(
    (change: (layout: LayoutSettings | undefined) => LayoutSettings) => {
      const write = async () => {
        // the next write starts from this one only once it is saved
        const next = change(latest.current.layout)
        const { id } = latest.current
        if (id) {
          await updateView({
            viewType: LAYOUT_VIEW_TYPE,
            viewId: id,
            genericViewPatchModel: { settings: next },
          }).unwrap()
          latest.current = { id, layout: next }
          return
        }
        const view = { ...generateWorkingView(next), label: 'My layout' }
        await createView({ viewType: LAYOUT_VIEW_TYPE, genericViewPostModel: view }).unwrap()
        latest.current = { id: view.id, layout: next }
        // the next write patches the cached layout (settings-only updates don't refetch), so it
        // waits until the new working view is in the cache
        await refetchWorking()
      }
      pending.current += 1
      const result = queue.current.then(write).finally(() => {
        pending.current -= 1
      })
      queue.current = result.catch(() => undefined)
      return result
    },
    [createView, updateView, refetchWorking],
  )

  return { enabled, layout, isLoading, update }
}
