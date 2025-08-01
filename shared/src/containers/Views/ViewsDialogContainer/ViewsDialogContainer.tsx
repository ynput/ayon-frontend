import { FC } from 'react'
import { useViewsContext } from '../context/ViewsContext'
import { useLoadModule } from '@shared/hooks'
import ViewFormDialogFallback from './ViewFormDialogFallback'
import { Dialog } from '@ynput/ayon-react-components'
import { useCreateViewMutation, useDeleteViewMutation } from '@shared/api'

interface ViewsDialogContainerProps {}

const ViewsDialogContainer: FC<ViewsDialogContainerProps> = ({}) => {
  const { editingView, editingViewData, setEditingView, viewType, projectName } = useViewsContext()

  const [ViewFormDialog, { isLoading: isLoadingQueries, outdated }] = useLoadModule({
    addon: 'powerpack',
    remote: 'views',
    module: 'ViewFormDialog',
    fallback: ViewFormDialogFallback,
    minVersion: '1.1.1-views',
  })

  // forward mutations to the dialog
  const [createView] = useCreateViewMutation()
  const [deleteView] = useDeleteViewMutation()

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
      setEditingView={setEditingView}
      viewType={viewType}
      projectName={projectName}
      createView={createView}
      deleteView={deleteView}
    />
  )
}

export default ViewsDialogContainer
