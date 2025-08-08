import { useCreateViewMutation, UserModel, ViewListItemModel } from '@shared/api'
import { useCallback, useMemo } from 'react'
import { VIEW_DIVIDER, ViewMenuItem } from '../ViewsMenu/ViewsMenu'
import { ViewItem } from '../ViewItem/ViewItem'
import { Icon } from '@ynput/ayon-react-components'
import { generateWorkingView } from '../utils/generateWorkingView'
import { toast } from 'react-toastify'
import { useLoadModule } from '@shared/hooks'
import { getCustomViewsFallback } from '../utils/getCustomViewsFallback'
import { usePowerpack } from '@shared/context'

// constants
export const WORKING_VIEW_ID = '_working_' as const
export const NEW_VIEW_ID = '_new_view_' as const
export type ViewListItemModelExtended = ViewListItemModel & {
  isOwner: boolean
  highlighted?: 'save' | 'edit'
}

type Props = {
  viewsList: ViewListItemModel[]
  workingView?: ViewListItemModel
  viewType?: string
  projectName?: string
  currentUser?: UserModel
  useWorkingView?: boolean
  editingViewId?: string // the preview id of the view being edited
  onEdit: (viewId: string) => void
  onSelect: (viewId: string) => void
  onSave: (viewId: string) => Promise<void>
  onResetWorkingView?: () => void
}

const useBuildViewMenuItems = ({
  viewsList,
  workingView,
  viewType,
  projectName,
  currentUser,
  useWorkingView,
  editingViewId,
  onSelect,
  onEdit,
  onSave,
  onResetWorkingView,
}: Props): ViewMenuItem[] => {
  const { powerLicense } = usePowerpack()

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

  const workingBaseView: ViewItem = {
    id: WORKING_VIEW_ID,
    label: useWorkingView ? 'Personal view' : 'Working view',
    startContent: useWorkingView && <Icon icon="person" />,
    isEditable: false,
  }

  // if we have a working view, we use it, otherwise we create one
  const handleWorkingViewChange = useCallback(async () => {
    let workingViewId = workingView?.id
    if (!workingView) {
      // no working view found, create one
      try {
        console.warn('No working view found, creating a new one')
        const workingView = generateWorkingView()
        await createView({
          payload: workingView,
          viewType: viewType as string,
          projectName: projectName,
        }).unwrap()
        // set id of the new view
        workingViewId = workingView.id
      } catch (error: any) {
        toast.error(`Failed to create working view: ${error}`)
      }
    }
    // select the working view
    onSelect(workingViewId as string)
  }, [workingView, viewType, createView, projectName, onSelect])

  const handleEditView = async (viewId: string) => {
    // save the view and then selected it
    try {
      await onSave(viewId)
      onSelect(viewId)
    } catch (error: any) {
      toast.error(error)
    }
  }

  const [getCustomViews, { isLoading: isLoadingQueries }] = useLoadModule({
    addon: 'powerpack',
    remote: 'views',
    module: 'getCustomViews',
    fallback: getCustomViewsFallback,
    // minVersion: minVersion,
    skip: !viewType || !powerLicense,
  })

  const { myViews, sharedViews } = useMemo(
    () =>
      getCustomViews({
        viewsList: extendedViewsList,
        onEdit,
        onSelect,
        onSave: handleEditView,
      }),
    [viewsList, onEdit, onSelect, handleEditView],
  )

  const dividers = myViews.length || sharedViews.length ? [VIEW_DIVIDER] : []

  const workingViewItem: ViewMenuItem = useMemo(
    () => ({
      ...workingBaseView,
      onClick: handleWorkingViewChange,
      // expose reset button when handler is provided
      isEditable: Boolean(onResetWorkingView),
      onResetView: onResetWorkingView,
    }),
    [handleWorkingViewChange, onResetWorkingView],
  )

  const viewItems: ViewMenuItem[] = useMemo(
    () => [workingViewItem, ...dividers, ...myViews, ...sharedViews, ...dividers],
    [workingView, myViews, sharedViews, workingViewItem],
  )

  return viewItems
}

export default useBuildViewMenuItems
