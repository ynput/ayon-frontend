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

const StyledContent = styled.div`
  padding: 0;
  cursor: pointer;
  height: 100%;
  display: flex;
  flex-direction: column;

  &.editing {
    cursor: default;
    padding: 0;
    margin: 0;
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
    height: 40px;
    border: none;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    padding: 4px;
    display: flex;
    width: unset;

    .ql-formats {
      margin-right: 8px;
      padding-right: 8px;
      border-right: 1px solid var(--md-sys-color-outline-variant);
      display: flex;
      gap: var(--base-gap-small);

      &:last-child {
        border-right: none;
      }
    }

    button {
      float: none;
      height: 32px;
      width: 32px;
      border-radius: var(--border-radius-m);
      transition: all 0.2s ease;
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;

      /* Base styling matching activity section */
      &,
      .icon {
        color: var(--md-sys-color-on-surface);
      }

      &.ql-active {
        background-color: var(--md-sys-color-secondary-container);

        .icon {
          color: var(--md-sys-color-on-secondary-container);
          font-weight: 600;
        }
      }

      &:hover {
        background-color: var(--md-sys-color-surface-container-high-hover);
      }

      &:hover.ql-active {
        background-color: var(--md-sys-color-secondary-container-hover);
      }

      /* Special styling for header dropdown when active - matching activity reference styling */
      &.ql-picker.ql-active {
        background-color: var(--md-sys-color-secondary-container);
        border: 1px solid var(--md-sys-color-outline);
        border-radius: var(--border-radius-m);

        .ql-picker-label {
          color: var(--md-sys-color-on-secondary-container);
          font-weight: 600;
        }
      }

      /* Picker dropdown styling to match activity section */
      &.ql-picker {
        background-color: var(--md-sys-color-surface-container-high);
        border-radius: var(--border-radius-m);

        &:hover {
          background-color: var(--md-sys-color-surface-container-high-hover);
        }

        &:active {
          background-color: var(--md-sys-color-surface-container-high-active);
        }
      }
    }
  }

  .ql-container.ql-snow {
    border: none;
    flex: 1;
    display: flex;
    flex-direction: column;
    max-height: calc(100% - 57px);

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

      /* Match activity section typography */
      h1 {
        font-size: 24px;
        margin-top: 16px;
        margin-bottom: 8px;
      }

      h2 {
        font-size: 20px;
        margin-top: 16px;
        margin-bottom: 8px;
      }

      h3 {
        font-size: 16px;
        margin-top: 16px;
        margin-bottom: 8px;
      }

      p {
        word-break: break-word;
        margin-bottom: 8px;
      }

      ul,
      ol {
        margin: 16px 0;
        padding-left: 20px;
      }

      blockquote {
        margin: 0;
        padding-left: 16px;
        position: relative;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: var(--md-sys-color-outline-variant);
          border-radius: 2px;
        }
      }
    }
  }
`

const StyledFooter = styled.div`
  display: flex;
  justify-content: end;
  align-items: center;
  padding: 8px;
  height: 48px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
`

const StyledMarkdown = styled.div`
  .markdown-content {
    color: var(--md-sys-color-on-surface);
    line-height: 1.5;
    white-space: normal; /* prevent preserved newlines from adding extra gaps compared to editor */

    /* Normalize spacing to match the editor */
    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      font-size: 20px;
      margin-top: 16px;
      margin-bottom: 8px;
      font-weight: 600;
    }

    /* Match editor heading sizes: Quill uses ~1.5em for H2 */
    h1 {
      font-size: 1.5rem;
    }
    h2 {
      font-size: 1.5em;
    }
    h3 {
      font-size: 1.125rem;
    }

    /* Avoid big gaps created by consecutive blank paragraphs */
    p {
      margin: 0 0 6px 0;
      &:last-child {
        margin-bottom: 0;
      }
    }

    pre {
      background-color: var(--md-sys-color-surface-container-lowest);
      padding: 8px;
      border-radius: var(--border-radius-m);
      overflow-x: auto;
      margin: 0;
      letter-spacing: 0.25px;
    }

    strong em {
      font-weight: 800 !important;
    }

    blockquote {
      border-left: 3px solid var(--md-sys-color-outline);
      margin: 8px 0;
      padding-left: 12px;
      color: var(--md-sys-color-on-surface-variant);
    }

    ul,
    ol {
      margin: 16px 0;
      padding-left: 20px !important;
    }

    /* Remove extra vertical gap when markdown renders mixed list types consecutively */
    ul + ul,
    ul + ol,
    ol + ul,
    ol + ol {
      /* Use a negative top margin to cancel the previous list's bottom margin (margin-collapsing) */
      margin-top: -16px;
    }

    ol li {
      list-style-type: decimal !important;
      list-style-position: inside !important;
    }

    ul li {
      list-style-type: circle !important;
      list-style-position: inside !important;
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
    <BorderedSection title="Description" showHeader={!isEditing} enableHover>
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
