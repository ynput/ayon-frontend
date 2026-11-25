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

  const { currentData: workingView, isLoading } = useGetWorkingViewQuery(
    { viewType: LAYOUT_VIEW_TYPE },
    { skip: !enabled },
  )
  const [createView] = useCreateViewMutation()
  const [updateView] = useUpdateViewMutation()
  const layout = workingView?.settings as LayoutSettings | undefined

  // Writes run one at a time, each from the layout the previous one left: quick changes (two pins
  // in a row) neither overwrite each other nor create a second working view.
  const pending = useRef(0)
  const latest = useRef<{ id?: string; layout?: LayoutSettings }>({})
  if (!pending.current) latest.current = { id: workingView?.id, layout }
  const queue = useRef<Promise<unknown>>(Promise.resolve())

  const update = useCallback(
    (change: (layout: LayoutSettings | undefined) => LayoutSettings) => {
      const write = async () => {
        const next = change(latest.current.layout)
        latest.current = { ...latest.current, layout: next }
        if (latest.current.id) {
          await updateView({
            viewType: LAYOUT_VIEW_TYPE,
            viewId: latest.current.id,
            genericViewPatchModel: { settings: next },
          }).unwrap()
          return
        }
        const view = { ...generateWorkingView(next), label: 'My layout' }
        await createView({ viewType: LAYOUT_VIEW_TYPE, genericViewPostModel: view }).unwrap()
        latest.current = { ...latest.current, id: view.id }
      }
      pending.current += 1
      const result = queue.current.then(write).finally(() => {
        pending.current -= 1
      })
      queue.current = result.catch(() => undefined)
      return result
    },
    [createView, updateView],
  )

  return { enabled, layout, isLoading, update }
}
