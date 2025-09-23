import { FC, useState, useCallback, useEffect } from 'react'
import { Dialog, Button, Spacer } from '@ynput/ayon-react-components'
import { EnumEditorItem, AttributeData } from '@shared/components/EnumEditor'
import { uniqueId } from 'lodash'
import styled from 'styled-components'

const DialogContent = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 300px;
`

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
`

interface CategoryFormData {
  label: string
  value: string
  icon?: string
  color?: string
}

interface ListCategoryFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSaveCategory: (category: CategoryFormData) => Promise<void>
  listCount?: number
  mode?: 'create' | 'edit'
  initialCategory?: CategoryFormData
}

export const ListCategoryFormDialog: FC<ListCategoryFormDialogProps> = ({
  isOpen,
  onClose,
  onSaveCategory,
  listCount = 1,
  mode = 'create',
  initialCategory,
}) => {
  const [categoryData, setCategoryData] = useState<AttributeData>(() => ({
    id: uniqueId(),
    isExpanded: true,
    label: initialCategory?.label || '',
    value: initialCategory?.value || '',
    icon: initialCategory?.icon,
    color: initialCategory?.color,
    isLabelFocused: true,
    isNewAttribute: mode === 'create',
  }))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update category data when initial category changes (for edit mode)
  useEffect(() => {
    if (isOpen) {
      setCategoryData({
        id: uniqueId(),
        isExpanded: true,
        label: initialCategory?.label || '',
        value: initialCategory?.value || '',
        icon: initialCategory?.icon,
        color: initialCategory?.color,
        isLabelFocused: true,
        isNewAttribute: mode === 'create',
      })
      setError(null)
    }
  }, [isOpen, initialCategory, mode])

  const handleSave = useCallback(async () => {
    if (!categoryData.label.trim()) {
      setError('Category label is required')
      return
    }

    if (!categoryData.value.trim()) {
      setError('Category value is required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSaveCategory({
        label: categoryData.label.trim(),
        value: categoryData.value.trim(),
        icon: categoryData.icon,
        color: categoryData.color,
      })
      setCategoryData({
        id: uniqueId(),
        isExpanded: true,
        label: '',
        value: '',
        isLabelFocused: true,
        isNewAttribute: true,
      })
      onClose()
    } catch (error) {
      console.error(`Failed to ${mode} category:`, error)
      setError(`Failed to ${mode} category`)
    } finally {
      setIsSaving(false)
    }
  }, [categoryData, onSaveCategory, onClose, mode])

  const handleCancel = useCallback(() => {
    setCategoryData({
      id: uniqueId(),
      isExpanded: true,
      label: '',
      value: '',
      isLabelFocused: true,
      isNewAttribute: true,
    })
    setError(null)
    onClose()
  }, [onClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave()
      } else if (e.key === 'Escape') {
        handleCancel()
      }
    },
    [handleSave, handleCancel],
  )

  const handleCategoryChange = useCallback(
    (attrs: (keyof AttributeData)[], values: (boolean | string | undefined)[]) => {
      setCategoryData((prev) => {
        const updated = { ...prev }
        attrs.forEach((attr, index) => {
          ;(updated as any)[attr] = values[index]
        })
        return updated
      })
      setError(null)
    },
    [],
  )

  const isValid = categoryData.label.trim() && categoryData.value.trim()

  const getDialogHeader = () => {
    if (mode === 'edit') {
      return 'Edit Category'
    }
    return listCount > 1 ? `Create Category for ${listCount} Lists` : 'Create Category'
  }

  const getButtonLabel = () => {
    if (isSaving) {
      return mode === 'edit' ? 'Saving...' : 'Creating...'
    }
    return mode === 'edit' ? 'Save' : 'Create'
  }

  return (
    <Dialog
      header={getDialogHeader()}
      isOpen={isOpen}
      onClose={handleCancel}
      size="md"
      onKeyDown={handleKeyDown}
    >
      <DialogContent>
        {mode === 'create' && listCount > 1 && (
          <p style={{ margin: '0 0 16px 0', color: 'var(--color-text-dim)', fontSize: '14px' }}>
            This category will be assigned to {listCount} selected lists.
          </p>
        )}
        <EnumEditorItem
          item={categoryData}
          onChange={handleCategoryChange}
          showRemoveButton={false}
          showDuplicateButton={false}
          autoFocus={true}
        />
        {error && <span style={{ color: 'var(--color-hl-error)', fontSize: '14px' }}>{error}</span>}
        <ButtonGroup>
          <Button variant="text" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Spacer />
          <Button onClick={handleSave} disabled={!isValid || isSaving}>
            {getButtonLabel()}
          </Button>
        </ButtonGroup>
      </DialogContent>
    </Dialog>
  )
}

export default ListCategoryFormDialog
