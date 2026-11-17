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
  onApply,
  onClose,
}: SettingsJsonDialogProps) => {
  const [code, setCode] = useState(() => toJson(value))
  const parsed = useMemo(() => parseJson(code), [code])
  // a value that doesn't parse, or isn't of the group's kind, is never confirmed
  const problem = getJsonProblem(parsed, value)
  const changed = !problem && !isEqual(parsed.value, value)

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
      <Button
        label="Format"
        icon="format_align_left"
        variant="text"
        disabled={parsed.error !== undefined}
        onClick={() => parsed.error === undefined && setCode(toJson(parsed.value))}
      />
      <span className="spacer" />
      <Button label="Cancel" variant="text" onClick={onClose} />
      <Button label="Confirm" icon="check" variant="filled" disabled={!changed} onClick={confirm} />
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
        <JsonCodeEditor value={code} onChange={setCode} error={problem} />
      </DialogBody>
    </Dialog>
  )
}
