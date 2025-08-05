import { useCreateViewMutation, UserModel, ViewListItemModel } from '@shared/api'
import { useCallback, useMemo } from 'react'
import { VIEW_DIVIDER, ViewMenuItem } from '../ViewsMenu/ViewsMenu'
import { ViewItem } from '../ViewItem/ViewItem'
import { Icon } from '@ynput/ayon-react-components'
import { generatePersonalView } from '../utils/generatePersonalView'
import { toast } from 'react-toastify'
import { useLoadModule } from '@shared/hooks'
import { getCustomViewsFallback } from '../utils/getCustomViewsFallback'
import { ViewData } from '../context/ViewsContext'

// constants
export const PERSONAL_VIEW_ID = '_personal_' as const
export const NEW_VIEW_ID = '_new_view_' as const
export type ViewListItemModelExtended = ViewListItemModel & {
  isOwner: boolean
  highlighted?: 'save' | 'edit'
}

type Props = {
  viewsList: ViewListItemModel[]
  personalView?: ViewListItemModel
  viewType?: string
  projectName?: string
  currentUser?: UserModel
  usePersonalView?: boolean
  editingViewId?: string // the preview id of the view being edited
  onEdit: (viewId: string) => void
  onSelect: (viewId: string) => void
  onSave: (viewId: string) => void
}

const useBuildViewMenuItems = ({
  viewsList,
  personalView,
  viewType,
  projectName,
  currentUser,
  usePersonalView,
  editingViewId,
  onSelect,
  onEdit,
  onSave,
}: Props): ViewMenuItem[] => {
  // MUTATIONS
  const [createView] = useCreateViewMutation()

  const extendedViewsList: ViewListItemModelExtended[] = useMemo(
    () =>
      viewsList.map((view) => ({
        ...view,
        isOwner: view.owner === currentUser?.name,
        highlighted: editingViewId === view.id ? 'save' : undefined,
      })),
    [viewsList, currentUser, editingViewId],
  )

  const personalBaseView: ViewItem = {
    id: PERSONAL_VIEW_ID,
    label: usePersonalView ? 'Personal view' : 'Working view',
    startContent: usePersonalView && <Icon icon="person" />,
    isEditable: false,
  }

  // if we have a personal view, we use it, otherwise we create one
  const handlePersonalViewChange = useCallback(async () => {
    let personalViewId = personalView?.id
    if (!personalView) {
      // no personal view found, create one
      try {
        console.warn('No personal view found, creating a new one')
        const personalView = generatePersonalView()
        await createView({
          payload: personalView,
          viewType: viewType as string,
          projectName: projectName,
        }).unwrap()
        // set id of the new view
        personalViewId = personalView.id
      } catch (error: any) {
        toast.error(`Failed to create personal view: ${error}`)
      }
    }
    // select the personal view
    onSelect(personalViewId as string)
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
        viewsList: extendedViewsList,
        onEdit,
        onSelect,
        onSave,
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
