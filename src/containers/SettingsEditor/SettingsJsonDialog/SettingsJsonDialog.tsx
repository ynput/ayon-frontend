import { useMemo, useState } from 'react'
import isEqual from 'lodash/isEqual'
import { Button, Dialog } from '@ynput/ayon-react-components'
import { copyToClipboard } from '@shared/util'
import {
  DialogBody,
  DialogFooter,
  DialogSubtitle,
  JSON_DIALOG_STYLE,
  JsonCodeEditor,
  getJsonProblem,
  parseJson,
  toJson,
} from '@components/JsonCodeEditor'

export type SettingsJsonDialogProps = {
  /** The group's title */
  title: string
  /** Where the group sits in the settings */
  path: string[]
  /** The group's value when the dialog opened */
  value: unknown
  /** Why the value can't be changed (no edit permissions, or it holds read-only settings): the
   * JSON can be read and copied, and Confirm is greyed out with this as its tooltip */
  readOnlyReason?: string
  /** Sets the value in the form, unsaved. Returns false when the editor refuses it (it says why) */
  onApply: (value: unknown) => boolean | void
  onClose: () => void
}

/**
 * A group's raw settings (JSON), to read or edit in one go: opened from the right-click menu of
 * a group's title. Confirming sets the value in the form like an edit, saved with the others
 */
export const SettingsJsonDialog = ({
  title,
  path,
  value,
  readOnlyReason,
  onApply,
  onClose,
}: SettingsJsonDialogProps) => {
  const readOnly = !!readOnlyReason
  const [code, setCode] = useState(() => toJson(value))
  const parsed = useMemo(() => parseJson(code), [code])
  // a value that doesn't parse, or isn't of the group's kind, is never confirmed
  const problem = getJsonProblem(parsed, value)
  const changed = !readOnly && !problem && !isEqual(parsed.value, value)

  const confirm = () => {
    if (!changed) return
    if (onApply(parsed.value) === false) return
    onClose()
  }

  const footer = (
    <DialogFooter>
      <Button
        label="Copy"
        icon="content_copy"
        variant="text"
        onClick={() => copyToClipboard(code)}
      />
      {!readOnly && (
        <Button
          label="Format"
          icon="format_align_left"
          variant="text"
          disabled={parsed.error !== undefined}
          onClick={() => parsed.error === undefined && setCode(toJson(parsed.value))}
        />
      )}
      <span className="spacer" />
      <Button label={readOnly ? 'Close' : 'Cancel'} variant="text" onClick={onClose} />
      {/* a span: a disabled button shows no tooltip */}
      <span data-tooltip={readOnlyReason}>
        <Button
          label="Confirm"
          icon="check"
          variant="filled"
          disabled={!changed}
          onClick={confirm}
        />
      </span>
    </DialogFooter>
  )

  return (
    <Dialog
      isOpen
      size="lg"
      header={`${title} raw settings`}
      footer={footer}
      hideCancelButton
      onClose={onClose}
      style={JSON_DIALOG_STYLE}
    >
      <DialogBody>
        <DialogSubtitle>{path.length ? path.join(' / ') : 'All settings'}</DialogSubtitle>
        <JsonCodeEditor
          value={code}
          onChange={setCode}
          error={readOnly ? undefined : problem}
          readOnly={readOnly}
        />
      </DialogBody>
    </Dialog>
  )
}
