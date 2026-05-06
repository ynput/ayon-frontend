import { HTMLAttributes, useEffect, useState } from 'react'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import * as Styled from './Thumbnail.styled'

export interface ThumbnailProps extends Omit<HTMLAttributes<HTMLDivElement>, 'color'> {
  projectName?: string
  entityType?: string
  entityId?: string
  icon?: string | null
  color?: string | null
  entityUpdatedAt?: string
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
  entityUpdatedAt,
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
  if (entityType && entityUpdatedAt && hasIdentity) {
    if (src) {
      url = src
    } else if (projectName) {
      url = isProject
        ? `/api/projects/${projectName}/thumbnail`
        : `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail`
    }
    if (url && !/[?&]updatedAt=/.test(url)) {
      url += (url.includes('?') ? '&' : '?') + `updatedAt=${entityUpdatedAt}`
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
    // Reset loaded and error states when src changes
    setLoaded(false)
    setError(false)
    const imageUrl = src || `${url}`

    // Function to fetch image and check status code
    const fetchImage = async () => {
      try {
        const response = await fetch(imageUrl, { cache: 'force-cache' })
        if (response.status === 200) {
          setLoaded(true)
        } else {
          throw new Error('Image not OK')
        }
      } catch (error) {
        setError(true) // Handle error (e.g., set error state)
        setLoaded(true)
      }
    }

    if (url) {
      fetchImage()
    }
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
        <Styled.Image alt={`Entity thumbnail ${entityId || projectName}`} src={url} />
      )}
      {hoverIcon && <Icon icon={hoverIcon} className="hover-icon" />}
    </Styled.Card>
  )
}
