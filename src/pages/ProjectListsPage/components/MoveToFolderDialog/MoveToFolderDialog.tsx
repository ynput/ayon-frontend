import { FC, useCallback } from 'react'
import { Button, Dialog } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import {
  ListsDataProvider,
  useListsDataContext,
} from '@pages/ProjectListsPage/context/ListsDataContext'
import { ListsProvider } from '@pages/ProjectListsPage/context/ListsProvider'
import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import ListsTable from '../ListsTable/ListsTable'
import { buildFolderMap, parseListFolderRowId, wouldCreateCircularDependency } from '../../util'
import type { EntityListFolderModel } from '@shared/api'

const TableContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: 0;
  width: 100%;

  /* circular-move rows: muted, not struck through; the reason gets the space it needs (label truncates first) so it never paints over other text (&& outranks SimpleTable's disabled rule) */
  && .disabled {
    .value {
      text-decoration: none;
    }
    .text {
      min-width: 0;
    }
    .badges {
      flex-shrink: 0;
    }
    .badges span {
      white-space: nowrap;
    }
  }
`

export interface MoveToFolderDialogProps {
  // what is being moved: list ids or folder ids (never mixed)
  moving: 'lists' | 'folders'
  ids: string[]
  isReview?: boolean
  isStoryboards?: boolean
  onMove: (targetFolderId: string) => Promise<void>
  onClose: () => void
}

const MoveToFolderDialogInner: FC<MoveToFolderDialogProps> = ({
  moving,
  ids,
  isReview,
  isStoryboards,
  onMove,
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
        <Button
          label="Move"
          variant="filled"
          disabled={!targetFolderId}
          onClick={() => targetFolderId && moveTo(targetFolderId)}
        />
      }
    >
      <TableContainer>
        <ListsTable
          picker
          foldersOnly
          singleSelect
          isReview={isReview}
          isStoryboards={isStoryboards}
          onRowSubmit={moveTo}
        />
      </TableContainer>
    </Dialog>
  )
}

export const MoveToFolderDialog: FC<MoveToFolderDialogProps> = (props) => {
  const { moving, ids, isReview, isStoryboards } = props

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
      isStoryboards={isStoryboards}
      getDisabledFolders={getDisabledFolders}
    >
      <ListsProvider picker isReview={isReview} isStoryboards={isStoryboards}>
        <MoveToFolderDialogInner {...props} />
      </ListsProvider>
    </ListsDataProvider>
  )
}

export default MoveToFolderDialog
