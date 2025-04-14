import axios from 'axios'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import SimpleFormDialog from '@/containers/SimpleFormDialog/SimpleFormDialog'

const ActionConfigDialog = ({ action, onClose, context }) => {
  const { configFields } = action || {}
  const [initValues, setInitValues] = useState(null)

  const params = action && {
    addonName: action.addonName,
    addonVersion: action.addonVersion,
    variant: action.variant,
    identifier: action.identifier,
  }

  useEffect(() => {
    if (!(action && context)) {
      setInitValues(null)
      return
    }

    // sending the context without value returns the current config
    axios
      .post(`/api/actions/config`, { ...context }, { params })
      .then((response) => { setInitValues(response.data) })
      .catch((error) => { 
        toast.error('Error fetching action config')
        console.error('Error fetching action config', error)
      })
  }, [action, context])

  if (!action) return null

  const handleSubmit = (data) => {
    // Sorry. Prototyping with axios. don't judge me.
    console.log('Submitting action config', data)

    axios
      .post(`/api/actions/config`, { ...context, value: data }, { params })
      .then((response) => {
        toast.success('Action config saved')
      })
      .catch((error) => {
        toast.error('Error saving action config')
        console.error('Error saving action config', error)
      })

    onClose()
  }

  return (
    <SimpleFormDialog
      isOpen
      title={action.label}
      header={`Configure action ${action.label}`}
      fields={configFields}
      values={initValues}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  )
}

export default ActionConfigDialog
