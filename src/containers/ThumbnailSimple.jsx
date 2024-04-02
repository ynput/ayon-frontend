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
  background-color: var(--md-sys-color-surface-container-lowest);
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
  ...props
}) => {
  const url = `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail`
  const queryArgs = `?updatedAt=${entityUpdatedAt}&token=${localStorage.getItem('accessToken')}`
  const isWrongEntity = ['product'].includes(entityType)

  return (
    <ThumbnailStyled className={className + ' thumbnail'} {...props}>
      {!isLoading && !disabled && <Icon icon={icon || 'image'} />}
      {((entityType && !(isWrongEntity || !entityId)) || src) && (
        <ImageStyled alt={`Entity thumbnail ${entityId}`} src={src || `${url}${queryArgs}`} />
      )}
    </ThumbnailStyled>
  )
}

export default ThumbnailSimple
