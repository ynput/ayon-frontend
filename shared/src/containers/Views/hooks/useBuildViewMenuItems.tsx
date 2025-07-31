import { useCreateViewMutation, ViewListItemModel } from '@shared/api'
import React, { useCallback, useMemo } from 'react'
import { VIEW_DIVIDER, ViewMenuItem } from '../ViewsMenu/ViewsMenu'
import { ViewItem } from '../ViewItem/ViewItem'
import { Icon } from '@ynput/ayon-react-components'
import { generatePersonalView } from '../utils/generatePersonalView'
import { toast } from 'react-toastify'
import { useLoadModule } from '@shared/hooks'
import { getCustomViewsFallback } from '../utils/getCustomViewsFallback'

// constants
export const PERSONAL_VIEW_ID = '_personal_' as const
export const NEW_VIEW_ID = '_new_view_' as const

const personalBaseView: ViewItem = {
  id: PERSONAL_VIEW_ID,
  label: 'Personal',
  startContent: <Icon icon="person" />,
  isEditable: false,
  isPersonal: true,
}

type Props = {
  viewsList: ViewListItemModel[]
  personalView?: ViewListItemModel
  viewType?: string
  projectName?: string
  onEdit: (viewId: string) => void
  onSelect: (viewId: string) => void
}

const useBuildViewMenuItems = ({
  viewsList,
  personalView,
  viewType,
  projectName,
  onSelect,
  onEdit,
}: Props): ViewMenuItem[] => {
  // MUTATIONS
  const [createView] = useCreateViewMutation()

  // if we have a personal view, we use it, otherwise we create one
  const handlePersonalViewChange = useCallback(async () => {
    onSelect(PERSONAL_VIEW_ID)
    if (!personalView) {
      try {
        console.warn('No personal view found, creating a new one')
        const personalView = generatePersonalView(viewType)
        await createView({
          payload: personalView,
          viewType: viewType as string,
          projectName: projectName,
        }).unwrap()
      } catch (error: any) {
        toast.error(`Failed to create personal view: ${error}`)
      }
    }
  }, [personalView, viewType, createView, projectName, onSelect])

  const [getCustomViews, { isLoading: isLoadingQueries }] = useLoadModule({
    addon: 'powerpack',
    remote: 'views',
    module: 'getCustomViews',
    fallback: getCustomViewsFallback,
    // minVersion: minVersion,
    skip: !viewType,
  })

  const { myViews, sharedViews } = useMemo(
    () =>
      getCustomViews({
        viewsList,
        onEdit,
        onSelect,
      }),
    [viewsList, onEdit, onSelect],
  )

  const dividers = myViews.length || sharedViews.length ? [VIEW_DIVIDER] : []

  const personalViewItem: ViewMenuItem = useMemo(
    () => ({
      ...personalBaseView,
      onClick: handlePersonalViewChange,
    }),
    [handlePersonalViewChange],
  )

  const viewItems: ViewMenuItem[] = useMemo(
    () => [personalViewItem, ...dividers, ...myViews, ...sharedViews, ...dividers],
    [personalView, myViews, sharedViews, personalViewItem],
  )

  return viewItems
}

export default useBuildViewMenuItems
