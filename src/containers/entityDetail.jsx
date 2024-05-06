import { toast } from 'react-toastify'
import { useGetEntityQuery } from '../services/entity/getEntity'
import { Dialog } from 'primereact/dialog'

const EntityDetail = ({ projectName, entityType, entityIds, visible, onHide }) => {
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
      visible={true}
      onHide={onHide}
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

export default EntityDetail
