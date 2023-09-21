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
      // try catch to update api key using unwrap and toast results
      try {
        await accept()

        showToasts && toast.success(label + ' deleted')
      } catch (error) {
        console.error(error)
        //   toast error
        showToasts && toast.error('Error deleting ' + label)
      }
    },
    reject: () => {},
    acceptLabel: 'Delete',
    rejectLabel: 'Cancel',
    acceptClassName: 'button-danger',
    ...props,
  })

export default confirmDelete
