import { useState, useEffect } from 'react'
import axios from 'axios'
import styled from 'styled-components'

const ThumbnailStyled = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
  aspect-ratio: 1.77;
  overflow: hidden;
  border-radius: 3px;
  margin: auto;
  max-width: 250px;

  /* icon */
  span {
    position: absolute;
    font-size: 4rem;
    user-select: none;
    display: flex;
    justify-content: center;
    align-items: center;
    inset: 0;
    background-color: #161616;
  }
`

const ImageStyled = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;

  /* ensures it always fills the parent */
  display: block;
  position: absolute;
  inset: 0;
`

const parseThumbnail = (response) => {
  // Create base64 image from axios response
  if (response.status !== 200) {
    return null
  }

  const mime = response.headers['content-type']
  const base64 = btoa(
    new Uint8Array(response.data).reduce((data, byte) => data + String.fromCharCode(byte), ''),
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
    axios.get(url, { responseType: 'arraybuffer' }).then((response) => {
      setThumbData(parseThumbnail(response))
    })
  }, [url, entityId])

  return (
    <ThumbnailStyled>
      {thumbData ? (
        <ImageStyled alt={`Entity thumbnail ${entityId}`} src={thumbData} />
      ) : (
        <span className="material-symbols-outlined">image</span>
      )}
    </ThumbnailStyled>
  )
}

export default Thumbnail
