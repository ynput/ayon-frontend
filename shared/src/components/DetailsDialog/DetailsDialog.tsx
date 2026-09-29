import { toast } from 'react-toastify'
import { useGetEntityQuery } from '@shared/api'
import { Dialog } from '@ynput/ayon-react-components'
import { JsonViewer } from '@shared/components/JsonViewer'

export interface DetailsDialogProps {
  projectName?: string
  entityType: string
  entityIds: string[]
  visible: boolean
  onHide: () => void
}

export const DetailsDialog = ({
  projectName,
  entityType,
  entityIds,
  visible,
  onHide,
}: DetailsDialogProps) => {
  const {
    data = {},
    isLoading,
    isError,
    error,
  } = useGetEntityQuery(
    { projectName, entityType: entityType, entityId: entityIds?.[0] },
    { skip: !visible },
  )

  // Show error toast if the query errored
  if (isError) {
    toast.error(`Unable to load detail. ${error}`)
  }

  // Keep the early return after hooks to ensure hooks are called on every render in the same order
  if (!visible || (Array.isArray(data) ? data.length < 1 : false)) return null

  return (
    <Dialog
      isOpen={true}
      onClose={onHide}
      size="lg"
      style={{ width: '50vw' }}
      header={`${entityType} detail`}
    >
      {isLoading || isError ? (
        <pre>{isLoading ? 'loading...' : 'error...'}</pre>
      ) : (
        <JsonViewer value={data} />
      )}
    </Dialog>
  )
}