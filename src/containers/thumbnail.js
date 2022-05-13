import { useState, useEffect } from 'react'
import axios from 'axios'

const Thumbnail = ({ projectName, entityType, entityId }) => {
  const [base64, setBase64] = useState(null)
  const url = `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail`

  useEffect(() => {
    if (!entityId) {
      setBase64(null)
      return
    }
    axios
      .get(url, { responseType: 'arraybuffer' })
      .then((response) =>
        setBase64(btoa(String.fromCharCode(...new Uint8Array(response.data))))
      )
  }, [url, entityId])

  if (!base64) {
    return (
      <div className="thumbnail placeholder">
        <span className="color-ternary material-symbols-outlined">image</span>
      </div>
    )
  }

  return (
    <img
      alt={`Entity thumbnail ${entityId}`}
      src={`data:image/png;charset=utf-8;base64,${base64}`}
    />
  )
}

export default Thumbnail
