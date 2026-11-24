import { FC, useCallback } from 'react'
import { Button, Dialog } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { ListsDataProvider, useListsDataContext } from '@pages/ProjectListsPage/context/lists-data'
import { ListsProvider, useListsContext } from '@pages/ProjectListsPage/context/lists'
import ListsTable from '../ListsTable/ListsTable'
import { PickerTableContainer } from '@shared/containers/ListPicker/ListPicker.styled'
import { buildFolderMap, parseListFolderRowId, wouldCreateCircularDependency } from '../../util'
import type { EntityListFolderModel } from '@shared/api'

export interface MoveToFolderDialogProps {
  // what is being moved: list ids or folder ids (never mixed)
  moving: 'lists' | 'folders'
  ids: string[]
  isReview?: boolean
  // none of the moved items sit in a folder, so there is nothing to unset
  canUnset?: boolean
  onMove: (targetFolderId: string) => Promise<void>
  onUnset: () => Promise<void>
  onClose: () => void
}

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
`

const MoveToFolderDialogInner: FC<MoveToFolderDialogProps> = ({
  moving,
  ids,
  isReview,
  canUnset,
  onMove,
  onUnset,
  onClose,
}) => {
  const { selectedRows } = useListsContext()
  const { disabledFolderMessages } = useListsDataContext()

  // right-click selects a row even when disabled, so disabled ids must be dropped here too
  const [targetFolderId] = selectedRows
    .map((rowId) => parseListFolderRowId(rowId))
    .filter((id): id is string => !!id && !disabledFolderMessages.has(id))

  // close immediately — the move is optimistic in the cache and rolls back on failure
  const moveTo = (folderId: string) => {
    if (disabledFolderMessages.has(folderId)) return
    onMove(folderId).catch(() => {})
    onClose()
  }

  const unset = () => {
    onUnset().catch(() => {})
    onClose()
  }

  const count = ids.length
  const header =
    moving === 'folders'
      ? count > 1
        ? `Move ${count} folders`
        : 'Move folder'
      : count > 1
      ? `Move ${count} lists`
      : 'Move list'

  return (
    <Dialog
      isOpen
      onClose={onClose}
      size="full"
      className="move-to-folder-dialog block-shortcuts"
      header={header}
      style={{ width: '100%', maxWidth: 800, height: '80vh' }}
      footer={
        <Footer>
          <Button
            label={moving === 'folders' ? 'Make root folder' : 'Unset folder'}
            icon="folder_off"
            variant="text"
            disabled={!canUnset}
            data-tooltip={
              canUnset
                ? undefined
                : moving === 'folders'
                ? 'Already a root folder'
                : 'Not in a folder'
            }
            onClick={unset}
          />
          <Button
            label="Move"
            variant="filled"
            disabled={!targetFolderId}
            onClick={() => targetFolderId && moveTo(targetFolderId)}
          />
        </Footer>
      }
    >
      {/* circular-move rows are muted, with the reason next to the label */}
      <PickerTableContainer>
        <ListsTable picker foldersOnly singleSelect isReview={isReview} onRowSubmit={moveTo} />
      </PickerTableContainer>
    </Dialog>
  )
}

export const MoveToFolderDialog: FC<MoveToFolderDialogProps> = (props) => {
  const { moving, ids, isReview } = props

  const getDisabledFolders = useCallback(
    (folders: EntityListFolderModel[]) => {
      const messages = new Map<string, string>()
      if (moving !== 'folders') return messages

      const folderMap = buildFolderMap(folders)
      for (const folder of folders) {
        if (ids.includes(folder.id)) messages.set(folder.id, 'Cannot move into itself')
        else if (ids.some((id) => wouldCreateCircularDependency(id, folder.id, folderMap)))
          messages.set(folder.id, 'Cannot move into own subfolder')
      }
      return messages
    },
    [moving, ids],
  )

  return (
    <ListsDataProvider
      picker
      foldersOnly
      isReview={isReview}
      // the folders of the moved items' list type
      entityListTypes={[isReview ? 'review-session' : 'generic']}
      getDisabledFolders={getDisabledFolders}
    >
      <ListsProvider picker isReview={isReview}>
        <MoveToFolderDialogInner {...props} />
      </ListsProvider>
    </ListsDataProvider>
  )
}

export default MoveToFolderDialog
