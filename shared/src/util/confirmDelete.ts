import { upperFirst } from 'lodash'
import { confirmDialog, ConfirmDialogOptions } from 'primereact/confirmdialog'
import { toast } from 'react-toastify'

export interface ConfirmDeleteOptions extends Omit<ConfirmDialogOptions, 'accept'> {
  label?: string
  message?: string
  deleteLabel?: string
  accept?: () => Promise<any>
  showToasts?: boolean
  isArchive?: boolean
  onSuccess?: () => void
  onError?: (error: any) => void
}

export const confirmDelete = ({
  label = '',
  message = 'Are you sure? This cannot be undone',
  deleteLabel,
  accept = async () => {},
  showToasts = true,
  isArchive = false,
  onSuccess,
  onError,
  ...props
}: ConfirmDeleteOptions): ReturnType<typeof confirmDialog> => {
  deleteLabel = deleteLabel || (isArchive ? 'Archive' : 'Delete')
  const deleteLabelPresent = isArchive ? 'archiving' : 'deleting'
  const deleteLabelPast = isArchive ? 'archived' : 'deleted'

  return confirmDialog({
    header: props.header || `${deleteLabel} ${label}`,
    message,
    accept: async () => {
      const toastId = showToasts
        ? toast.loading(`${upperFirst(deleteLabelPresent)} ${label.toLowerCase()}...`, {
            autoClose: false,
          })
        : null
      try {
        await accept()

        showToasts &&
          toastId &&
          toast.update(toastId, {
            render: `${label} ${deleteLabelPast}`,
            type: 'success',
            autoClose: 5000,
            isLoading: false,
          })

        onSuccess && onSuccess()
      } catch (error: any) {
        const errorMessage =
          typeof error === 'string'
            ? error
            : error.message || `Error ${deleteLabelPresent} ${label}`

        showToasts &&
          toastId &&
          toast.update(toastId, {
            render: errorMessage,
            type: 'error',
            autoClose: 5000,
            isLoading: false,
          })

        onError && onError(error)
      }
    },
    reject: () => {},
    acceptLabel: upperFirst(deleteLabel),
    rejectLabel: 'Cancel',
    acceptClassName: 'button-danger',
    style: { minWidth: 400, maxWidth: 600 },
    ...props,
  })
}
