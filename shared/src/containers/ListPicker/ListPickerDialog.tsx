import { FC, ReactNode, useState } from 'react'
import { Button, Dialog } from '@ynput/ayon-react-components'
import type { EntityList } from '@shared/api'
import { ProjectContextProvider, useOptionalProjectContext } from '@shared/context'
import { ListPicker, ListPickerProps } from './ListPicker'

export interface ListPickerDialogProps
  extends Pick<
    ListPickerProps,
    'entityListTypes' | 'multiSelect' | 'initialSelection' | 'listFilter' | 'isListDisabled'
  > {
  projectName: string
  header?: ReactNode
  submitLabel?: string
  onSubmit: (lists: EntityList[]) => void // the button, a double-click on a list, or Enter
  onClose: () => void
}

// The list picker in a dialog. It reads the project from the page; where there is none, or it is
// another project's (the dashboard, studio pages, an addon), it brings its own.
export const ListPickerDialog: FC<ListPickerDialogProps> = ({ projectName, ...props }) => {
  const project = useOptionalProjectContext()
  const dialog = <ListPickerDialogContent {...props} />

  if (project?.projectName !== projectName) {
    return <ProjectContextProvider projectName={projectName}>{dialog}</ProjectContextProvider>
  }
  return dialog
}

const ListPickerDialogContent: FC<Omit<ListPickerDialogProps, 'projectName'>> = ({
  header,
  submitLabel,
  onSubmit,
  onClose,
  multiSelect,
  ...props
}) => {
  const [picked, setPicked] = useState<EntityList[]>([])
  const noun = multiSelect ? 'lists' : 'list'

  return (
    <Dialog
      isOpen
      onClose={onClose}
      size="full"
      className="list-picker-dialog block-shortcuts"
      header={header ?? `Select ${noun}`}
      style={{ width: '100%', maxWidth: 800, height: '80vh' }}
      footer={
        <>
          <Button label="Cancel" variant="text" onClick={onClose} />
          <Button
            label={submitLabel ?? `Select ${noun}`}
            variant="filled"
            disabled={!picked.length}
            onClick={() => onSubmit(picked)}
          />
        </>
      }
    >
      <ListPicker {...props} multiSelect={multiSelect} onSelect={setPicked} onSubmit={onSubmit} />
    </Dialog>
  )
}
