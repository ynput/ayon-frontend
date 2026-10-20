import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { Button, SaveButton } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { MarkdownEditor } from '@shared/components/MarkdownEditor'
import { DESCRIPTION_TOOLBAR } from '@shared/components/DetailsPanelDetails/DescriptionSection'
import { useUpdateBundleMutation } from '@shared/api'
import * as Styled from './BundleNote.styled'

type BundleNoteProps = {
  bundle: { name: string; description?: string | null }
}

const BundleNote: React.FC<BundleNoteProps> = ({ bundle }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editorValue, setEditorValue] = useState('')
  const [updateBundle, { isLoading: isSaving }] = useUpdateBundleMutation()

  const description = bundle.description || ''

  const handleStartEditing = () => {
    setEditorValue(description)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditorValue('')
  }

  const handleSave = async () => {
    const nextDescription = editorValue.trim() ? editorValue : null
    if (nextDescription === (bundle.description || null)) return handleCancel()

    const args = {
      bundleName: bundle.name,
      bundlePatchModel: { description: nextDescription },
      patch: { ...bundle, description: nextDescription },
    }
    try {
      await updateBundle(args).unwrap()
      toast.success('Bundle description saved')
      handleCancel()
    } catch (error) {
      toast.error((error as any)?.data?.detail || 'Failed to save bundle description')
    }
  }

  const handleContentClick = (e: React.MouseEvent) => {
    if (isEditing) return
    if ((e.target as HTMLElement).closest('a')) return e.stopPropagation()
    handleStartEditing()
  }

  return (
    <Styled.NoteSection
      title="Description"
      autoHeight
      showHeader={!isEditing}
      enableHover={!isEditing}
      onClick={!isEditing ? handleStartEditing : undefined}
    >
      <Styled.Content className={clsx({ editing: isEditing })} onClick={handleContentClick}>
        <Styled.Editor className="block-shortcuts">
          <MarkdownEditor
            key={isEditing ? 'edit' : 'view'}
            value={isEditing ? editorValue : description}
            onChange={isEditing ? setEditorValue : undefined}
            placeholder={
              isEditing
                ? 'Describe it, or type / to add headings, lists, code and more...'
                : 'Add a description...'
            }
            readOnly={!isEditing}
            toolbar={isEditing ? DESCRIPTION_TOOLBAR : false}
            bordered={false}
            autoFocus={isEditing}
            minHeight={isEditing ? 60 : 20}
            maxHeight={isEditing ? 400 : 240}
            onSubmit={isEditing ? handleSave : undefined}
            onEscape={isEditing ? handleCancel : undefined}
          />
        </Styled.Editor>
        {isEditing && (
          <Styled.Footer>
            <Button variant="text" label="Cancel" onClick={handleCancel} disabled={isSaving} />
            <SaveButton label="Save" onClick={handleSave} active saving={isSaving} />
          </Styled.Footer>
        )}
      </Styled.Content>
    </Styled.NoteSection>
  )
}

type BundleDescriptionFieldProps = {
  value?: string | null
  onChange: (value: string) => void
}

export const BundleDescriptionField: React.FC<BundleDescriptionFieldProps> = ({
  value,
  onChange,
}) => (
  <Styled.NoteSection title="Description" autoHeight showHeader>
    <Styled.Content className="editing">
      <Styled.Editor className="block-shortcuts">
        <MarkdownEditor
          value={value || ''}
          onChange={onChange}
          placeholder="Describe it, or type / to add headings, lists, code and more..."
          toolbar={DESCRIPTION_TOOLBAR}
          bordered={false}
          minHeight={60}
          maxHeight={400}
        />
      </Styled.Editor>
    </Styled.Content>
  </Styled.NoteSection>
)

export default BundleNote
