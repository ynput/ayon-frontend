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
import { YouTubeEmbed } from '../youtube/YouTubeEmbed'
import { getYouTubeEmbedUrl, parseYouTubeUrl } from '../youtube/parseYouTubeUrl'

export type SerializedYouTubeNode = Spread<{ url: string }, SerializedDecoratorBlockNode>

/**
 * An embedded YouTube video. Stored in markdown as the video url on its own line, which the
 * comment renderer shows as the player (and anything else as a link).
 */
export class YouTubeNode extends DecoratorBlockNode {
  // the url as written, so its start time etc. survive saving
  __url: string

  static getType(): string {
    return 'youtube'
  }

  static clone(node: YouTubeNode): YouTubeNode {
    return new YouTubeNode(node.__url, node.__format, node.__key)
  }

  static importJSON(serializedNode: SerializedYouTubeNode): YouTubeNode {
    return $createYouTubeNode(serializedNode.url).updateFromJSON(serializedNode)
  }

  constructor(url: string, format?: ElementFormatType, key?: NodeKey) {
    super(format, key)
    this.__url = url
  }

  exportJSON(): SerializedYouTubeNode {
    return { ...super.exportJSON(), url: this.__url }
  }

  exportDOM(): DOMExportOutput {
    const video = parseYouTubeUrl(this.__url)
    if (!video) return { element: document.createTextNode(this.__url) as unknown as HTMLElement }
    const element = document.createElement('iframe')
    element.setAttribute('data-lexical-youtube', this.__url)
    element.setAttribute('src', getYouTubeEmbedUrl(video))
    element.setAttribute('width', '560')
    element.setAttribute('height', '315')
    element.setAttribute('allowfullscreen', 'true')
    return { element }
  }

  static importDOM(): DOMConversionMap | null {
    return {
      iframe: (domNode: HTMLElement) => {
        const url = domNode.getAttribute('data-lexical-youtube') || domNode.getAttribute('src')
        if (!url || !parseYouTubeUrl(url)) return null
        return { conversion: () => ({ node: $createYouTubeNode(url) }), priority: 1 }
      },
    }
  }

  updateDOM(): false {
    return false
  }

  getUrl(): string {
    return this.getLatest().__url
  }

  getTextContent(): string {
    return this.__url
  }

  decorate(_editor: LexicalEditor, config: EditorConfig): JSX.Element {
    const video = parseYouTubeUrl(this.__url)
    const theme = config.theme.embedBlock || {}
    return (
      <BlockWithAlignableContents
        className={{ base: theme.base || '', focus: theme.focus || '' }}
        format={this.__format}
        nodeKey={this.getKey()}
      >
        {video ? <YouTubeEmbed video={video} /> : <span>{this.__url}</span>}
      </BlockWithAlignableContents>
    )
  }
}

export const $createYouTubeNode = (url: string): YouTubeNode =>
  $applyNodeReplacement(new YouTubeNode(url.trim()))

export const $isYouTubeNode = (node: LexicalNode | null | undefined): node is YouTubeNode =>
  node instanceof YouTubeNode
