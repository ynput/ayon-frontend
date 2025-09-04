import { useCallback } from 'react'
import { isViewStudioScope, ViewData, ViewSettings, ViewType } from '..'
import { UseViewMutations } from './useViewsMutations'
import { ViewListItemModel } from '@shared/api'
import { toast } from 'react-toastify'

type Props = {
  viewType?: ViewType
  projectName?: string
  viewsList: ViewListItemModel[]
  sourceSettings?: ViewSettings
  onUpdateView: UseViewMutations['onUpdateView']
}

export const useSaveViewFromCurrent = ({
  viewType,
  projectName,
  viewsList,
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
        await onUpdateView(
          viewId,
          {
            settings: sourceSettings,
          },
          isViewStudioScope(viewId, viewsList),
        )

        toast.success('View settings saved')
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
