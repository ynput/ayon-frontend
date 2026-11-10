import { Icon } from '@ynput/ayon-react-components'
import { newEntityDefinitions, useNewEntityContext } from '@shared/containers/NewEntity'
import * as ShellStyled from '@containers/MobileShell/MobileShell.styled'
import { SHEET_MASK_STYLE } from '@containers/MobileShell/MobileShellHelpers'

export type CreateSheetTarget = { folderId?: string; folderLabel?: string }

type Props = {
  target: CreateSheetTarget | null
  onHide: () => void
  onOpenDetails: (folderId: string) => void
}

const MobileCreateSheet = ({ target, onHide, onOpenDetails }: Props) => {
  const { onOpenNew } = useNewEntityContext()
  const folderId = target?.folderId
  const parentFolderIds = folderId ? [folderId] : undefined

  const open = (type: 'folder' | 'task', isSequence?: boolean) => {
    onHide()
    onOpenNew(type, { isSequence, parentFolderIds })
  }

  return (
    <ShellStyled.Sheet
      position="bottom"
      visible={!!target}
      onHide={onHide}
      showCloseIcon={false}
      blockScroll
      maskStyle={SHEET_MASK_STYLE}
    >
      <ShellStyled.SheetTitle>
        {target?.folderLabel ? `In ${target.folderLabel}` : 'Create at the project root'}
      </ShellStyled.SheetTitle>
      {folderId && (
        <ShellStyled.SheetSection>
          <ShellStyled.SheetButton
            type="button"
            onClick={() => {
              onHide()
              onOpenDetails(folderId)
            }}
          >
            <Icon icon="info" />
            <span>Open details</span>
          </ShellStyled.SheetButton>
        </ShellStyled.SheetSection>
      )}
      <ShellStyled.SheetSection>
        <ShellStyled.SheetButton type="button" disabled={!folderId} onClick={() => open('task')}>
          <Icon icon={newEntityDefinitions.task.icon} />
          <span>{folderId ? 'New task' : 'New task (open a folder’s … menu)'}</span>
        </ShellStyled.SheetButton>
        <ShellStyled.SheetButton type="button" onClick={() => open('folder')}>
          <Icon icon={newEntityDefinitions.folder.icon} />
          <span>New folder</span>
        </ShellStyled.SheetButton>
        <ShellStyled.SheetButton type="button" onClick={() => open('folder', true)}>
          <Icon icon="topic" />
          <span>New folder sequence</span>
        </ShellStyled.SheetButton>
      </ShellStyled.SheetSection>
    </ShellStyled.Sheet>
  )
}

export default MobileCreateSheet
