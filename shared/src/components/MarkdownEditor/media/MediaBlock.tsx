import clsx from 'clsx'
import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'
import { getMediaKind, getProjectFileId } from './mediaUtils'

const StyledMedia = styled.div`
  position: relative;
  display: inline-flex;
  max-width: 100%;
  border-radius: var(--border-radius-m);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-lowest);

  img,
  video {
    display: block;
    max-width: 100%;
    max-height: 400px;
    object-fit: contain;
  }

  .md-media-open {
    all: unset;
    display: block;
    cursor: zoom-in;
  }

  .md-media-open,
  .md-media-play {
    &:focus-visible {
      outline: 2px solid var(--md-sys-color-primary);
      outline-offset: -2px;
    }
  }

  .md-media-play {
    all: unset;
    position: relative;
    display: block;
    cursor: pointer;

    img {
      cursor: pointer;
    }
    .md-media-no-poster {
      display: block;
      width: 320px;
      max-width: 100%;
      aspect-ratio: 16 / 9;
    }
    .play-icon {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 48px;
      color: white;
      filter: drop-shadow(0 1px 4px rgba(0, 0, 0, 0.6));
    }
    &:hover .play-icon {
      transform: translate(-50%, -50%) scale(1.1);
    }
  }

  .uploading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background-color: rgba(0, 0, 0, 0.5);
    color: white;

    /* css spinner, not an icon (the icon font may not have one) */
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: md-media-spin 0.8s linear infinite;
    }
  }

  @keyframes md-media-spin {
    to {
      transform: rotate(360deg);
    }
  }
`

interface MediaBlockProps {
  src: string
  alt?: string
  mime?: string | null
  uploading?: boolean
  // e.g. open the attachment preview
  onOpen?: () => void
  className?: string
}

// An image or video block, used by the editor and the comment renderer
export const MediaBlock = ({ src, alt, mime, uploading, onOpen, className }: MediaBlockProps) => {
  const kind = getMediaKind(mime, alt, src)
  // project files have a generated thumbnail for videos
  const poster = kind === 'video' && getProjectFileId(src) ? `${src}/thumbnail` : undefined

  return (
    <StyledMedia
      className={clsx('md-media', `md-media-${kind}`, className, { clickable: !!onOpen })}
    >
      {kind === 'video' && onOpen ? (
        // opens the video player, like a video attachment
        <button type="button" className="md-media-play" onClick={onOpen} title={alt}>
          {poster ? <img src={poster} alt={alt || ''} /> : <span className="md-media-no-poster" />}
          <Icon icon="play_circle" className="play-icon" />
        </button>
      ) : kind === 'video' ? (
        <video src={src} poster={poster} controls preload="metadata" title={alt} />
      ) : onOpen ? (
        // opens the attachment preview
        <button type="button" className="md-media-open" onClick={onOpen} title={alt}>
          <img src={src} alt={alt || ''} loading="lazy" />
        </button>
      ) : (
        <img src={src} alt={alt || ''} title={alt} loading="lazy" />
      )}
      {uploading && (
        <span className="uploading">
          <span className="spinner" />
          Uploading...
        </span>
      )}
    </StyledMedia>
  )
}
