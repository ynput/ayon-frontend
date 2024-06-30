import { toast } from 'react-toastify'
import { useGetEntityQuery } from '@queries/entity/getEntity'
import { Dialog } from '@ynput/ayon-react-components'

const DetailsDialog = ({ projectName, entityType, entityIds, visible, onHide }) => {
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

export default DetailsDialog
