import { Quill } from 'react-quill-ayon'
import type QuillType from 'quill'
import type DeltaStatic from 'quill-delta'

const Delta = Quill.import('delta') as unknown as new () => DeltaStatic

type TypeOption = { id: string; isCircle?: boolean }
type TypeOptions = Record<string, TypeOption>

interface MentionClipboardOptions {
  typeOptions?: TypeOptions
  refTypes?: readonly string[]
}

const DEFAULT_REF_TYPES = [
  'user',
  'team',
  'task',
  'version',
  'folder',
  'representation',
  'workfile',
  'product',
] as const

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}
const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => HTML_ESCAPES[c])

const refTypeToPrefix = (refType: string, options: TypeOptions) =>
  Object.entries(options).find(([, v]) => v.id === refType)?.[0] || '@'

// Roundtrip mentions through the clipboard:
//   <MENTION data-value="type:id">@label</MENTION>  ⇄  [label](type:id)
class MentionClipboard {
  private quill: QuillType
  private root: HTMLElement
  private typeOptions: TypeOptions
  private refTypes: readonly string[]
  private mentionMdRe: RegExp

  constructor(quill: QuillType, options?: MentionClipboardOptions) {
    this.quill = quill
    this.root = quill.root
    this.typeOptions = options?.typeOptions ?? {}
    this.refTypes = options?.refTypes ?? DEFAULT_REF_TYPES
    this.mentionMdRe = new RegExp(
      `\\[([^\\]\\n]+)\\]\\((${this.refTypes.join('|')}):([^)\\s]+)\\)`,
      'g',
    )

    this.matchAnchor = this.matchAnchor.bind(this)
    this.handleCopy = this.handleCopy.bind(this)
    this.handlePaste = this.handlePaste.bind(this)

    // fallback for external HTML pastes that bypass our plain-text branch
    if (quill.clipboard && (quill.clipboard as any).addMatcher) {
      ;(quill.clipboard as any).addMatcher('A', this.matchAnchor)
    }
    // capture phase so we transform clipboardData before Quill's bubble-phase clipboard fires
    this.root.addEventListener('copy', this.handleCopy, true)
    this.root.addEventListener('paste', this.handlePaste, true)
  }

  private matchAnchor(node: HTMLAnchorElement, delta: DeltaStatic) {
    const href = (node.getAttribute('href') || '').replace(/^@/, '')
    const refType = href.split(':')[0]
    if (!this.refTypes.includes(refType)) return delta
    const label = node.textContent || ''
    if (!label) return delta
    return new Delta().insert(label, { mention: href })
  }

  private handleCopy(e: ClipboardEvent) {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return
    const range = sel.getRangeAt(0)
    if (!this.root.contains(range.startContainer) || !this.root.contains(range.endContainer)) return

    let text = ''
    let html = ''
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const data = (node as Text).data
        text += data
        html += escapeHtml(data)
        return
      }
      if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
        node.childNodes.forEach(walk)
        return
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return
      const el = node as HTMLElement
      if (el.tagName === 'MENTION') {
        const value = el.getAttribute('data-value') || ''
        const label = (el.textContent || '').replace(/^@/, '')
        if (value && label) {
          text += `[${label}](${value})`
          html += `<a href="@${escapeHtml(value)}">@${escapeHtml(label)}</a>`
        }
        return
      }
      if (el.tagName === 'A') {
        const href = (el.getAttribute('href') || '').replace(/^@/, '')
        const refType = href.split(':')[0]
        const label = (el.textContent || '').replace(/^@/, '')
        if (this.refTypes.includes(refType) && label) {
          text += `[${label}](${href})`
          html += `<a href="@${escapeHtml(href)}">@${escapeHtml(label)}</a>`
          return
        }
      }
      if (el.tagName === 'BR') {
        text += '\n'
        html += '<br>'
        return
      }
      node.childNodes.forEach(walk)
    }
    walk(range.cloneContents())

    if (!text) return
    // stop Quill's clipboard from also handling this event
    e.stopImmediatePropagation()
    e.clipboardData?.setData('text/plain', text)
    e.clipboardData?.setData('text/html', html)
    e.preventDefault()
  }

  private handlePaste(e: ClipboardEvent) {
    const text = e.clipboardData?.getData('text/plain')
    if (!text) return
    const matches = [...text.matchAll(this.mentionMdRe)]
    if (!matches.length) return

    const delta = new Delta()
    let last = 0
    for (const m of matches) {
      const start = m.index ?? 0
      const before = text.slice(last, start)
      if (before) delta.insert(before)
      const [, label, refType, rawId] = m
      let id = rawId
      try {
        id = decodeURIComponent(rawId)
      } catch {
        /* keep raw */
      }
      const prefix = refTypeToPrefix(refType, this.typeOptions)
      delta.insert(prefix + label, { mention: `${refType}:${id}` })
      last = start + m[0].length
    }
    const tail = text.slice(last)
    if (tail) delta.insert(tail)

    e.stopImmediatePropagation()
    e.preventDefault()
    const selection = this.quill.getSelection(true)
    if (!selection) return
    const change = new Delta().retain(selection.index)
    if (selection.length) change.delete(selection.length)
    this.quill.updateContents(change.concat(delta), 'user')
    this.quill.setSelection(selection.index + delta.length(), 0, 'user')
  }
}

export default MentionClipboard
