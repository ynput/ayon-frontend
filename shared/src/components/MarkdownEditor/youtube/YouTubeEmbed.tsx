import type { ReactNode } from 'react'
import styled from 'styled-components'
import { getYouTubeEmbedUrl, parseYouTubeUrl, type YouTubeVideo } from './parseYouTubeUrl'

const StyledEmbed = styled.div`
  width: 100%;
  max-width: 560px;
  aspect-ratio: 16 / 9;
  border-radius: var(--border-radius-m);
  overflow: hidden;
  background-color: var(--md-sys-color-surface-container-lowest);

  iframe {
    display: block;
    width: 100%;
    height: 100%;
    border: none;
  }
`

interface YouTubeEmbedProps {
  video: YouTubeVideo
  className?: string
}

// A YouTube player, used by the editor and the comment renderer
export const YouTubeEmbed = ({ video, className }: YouTubeEmbedProps) => (
  <StyledEmbed className={className ? `youtube-embed ${className}` : 'youtube-embed'}>
    <iframe
      src={getYouTubeEmbedUrl(video)}
      title="YouTube video"
      allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      loading="lazy"
    />
  </StyledEmbed>
)

interface HastNode {
  type: string
  tagName?: string
  value?: string
  properties?: { href?: string }
  children?: HastNode[]
}

/**
 * For react-markdown `p` components: a paragraph that is only a YouTube link (how the editor
 * stores videos) renders as the player. Returns null for any other paragraph.
 */
export const renderYouTubeParagraph = (props: { node?: HastNode }): ReactNode | null => {
  const children = (props.node?.children ?? []).filter(
    (child) => !(child.type === 'text' && !child.value?.trim()),
  )
  if (children.length !== 1) return null
  const [link] = children
  if (link.type !== 'element' || link.tagName !== 'a') return null
  const href = link.properties?.href
  const text = link.children?.map((child) => child.value ?? '').join('')
  // only bare urls, a link with its own text stays a link
  if (!href || text?.trim() !== href) return null
  const video = parseYouTubeUrl(href)
  if (!video) return null
  return <YouTubeEmbed video={video} />
}
