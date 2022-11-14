import { useState, useEffect } from 'react'
import axios from 'axios'

const parseThumbnail = (response) => {
  // Create base64 image from axios response
  if (response.status !== 200) {
    return null
  }

  const mime = response.headers['content-type']
  const base64 = btoa(
    new Uint8Array(response.data).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    )
  )
  return `data:${mime};base64,${base64}`
}

const Thumbnail = ({ projectName, entityType, entityId }) => {
  const [thumbData, setThumbData] = useState(null)
  const url = `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail`


  useEffect(() => {
    if (!entityId) {
      setThumbData(null)
      return
    }
    axios
      .get(url, { responseType: 'arraybuffer' })
      .then((response) => {
        setThumbData(parseThumbnail(response))
      })
  }, [url, entityId])

  if (!thumbData) {
    return (
      <div className="thumbnail placeholder">
        <span className="material-symbols-outlined">image</span>
      </div>
    )
  }

  return (
    <div className="thumbnail">
      <img
        alt={`Entity thumbnail ${entityId}`}
        src={thumbData}
      />
    </div>
  )
}

export default Thumbnail
