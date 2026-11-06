import { useState } from 'react'
import { Button, Spacer, Dialog } from '@ynput/ayon-react-components'
import { SimpleForm } from '@shared/components/SimpleForm'
import type { SimpleFormErrors, SimpleFormValueDict } from '@shared/components/SimpleForm'
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
  const [errors, setErrors] = useState<SimpleFormErrors>({})
  // errors show once a submit was blocked, then follow the values: fixing one clears it
  const [showErrors, setShowErrors] = useState(false)

  if (!isOpen) return null

  const handleChange = (values: SimpleFormValueDict, valueErrors: SimpleFormErrors) => {
    setFormData(values)
    setErrors(valueErrors)
  }

  // the one submit path for the button and Enter: invalid values never reach onSubmit
  const submit = () => {
    if (Object.keys(errors).length) {
      setShowErrors(true)
      return
    }
    onSubmit(formData)
  }

  // without a submit button there is nothing for Enter to confirm
  const handleSubmit = submitLabel ? submit : undefined

  const footer = (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
      <Spacer />
      {cancelLabel && <Button onClick={() => onClose()} label={cancelLabel} icon={cancelIcon} />}
      {submitLabel && (
        // focused on open, so Enter confirms the dialog as the highlighted button suggests
        <Button
          onClick={handleSubmit}
          label={submitLabel}
          icon={submitIcon}
          variant="filled"
          autoFocus
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
        onChange={handleChange}
        onSubmit={handleSubmit}
        showErrors={showErrors}
        style={{ width: '95%' }}
      />
    </Dialog>
  )
}
