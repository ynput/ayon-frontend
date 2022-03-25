import { useState, useEffect } from 'react'
import axios from 'axios'

const Thumbnail = ({projectName, entityType, entityId}) => {
  const [base64, setBase64] = useState()
  const url = `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail`

  useEffect(() => {
    console.log("loading thumbnail", entityId)
    axios.get(url, {responseType: 'arraybuffer'})
    .then((response) => 
      setBase64(btoa(String.fromCharCode(...new Uint8Array(response.data))))
    )
    .catch(err => console.log(err))
  }, [entityId])

  return base64 ? <img src={`data:image/png;charset=utf-8;base64,${base64}`} /> : <></>
}

export default Thumbnail
