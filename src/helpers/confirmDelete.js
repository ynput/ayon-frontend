import { confirmDialog } from 'primereact/confirmdialog'
import { toast } from 'react-toastify'

const confirmDelete = ({
  label = '',
  message = 'Are you sure? This cannot be undone',
  accept = async () => {},
  showToasts = true,
  ...props
}) =>
  confirmDialog({
    header: props.header || `Delete ${label}`,
    message,
    accept: async () => {
      const toastId = showToasts
        ? toast.loading(`Deleting ${label.toLowerCase()}...`, { autoClose: false })
        : null
      try {
        await accept()

        showToasts &&
          toast.update(toastId, {
            render: `${label} deleted`,
            type: toast.TYPE.SUCCESS,
            autoClose: 5000,
            isLoading: false,
          })
      } catch (error) {
        console.error(error)

        showToasts &&
          toast.update(toastId, {
            render: `Error deleting ${label}`,
            type: toast.TYPE.ERROR,
            autoClose: 5000,
          })
      }
    },
    reject: () => {},
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    acceptClassName: 'button-danger',
    ...props,
  })

export default confirmDelete
