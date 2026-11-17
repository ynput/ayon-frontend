import { ReactNode } from 'react'
import clsx from 'clsx'
import { CodeEditor } from '@shared/components/CodeEditor'
import * as Styled from './JsonCodeEditor.styled'

export type JsonCodeEditorProps = {
  value: string
  onChange: (value: string) => void
  /** Why the value can't be used (it doesn't parse, or isn't of the right kind): shown under
   * the editor, which gets a red frame */
  error?: string
  /** Laid over the editor (the low-level editor's warning) */
  overlay?: ReactNode
  /** The editor can't be reached (mouse, keyboard, screen readers) while the overlay asks first */
  locked?: boolean
}

/**
 * The editor of the raw settings dialogs (a group's, SettingsJsonDialog, and an addon's
 * overrides, RawSettingsDialog): coloured JSON, indented with 2 spaces
 */
export const JsonCodeEditor = ({
  value,
  onChange,
  error,
  overlay,
  locked,
}: JsonCodeEditorProps) => (
  <>
    <Styled.Wrapper>
      <Styled.Frame
        className={clsx('json-code-editor', error && 'has-error', locked && 'is-locked')}
        // React 18 has no inert prop: an empty attribute turns it on
        {...(locked ? { inert: '' } : {})}
      >
        <CodeEditor
          value={value}
          language="json"
          padding={12}
          onChange={(event) => onChange(event.target.value)}
        />
      </Styled.Frame>
      {overlay}
    </Styled.Wrapper>
    {error && <Styled.ErrorMessage>{error}</Styled.ErrorMessage>}
  </>
)
