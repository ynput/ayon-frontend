import { useMemo } from 'react'
import { toast } from 'react-toastify'
import { useGetEntityQuery } from '@shared/api'
import { Dialog, Icon } from '@ynput/ayon-react-components'
import CodeEditor from '@uiw/react-textarea-code-editor'
import { copyToClipboard } from '@shared/util'

export interface DetailsDialogProps {
  projectName?: string
  entityType: string
  entityIds: string[]
  visible: boolean
  onHide: () => void
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
          .w-tc-editor .token.property { color: #c9a5f7 !important; }
          .w-tc-editor .token.string { color: #6bc985 !important; }
          .w-tc-editor .token.number { color: #e5a66b !important; }
          .w-tc-editor .token.boolean { color: #e5a66b !important; }
          .w-tc-editor .token.null { color: #7a8a99 !important; }
          .w-tc-editor .token.punctuation { color: #b0bec5 !important; }
          .w-tc-editor .token.operator { color: #b0bec5 !important; }
      `}</style>
      <div className="details-dialog__code">
        {/* If loading or error, render plain text */}
        {isLoading || isError ? (
          <pre>{isLoading ? 'loading...' : 'error...'}</pre>
        ) : (
          <>
            <div
              role="button"
              aria-label="Copy JSON"
              onClick={() => copyToClipboard(rawJson)}
              className="details-dialog__copy"
            >
              <Icon icon={'content_copy'} data-tooltip="Copy to clipboard" />
            </div>
            <CodeEditor
              wrap={'off'}
              value={rawJson}
              language="json"
              placeholder="Please enter JS code."
              readOnly
              data-color-mode={'dark'}
            />
          </>
        )}
      </div>
    </Dialog>
  )
}
