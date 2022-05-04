import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faImage } from '@fortawesome/free-solid-svg-icons'
import axios from 'axios'

const Thumbnail = ({ projectName, entityType, entityId }) => {
  const [base64, setBase64] = useState(null)
  const url = `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail`

  useEffect(() => {
    axios
      .get(url, { responseType: 'arraybuffer' })
      .then((response) =>
        setBase64(btoa(String.fromCharCode(...new Uint8Array(response.data))))
      )
  }, [url])

  if (!base64) {
    return <div
      style={{
        width: '100%',
        height: 'auto',
        aspectRatio: '1.77',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#161616',
        fontSize: '2em',
      }}
    >
      <FontAwesomeIcon icon={faImage} className="color-ternary" />
    </div>
  }

  return (
    <img
      alt={`Entity thumbnail ${entityId}`}
      src={`data:image/png;charset=utf-8;base64,${base64}`}
    />
  ) 
}

export default Thumbnail
