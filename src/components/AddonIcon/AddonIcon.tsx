import React, { useRef, useState } from 'react'
import * as Styled from './AddonIcon.styled'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'

interface AddonIconProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  isPlaceholder?: boolean
  size?: number
  icon?: string
}

const AddonIcon = ({ isPlaceholder, size, icon = 'extension', ...props }: AddonIconProps) => {
  const [imageLoading, setImageLoading] = useState(!!props.src)
  const [imageError, setImageError] = useState(false)
  const imgRef = useRef(null)

  const handleLoad = () => {
    if (!imgRef.current) setImageError(true)
    setImageLoading(false)
  }

  const isLoading = isPlaceholder || imageLoading
  return (
    <Styled.Icon className={clsx({ loading: isLoading, isError: imageError })} $size={size}>
      {imageError || !props.src ? (
        <Icon icon={icon} />
      ) : (
        <img {...props} onLoad={handleLoad} ref={imgRef} />
      )}
    </Styled.Icon>
  )
}

export default AddonIcon
