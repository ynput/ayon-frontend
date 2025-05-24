import { Dialog, Button, Spacer, SaveButton } from '@ynput/ayon-react-components'
import { FC, useEffect, useState } from 'react'
import { useVersionUploadContext } from '../context/VersionUploadContext'
import { productTypes } from '@shared/util'
import { UploadVersionForm } from './UploadVersionForm'

// mix of create version and product model
export type FormData = {
  version: number // 10
  name: string // product name
  productType: string // product type
}

const defaultFormData: FormData = {
  version: 1,
  name: productTypes.render.name,
  productType: 'render',
}

interface UploadVersionDialogProps {}

const UploadVersionDialog: FC<UploadVersionDialogProps> = () => {
  const { isOpen, setIsOpen, version, productId, onUploadVersion } = useVersionUploadContext()

  const closeDialog = () => setIsOpen(false)

  const [form, setForm] = useState<FormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (!isOpen) return

    if (version) {
      setForm({
        ...defaultFormData,
        version: version.version + 1,
      })
    } else {
      setForm(defaultFormData)
    }

    return () => {
      setForm(defaultFormData)
    }
  }, [isOpen, version])

  const handleFormChange = (key: keyof FormData, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleFormSubmit = async (formData: FormData) => {
    // Handle form submission here
    try {
      setIsSubmitting(true)
      await onUploadVersion(formData)
      // Add your submission logic here
      closeDialog()
    } catch (error: any) {
      setError(error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const footer = (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
      <Spacer />
      <Button onClick={closeDialog} label="Cancel" variant="text" />
      <SaveButton
        type="submit"
        form="upload-version-form"
        label="Upload Version"
        icon={'upload'}
        active
        saving={isSubmitting}
      />
    </div>
  )

  return (
    <Dialog
      isOpen={isOpen}
      onClose={closeDialog}
      header="Upload and create new version"
      size="md"
      footer={footer}
    >
      <UploadVersionForm
        formData={form}
        onChange={handleFormChange}
        onSubmit={handleFormSubmit}
        hidden={productId ? ['name', 'productType'] : []}
      />
      {error && <div className="error-message">{error}</div>}
    </Dialog>
  )
}

export default UploadVersionDialog
