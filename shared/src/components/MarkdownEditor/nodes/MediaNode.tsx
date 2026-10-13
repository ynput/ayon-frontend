import type { JSX } from 'react'
import { BlockWithAlignableContents } from '@lexical/react/LexicalBlockWithAlignableContents'
import {
  DecoratorBlockNode,
  type SerializedDecoratorBlockNode,
} from '@lexical/react/LexicalDecoratorBlockNode'
import {
  $applyNodeReplacement,
  type DOMConversionMap,
  type DOMExportOutput,
  type EditorConfig,
  type ElementFormatType,
  type LexicalEditor,
  type LexicalNode,
  type NodeKey,
  type Spread,
} from 'lexical'
import { MediaBlock } from '../media/MediaBlock'
import { getMediaKind, getProjectFileId } from '../media/mediaUtils'

export interface MediaPayload {
  src: string
  alt?: string
  mime?: string | null
  // shown with a local preview until the upload finishes
  uploading?: boolean
}

export type SerializedMediaNode = Spread<
  { src: string; alt: string; mime: string | null },
  SerializedDecoratorBlockNode
>

/**
 * An image or video block. Stored in markdown as an image on its own line with the mime type as
 * its title: `![clip.mp4](/api/projects/p/files/id "video/mp4")`.
 */
export class MediaNode extends DecoratorBlockNode {
  __src: string
  __alt: string
  __mime: string | null
  __uploading: boolean

  static getType(): string {
    return 'media'
  }

  static clone(node: MediaNode): MediaNode {
    return new MediaNode(
      { src: node.__src, alt: node.__alt, mime: node.__mime, uploading: node.__uploading },
      node.__format,
      node.__key,
    )
  }

  static importJSON(serializedNode: SerializedMediaNode): MediaNode {
    return $createMediaNode({
      src: serializedNode.src,
      alt: serializedNode.alt,
      mime: serializedNode.mime,
    }).updateFromJSON(serializedNode)
  }

  constructor(payload: MediaPayload, format?: ElementFormatType, key?: NodeKey) {
    super(format, key)
    this.__src = payload.src
    this.__alt = payload.alt || ''
    this.__mime = payload.mime || null
    this.__uploading = !!payload.uploading
  }

  exportJSON(): SerializedMediaNode {
    return { ...super.exportJSON(), src: this.__src, alt: this.__alt, mime: this.__mime }
  }

  exportDOM(): DOMExportOutput {
    const isVideo = getMediaKind(this.__mime, this.__alt, this.__src) === 'video'
    const element = document.createElement(isVideo ? 'video' : 'img')
    element.setAttribute('src', this.__src)
    element.setAttribute(isVideo ? 'title' : 'alt', this.__alt)
    if (this.__mime) element.setAttribute('data-mime', this.__mime)
    return { element }
  }

  static importDOM(): DOMConversionMap | null {
    // only project files (e.g. copied from a comment), not images hotlinked from pasted web pages
    const convert = (domNode: HTMLElement) => {
      const src = domNode.getAttribute('src')
      if (!src || !getProjectFileId(src)) return null
      const alt = domNode.getAttribute('alt') || domNode.getAttribute('title') || ''
      const mime = domNode.getAttribute('data-mime')
      return { node: $createMediaNode({ src, alt, mime }) }
    }
    return {
      img: () => ({ conversion: convert, priority: 1 }),
      video: () => ({ conversion: convert, priority: 1 }),
    }
  }

  updateDOM(): false {
    return false
  }

  getSrc(): string {
    return this.getLatest().__src
  }

  getAlt(): string {
    return this.getLatest().__alt
  }

  getMime(): string | null {
    return this.getLatest().__mime
  }

  isUploading(): boolean {
    return this.getLatest().__uploading
  }

  // the upload finished, swap the local preview for the stored file
  setUploaded(src: string, { alt, mime }: { alt?: string; mime?: string | null } = {}): this {
    const writable = this.getWritable()
    writable.__src = src
    writable.__uploading = false
    if (alt) writable.__alt = alt
    if (mime) writable.__mime = mime
    return writable
  }

  getTextContent(): string {
    return this.__alt
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const theme = config.theme.embedBlock || {}
    return (
      <BlockWithAlignableContents
        className={{ base: theme.base || '', focus: theme.focus || '' }}
        format={this.__format}
        nodeKey={this.getKey()}
      >
        <MediaBlock
          src={this.__src}
          alt={this.__alt}
          mime={this.__mime}
          uploading={this.__uploading}
        />
      </BlockWithAlignableContents>
    )
  }
}

export const $createMediaNode = (payload: MediaPayload): MediaNode =>
  $applyNodeReplacement(new MediaNode(payload))

export const $isMediaNode = (node: LexicalNode | null | undefined): node is MediaNode =>
  node instanceof MediaNode
