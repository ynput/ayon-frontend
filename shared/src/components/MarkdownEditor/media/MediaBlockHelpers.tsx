import type { ReactNode } from 'react'
import { MediaBlock } from './MediaBlock'

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
