import React from 'react'
import { Button } from '@ynput/ayon-react-components'
import ReactQuill from 'react-quill-ayon'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import emoji from 'remark-emoji'
import remarkDirective from 'remark-directive'
import remarkDirectiveRehype from 'remark-directive-rehype'
import clsx from 'clsx'
import { BorderedSection } from './BorderedSection'
import { QuillListStyles } from '../QuillListStyles'
import {
  StyledContent,
  StyledDescription,
  StyledEditor,
  StyledFooter,
  StyledMarkdown,
  StyledLoadingSkeleton,
  StyledMultipleValues,
  StyledButtonContainer,
  StyledQuillContainer,
} from './DescriptionSection.styles'

import { useDescriptionEditor, useQuillFormats } from './hooks'

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
    description,
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

  return (
    <BorderedSection title="Description" showHeader={!isEditing} enableHover>
      <StyledContent
        className={clsx({ editing: isEditing })}
        onClick={!isEditing ? handleStartEditing : undefined}
      >
        {isEditing ? (
          <StyledEditor className="block-shortcuts">
            <QuillListStyles>
              <StyledQuillContainer>
                <ReactQuill
                  key={`description-editor-${isEditing}`}
                  theme="snow"
                  ref={editorRef}
                  value={editorValue}
                  onChange={setEditorValue}
                  placeholder="Add a description..."
                  modules={getDescriptionModules({ imageUploader: null, disableImageUpload: true })}
                  formats={conditionalFormats}
                  onKeyDown={handleKeyDown}
                />
              </StyledQuillContainer>
            </QuillListStyles>
          </StyledEditor>
        ) : (
          <StyledDescription className={clsx({ empty: !description && !isMixed })}>
            {isMixed ? (
              <StyledMultipleValues>
                Multiple values
              </StyledMultipleValues>
            ) : description ? (
              <StyledMarkdown>
                <ReactMarkdown
                  className="markdown-content"
                  remarkPlugins={[remarkGfm, emoji, remarkDirective, remarkDirectiveRehype]}
                >
                  {description}
                </ReactMarkdown>
              </StyledMarkdown>
            ) : (
              ''
            )}
          </StyledDescription>
        )}
        {isEditing && (
          <StyledFooter>
            <StyledButtonContainer>
              <Button variant="text" label="Cancel" onClick={handleCancel} />
              <Button variant="filled" label="Save" onClick={handleSave} />
            </StyledButtonContainer>
          </StyledFooter>
        )}
      </StyledContent>
    </BorderedSection>
  )
}
