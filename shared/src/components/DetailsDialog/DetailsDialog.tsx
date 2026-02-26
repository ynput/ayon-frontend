import { useMemo, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { useGetEntityQuery } from '@shared/api'
import {Dialog, Icon} from '@ynput/ayon-react-components'

// TODO: Probably not import cross-component like this
import {
  BlockCode
} from "@shared/containers/Feed/components/ActivityComment/ActivityComment.styled";

export interface DetailsDialogProps {
  projectName?: string
  entityType: string
  entityIds: string[]
  visible: boolean
  onHide: () => void
}

// Small, dependency-free syntax highlighter that returns HTML with inline styles
function escapeHtml(unsafe: string) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// TODO: Use a proper syntax highlighter library for more features
function syntaxHighlight(json: string) {
  // regex adapted for JSON token highlighting
  return escapeHtml(json).replace(
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

export const DetailsDialog = ({
  projectName,
  entityType,
  entityIds,
  visible,
  onHide,
}: DetailsDialogProps) => {
  const {
    data = {},
    isLoading,
    isError,
    error,
  } = useGetEntityQuery(
    { projectName, entityType: entityType, entityId: entityIds?.[0] },
    { skip: !visible },
  )

  // Show error toast if the query errored
  if (isError) {
    toast.error(`Unable to load detail. ${error}`)
  }

  // Raw pretty JSON for copying and highlighting
  const rawJson = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      // Fallback to string representation
      return String(data)
    }
  }, [data])

  const highlighted = useMemo(() => syntaxHighlight(rawJson), [rawJson])

  const [copied, setCopied] = useState(false)

  const copyToClipboard = useCallback(async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(rawJson)
      } else {
        // Fallback for older browsers
        const ta = document.createElement('textarea')
        ta.value = rawJson
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
  }, [rawJson])

  // Keep the early return after hooks to ensure hooks are called on every render in the same order
  if (!visible || (Array.isArray(data) ? data.length < 1 : false)) return null

  // TODO: Create a dedicate CodeBlock component that allows to pick the
  //  code language (or a Markdown component that supports code blocks
  //  with language syntax highlighting)
  return (
    <Dialog
      isOpen={true}
      onClose={onHide}
      size="lg"
      style={{ width: '50vw' }}
      header={`${entityType} detail`}
    >
      <style>{`
        .details-dialog__code { position: relative; }
        .details-dialog__copy { position: absolute; right: 12px; top: 24px; z-index: 10; background: rgba(0,0,0,0.5); border-radius: 4px; padding: 6px; cursor: pointer; display: none; align-items: center; justify-content: center; }
        .details-dialog__code:hover .details-dialog__copy, .details-dialog__code:focus-within .details-dialog__copy { display: flex; }
      `}</style>
      <div className="details-dialog__code">
        {/* If loading or error, render plain text */}
        {(isLoading || isError) ? (
          <pre>
            {isLoading ? 'loading...' : 'error...'}
          </pre>
        ) : (
          <>
            <div
              role="button"
              aria-label="Copy JSON"
              onClick={copyToClipboard}
              className="details-dialog__copy"
            >
              <Icon icon={!copied ? "content_copy" : "check"} data-tooltip="Copy to clipboard" />
            </div>
            <BlockCode><code dangerouslySetInnerHTML={{ __html: highlighted }} /></BlockCode>
          </>
        )}
      </div>
    </Dialog>
  )
}
