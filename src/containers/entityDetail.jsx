import axios from 'axios'
import { useState, useEffect } from 'react'

import { Dialog } from 'primereact/dialog'

const EntityDetail = ({
  projectName,
  entityType,
  entityId,
  visible,
  onHide,
}) => {
  const [data, setData] = useState(null)

  useEffect(() => {
    if (!(entityId && entityType)) return

    axios
      .get(`/api/projects/${projectName}/${entityType}s/${entityId}`)
      .then((res) => setData(res.data))
      .catch((err) => {
        console.log(`unable to load ${entityType} ${entityId}`, err)
      })
      .finally(() => console.log('done'))
  }, [entityId, entityType, projectName])

  if (!(entityId && visible)) {
    return null
  }

  return (
    <Dialog visible={true} onHide={onHide} style={{ width: '50vw' }}>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </Dialog>
  )
}

export default EntityDetail
