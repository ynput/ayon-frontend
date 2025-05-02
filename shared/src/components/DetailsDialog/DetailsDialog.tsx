import { toast } from 'react-toastify'
import { useGetEntityQuery } from '@shared/api'
import { Dialog } from '@ynput/ayon-react-components'

export interface DetailsDialogProps {
  projectName: string
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
    { projectName, entityType: entityType, entityId: entityIds[0] },
    { skip: !visible },
  )

  if (isLoading)
    if (isError) {
      toast.error(`Unable to load detail. ${error}`)
    }

  if (!visible || data.length < 1) return null

  return (
    <Dialog
      isOpen={true}
      onClose={onHide}
      size="lg"
      style={{ width: '50vw' }}
      header={`${entityType} detail`}
    >
      <pre>
        {!isLoading && !isError && JSON.stringify(data, null, 2)}
        {isLoading && 'loading...'}
        {isError && 'error...'}
      </pre>
    </Dialog>
  )
}
