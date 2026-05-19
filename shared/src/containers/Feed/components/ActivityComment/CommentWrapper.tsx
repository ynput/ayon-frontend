import React, { FC, useCallback } from 'react'

const removeAts = (text: string): string => {
  // remove @ if followed by @ or [
  return text.replace(/@(?=@|\[)/g, '')
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
}
const escapeHtml = (s: string) => s.replace(/[&<>"]/g, (c) => HTML_ESCAPES[c])
const encodeIdSpaces = (s: string) => s.replaceAll(' ', '%20')

const serializeSelection = (root: HTMLElement, range: Range) => {
  const fragment = range.cloneContents()
  if (!fragment.querySelector('[data-mention-value]')) return null

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

    const mentionValue = el.getAttribute('data-mention-value')
    if (mentionValue) {
      const label = el.getAttribute('data-mention-label') || (el.textContent || '').trim()
      if (label) {
        const encoded = encodeIdSpaces(mentionValue)
        text += `[${label}](${encoded})`
        html += `<a href="@${escapeHtml(encoded)}">@${escapeHtml(label)}</a>`
      }
      return
    }

    if (el.tagName === 'BR') {
      text += '\n'
      html += '<br>'
      return
    }

    if (el.tagName === 'P' || el.tagName === 'DIV') {
      if (text && !text.endsWith('\n')) text += '\n'
      node.childNodes.forEach(walk)
      return
    }

    node.childNodes.forEach(walk)
  }

  walk(fragment)
  if (!text) return null
  return { text, html }
}

const CommentWrapper: FC<{ children: React.ReactNode }> = ({ children }) => {
  const parsedChildren = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child

    const bodyString = child.props.children

    if (typeof bodyString !== 'string') return child
    else {
      const newChild = {
        ...child,
        props: {
          ...child.props,
          children: removeAts(bodyString),
        },
      }

      return newChild
    }
  })

  const handleCopy = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return
    const range = sel.getRangeAt(0)
    const root = e.currentTarget
    if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) return

    const result = serializeSelection(root, range)
    if (!result) return

    e.preventDefault()
    e.clipboardData.setData('text/plain', result.text)
    e.clipboardData.setData('text/html', result.html)
  }, [])

  return <div onCopy={handleCopy}>{parsedChildren}</div>
}

export default CommentWrapper
