import { Dialog, Button, Spacer, SaveButton } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { useVersionUploadContext } from '../context/VersionUploadContext'
import { UploadVersionForm } from './UploadVersionForm'
import styled from 'styled-components'

const toVersionString = (number: number) => {
  // Convert the number to a string
  let numStr = String(number)

  // Calculate how many zeros are needed for padding
  // If the number of digits is less than 3, we need 3 - numStr.length zeros.
  // Otherwise, no padding is needed.
  let paddingNeeded = Math.max(0, 3 - numStr.length)

  // Create the padding string
  let padding = '0'.repeat(paddingNeeded)

  // Combine to form the version string
  return `v${padding}${numStr}`
}

const ErrorMessage = styled.span`
  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
  padding: var(--padding-s);
  border-radius: var(--border-radius-m);
`

interface UploadVersionDialogProps {}

const UploadVersionDialog: FC<UploadVersionDialogProps> = () => {
  const {
    isOpen,
    onCloseVersionUpload,
    productId,
    taskId,
    projectName,
    form,
    version,
    handleFormChange,
    handleFormSubmit,
    isSubmitting,
    error,
    createdProductId,
    createdVersionId,
  } = useVersionUploadContext()

  // Use existing productId if available, otherwise use created one
  const currentProductId = productId || createdProductId
  const currentVersionId = createdVersionId

  const footer = (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
      <Spacer />
      <Button onClick={onCloseVersionUpload} label="Cancel" variant="text" />
      <SaveButton
        type="submit"
        form="upload-version-form"
        label={`Create ${toVersionString(form.version)}`}
        icon={'upload'}
        active
        saving={isSubmitting}
      />
    </div>
  )

  const creatingOnEntityType = productId ? 'Product' : taskId ? 'Task' : 'Folder'
  const title = 'Create new version' + ' - ' + creatingOnEntityType

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onCloseVersionUpload}
      header={title}
      size="md"
      footer={footer}
      style={{ width: 600, maxHeight: '80vh' }}
    >
      <UploadVersionForm
        formData={form}
        minVersion={version?.version}
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
