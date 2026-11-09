import React from 'react'
import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'
import { getEntityFilmstripUrl, getEntityThumbnailUrl } from '@shared/util'
import { Filmstrip } from '../Filmstrip'

export interface ThumbnailSimpleProps extends React.HTMLAttributes<HTMLDivElement> {
  projectName: string
  entityType: string
  entityId: string
  icon?: string
  thumbnailHash?: string
  isLoading?: boolean
  disabled?: boolean
  src?: string
  onLoad?: React.ReactEventHandler<HTMLImageElement>
  onError?: React.ReactEventHandler<HTMLImageElement>
  iconOnly?: boolean
  /** show a hover-scrub filmstrip (the entity should have reviewables) */
  filmstrip?: boolean
  /** filmstrip url override, when the entity props are not available */
  filmstripUrl?: string | null
  /** should match object-fit of the image */
  filmstripFit?: 'cover' | 'contain'
}

const ThumbnailStyled = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
  aspect-ratio: 1.77;
  overflow: hidden;
  margin: auto;
  max-width: 250px;
  background-color: var(--md-sys-color-surface-container-lowest);

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
  }

  /* the hover-scrub filmstrip replaces the static image */
  &[data-filmstrip-active] > img,
  &[data-filmstrip-active] > span {
    visibility: hidden;
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

export const ThumbnailSimple: React.FC<ThumbnailSimpleProps> = ({
  projectName,
  entityType,
  entityId,
  icon,
  thumbnailHash,
  isLoading,
  className,
  disabled,
  src,
  onLoad,
  onError,
  iconOnly,
  filmstrip,
  filmstripUrl,
  filmstripFit = 'contain',
  ...props
}) => {
  const url = getEntityThumbnailUrl({
    projectName,
    entityType,
    entityId,
    thumbnailHash: thumbnailHash ? String(thumbnailHash) : undefined,
  })
  const isProject = entityType === 'project'
  const isWrongEntity = ['product'].includes(entityType)
  const hasIdentity = isProject ? !!projectName : !!entityId

  return (
    <ThumbnailStyled className={className + ' thumbnail'} {...props}>
      {!isLoading && !disabled && <Icon icon={icon || 'image'} />}
      {((entityType && !isWrongEntity && hasIdentity) || src) && !iconOnly && (
        <ImageStyled
          alt={`Entity thumbnail ${entityId || projectName}`}
          src={src || url || undefined}
          onLoad={onLoad}
          onError={onError}
        />
      )}
      {(filmstrip || filmstripUrl) && !isLoading && !disabled && (
        <Filmstrip
          src={
            filmstripUrl ||
            getEntityFilmstripUrl({ projectName, entityType, entityId, thumbnailHash })
          }
          fit={filmstripFit}
        />
      )}
    </ThumbnailStyled>
  )
}
