import { FC, useMemo } from 'react'
import styled from 'styled-components'
import { Icon } from '@ynput/ayon-react-components'
import CodeEditor from '@uiw/react-textarea-code-editor'

import { copyToClipboard } from '@shared/util'

const Container = styled.div`
  position: relative;
  overflow: auto;
  border-radius: var(--border-radius-m);

  .json-viewer__copy {
    position: absolute;
    right: 12px;
    top: 12px;
    z-index: 10;
    background: rgba(0, 0, 0, 0.5);
    border-radius: var(--border-radius-m);
    padding: 6px;
    cursor: pointer;
    display: none;
    align-items: center;
    justify-content: center;
  }

  &:hover .json-viewer__copy,
  &:focus-within .json-viewer__copy {
    display: flex;
  }

  .w-tc-editor {
    background-color: var(--md-sys-color-surface-container) !important;
  }

  .w-tc-editor .token.property {
    color: #c9a5f7 !important;
  }
  .w-tc-editor .token.string {
    color: #6bc985 !important;
  }
  .w-tc-editor .token.number,
  .w-tc-editor .token.boolean {
    color: #e5a66b !important;
  }
  .w-tc-editor .token.null {
    color: #7a8a99 !important;
  }
  .w-tc-editor .token.punctuation,
  .w-tc-editor .token.operator {
    color: #b0bec5 !important;
  }

  /* read only: the textarea only steals focus and shows a caret */
  .w-tc-editor textarea {
    display: none !important;
  }
`

export interface JsonViewerProps {
  value: unknown
  wrap?: boolean
  className?: string
}

export const JsonViewer: FC<JsonViewerProps> = ({ value, wrap, className }) => {
  const json = useMemo(() => {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }, [value])

  return (
    <Container className={className}>
      <div
        role="button"
        aria-label="Copy JSON"
        onClick={() => copyToClipboard(json)}
        className="json-viewer__copy"
      >
        <Icon icon="content_copy" data-tooltip="Copy to clipboard" />
      </div>
      <CodeEditor
        wrap={wrap ? 'soft' : 'off'}
        value={json}
        language="json"
        readOnly
        data-color-mode="dark"
        style={{ fontSize: 12 }}
      />
    </Container>
  )
}
