import { upperFirst } from 'lodash'
import { confirmDialog } from 'primereact/confirmdialog'
import { toast } from 'react-toastify'

const confirmDelete = ({
  label = '',
  message = 'Are you sure? This cannot be undone',
  deleteLabel,
  accept = async () => {},
  showToasts = true,
  isArchive = false,
  onSuccess,
  onError,
  ...props
}) => {
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
          toast.update(toastId, {
            render: `${label} ${deleteLabelPast}`,
            type: toast.TYPE.SUCCESS,
            autoClose: 5000,
            isLoading: false,
          })

        onSuccess && onSuccess()
      } catch (error) {
        const errorMessage =
          typeof error === 'string'
            ? error
            : error.message || `Error ${deleteLabelPresent} ${label}`

        showToasts &&
          toast.update(toastId, {
            render: errorMessage,
            type: toast.TYPE.ERROR,
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

export default confirmDelete
