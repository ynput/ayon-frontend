import { getMimeTypeIcon, Icon } from '@ynput/ayon-react-components'
import { FC, HTMLAttributes, ImgHTMLAttributes, useEffect, useState } from 'react'
import styled, { keyframes } from 'styled-components'
import clsx from 'clsx'

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`

const Wrapper = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;

  overflow: hidden;

  background-color: var(--md-sys-color-surface-container-low);
`

const LoadingIcon = styled(Icon)`
  animation: ${spin} 1s linear infinite;
  opacity: 0.6;
`

const Image = styled.img`
  position: absolute;
  inset: 0;
  object-fit: cover;
  background-color: var(--md-sys-color-surface-container-low);

  width: 100%;
  height: 100%;

  &.hidden {
    opacity: 0;
  }
`

export interface FileThumbnailProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onError' | 'onLoad'> {
  src: string
  mimetype?: string
  imgProps?: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError' | 'onLoad'>
}

export const FileThumbnail: FC<FileThumbnailProps> = ({ mimetype = '', src, ...props }) => {
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // reset loaded state when src changes
    setLoaded(false)
    setError(false)
  }, [src])

  return (
    <Wrapper {...props} className={clsx('file-thumbnail', props.className)}>
      {!loaded ? (
        <LoadingIcon icon="progress_activity" />
      ) : (
        <Icon icon={getMimeTypeIcon(mimetype)} />
      )}
      <Image
        src={src}
        {...props}
        onError={() => {
          setLoaded(true)
          setError(true)
        }}
        onLoad={() => {
          setLoaded(true)
          setError(false)
        }}
        className={clsx({ hidden: !loaded || error })}
      />
    </Wrapper>
  )
}
