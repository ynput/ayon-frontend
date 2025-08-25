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

import { getModules } from '@shared/containers/Feed/components/CommentInput/modules'
import CommentMentionSelect from '@shared/containers/Feed/components/CommentMentionSelect/CommentMentionSelect'
import {
  useDescriptionEditor,
  useMentionSystem,
  useQuillFormats,
} from './hooks'

const StyledContent = styled.div`
  padding: 8px;
  min-height: 60px;
  cursor: pointer;

  &.editing {
    cursor: default;
    padding: 0;
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
  .ql-toolbar.ql-snow {
    border: none;
    border-bottom: 1px solid var(--md-sys-color-outline-variant);
    padding: 8px;
    display: flex;
    height: unset;
    width: unset;

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
    height: calc(100% - 41px);

    .ql-editor {
      padding: 12px;
      min-height: 60px;
      max-height: 200px;
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

      .mention {
        border-radius: var(--border-radius-m);
        user-select: none;
        padding: 0 4px;
        text-decoration: none;

        white-space: nowrap;
        cursor: pointer;

        color: var(--md-sys-color-primary);
        background-color: var(--md-sys-color-surface-container-high);

        &:hover {
          background-color: var(--md-sys-color-surface-container-high-hover);
        }
        &:active {
          background-color: var(--md-sys-color-surface-container-high-active);
        }
      }
    }
  }
`

const StyledFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-top: 1px solid var(--md-sys-color-outline-variant);
  background-color: var(--md-sys-color-surface-container);
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

  const {
    feedContext,
    projectName,
    mention,
    mentionSelectedIndex,
    mentionOptions,
    mentionTypes,
    mentionTypeOptions,
    handleSelectMention,
    handleMentionButton,
    handleMentionKeyDown,
    handleMentionChange,
  } = useMentionSystem({
    editorRef,
    isEditing,
    setEditorValue,
  })

  const conditionalFormats = useQuillFormats({ feedContext, projectName })

  // Combine keyboard handlers
  const handleCombinedKeyDown = (e: React.KeyboardEvent) => {
    handleMentionKeyDown(e)
    handleKeyDown(e)
  }

  // Combine change handlers
  const handleCombinedChange = (content: string, delta: any, source: any, editor: any) => {
    handleMentionChange(content, delta, source, editor)
  }

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
    <BorderedSection title="Description">
      <StyledContent
        className={clsx({ editing: isEditing })}
        onClick={!isEditing ? handleStartEditing : undefined}
      >
        {isEditing ? (
          <StyledEditor className="block-shortcuts">
            <ReactQuill
              key={`description-editor-${isEditing}`}
              theme="snow"
              ref={editorRef}
              value={editorValue}
              onChange={handleCombinedChange}
              placeholder={
                feedContext
                  ? 'Add a description or mention with @user, @@version, @@@task...'
                  : 'Add a description...'
              }
              modules={getModules({ imageUploader: null, disableImageUpload: true })}
              formats={conditionalFormats}
              onKeyDown={handleCombinedKeyDown}
            />
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
            {feedContext && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button
                  icon="person"
                  variant="text"
                  onClick={() => handleMentionButton('@')}
                  data-tooltip={'Mention user'}
                  data-shortcut={'@'}
                />
                <Button
                  icon="layers"
                  variant="text"
                  onClick={() => handleMentionButton('@@')}
                  data-tooltip={'Mention version'}
                  data-shortcut={'@@'}
                />
                <Button
                  icon="check_circle"
                  variant="text"
                  onClick={() => handleMentionButton('@@@')}
                  data-tooltip={'Mention task'}
                  data-shortcut={'@@@'}
                />
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="text" label="Cancel" onClick={handleCancel} />
              <Button variant="filled" label="Save" onClick={handleSave} />
            </div>
          </StyledFooter>
        )}

        {feedContext && (
          <CommentMentionSelect
            mention={mention}
            options={mentionOptions}
            onChange={handleSelectMention}
            types={mentionTypes}
            // @ts-ignore
            config={mentionTypeOptions[mention?.type]}
            noneFound={!mentionOptions.length && mention?.search}
            noneFoundAtAll={!mentionOptions.length && !mention?.search}
            selectedIndex={mentionSelectedIndex}
          />
        )}
      </StyledContent>
    </BorderedSection>
  )
}
