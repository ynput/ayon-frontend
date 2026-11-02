import type { ReactNode } from 'react'
import { parseYouTubeUrl } from './parseYouTubeUrl'
import { YouTubeEmbed } from './YouTubeEmbed'

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
