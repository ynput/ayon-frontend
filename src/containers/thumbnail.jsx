import { useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import getShimmerStyles from '../styles/getShimmerStyles'
import { Icon } from '@ynput/ayon-react-components'
import ThumbnailUploader from '../components/ThumbnailUploader/ThumbnailUploader'
import { createPortal } from 'react-dom'

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
  background-color: hsl(220 20% 8%);
  /* icon */
  span {
    position: absolute;
    font-size: 4rem;
    user-select: none;
    display: flex;
    justify-content: center;
    align-items: center;
    inset: 0;
    background-color: hsl(220 20% 8%);
    color: var(--md-sys-color-outline);

    opacity: 0;
    /* delay being seen by 0.3s */
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
  background-color: var(--md-sys-color-surface-container-lowest);
`

const Thumbnail = ({
  projectName,
  entityType,
  entityId,
  icon,
  style,
  entityUpdatedAt,
  isLoading,
  shimmer,
  className,
  disabled,
  src,
  uploadEntities,
  isStacked,
  onUpload,
  portalId,
  disableUpload,
  isUploadButton,
  ...props
}) => {
  // Display image only when loaded to avoid flickering and displaying,
  // ugly border around the image (when it's not loaded yet)
  const [thumbLoaded, setThumbLoaded] = useState(false)

  const url = `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail`
  const queryArgs = `?updatedAt=${entityUpdatedAt}`
  const isWrongEntity = ['product'].includes(entityType)
  const portalEl = document.getElementById(portalId)

  const [showPortal, setShowPortal] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  // if portalEl is true, attach an event listener for drag events
  useEffect(() => {
    if (!portalEl) return

    const handleDragOver = (e) => {
      e.preventDefault()
      e.stopPropagation()
      setShowPortal(true)
    }
    const handleDragLeave = (e) => {
      e.preventDefault()
      e.stopPropagation()
      setShowPortal(false)
    }

    portalEl.addEventListener('dragover', handleDragOver)
    portalEl.addEventListener('dragleave', handleDragLeave)

    return () => {
      portalEl.removeEventListener('dragover', handleDragOver)
      portalEl.removeEventListener('dragleave', handleDragLeave)
    }
  }, [portalEl])

  const thumbnailProps = {
    entities: uploadEntities,
    entityType,
    entityId,
    projectName,
    key: entityId,
    existingImage: thumbLoaded,
    onUpload: onUpload,
    portalId,
  }

  return (
    <ThumbnailStyled
      style={style}
      className={className + ' thumbnail'}
      $shimmer={isLoading && shimmer}
      {...props}
    >
      {(!isLoading || !thumbLoaded) && !disabled && <Icon icon={icon || 'image'} />}
      {((entityType && !(isWrongEntity || !entityId)) || src) && (
        <ImageStyled
          alt={`Entity thumbnail ${entityId}`}
          src={src || `${url}${queryArgs}`}
          style={{ display: thumbLoaded ? 'block' : 'none' }}
          onError={() => setThumbLoaded(false)}
          onLoad={() => setThumbLoaded(true)}
        />
      )}
      {entityType && entityId && !isStacked && projectName && !disableUpload && (
        <>
          <ThumbnailUploader {...thumbnailProps} isButton={isUploadButton} />
          {portalEl &&
            (showPortal || isUploading) &&
            createPortal(
              <ThumbnailUploader
                {...thumbnailProps}
                isPortal={true}
                onUpload={(v) => {
                  setIsUploading(false)

                  onUpload && onUpload(v)

                  setTimeout(() => {
                    setShowPortal(false)
                  }, 800)
                }}
                onUploading={() => setIsUploading(true)}
              />,
              portalEl,
            )}
        </>
      )}
    </ThumbnailStyled>
  )
}

export default Thumbnail
