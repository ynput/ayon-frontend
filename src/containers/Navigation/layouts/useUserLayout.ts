import { useCallback, useRef, useState } from 'react'
import { isEqual } from 'lodash'
import { useCreateViewMutation, useGetWorkingViewQuery, useUpdateViewMutation } from '@shared/api'
import { usePowerpack } from '@shared/context'
import { generateViewId, generateWorkingView } from '@shared/containers/Views'
import { LAYOUT_VIEW_TYPE, type LayoutSettings } from './types'

interface SavedLayout {
  id: string
  layout: LayoutSettings
}

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

  // What this session last saved. A refetch can still bring back an older layout (creating the
  // working view refreshes it, and that can land after a quick second change), so this is what's
  // shown and built on until the cache has caught up with it.
  const saved = useRef<SavedLayout | null>(null)
  const cached = workingView?.id
    ? { id: workingView.id, layout: workingView.settings as LayoutSettings }
    : undefined
  if (
    saved.current &&
    cached?.id === saved.current.id &&
    isEqual(cached.layout, saved.current.layout)
  )
    saved.current = null
  const current: Partial<SavedLayout> | undefined = saved.current ?? cached
  const currentRef = useRef(current)
  currentRef.current = current
  const [, rerender] = useState(0)

  // writes run one at a time, each from the layout the previous one saved
  const queue = useRef<Promise<unknown>>(Promise.resolve())

  const update = useCallback(
    (change: (layout: LayoutSettings | undefined) => LayoutSettings) => {
      const write = async () => {
        const base = saved.current ?? currentRef.current
        const next = change(base?.layout)
        if (base?.id) {
          await updateView({
            viewType: LAYOUT_VIEW_TYPE,
            viewId: base.id,
            genericViewPatchModel: { settings: next },
          }).unwrap()
          saved.current = { id: base.id, layout: next }
        } else {
          const id = generateViewId()
          const view = { ...generateWorkingView(next), id, label: 'My layout' }
          await createView({ viewType: LAYOUT_VIEW_TYPE, genericViewPostModel: view }).unwrap()
          saved.current = { id, layout: next }
        }
        rerender((count) => count + 1)
      }
      const result = queue.current.then(write)
      queue.current = result.catch(() => undefined)
      return result
    },
    [createView, updateView],
  )

  return { enabled, layout: current?.layout, isLoading, update }
}
