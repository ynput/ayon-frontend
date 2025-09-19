import { useState, useRef, useEffect } from 'react'
import { convertToMarkdown } from '@shared/containers/Feed/components/CommentInput/quillToMarkdown'

interface UseDescriptionEditorProps {
  description: string
  enableEditing: boolean
  isMixed: boolean
  onChange: (description: string) => void
}

export const useDescriptionEditor = ({
  description,
  enableEditing,
  isMixed,
  onChange,
}: UseDescriptionEditorProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editorValue, setEditorValue] = useState('')
  const editorRef = useRef<any>(null)

  // Convert markdown to HTML for the editor (support lists, headers, code, quotes)
  const convertMarkdownToHtml = (markdown: string): string => {
    if (!markdown) return ''

    // Escape HTML
    const escapeHtml = (s: string) =>
      s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

    // Handle code blocks first
    const lines = markdown.split(/\r?\n/)
    const out: string[] = []
    let i = 0
    while (i < lines.length) {
      const line = lines[i]

      // fenced code block ```
      if (/^```/.test(line)) {
        i++
        const code: string[] = []
        while (i < lines.length && !/^```/.test(lines[i])) {
          code.push(lines[i])
          i++
        }
        // skip closing ```
        if (i < lines.length && /^```/.test(lines[i])) i++
        continue
      }

      // blockquote
      if (/^>\s?/.test(line)) {
        const quoteLines: string[] = []
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          quoteLines.push(lines[i].replace(/^>\s?/, ''))
          i++
        }
        out.push(`<blockquote>${escapeHtml(quoteLines.join('\n'))}</blockquote>`)
        continue
      }

      // Handle both ordered and unordered lists in a unified way
      if (/^\s*[-*]\s+/.test(line) || /^\s*\d+\.\s+/.test(line)) {
        const items: string[] = []
        let hasOrdered = false
        let hasUnordered = false

        // Collect all consecutive list items (both ordered and unordered)
        const listItems: Array<{ text: string; isOrdered: boolean }> = []
        let j = i
        while (
          j < lines.length &&
          (/^\s*[-*]\s+/.test(lines[j]) || /^\s*\d+\.\s+/.test(lines[j]))
        ) {
          const currentLine = lines[j]
          const isOrdered = /^\s*\d+\.\s+/.test(currentLine)
          const text = currentLine.replace(/^\s*[-*]\s+/, '').replace(/^\s*\d+\.\s+/, '')
          listItems.push({ text, isOrdered })
          if (isOrdered) hasOrdered = true
          else hasUnordered = true
          j++
        }

        // Determine list type
        let listType: 'ordered' | 'unordered' | 'mixed' = 'unordered'
        if (hasOrdered && hasUnordered) {
          listType = 'mixed'
        } else if (hasOrdered) {
          listType = 'ordered'
        } else {
          listType = 'unordered'
        }

        // Process each item
        for (const item of listItems) {
          const itemEsc = escapeHtml(item.text)
          // Protect inline code spans
          const CODE_TOKEN = '\uFFFFCODETOKEN\uFFFF'
          const codeSpans: string[] = []
          let tmp = itemEsc.replace(/`([^`]+)`/g, (_m, p1) => {
            codeSpans.push(`<code>${p1}</code>`)
            return CODE_TOKEN
          })
          tmp = tmp.replace(/\*\*([^\s][\s\S]*?)\*\*/g, '<strong>$1</strong>')
          tmp = tmp.replace(
            /(^|[^*])\*([^\s][^*]*?)\*(?!\*)/g,
            (_m, p1, p2) => `${p1}<em>${p2}</em>`,
          )
          tmp = tmp.replace(
            /(^|\W)_([^_\s][^_]*?)_(?=\W|$)/g,
            (_m, p1, p2) => `${p1}<em>${p2}</em>`,
          )
          let idx = 0
          const itemInline = tmp.replace(new RegExp(CODE_TOKEN, 'g'), () => codeSpans[idx++])

          // Add data-list attribute and ql-ui span to match Quill's structure
          const dataListAttr = item.isOrdered ? 'data-list="ordered"' : 'data-list="bullet"'
          const qlUiSpan = '<span class="ql-ui" contenteditable="false"></span>'
          items.push(`<li ${dataListAttr}>${qlUiSpan}${itemInline}</li>`)
        }

        // Use appropriate list tag based on the determined type
        // For mixed lists, use <ol> to match Quill's behavior
        const listTag = listType === 'unordered' ? 'ul' : 'ol'
        out.push(`<${listTag}>${items.join('')}</${listTag}>`)
        i = j
        continue
      }

      // setext-style headers (H1/H2)
      if (line.trim() !== '' && i + 1 < lines.length) {
        const next = lines[i + 1]
        if (/^=+\s*$/.test(next)) {
          // Process inline formatting inside H1 - convert to H2 to match toolbar
          const raw = line.trim()
          const esc = escapeHtml(raw)
          const TOKEN = '\uFFFFCODETOKEN\uFFFF'
          const codeSpans: string[] = []
          let t = esc.replace(/`([^`]+)`/g, (_m, p1) => {
            codeSpans.push(`<code>${p1}</code>`)
            return TOKEN
          })
          t = t.replace(/\*\*([^\s][\s\S]*?)\*\*/g, '<strong>$1</strong>')
          t = t.replace(/(^|[^*])\*([^\s][^*]*?)\*(?!\*)/g, (_m, p1, p2) => `${p1}<em>${p2}</em>`)
          t = t.replace(/(^|\W)_([^_\s][^_]*?)_(?=\W|$)/g, (_m, p1, p2) => `${p1}<em>${p2}</em>`)
          let cidx = 0
          const inline = t.replace(new RegExp(TOKEN, 'g'), () => codeSpans[cidx++])
          out.push(`<h2>${inline}</h2>`)
          i += 2
          continue
        }
        if (/^-+\s*$/.test(next)) {
          // Process inline formatting inside H2
          const raw = line.trim()
          const esc = escapeHtml(raw)
          const TOKEN = '\uFFFFCODETOKEN\uFFFF'
          const codeSpans: string[] = []
          let t = esc.replace(/`([^`]+)`/g, (_m, p1) => {
            codeSpans.push(`<code>${p1}</code>`)
            return TOKEN
          })
          t = t.replace(/\*\*([^\s][\s\S]*?)\*\*/g, '<strong>$1</strong>')
          t = t.replace(/(^|[^*])\*([^\s][^*]*?)\*(?!\*)/g, (_m, p1, p2) => `${p1}<em>${p2}</em>`)
          t = t.replace(/(^|\W)_([^_\s][^_]*?)_(?=\W|$)/g, (_m, p1, p2) => `${p1}<em>${p2}</em>`)
          let cidx = 0
          const inline = t.replace(new RegExp(TOKEN, 'g'), () => codeSpans[cidx++])
          out.push(`<h2>${inline}</h2>`)
          i += 2
          continue
        }
      }

      // header level 1 (# ) - convert to H2 to match toolbar
      if (/^#\s+/.test(line)) {
        const raw = line.replace(/^#\s+/, '')
        const esc = escapeHtml(raw)
        const TOKEN = '\uFFFFCODETOKEN\uFFFF'
        const codeSpans: string[] = []
        let t = esc.replace(/`([^`]+)`/g, (_m, p1) => {
          codeSpans.push(`<code>${p1}</code>`)
          return TOKEN
        })
        t = t.replace(/\*\*([^\s][\s\S]*?)\*\*/g, '<strong>$1</strong>')
        t = t.replace(/(^|[^*])\*([^\s][^*]*?)\*(?!\*)/g, (_m, p1, p2) => `${p1}<em>${p2}</em>`)
        t = t.replace(/(^|\W)_([^_\s][^_]*?)_(?=\W|$)/g, (_m, p1, p2) => `${p1}<em>${p2}</em>`)
        let cidx = 0
        const inline = t.replace(new RegExp(TOKEN, 'g'), () => codeSpans[cidx++])
        out.push(`<h2>${inline}</h2>`)
        i++
        continue
      }

      // header level 2 (## )
      if (/^##\s+/.test(line)) {
        const raw = line.replace(/^##\s+/, '')
        const esc = escapeHtml(raw)
        const TOKEN = '\uFFFFCODETOKEN\uFFFF'
        const codeSpans: string[] = []
        let t = esc.replace(/`([^`]+)`/g, (_m, p1) => {
          codeSpans.push(`<code>${p1}</code>`)
          return TOKEN
        })
        t = t.replace(/\*\*([^\s][\s\S]*?)\*\*/g, '<strong>$1</strong>')
        t = t.replace(/(^|[^*])\*([^\s][^*]*?)\*(?!\*)/g, (_m, p1, p2) => `${p1}<em>${p2}</em>`)
        t = t.replace(/(^|\W)_([^_\s][^_]*?)_(?=\W|$)/g, (_m, p1, p2) => `${p1}<em>${p2}</em>`)
        let cidx = 0
        const inline = t.replace(new RegExp(TOKEN, 'g'), () => codeSpans[cidx++])
        out.push(`<h2>${inline}</h2>`)
        i++
        continue
      }

      // inline formatting with protections for code and boundaries
      // Protect inline code spans first to avoid parsing asterisks inside them
      const escaped = escapeHtml(line)
      const CODE_TOKEN = '\uFFFFCODETOKEN\uFFFF'
      const codeSpans: string[] = []
      let tmp = escaped.replace(/`([^`]+)`/g, (_m, p1) => {
        codeSpans.push(`<code>${p1}</code>`)
        return CODE_TOKEN
      })
      // Bold: require two asterisks with some non-space inside; avoid crossing whitespace-only
      tmp = tmp.replace(/\*\*([^\s][\s\S]*?)\*\*/g, '<strong>$1</strong>')
      // Italic (asterisk): ensure not a list marker (start-of-line "* ") and not part of bold
      tmp = tmp.replace(/(^|[^*])\*([^\s][^*]*?)\*(?!\*)/g, (_m, p1, p2) => `${p1}<em>${p2}</em>`)
      // Italic (underscore): avoid inside words (word boundary on each side)
      tmp = tmp.replace(/(^|\W)_([^_\s][^_]*?)_(?=\W|$)/g, (_m, p1, p2) => `${p1}<em>${p2}</em>`)
      // Restore code spans
      let idx = 0
      const inline = tmp.replace(new RegExp(CODE_TOKEN, 'g'), () => codeSpans[idx++])

      if (inline.trim() === '') {
        out.push('')
      } else {
        out.push(`<p>${inline}</p>`) 
      }
      i++
    }

    // Join preserving block elements
    return out.join('\n')
  }

  useEffect(() => {
    if (isEditing && description) {
      // Use description directly as HTML instead of converting from markdown
      setEditorValue(description)
    }
  }, [description, isEditing])

  // Autofocus editor when entering edit mode and place cursor at end
  useEffect(() => {
    if (!isEditing) return
    const quill = editorRef.current?.getEditor?.()
    // If Quill instance not ready yet, try on next frame
    if (!quill) {
      const id = requestAnimationFrame(() => {
        const q = editorRef.current?.getEditor?.()
        if (q) {
          q.focus()
          const len = q.getLength?.() ?? 0
          q.setSelection?.(len, 0)
        }
      })
      return () => cancelAnimationFrame(id)
    }
    quill.focus()
    const len = quill.getLength?.() ?? 0
    quill.setSelection?.(len, 0)
  }, [isEditing])

  const handleStartEditing = () => {
    if (enableEditing && !isMixed) {
      setIsEditing(true)
      // Use description directly as HTML instead of converting from markdown
      setEditorValue(description)
    }
  }

  const handleSave = () => {
    const quill = editorRef.current?.getEditor()
    if (quill) {
      const html = quill.root.innerHTML
      // Preserve React Quill HTML directly instead of converting to markdown
      onChange(html)
    }
    setIsEditing(false)
    setEditorValue('')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditorValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave()
    }
  }

  return {
    isEditing,
    editorValue,
    setEditorValue,
    editorRef,
    handleStartEditing,
    handleSave,
    handleCancel,
    handleKeyDown,
  }
}
