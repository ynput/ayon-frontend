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

  // a second change before the first one's working view exists must not create another one
  const creating = useRef<Promise<unknown> | null>(null)

  const update = useCallback(
    async (change: (layout: LayoutSettings | undefined) => LayoutSettings) => {
      if (creating.current) await creating.current
      if (workingView?.id) {
        await updateView({
          viewType: LAYOUT_VIEW_TYPE,
          viewId: workingView.id,
          genericViewPatchModel: { settings: change(layout) },
        }).unwrap()
        return
      }
      creating.current = createView({
        viewType: LAYOUT_VIEW_TYPE,
        genericViewPostModel: { ...generateWorkingView(change(layout)), label: 'My layout' },
      }).unwrap()
      try {
        await creating.current
      } finally {
        creating.current = null
      }
    },
    [workingView?.id, layout, createView, updateView],
  )

  return { enabled, layout, isLoading, update }
}
