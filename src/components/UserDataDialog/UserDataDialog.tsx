import { useMemo } from 'react'
import { Button, Dialog } from '@ynput/ayon-react-components'
import { copyToClipboard } from '@shared/util'
import {
  DialogBody,
  DialogFooter,
  DialogSubtitle,
  JSON_DIALOG_STYLE,
  JsonCodeEditor,
  toJson,
} from '@components/JsonCodeEditor'

export type UserDataDialogProps = {
  /** The selected users, as the users list has them */
  users: { name?: string }[]
  onClose: () => void
}

/**
 * The selected users' data as JSON ("User Context"), from "View data" in the user details panel
 * and the member settings' more button. Read only, as the header's own dialog it replaces: the
 * JSON can be selected and copied, never typed into. Drawn in the raw settings dialogs' editor
 */
export const UserDataDialog = ({ users, onClose }: UserDataDialogProps) => {
  const code = useMemo(() => toJson(users), [users])
  const subtitle = users.length === 1 ? `users / ${users[0].name}` : `${users.length} users`

  const footer = (
    <DialogFooter>
      <Button
        label="Copy"
        icon="content_copy"
        variant="text"
        onClick={() => copyToClipboard(code)}
      />
      <span className="spacer" />
      <Button label="Close" variant="text" onClick={onClose} />
    </DialogFooter>
  )

  return (
    <Dialog
      isOpen
      size="lg"
      header="User Context"
      footer={footer}
      hideCancelButton
      onClose={onClose}
      style={JSON_DIALOG_STYLE}
    >
      <DialogBody>
        <DialogSubtitle>{subtitle}</DialogSubtitle>
        <JsonCodeEditor value={code} onChange={() => {}} readOnly />
      </DialogBody>
    </Dialog>
  )
}

export default UserDataDialog
