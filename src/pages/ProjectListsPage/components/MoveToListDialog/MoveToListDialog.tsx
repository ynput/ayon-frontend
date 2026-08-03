import { FC, Fragment, ReactNode, useCallback, useMemo, useState } from 'react'
import { Button, Dialog, Icon, InputText } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import {
  ListsDataProvider,
  useListsDataContext,
} from '@pages/ProjectListsPage/context/ListsDataContext'
import { ListsProvider } from '@pages/ProjectListsPage/context/ListsProvider'
import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { ProjectContextProvider, useOptionalProjectContext } from '@shared/context'
import { buildFolderHierarchy } from '@shared/util'
import { EntityListFolderModel } from '@shared/api'
import {
  FOLDER_ICON,
  FOLDER_ICON_REMOVE,
  wouldCreateCircularDependency,
} from '../../hooks/useListContextMenu'

// ✨ YN-0974: "Move list should use add to list dialog"
// Replaces the hard-to-navigate nested "Move" submenus with a dialog that shows
// only folders (single selection), mirroring the AddToListDialog pattern.
// Works for both lists (Move list) and folders (Move folder).

export interface MoveToListDialogProps {
  // lists being moved (Move list) — mutually exclusive with folderIds
  listIds: string[]
  // folders being moved (Move folder)
  folderIds: string[]
  // owning provider's project — used to supply a ProjectContext where none exists
  projectName?: string
  onClose: () => void
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: 0;
  width: 100%;
  gap: var(--base-gap-small, 8px);
`

const SearchContainer = styled.div`
  padding: 4px 8px;

  input {
    width: 100%;
  }
`

const FolderList = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  width: 100%;
`

const FolderRow = styled.div<{ $depth?: number; $selected?: boolean; $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small, 8px);
  padding: 8px 12px;
  padding-left: ${({ $depth = 0 }) => 12 + $depth * 20}px;
  border-radius: 8px;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.4 : 1)};
  background: ${({ $selected }) => ($selected ? 'var(--md-sys-color-primary)' : 'transparent')};
  color: ${({ $selected }) => ($selected ? 'var(--md-sys-color-on-primary)' : 'inherit')};

  &:hover {
    background: ${({ $selected, $disabled }) =>
      $disabled
        ? 'transparent'
        : $selected
        ? 'var(--md-sys-color-primary-hover)'
        : 'var(--md-sys-color-surface-container-high)'};
  }

  .folder-icon {
    display: flex;
    font-size: 18px;
  }

  .folder-label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`

const RootRow = styled(FolderRow)`
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  padding-bottom: 12px;
`

const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 24px;
  opacity: 0.6;
`

const MoveToListDialogInner: FC<MoveToListDialogProps> = ({ listIds, folderIds, onClose }) => {
  const { listFolders } = useListsDataContext()
  const {
    onPutListsInFolder,
    onPutFoldersInFolder,
    onRemoveListsFromFolder,
    onRemoveFoldersFromFolder,
  } = useListsContext()

  const [search, setSearch] = useState('')
  // null = "Move to root" (unset folder / make root folder)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const isFolderMove = folderIds.length > 0

  const filteredFolders = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return listFolders
    return listFolders.filter((f) => f.label.toLowerCase().includes(q))
  }, [listFolders, search])

  const { rootFolders } = useMemo(() => buildFolderHierarchy(filteredFolders), [filteredFolders])

  // when moving folders, self and descendants can't be destinations
  const isDisabledFolder = useCallback(
    (folderId: string) =>
      isFolderMove &&
      folderIds.some((fid) => wouldCreateCircularDependency(fid, folderId, listFolders)),
    [isFolderMove, folderIds, listFolders],
  )

  const handleMove = async (targetFolderId: string | null) => {
    setIsLoading(true)
    try {
      if (targetFolderId === null) {
        // root: unset folder / make root folder
        if (isFolderMove) await onRemoveFoldersFromFolder(folderIds)
        else await onRemoveListsFromFolder(listIds)
      } else if (isFolderMove) {
        await onPutFoldersInFolder(folderIds, targetFolderId)
      } else {
        await onPutListsInFolder(listIds, targetFolderId)
      }
      onClose()
    } catch {
      // onPut*/onRemove* toast their own errors; keep the dialog open so the
      // user can pick another destination or retry
    } finally {
      setIsLoading(false)
    }
  }

  const renderFolderRows = (
    folders: (EntityListFolderModel & { children: EntityListFolderModel[] })[],
    depth: number,
  ): ReactNode =>
    folders.map((folder) => (
      <Fragment key={folder.id}>
        <FolderRow
          $depth={depth}
          $selected={selectedFolderId === folder.id}
          $disabled={isDisabledFolder(folder.id)}
          onClick={() => {
            if (!isDisabledFolder(folder.id)) setSelectedFolderId(folder.id)
          }}
          onDoubleClick={() => {
            if (!isDisabledFolder(folder.id)) handleMove(folder.id)
          }}
        >
          <span className="folder-icon">
            <Icon icon={folder.data?.icon || FOLDER_ICON} />
          </span>
          <span className="folder-label">{folder.label}</span>
        </FolderRow>
        {folder.children.length > 0 &&
          renderFolderRows(
            folder.children as (EntityListFolderModel & {
              children: EntityListFolderModel[]
            })[],
            depth + 1,
          )}
      </Fragment>
    ))

  const hasFolders = filteredFolders.length > 0
  const isRootSelected = selectedFolderId === null

  return (
    <Dialog
      isOpen
      onClose={onClose}
      size="full"
      className="move-to-list-dialog block-shortcuts"
      header={isFolderMove ? 'Move folder to…' : 'Move list to…'}
      style={{ width: '100%', maxWidth: 520, height: '70vh' }}
      footer={
        <Button
          label={isRootSelected ? 'Move to root' : 'Move here'}
          variant="filled"
          disabled={isLoading}
          // @ts-expect-error - loading prop exists on Button but is missing from its typings
          loading={isLoading}
          onClick={() => handleMove(selectedFolderId)}
        />
      }
    >
      <Container>
        <SearchContainer>
          <InputText
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search folders…"
            autoFocus
          />
        </SearchContainer>
        <FolderList>
          <RootRow
            $selected={isRootSelected}
            onClick={() => setSelectedFolderId(null)}
            onDoubleClick={() => handleMove(null)}
          >
            <span className="folder-icon">
              <Icon icon={FOLDER_ICON_REMOVE} />
            </span>
            <span className="folder-label">
              {isFolderMove ? 'Make root folder' : 'Unset folder (root)'}
            </span>
          </RootRow>
          {hasFolders ? (
            renderFolderRows(rootFolders, 0)
          ) : (
            <EmptyState>No folders{search ? ' match your search' : ' yet'}</EmptyState>
          )}
        </FolderList>
      </Container>
    </Dialog>
  )
}

export const MoveToListDialog: FC<MoveToListDialogProps> = (props) => {
  const { projectName } = props
  const existingProject = useOptionalProjectContext()

  const tree = (
    <ListsDataProvider picker>
      <ListsProvider picker>
        <MoveToListDialogInner {...props} />
      </ListsProvider>
    </ListsDataProvider>
  )

  // ListsDataProvider/ListsProvider read useProjectContext; supply one where the
  // page doesn't using the owning provider's projectName (same as AddToListDialog)
  if (existingProject) return tree
  return <ProjectContextProvider projectName={projectName ?? ''}>{tree}</ProjectContextProvider>
}

export default MoveToListDialog
