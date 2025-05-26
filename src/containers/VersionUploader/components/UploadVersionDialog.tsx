import { Dialog, Button, Spacer, SaveButton } from '@ynput/ayon-react-components'
import { FC, useEffect, useState } from 'react'
import { useVersionUploadContext } from '../context/VersionUploadContext'
import { productTypes } from '@shared/util'
import { UploadVersionForm } from './UploadVersionForm'
import styled from 'styled-components'

const ErrorMessage = styled.span`
  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  padding: var(--padding-s);
  border-radius: var(--border-radius-m);
`

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
  const {
    isOpen,
    onCloseVersionUpload,
    version,
    productId,
    onUploadVersion,
    projectName,
    pendingFiles,
  } = useVersionUploadContext()

  const [form, setForm] = useState<FormData>(defaultFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string>('')
  const [createdProductId, setCreatedProductId] = useState<string | null>(null)
  const [createdVersionId, setCreatedVersionId] = useState<string | null>(null)

  const closeDialog = () => {
    setForm(defaultFormData)
    setCreatedProductId(null)
    setCreatedVersionId(null)
    setError('')
    onCloseVersionUpload()
  }

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
      const response = await onUploadVersion(formData)

      // Extract productId and versionId from response
      if (response?.productId) {
        setCreatedProductId(response.productId)
      }
      if (response?.versionId) {
        setCreatedVersionId(response.versionId)
      }

      if (pendingFiles.length < 1) {
        setIsSubmitting(false)
        closeDialog()
      }
    } catch (error: any) {
      console.log('ERRRRRROR', error)
      setError(error)
      setIsSubmitting(false)
    } finally {
    }
  }

  // Use existing productId if available, otherwise use created one
  const currentProductId = productId || createdProductId
  const currentVersionId = createdVersionId

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
      style={{ width: 600, maxHeight: '80vh' }}
    >
      <UploadVersionForm
        formData={form}
        onChange={handleFormChange}
        onSubmit={handleFormSubmit}
        hidden={productId ? ['name', 'productType'] : []}
        projectName={projectName}
        versionId={currentVersionId}
        productId={currentProductId}
      />
      {error && <ErrorMessage className="error">{error}</ErrorMessage>}
    </Dialog>
  )
}

export default UploadVersionDialog
