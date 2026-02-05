import { useMemo } from 'react'
import { toast } from 'react-toastify'
import { useGetEntityQuery } from '@shared/api'
import { Dialog } from '@ynput/ayon-react-components'
import { SyntaxHighlighter } from '../SyntaxHighlighter'

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

  // Raw pretty JSON for display
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

  return (
    <Dialog
      isOpen={true}
      onClose={onHide}
      size="lg"
      style={{ width: '50vw' }}
      header={`${entityType} detail`}
    >
      {/* If loading or error, render plain text */}
      {(isLoading || isError) ? (
        <pre>
          {isLoading ? 'loading...' : 'error...'}
        </pre>
      ) : (
        <SyntaxHighlighter code={rawJson} language="json" showCopyButton={true} />
      )}
    </Dialog>
  )
}
