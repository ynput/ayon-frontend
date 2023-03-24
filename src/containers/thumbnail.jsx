import { useState } from 'react'
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

const ImagePlaceholder = () => <span className="material-symbols-outlined">image</span>

const Thumbnail = ({ projectName, entityType, entityId, style, entityUpdatedAt }) => {
  // Display image only when loaded to avoid flickering and displaying,
  // ugly border around the image (when it's not loaded yet)
  const [thumbLoaded, setThumbLoaded] = useState(false)

  const url = `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail`
  const queryArgs = `?updatedAt=${entityUpdatedAt}&token=${localStorage.getItem('accessToken')}`
  const isWrongEntity = ['task', 'subset'].includes(entityType)

  return (
    <ThumbnailStyled style={style}>
      <ImagePlaceholder />
      {!(isWrongEntity || !entityId) && (
        <ImageStyled
          alt={`Entity thumbnail ${entityId}`}
          src={`${url}${queryArgs}`}
          style={{ display: thumbLoaded ? 'block' : 'none' }}
          onError={() => setThumbLoaded(false)}
          onLoad={() => setThumbLoaded(true)}
        />
      )}
    </ThumbnailStyled>
  )
}

export default Thumbnail
