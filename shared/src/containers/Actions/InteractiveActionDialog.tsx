import { SimpleFormDialog } from '@shared/components'
import type { SimpleFormField } from '@shared/api'

export interface InteractiveForm {
  identifier: string
  title: string
  fields: SimpleFormField[]
  submitLabel?: string
  cancelLabel?: string
  submitIcon?: string
  cancelIcon?: string
}

export interface InteractiveActionDialogProps {
  interactiveForm: InteractiveForm | null
  onClose: () => void
  onSubmit: (identifier: string, formData: Record<string, any>) => void
}

export const InteractiveActionDialog = ({
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
      title={`${interactiveForm.title}`}
      fields={interactiveForm.fields}
      submitLabel={interactiveForm.submitLabel}
      cancelLabel={interactiveForm.cancelLabel}
      submitIcon={interactiveForm.submitIcon}
      cancelIcon={interactiveForm.cancelIcon}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  )
}
