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
  let url = ''
  if (entityType && entityId && entityUpdatedAt) {
    url =
      src || (projectName && `/api/projects/${projectName}/${entityType}s/${entityId}/thumbnail`)
    const queryArgs = `?updatedAt=${entityUpdatedAt}`
    url += queryArgs
  }
  const isWrongEntity = ['product'].includes(entityType)

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
      {entityType && projectName && !(isWrongEntity || !entityId) && (
        <Styled.Image alt={`Entity thumbnail ${entityId}`} src={url} />
      )}
      {hoverIcon && <Icon icon={hoverIcon} className="hover-icon" />}
    </Styled.Card>
  )
}
