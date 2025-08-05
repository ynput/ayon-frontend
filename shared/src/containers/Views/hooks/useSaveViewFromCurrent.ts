import { useCallback } from 'react'
import { ViewData, ViewType } from '..'
import { UseViewMutations } from './useViewsMutations'

type Props = {
  viewType?: ViewType
  projectName?: string
  sourceView?: ViewData
  onUpdateView: UseViewMutations['onUpdateView']
}

export const useSaveViewFromCurrent = ({
  viewType,
  projectName,
  sourceView,
  onUpdateView,
}: Props) => {
  // save the views settings from another views settings (uses update)
  const onSaveViewFromCurrent = useCallback(
    async (viewId: string) => {
      if (!viewType) {
        throw new Error('viewType are required for saving a view from another view')
      }

      // get the fromView settings
      if (!sourceView || !sourceView.settings) {
        throw new Error('sourceView is required for saving a view from another view')
      }

      try {
        await onUpdateView(viewId, {
          settings: sourceView.settings,
        })
      } catch (error) {
        console.error('Failed to save view from another view:', error)
        throw error
      }
    },
    [viewType, projectName, sourceView],
  )

  return { onSaveViewFromCurrent }
}
