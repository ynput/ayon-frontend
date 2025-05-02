import { SimpleFormDialog } from '@shared/components'
import type { SimpleFormField } from '@shared/api'

interface InteractiveForm {
  fields: SimpleFormField[]
  header: string
  identifier: string
}

interface InteractiveActionDialogProps {
  interactiveForm: InteractiveForm | null
  onClose: () => void
  onSubmit: (identifier: string, formData: Record<string, any>) => void
}

const InteractiveActionDialog = ({
  interactiveForm,
  onClose,
  onSubmit,
}: InteractiveActionDialogProps) => {
  if (!interactiveForm) return null

  const handleSubmit = (formData: Record<string, any>) => {
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
