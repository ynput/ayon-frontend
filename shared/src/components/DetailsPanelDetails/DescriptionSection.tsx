import React from 'react'
import styled from 'styled-components'
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

import { useDescriptionEditor, useQuillFormats } from './hooks'

// Custom modules function for description editor (without checklist)
const getDescriptionModules = ({ imageUploader, disableImageUpload = false }: { imageUploader: any; disableImageUpload?: boolean }) => {
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

const StyledContent = styled.div`
  padding: 8px;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;

  &.editing {
    cursor: default;
    padding: 0;
    margin: 0 -8px;
  }
`

const StyledDescription = styled.div`
  color: var(--md-sys-color-on-surface);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;

  &.empty {
    color: var(--md-sys-color-on-surface-variant);
    font-style: italic;
  }
`

const StyledEditor = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;

  .ql-toolbar.ql-snow {
    border: none;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    padding: 8px;
    display: flex;
    height: unset;
    width: unset;
    flex-shrink: 0;

    .ql-formats {
      height: 32px;
      margin-right: 8px;
      padding-right: 8px;
      border-right: 1px solid var(--md-sys-color-outline-variant);
      display: flex;
      gap: 2px;

      &:last-child {
        border-right: none;
      }
    }

    button {
      float: none;
      padding: 6px;
      border-radius: var(--border-radius-m);
      height: 32px;
      width: 32px;

      &.ql-active {
        .icon {
          color: var(--md-sys-color-on-secondary-container);
        }
      }

      &:hover {
        background-color: var(--md-sys-color-surface-container-high-hover);
      }
    }
  }

  .ql-container.ql-snow {
    border: none;
    flex: 1;
    display: flex;
    flex-direction: column;
    max-height: calc(100% - 49px);

    .ql-editor {
      padding: 12px;
      min-height: 60px;
      flex: 1;
      overflow-y: auto;

      &.ql-blank::before {
        color: var(--md-sys-color-on-surface-variant);
        opacity: 0.6;
        font-style: italic;
      }

      .ql-code-block-container {
        background-color: var(--md-sys-color-surface-container-lowest);
        padding: var(--padding-m);
        border-radius: var(--border-radius-m);
      }

      a {
        color: var(--md-sys-color-primary);
        text-decoration: none;
      }

      strong {
        em,
        u {
          font-weight: 800;
        }
      }

    }
  }
`

const StyledFooter = styled.div`
  display: flex;
  justify-content: end;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
`

const StyledMarkdown = styled.div`
  .markdown-content {
    color: var(--md-sys-color-on-surface);
    line-height: 1.5;

    p {
      margin: 0 0 8px 0;
      &:last-child {
        margin-bottom: 0;
      }
    }

    code {
      background-color: var(--md-sys-color-surface-container-lowest);
      padding: 2px 4px;
      border-radius: var(--border-radius-s);
      font-family: monospace;
    }

    pre {
      background-color: var(--md-sys-color-surface-container-lowest);
      padding: 8px;
      border-radius: var(--border-radius-m);
      overflow-x: auto;
    }

    blockquote {
      border-left: 3px solid var(--md-sys-color-outline);
      margin: 8px 0;
      padding-left: 12px;
      color: var(--md-sys-color-on-surface-variant);
    }

    ul,
    ol {
      margin: 8px 0;
      padding-left: 20px;
    }

    a {
      color: var(--md-sys-color-primary);
      text-decoration: none;
    }
  }
`

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
        <div
          style={{
            height: '20px',
            background: 'var(--md-sys-color-surface-container-low)',
            borderRadius: '4px',
          }}
        />
      </BorderedSection>
    )
  }

  return (
    <BorderedSection title="Description" showHeader={!isEditing}>
      <StyledContent
        className={clsx({ editing: isEditing })}
        onClick={!isEditing ? handleStartEditing : undefined}
      >
        {isEditing ? (
          <StyledEditor className="block-shortcuts">
            <QuillListStyles style={{ height: '100%' }}>
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
                style={{ height: '100%' }}
              />
            </QuillListStyles>
          </StyledEditor>
        ) : (
          <StyledDescription className={clsx({ empty: !description && !isMixed })}>
            {isMixed ? (
              <span
                style={{ color: 'var(--md-sys-color-on-surface-variant)', fontStyle: 'italic' }}
              >
                Multiple values
              </span>
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
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="text" label="Cancel" onClick={handleCancel} />
              <Button variant="filled" label="Save" onClick={handleSave} />
            </div>
          </StyledFooter>
        )}
      </StyledContent>
    </BorderedSection>
  )
}
