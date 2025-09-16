// A dialog to ask the user to name their new upload uploaded version (naming the product)
// by default we can take the file name

import { Dialog, InputText, Button, FormRow } from '@ynput/ayon-react-components'
import { camelCase, upperFirst } from 'lodash'
import { FC, useState, useEffect, useRef } from 'react'

const prefix = 'review'
const buildDefaultName = (file?: File | null) => {
  // remove file extension
  // convert to camelCase
  // first letter to uppercase
  // prefix with "review"
  if (!file) return ''
  const name = file.name.replace(/\.[^/.]+$/, '') // remove file extension
  const camelCaseName = camelCase(name)
  const pascalCaseName = upperFirst(camelCaseName)
  return `${prefix}${pascalCaseName}`
}

interface EntityPanelUploaderDialogProps {
  files: FileList | null // used to determine the default product name
  isOpen: boolean
  defaultProductName?: string
  onCancel?: () => void
  onSubmit?: (productName: string) => void
}

const EntityPanelUploaderDialog: FC<EntityPanelUploaderDialogProps> = ({
  files,
  isOpen,
  onCancel,
  onSubmit,
}) => {
  // Build default product name from the first file
  const defaultProductName = buildDefaultName(files?.[0])
  const inputRef = useRef<HTMLInputElement>(null)
  const hasSelectedRef = useRef(false)

  const [product, setProduct] = useState(defaultProductName)

  // Update state when defaultProductName changes
  useEffect(() => {
    setProduct(defaultProductName)
    hasSelectedRef.current = false // Reset selection flag when product name changes
  }, [defaultProductName])

  // Select the filename part (excluding "review" prefix) when dialog opens - only once
  useEffect(() => {
    if (isOpen && inputRef.current && product.startsWith(prefix) && !hasSelectedRef.current) {
      // Focus the input first
      inputRef.current.focus()
      // Then select just the filename part (after "review")
      const selectionStart = prefix.length
      const selectionEnd = product.length
      inputRef.current.setSelectionRange(selectionStart, selectionEnd)
      hasSelectedRef.current = true // Mark as selected to prevent re-selection
    } else if (!isOpen) {
      hasSelectedRef.current = false // Reset when dialog closes
    }
  }, [isOpen, product])

  const handleSubmit = () => {
    if (product.trim() && onSubmit) {
      onSubmit(product.trim())
    }
  }

  const handleCancel = () => {
    setProduct(defaultProductName)
    if (onCancel) {
      onCancel()
    }
  }

  const isValidProduct = product.trim().length > 0

  const footer = (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
      <Button variant="text" onClick={handleCancel}>
        Cancel
      </Button>
      <Button variant="filled" onClick={handleSubmit} disabled={!isValidProduct}>
        Upload
      </Button>
    </div>
  )

  return (
    <Dialog isOpen={isOpen} onClose={handleCancel} header="Upload Entity" footer={footer} size="sm">
      <div style={{ padding: '16px 0' }}>
        <FormRow label="Product Name">
          <InputText
            ref={inputRef}
            placeholder="Enter product name..."
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isValidProduct) {
                e.preventDefault()
                handleSubmit()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                handleCancel()
              }
            }}
          />
        </FormRow>
      </div>
    </Dialog>
  )
}

export default EntityPanelUploaderDialog
