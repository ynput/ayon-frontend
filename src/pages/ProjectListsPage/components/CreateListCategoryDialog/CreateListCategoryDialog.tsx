import { FC, useState, useCallback } from 'react'
import { Dialog, InputText, Button, Spacer } from '@ynput/ayon-react-components'
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
  onCreateCategory: (categoryName: string) => Promise<void>
  existingCategories?: string[]
  listCount?: number
}

export const CreateListCategoryDialog: FC<CreateListCategoryDialogProps> = ({
  isOpen,
  onClose,
  onCreateCategory,
  existingCategories = [],
  listCount = 1,
}) => {
  const [categoryName, setCategoryName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = useCallback(async () => {
    if (!categoryName.trim()) {
      setError('Category name is required')
      return
    }

    if (existingCategories.includes(categoryName.trim())) {
      setError('Category already exists')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      await onCreateCategory(categoryName.trim())
      setCategoryName('')
      onClose()
    } catch (error) {
      console.error('Failed to create category:', error)
      setError('Failed to create category')
    } finally {
      setIsCreating(false)
    }
  }, [categoryName, existingCategories, onCreateCategory, onClose])

  const handleCancel = useCallback(() => {
    setCategoryName('')
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

  return (
    <Dialog
      header={listCount > 1 ? `Create Category for ${listCount} Lists` : 'Create Category'}
      isOpen={isOpen}
      onClose={handleCancel}
      size="sm"
    >
      <DialogContent>
        {listCount > 1 && (
          <p style={{ margin: '0 0 8px 0', color: 'var(--color-text-dim)', fontSize: '14px' }}>
            This category will be assigned to {listCount} selected lists.
          </p>
        )}
        <InputText
          placeholder="Enter category name"
          value={categoryName}
          onChange={(e) => {
            setCategoryName(e.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          autoFocus
          disabled={isCreating}
        />
        {error && <span style={{ color: 'var(--color-hl-error)', fontSize: '14px' }}>{error}</span>}
        <ButtonGroup>
          <Button variant="text" onClick={handleCancel} disabled={isCreating}>
            Cancel
          </Button>
          <Spacer />
          <Button onClick={handleCreate} disabled={!categoryName.trim() || isCreating}>
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </ButtonGroup>
      </DialogContent>
    </Dialog>
  )
}

export default CreateListCategoryDialog
