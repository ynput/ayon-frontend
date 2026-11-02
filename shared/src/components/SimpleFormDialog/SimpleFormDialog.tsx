import { useState } from 'react'
import { Button, Spacer, Dialog } from '@ynput/ayon-react-components'
import { SimpleForm } from '@shared/components/SimpleForm'
import type { SimpleFormValueDict } from '@shared/components/SimpleForm'
import type { SimpleFormField } from '@shared/api'

export interface SimpleFormDialogProps {
  title: string
  fields: SimpleFormField[]
  values?: SimpleFormValueDict
  submitLabel?: string
  cancelLabel?: string
  submitIcon?: string
  cancelIcon?: string
  onClose: () => void
  onSubmit: (values: SimpleFormValueDict) => void
  isOpen: boolean
}

/**
 * Dialog chrome (header/footer/buttons) around an embedded SimpleForm. All
 * the actual field rendering and rule/enumResolver logic lives in SimpleForm
 * (and its helper modules) - this component only tracks the latest values
 * for the submit button and stays out of the way otherwise.
 */
export const SimpleFormDialog = ({
  fields,
  values,
  onClose,
  onSubmit,
  isOpen,
  title,
  submitLabel,
  cancelLabel,
  submitIcon,
  cancelIcon,
}: SimpleFormDialogProps) => {
  const [formData, setFormData] = useState<SimpleFormValueDict>({})

  if (!isOpen) return null

  const footer = (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
      <Spacer />
      {cancelLabel && <Button onClick={() => onClose()} label={cancelLabel} icon={cancelIcon} />}
      {submitLabel && (
        <Button
          onClick={() => onSubmit(formData)}
          label={submitLabel}
          icon={submitIcon}
          variant="filled"
        />
      )}
    </div>
  )

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      header={title}
      footer={footer}
      style={{ minHeight: 500, minWidth: 600 }}
      enableBackdropClose={false}
    >
      <SimpleForm
        fields={fields}
        values={values}
        onChange={setFormData}
        style={{ width: '95%' }}
      />
    </Dialog>
  )
}
