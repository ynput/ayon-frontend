import React, { useEffect } from 'react'
import { Button, BorderedSection } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { MarkdownEditor, type ToolbarLayout } from '@shared/components/MarkdownEditor'
import {
  StyledContent,
  StyledEditor,
  StyledFooter,
  StyledLoadingSkeleton,
  StyledButtonContainer,
} from './DescriptionSection.styles'
import {
  useDescriptionEditor,
  useDescriptionMentions,
  type DescriptionMentionsContext,
} from './hooks'

// descriptions have no check lists (those belong in comments)
const DESCRIPTION_TOOLBAR: ToolbarLayout = [
  'h1',
  'h2',
  'h3',
  '|',
  'bold',
  'italic',
  'strikethrough',
  'link',
  '|',
  'codeBlock',
  'quote',
  '|',
  'numberList',
  'bulletList',
]

interface DescriptionSectionProps {
  description: string
  isLarge?: boolean
  isMixed: boolean
  enableEditing: boolean
  initialEdit?: boolean
  onChange: (description: string) => void
  onCancel?: () => void
  isLoading: boolean
  // enables mentions of users, sibling tasks and versions of this entity
  mentionsContext?: DescriptionMentionsContext
  onMentionClick?: (mention: { type: string; id: string; label: string }) => void
  onMentionHover?: (
    mention: { type: string; id: string; label: string },
    target: HTMLElement,
  ) => void
}

export const DescriptionSection: React.FC<DescriptionSectionProps> = ({
  description,
  isLarge = true,
  isMixed,
  enableEditing,
  initialEdit,
  onChange,
  onCancel,
  isLoading,
  mentionsContext,
  onMentionClick,
  onMentionHover,
}) => {
  const { isEditing, editorValue, setEditorValue, handleStartEditing, handleSave, handleCancel } =
    useDescriptionEditor({
      description,
      enableEditing,
      isMixed,
      onChange,
    })

  const mentions = useDescriptionMentions(mentionsContext, { skip: !isEditing })

  useEffect(() => {
    if (initialEdit && !isEditing) {
      handleStartEditing()
    }
  }, [initialEdit])

  if (isLoading) {
    return (
      <BorderedSection title="Description">
        <StyledLoadingSkeleton />
      </BorderedSection>
    )
  }

  // Handle clicks on links to prevent edit mode activation
  const handleContentClick = (e: React.MouseEvent) => {
    if (isEditing) return

    // links open in a new tab and mentions open the entity instead
    const target = e.target as HTMLElement
    if (target.closest('a') || (onMentionClick && target.closest('.mention'))) {
      e.stopPropagation()
      return
    }

    handleStartEditing()
  }

  const handleCancelEdit = () => {
    handleCancel()
    onCancel?.()
  }

  return (
    <BorderedSection
      title="Description"
      showHeader={!isEditing}
      enableHover={!isEditing}
      onClick={!isEditing ? handleStartEditing : undefined}
      description={isLarge}
    >
      <StyledContent className={clsx({ editing: isEditing })} onClick={handleContentClick}>
        <StyledEditor className="block-shortcuts">
          {/* remount between viewing and editing: view shows the saved value, edit the draft */}
          <MarkdownEditor
            key={isEditing ? 'edit' : 'view'}
            className="description-editor"
            value={isEditing ? editorValue : description || ''}
            onChange={isEditing ? setEditorValue : undefined}
            placeholder={
              isEditing
                ? 'Describe it, or type / to add headings, lists, mentions, code and more...'
                : 'Add a description...'
            }
            mentions={isEditing ? mentions : undefined}
            onMentionClick={onMentionClick}
            onMentionHover={onMentionHover}
            readOnly={!isEditing}
            toolbar={isEditing ? DESCRIPTION_TOOLBAR : false}
            bordered={false}
            autoFocus={isEditing}
            minHeight={isEditing ? 60 : 20}
            onSubmit={isEditing ? handleSave : undefined}
            onEscape={isEditing ? handleCancelEdit : undefined}
          />
        </StyledEditor>
        {isEditing && (
          <StyledFooter>
            <StyledButtonContainer>
              <Button variant="text" label="Cancel" onClick={handleCancelEdit} />
              <Button variant="filled" label="Save" onClick={handleSave} />
            </StyledButtonContainer>
          </StyledFooter>
        )}
      </StyledContent>
    </BorderedSection>
  )
}
