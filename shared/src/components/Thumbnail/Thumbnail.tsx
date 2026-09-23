import { HTMLAttributes, useEffect, useState } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import * as Styled from './Thumbnail.styled'
import { getEntityThumbnailUrl } from '@shared/util'

export interface ThumbnailProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  projectName?: string
  entityType?: string
  entityId?: string
  icon?: string | null
  color?: string | null
  thumbnailHash?: string
  isLoading?: boolean
  shimmer?: boolean
  className?: string
  disabled?: boolean
  src?: string
  hoverIcon?: string
  showBorder?: boolean
}

export const Thumbnail = ({
  projectName = '',
  entityType = '',
  entityId = '',
  icon,
  color,
  thumbnailHash,
  isLoading,
  shimmer,
  className,
  disabled,
  src,
  hoverIcon,
  showBorder = true,
  ...props
}: ThumbnailProps) => {
  const isProject = entityType === 'project'
  const isWrongEntity = ['product'].includes(entityType)
  const hasIdentity = isProject ? !!projectName : !!entityId

  let url = ''
  if (entityType && (thumbnailHash || isProject) && hasIdentity) {
    if (src) {
      url = src
    } else {
      url = getEntityThumbnailUrl({ projectName, entityType, entityId, thumbnailHash }) ?? ''
    }
  }

  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (url === '') {
      setLoaded(true)
      setError(true)
      return
    }

    setLoaded(false)
    setError(false)
  }, [url])

  return (
    <Styled.Card
      className={clsx(className, 'thumbnail', {
        loading: shimmer && (isLoading || !loaded),
        loaded,
        error,
        clickable: !!props.onClick,
        border: showBorder,
      })}
      {...props}
    >
      {(!isLoading || !loaded) && !disabled && (
        <Icon style={{ color: color || undefined }} icon={icon || 'image'} className="type-icon" />
      )}
      {entityType && projectName && !isWrongEntity && hasIdentity && (
        <Styled.Image
          alt={`Entity thumbnail ${entityId || projectName}`}
          src={url}
          onLoad={() => {
            setLoaded(true)
            setError(false)
          }}
          onError={() => {
            setLoaded(true)
            setError(true)
          }}
        />
      )}
      {hoverIcon && <Icon icon={hoverIcon} className="hover-icon" />}
    </Styled.Card>
  )
}
