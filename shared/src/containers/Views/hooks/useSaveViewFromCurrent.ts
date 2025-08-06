import { useCallback } from 'react'
import { ViewData, ViewSettings, ViewType } from '..'
import { UseViewMutations } from './useViewsMutations'

type Props = {
  viewType?: ViewType
  projectName?: string
  sourceSettings?: ViewSettings
  onUpdateView: UseViewMutations['onUpdateView']
}

export const useSaveViewFromCurrent = ({
  viewType,
  projectName,
  sourceSettings,
  onUpdateView,
}: Props) => {
  // save the views settings from another views settings (uses update)
  const onSaveViewFromCurrent = useCallback(
    async (viewId: string) => {
      if (!viewType) {
        throw 'viewType are required for saving a view from another view'
      }

      // get the fromView settings
      if (!sourceSettings) {
        throw 'sourceView is required for saving a view from another view'
      }

      try {
        await onUpdateView(viewId, {
          settings: sourceSettings,
        })
      } catch (error) {
        const errorMessage =
          typeof error === 'string'
            ? 'Failed to save view settings: ' + error
            : 'Failed to save view settings'
        console.error(errorMessage)
        throw errorMessage
      }
    },
    [viewType, projectName, sourceSettings],
  )

  return { onSaveViewFromCurrent }
}
