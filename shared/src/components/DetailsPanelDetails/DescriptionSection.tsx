import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@ynput/ayon-react-components'
import ReactQuill from 'react-quill-ayon'
import clsx from 'clsx'
import { BorderedSection } from './BorderedSection'
import { QuillListStyles } from '../QuillListStyles'
import {
  StyledContent,
  StyledEditor,
  StyledFooter,
  StyledLoadingSkeleton,
  StyledButtonContainer,
  StyledQuillContainer,
  StyledHiddenMarkdown,
} from './DescriptionSection.styles'
import InputMarkdownConvert from '@shared/containers/Feed/components/CommentInput/InputMarkdownConvert'
import { mentionTypeOptions, useDescriptionEditor, useQuillFormats } from './hooks'

// Custom modules function for description editor (without checklist)
const getDescriptionModules = ({
  imageUploader,
  disableImageUpload = false,
}: {
  imageUploader: any
  disableImageUpload?: boolean
}) => {
  const toolbar = [
    [{ header: 2 }, 'bold', 'italic', 'link', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }], // Removed { list: 'check' }
  ]

  if (!disableImageUpload) {
    toolbar.push(['image'])
  }

  return {
    toolbar,
    imageUploader,
    magicUrl: true,
  }
}

interface DescriptionSectionProps {
  description: string
  isMixed: boolean
  enableEditing: boolean
  onChange: (description: string) => void
  isLoading: boolean
}

export const DescriptionSection: React.FC<DescriptionSectionProps> = ({
  description,
  isMixed,
  enableEditing,
  onChange,
  isLoading,
}) => {
  const markdownRef = useRef<HTMLDivElement>(null)
  const [descriptionHtml, setDescriptionHtml] = useState('')

  useEffect(() => {
    if (!description?.trim()) {
      setDescriptionHtml('')
      return
    }

    if (!markdownRef.current) return

    const html = markdownRef.current.innerHTML
    setDescriptionHtml(html)
  }, [description])

  // Use custom hooks to manage state and logic
  const {
    isEditing,
    editorValue,
    setEditorValue,
    editorRef,
    handleStartEditing,
    handleSave,
    handleCancel,
    handleKeyDown,
  } = useDescriptionEditor({
    descriptionHtml,
    enableEditing,
    isMixed,
    onChange,
  })

  const conditionalFormats = useQuillFormats()

  if (isLoading) {
    return (
      <BorderedSection title="Description">
        <StyledLoadingSkeleton />
      </BorderedSection>
    )
  }

  // Handle clicks on links to prevent edit mode activation
  const handleContentClick = (e: React.MouseEvent) => {
    // If we're in editing mode, don't prevent default behavior for links
    if (isEditing) {
      return
    }

    // Check if the clicked element is a link or inside a link
    const target = e.target as HTMLElement
    const link = target.closest('a')

    if (link) {
      // If clicking on a link, prevent the edit mode from activating
      e.stopPropagation()
      return
    }

    // For other clicks when not editing, allow edit mode to activate
    if (!isEditing) {
      handleStartEditing()
    }
  }

  const quillValue = isEditing ? editorValue : descriptionHtml

  return (
    <BorderedSection
      title="Description"
      showHeader={!isEditing}
      enableHover={!isEditing}
      onClick={!isEditing ? handleStartEditing : undefined}
    >
      <StyledContent
        className={clsx({ editing: isEditing })}
        onClick={handleContentClick}
      >
        <StyledEditor className="block-shortcuts">
          <QuillListStyles style={isEditing ? { height: 'auto' } : undefined}>
            <StyledQuillContainer style={isEditing ? { height: 'auto' } : undefined}>
              <ReactQuill
                key={`description-editor-${isEditing}`}
                theme="snow"
                ref={editorRef}
                value={quillValue}
                onChange={setEditorValue}
                placeholder="Add a description..."
                modules={
                  isEditing
                    ? getDescriptionModules({ imageUploader: null, disableImageUpload: true })
                    : { toolbar: false }
                }
                formats={conditionalFormats}
                onKeyDown={handleKeyDown}
                readOnly={!isEditing}
              />
            </StyledQuillContainer>
          </QuillListStyles>
        </StyledEditor>
        {isEditing && (
          <StyledFooter>
            <StyledButtonContainer>
              <Button variant="text" label="Cancel" onClick={handleCancel} />
              <Button variant="filled" label="Save" onClick={handleSave} />
            </StyledButtonContainer>
          </StyledFooter>
        )}
      </StyledContent>
      <StyledHiddenMarkdown ref={markdownRef}>
        <InputMarkdownConvert
          typeOptions={mentionTypeOptions}
          initValue={description || ''}
        />
      </StyledHiddenMarkdown>
    </BorderedSection>
  )
}
