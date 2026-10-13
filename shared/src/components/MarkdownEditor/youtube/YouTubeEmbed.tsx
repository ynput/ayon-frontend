import styled from 'styled-components'
import { getYouTubeEmbedUrl, type YouTubeVideo } from './parseYouTubeUrl'

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
