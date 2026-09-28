import type { ReactNode } from 'react'
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

  &.clickable img {
    cursor: zoom-in;
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

    .icon {
      animation: md-media-spin 1s linear infinite;
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
      ) : (
        <img src={src} alt={alt || ''} title={alt} onClick={onOpen} loading="lazy" />
      )}
      {uploading && (
        <span className="uploading">
          <Icon icon="progress_activity" />
          Uploading...
        </span>
      )}
    </StyledMedia>
  )
}

interface HastNode {
  type: string
  tagName?: string
  value?: string
  properties?: { src?: string; alt?: string; title?: string }
  children?: HastNode[]
}

/**
 * For react-markdown `p` components: a paragraph that is only an image (how the editor stores
 * image and video blocks) renders as the block. Returns null for any other paragraph.
 */
export const renderMediaParagraph = (
  props: { node?: HastNode },
  { onOpen }: { onOpen?: (src: string) => void } = {},
): ReactNode | null => {
  const children = (props.node?.children ?? []).filter(
    (child) => !(child.type === 'text' && !child.value?.trim()),
  )
  if (children.length !== 1) return null
  const [image] = children
  if (image.type !== 'element' || image.tagName !== 'img') return null
  const { src, alt, title } = image.properties ?? {}
  if (!src) return null
  return (
    <MediaBlock src={src} alt={alt} mime={title} onOpen={onOpen ? () => onOpen(src) : undefined} />
  )
}
