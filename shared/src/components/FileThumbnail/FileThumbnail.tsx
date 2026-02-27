import { getMimeTypeIcon, Icon } from '@ynput/ayon-react-components'
import { FC, HTMLAttributes, ImgHTMLAttributes, useEffect, useState, useRef } from 'react'
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
  const imageRef = useRef<HTMLImageElement | null>(null)
  const loadAttemptRef = useRef(0)

  // Robust loading effect: attempt to detect when the image is actually ready.
  // Uses `decode()` when available, falls back to `complete` + `naturalWidth` checks,
  // adds RAF + polling and a watchdog timeout to avoid stuck states.
  useEffect(() => {
    const attemptId = loadAttemptRef.current + 1
    loadAttemptRef.current = attemptId

    // reset visible state for this attempt
    setLoaded(false)
    setError(false)

    const img = imageRef.current
    let resolved = false
    let frame = 0
    let interval = 0
    let timeout = 0

    const resolveOnce = (resolver: () => void) => {
      if (resolved || attemptId !== loadAttemptRef.current) return
      resolved = true
      cancelAnimationFrame(frame)
      window.clearInterval(interval)
      window.clearTimeout(timeout)
      resolver()
    }

    const checkComplete = () => {
      if (!img || attemptId !== loadAttemptRef.current) return
      if (img.complete && img.naturalWidth > 0) {
        resolveOnce(() => {
          setLoaded(true)
          setError(false)
        })
      }
    }

    const onLoad = () =>
      resolveOnce(() => {
        setLoaded(true)
        setError(false)
      })
    const onError = () =>
      resolveOnce(() => {
        // keep behavior: mark loaded so placeholder swaps to icon, and flag error
        setLoaded(true)
        setError(true)
      })

    if (img) {
      img.addEventListener('load', onLoad)
      img.addEventListener('error', onError)

      if (typeof img.decode === 'function') {
        img
          .decode()
          .then(() =>
            resolveOnce(() => {
              setLoaded(true)
              setError(false)
            }),
          )
          .catch(() => {
            checkComplete()
          })
      }
    }

    frame = requestAnimationFrame(checkComplete)
    interval = window.setInterval(checkComplete, 250)

    timeout = window.setTimeout(() => {
      // Force-resolve after a timeout to avoid infinite spinner states.
      resolveOnce(() => {
        if (img && img.naturalWidth > 0) {
          setLoaded(true)
          setError(false)
        } else {
          setLoaded(true)
        }
      })
    }, 10000)

    return () => {
      cancelAnimationFrame(frame)
      window.clearInterval(interval)
      window.clearTimeout(timeout)
      if (img) {
        img.removeEventListener('load', onLoad)
        img.removeEventListener('error', onError)
      }
    }
  }, [src])

  return (
    <Wrapper {...props} className={clsx('file-thumbnail', props.className)}>
      {!loaded ? (
        <LoadingIcon icon="progress_activity" />
      ) : (
        <Icon icon={getMimeTypeIcon(mimetype)} />
      )}
      <Image
        ref={imageRef}
        src={src}
        {...props}
        onError={(event) => {
          if (event.currentTarget === imageRef.current) {
            setLoaded(true)
            setError(true)
          }
        }}
        onLoad={(event) => {
          if (event.currentTarget === imageRef.current) {
            setLoaded(true)
            setError(false)
          }
        }}
        className={clsx({ hidden: !loaded || error })}
      />
    </Wrapper>
  )
}
