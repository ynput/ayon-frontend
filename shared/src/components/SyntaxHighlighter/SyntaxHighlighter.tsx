import { useMemo, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { Icon } from '@ynput/ayon-react-components'
import { BlockCode } from '@shared/containers/Feed/components/ActivityComment/ActivityComment.styled'

export interface SyntaxHighlighterProps {
  code: string
  language?: string
  showCopyButton?: boolean
}

// Small, dependency-free syntax highlighter that returns HTML with inline styles
function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// TODO: Use a proper syntax highlighter library for more features
function syntaxHighlight(code: string) {
  // regex adapted for JSON token highlighting
  return escapeHtml(code).replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    (match) => {
      let color = '#a626a4' // string / key default
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          // key
          color = '#8fceff'
        } else {
          // string
          color = '#00a3ea'
        }
      } else if (/true|false/.test(match)) {
        color = '#99d9ff'
      } else if (/null/.test(match)) {
        color = '#a2e1ff'
      } else {
        // number
        color = '#a1d8ff'
      }
      return `<span style="color: ${color}">${match}</span>`
    },
  )
}

export const SyntaxHighlighter = ({
  code,
  language = 'json',
  showCopyButton = true,
}: SyntaxHighlighterProps) => {
  const highlighted = useMemo(() => syntaxHighlight(code), [code])

  const [copied, setCopied] = useState(false)

  const copyToClipboard = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code)
      } else {
        // Fallback for older browsers
        const ta = document.createElement('textarea')
        ta.value = code
        ta.style.position = 'fixed'
        ta.style.left = '-9999px'
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Unable to copy to clipboard')
    }
  }, [code])

  return (
    <>
      <style>{`
        .details-dialog__code { position: relative; }
        .details-dialog__copy { position: absolute; right: 12px; top: 24px; z-index: 10; background: rgba(0,0,0,0.5); border-radius: 4px; padding: 6px; cursor: pointer; display: none; align-items: center; justify-content: center; }
        .details-dialog__code:hover .details-dialog__copy, .details-dialog__code:focus-within .details-dialog__copy { display: flex; }
      `}</style>
      <div className="details-dialog__code">
        {showCopyButton && (
          <div
            role="button"
            aria-label="Copy code"
            onClick={copyToClipboard}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                copyToClipboard()
              }
            }}
            tabIndex={0}
            className="details-dialog__copy"
          >
            <Icon icon={!copied ? "content_copy" : "check"} data-tooltip="Copy to clipboard" />
          </div>
        )}
        <BlockCode><code dangerouslySetInnerHTML={{ __html: highlighted }} /></BlockCode>
      </div>
    </>
  )
}
