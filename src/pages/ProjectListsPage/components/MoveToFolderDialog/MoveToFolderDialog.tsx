import { FC, useCallback } from 'react'
import { Button, Dialog } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { toast } from 'react-toastify'
import {
  ListsDataProvider,
  useListsDataContext,
} from '@pages/ProjectListsPage/context/ListsDataContext'
import { ListsProvider } from '@pages/ProjectListsPage/context/ListsProvider'
import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import ListsTable from '../ListsTable/ListsTable'
import { parseListFolderRowId, wouldCreateCircularDependency } from '../../util'
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

const MoveToFolderDialogInner: FC<MoveToFolderDialogProps> = ({ moving, ids, onMove, onClose }) => {
  const { selectedRows } = useListsContext()
  const { disabledFolderIds } = useListsDataContext()

  // right-click selects a row even when disabled, so disabled ids must be dropped here too
  const [targetFolderId] = selectedRows
    .map((rowId) => parseListFolderRowId(rowId))
    .filter((id): id is string => !!id && !disabledFolderIds.has(id))

  // close immediately — the move is optimistic in the cache and rolls back on failure
  const moveTo = (folderId: string) => {
    if (disabledFolderIds.has(folderId)) return
    onMove(folderId).catch((error: any) => {
      toast.error(error?.message || error || 'Failed to move')
    })
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
        <ListsTable picker foldersOnly singleSelect onRowSubmit={moveTo} />
      </TableContainer>
    </Dialog>
  )
}

export const MoveToFolderDialog: FC<MoveToFolderDialogProps> = (props) => {
  const { moving, ids, isReview, isStoryboards } = props

  const folderDisabled = useCallback(
    (folder: EntityListFolderModel, folders: EntityListFolderModel[]) => {
      if (moving !== 'folders') return undefined
      if (ids.includes(folder.id)) return 'Cannot move into itself'
      if (ids.some((id) => wouldCreateCircularDependency(id, folder.id, folders)))
        return 'Cannot move into own subfolder'
      return undefined
    },
    [moving, ids],
  )

  return (
    <ListsDataProvider
      picker
      foldersOnly
      isReview={isReview}
      isStoryboards={isStoryboards}
      folderDisabled={folderDisabled}
    >
      <ListsProvider picker isReview={isReview} isStoryboards={isStoryboards}>
        <MoveToFolderDialogInner {...props} />
      </ListsProvider>
    </ListsDataProvider>
  )
}

export default MoveToFolderDialog
