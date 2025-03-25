import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'

const ThumbnailStyled = styled.div`
  position: relative;
  width: 100%;
  max-width: 500px;
  aspect-ratio: 1.77;
  overflow: hidden;
  border-radius: 3px;
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

const ThumbnailSimple = ({
  projectName,
  entityType,
  entityId,
  icon,
  entityUpdatedAt,
  isLoading,
  className,
  disabled,
  src,
  onLoad,
  onError,
  iconOnly,
  ...props
}) => {
  const url = projectName && `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail`
  const queryArgs = `?updatedAt=${entityUpdatedAt}`
  const isWrongEntity = ['product'].includes(entityType)

  return (
    <ThumbnailStyled className={className + ' thumbnail'} {...props}>
      {!isLoading && !disabled && <Icon icon={icon || 'image'} />}
      {((entityType && !(isWrongEntity || !entityId)) || src) && !iconOnly && (
        <ImageStyled
          alt={`Entity thumbnail ${entityId}`}
          src={src || `${url}${queryArgs}`}
          onLoad={onLoad}
          onError={onError}
        />
      )}
    </ThumbnailStyled>
  )
}

export default ThumbnailSimple
