import { FC } from 'react'
import { useViewsContext } from '../context/ViewsContext'
import { useLoadModule } from '@shared/hooks'
import ViewFormDialogFallback from './ViewFormDialogFallback'
import { Dialog } from '@ynput/ayon-react-components'

export const VIEWS_DIALOG_CLASS = 'views-dialog' as const

interface ViewsDialogContainerProps {}

const ViewsDialogContainer: FC<ViewsDialogContainerProps> = ({}) => {
  const {
    editingView,
    editingViewData,
    setEditingView,
    viewType,
    projectName,
    currentUser,
    viewSettings,
    setSelectedView,
    onCreateView,
    onUpdateView,
    onDeleteView,
    api,
    dispatch,
  } = useViewsContext()

  const [ViewFormDialog, { isLoading: isLoadingQueries, outdated }] = useLoadModule({
    addon: 'powerpack',
    remote: 'views',
    module: 'ViewFormDialog',
    fallback: ViewFormDialogFallback,
    minVersion: '1.1.1-views',
  })

  if (!viewType || !editingView) return null

  if (editingView && outdated) {
    return (
      <Dialog isOpen header="Powerpack Update Required" onClose={() => setEditingView(null)}>
        <p>
          The View Form Dialog is outdated. Please update the Powerpack addon to the latest version.
        </p>
      </Dialog>
    )
  }

  return (
    <ViewFormDialog
      editingView={{
        viewId: editingView === true ? undefined : editingView,
        ...(editingViewData || {}),
      }}
      viewSettings={viewSettings}
      setEditingView={setEditingView}
      viewType={viewType}
      projectName={projectName}
      setSelected={setSelectedView}
      onCreateView={onCreateView}
      onUpdateView={onUpdateView}
      onDeleteView={onDeleteView}
      api={api}
      dispatch={dispatch}
      currentUser={currentUser}
      pt={{
        dialog: {
          className: VIEWS_DIALOG_CLASS,
        },
      }}
    />
  )
}

export default ViewsDialogContainer
