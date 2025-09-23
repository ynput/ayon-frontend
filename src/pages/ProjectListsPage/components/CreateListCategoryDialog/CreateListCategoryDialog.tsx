import { FC, useState, useCallback } from 'react'
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

interface CreateListCategoryDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreateCategory: (category: {
    label: string
    value: string
    icon?: string
    color?: string
  }) => Promise<void>
  listCount?: number
}

export const CreateListCategoryDialog: FC<CreateListCategoryDialogProps> = ({
  isOpen,
  onClose,
  onCreateCategory,
  listCount = 1,
}) => {
  const [categoryData, setCategoryData] = useState<AttributeData>(() => ({
    id: uniqueId(),
    isExpanded: true,
    label: '',
    value: '',
    isLabelFocused: true,
    isNewAttribute: true,
  }))
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = useCallback(async () => {
    if (!categoryData.label.trim()) {
      setError('Category label is required')
      return
    }

    if (!categoryData.value.trim()) {
      setError('Category value is required')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      await onCreateCategory({
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
      console.error('Failed to create category:', error)
      setError('Failed to create category')
    } finally {
      setIsCreating(false)
    }
  }, [categoryData, onCreateCategory, onClose])

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
        handleCreate()
      } else if (e.key === 'Escape') {
        handleCancel()
      }
    },
    [handleCreate, handleCancel],
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

  return (
    <Dialog
      header={listCount > 1 ? `Create Category for ${listCount} Lists` : 'Create Category'}
      isOpen={isOpen}
      onClose={handleCancel}
      size="md"
      onKeyDown={handleKeyDown}
    >
      <DialogContent>
        {listCount > 1 && (
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
          <Button variant="text" onClick={handleCancel} disabled={isCreating}>
            Cancel
          </Button>
          <Spacer />
          <Button onClick={handleCreate} disabled={!isValid || isCreating}>
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </ButtonGroup>
      </DialogContent>
    </Dialog>
  )
}

export default CreateListCategoryDialog
