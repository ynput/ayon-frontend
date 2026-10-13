import {
  $applyNodeReplacement,
  TextNode,
  type DOMConversionMap,
  type DOMConversionOutput,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedTextNode,
  type Spread,
} from 'lexical'
import { MENTION_REF_TYPES, getMentionTrigger } from '../types'

export type SerializedMentionNode = Spread<
  { mentionType: string; mentionId: string },
  SerializedTextNode
>

const stripTrigger = (text: string) => text.replace(/^@+/, '')

// Parse a mention value like `task:123` (optionally prefixed with `@` as used by the legacy editor)
export const parseMentionValue = (value: string | null | undefined) => {
  if (!value) return null
  const clean = value.replace(/^@/, '')
  const index = clean.indexOf(':')
  if (index < 1) return null
  const type = clean.slice(0, index)
  let id = clean.slice(index + 1)
  if (!id || !(MENTION_REF_TYPES as readonly string[]).includes(type)) return null
  try {
    id = decodeURIComponent(id)
  } catch {
    /* keep raw id */
  }
  return { type, id }
}

const convertMentionElement = (domNode: HTMLElement): DOMConversionOutput | null => {
  const value =
    domNode.getAttribute('data-mention-value') ||
    domNode.getAttribute('data-value') ||
    domNode.getAttribute('href')
  const parsed = parseMentionValue(value)
  if (!parsed) return null
  const label = stripTrigger(
    domNode.getAttribute('data-mention-label') || domNode.textContent?.trim() || '',
  )
  if (!label) return null
  return { node: $createMentionNode(parsed.type, parsed.id, label) }
}

/**
 * An inline reference to a user, team, task, version... rendered as `@label` and stored in
 * markdown as `[label](type:id)`. It is a token so it can only be selected and deleted as a whole.
 */
export class MentionNode extends TextNode {
  __mentionType: string
  __mentionId: string

  static getType(): string {
    return 'mention'
  }

  static clone(node: MentionNode): MentionNode {
    return new MentionNode(node.__mentionType, node.__mentionId, node.__text, node.__key)
  }

  static importJSON(serializedNode: SerializedMentionNode): MentionNode {
    return $createMentionNode(
      serializedNode.mentionType,
      serializedNode.mentionId,
      stripTrigger(serializedNode.text),
    ).updateFromJSON(serializedNode)
  }

  constructor(mentionType: string, mentionId: string, text: string, key?: NodeKey) {
    super(text, key)
    this.__mentionType = mentionType
    this.__mentionId = mentionId
  }

  exportJSON(): SerializedMentionNode {
    return {
      ...super.exportJSON(),
      mentionType: this.__mentionType,
      mentionId: this.__mentionId,
    }
  }

  getMentionType(): string {
    return this.getLatest().__mentionType
  }

  getMentionId(): string {
    return this.getLatest().__mentionId
  }

  // label without the @ trigger
  getLabel(): string {
    return stripTrigger(this.getTextContent())
  }

  getMentionValue(): string {
    return `${this.getMentionType()}:${this.getMentionId()}`
  }

  createDOM(config: EditorConfig): HTMLElement {
    const dom = super.createDOM(config)
    dom.classList.add('mention', `mention-${this.__mentionType}`)
    dom.setAttribute('data-mention-value', `${this.__mentionType}:${this.__mentionId}`)
    dom.setAttribute('data-mention-label', stripTrigger(this.__text))
    dom.spellcheck = false
    return dom
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement('a')
    element.setAttribute('href', `@${this.__mentionType}:${this.__mentionId}`)
    element.setAttribute('data-mention-value', `${this.__mentionType}:${this.__mentionId}`)
    element.setAttribute('data-mention-label', stripTrigger(this.__text))
    element.textContent = this.__text
    return { element }
  }

  static importDOM(): DOMConversionMap | null {
    const isMention = (domNode: HTMLElement) =>
      !!parseMentionValue(
        domNode.getAttribute('data-mention-value') ||
          domNode.getAttribute('data-value') ||
          domNode.getAttribute('href'),
      )
    const conversion = (domNode: HTMLElement) =>
      isMention(domNode) ? { conversion: convertMentionElement, priority: 2 as const } : null

    return {
      a: conversion,
      span: conversion,
      // the legacy quill editor wraps mentions in a <mention> tag
      mention: conversion,
    }
  }

  isTextEntity(): true {
    return true
  }

  canInsertTextBefore(): boolean {
    return false
  }

  canInsertTextAfter(): boolean {
    return false
  }
}

export const $createMentionNode = (type: string, id: string, label: string): MentionNode => {
  const node = new MentionNode(type, id, getMentionTrigger(type) + stripTrigger(label))
  node.setMode('token').toggleDirectionless()
  return $applyNodeReplacement(node)
}

export const $isMentionNode = (node: LexicalNode | null | undefined): node is MentionNode =>
  node instanceof MentionNode
