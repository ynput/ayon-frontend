import { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import getShimmerStyles from '../styles/getShimmerStyles'

const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`

const ThumbnailStyled = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
  aspect-ratio: 1.77;
  overflow: hidden;
  border-radius: 3px;
  margin: auto;
  max-width: 250px;
  background-color: #161616;
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

    opacity: 0;
    /* delay being seen by 1s */
    animation: ${fadeIn} 0.1s 0.3s forwards;
  }

  ${({ $shimmer }) => $shimmer && getShimmerStyles()}
`

const ImageStyled = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;

  /* ensures it always fills the parent */
  display: block;
  position: absolute;
  inset: 0;
  background-color: #161616;
`

const ImagePlaceholder = () => <span className="material-symbols-outlined">image</span>

const Thumbnail = ({
  projectName,
  entityType,
  entityId,
  style,
  entityUpdatedAt,
  isLoading,
  shimmer,
  className,
  disabled,
}) => {
  // Display image only when loaded to avoid flickering and displaying,
  // ugly border around the image (when it's not loaded yet)
  const [thumbLoaded, setThumbLoaded] = useState(false)

  const url = `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail`
  const queryArgs = `?updatedAt=${entityUpdatedAt}&token=${localStorage.getItem('accessToken')}`
  const isWrongEntity = ['task', 'product'].includes(entityType)

  return (
    <ThumbnailStyled style={style} className={className} $shimmer={isLoading && shimmer}>
      {(!isLoading || !thumbLoaded) && !disabled && <ImagePlaceholder />}
      {entityType && !(isWrongEntity || !entityId) && (
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
