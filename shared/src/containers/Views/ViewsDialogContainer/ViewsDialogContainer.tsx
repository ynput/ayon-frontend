import { FC } from 'react'
import { useViewsContext } from '../context/ViewsContext'
import { useLoadModule } from '@shared/hooks'
import ViewFormDialogFallback from './ViewFormDialogFallback'
import { Dialog } from '@ynput/ayon-react-components'

interface ViewsDialogContainerProps {}

const ViewsDialogContainer: FC<ViewsDialogContainerProps> = ({}) => {
  const { editingView, setEditingView, viewType, projectName } = useViewsContext()

  const [ViewFormDialog, { isLoading: isLoadingQueries, outdated }] = useLoadModule({
    addon: 'powerpack',
    remote: 'views',
    module: 'ViewFormDialog',
    fallback: ViewFormDialogFallback,
    minVersion: '1.1.1-views',
  })

  if (!viewType) return null

  if (editingView && outdated) {
    ;<Dialog isOpen header="Powerpack Update Required" onClose={() => setEditingView(null)}>
      <p>
        The View Form Dialog is outdated. Please update the Powerpack addon to the latest version.
      </p>
    </Dialog>
  }

  return (
    <ViewFormDialog
      editingView={editingView}
      setEditingView={setEditingView}
      viewType={viewType}
      projectName={projectName}
    />
  )
}

export default ViewsDialogContainer
