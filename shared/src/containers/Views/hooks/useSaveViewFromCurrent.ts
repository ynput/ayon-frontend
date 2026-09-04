import { useCallback } from 'react'
import { useStore } from 'react-redux'
import type { ViewType } from '../types'
import type { ViewData, ViewSettings } from '../context/ViewsContext'
import { isViewStudioScope } from '../utils/isViewStudioScope'
import { UseViewMutations } from './useViewsMutations'
import { viewsQueries, type ViewListItemModel } from '@shared/api'
import { flushPendingColumnWrites } from '@shared/containers/ProjectTreeTable/utils/pendingColumnWrites'
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
  const store = useStore()

  // save the views settings from another views settings (uses update)
  const onSaveViewFromCurrent = useCallback(
    async (viewId: string) => {
      if (!viewType) {
        throw 'viewType are required for saving a view from another view'
      }

      // a resize can still be sitting in its debounce, so write it before copying the settings
      flushPendingColumnWrites()

      const latestSettings =
        (
          viewsQueries.endpoints.getDefaultView.select({ viewType, projectName })(
            store.getState() as any,
          ).data as ViewData | undefined
        )?.settings ?? sourceSettings

      // get the fromView settings
      if (!latestSettings) {
        throw 'sourceView is required for saving a view from another view'
      }

      try {
        await onUpdateView(
          viewId,
          {
            settings: latestSettings,
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
    [viewType, projectName, sourceSettings, store, viewsList, onUpdateView],
  )

  return { onSaveViewFromCurrent }
}
