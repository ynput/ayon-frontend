import { useEffect, useState } from 'react'
import SimpleFormDialog from '@/containers/SimpleFormDialog/SimpleFormDialog'

const InteractiveActionDialog = ({ interactiveForm, onClose, onSubmit }) => {
  if (!interactiveForm) return null

  const handleSubmit = (formData) => { 
    onSubmit(interactiveForm.identifier, formData)
    onClose()
  }

  return (
    <SimpleFormDialog
      isOpen
      header={`${interactiveForm.header}`}
      fields={interactiveForm.fields}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  )
}

export default InteractiveActionDialog
