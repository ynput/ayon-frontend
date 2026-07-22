import { FC, useCallback, useState } from 'react'
import { Button, Dialog } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import {
  ListsDataProvider,
  useListsDataContext,
} from '@pages/ProjectListsPage/context/ListsDataContext'
import { ListsProvider } from '@pages/ProjectListsPage/context/ListsProvider'
import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { ProjectContextProvider, useOptionalProjectContext } from '@shared/context'
import ListsTable from '../ListsTable/ListsTable'
import type { ListEntityInput } from '../../hooks/useBuildListMenuItems'
import { listEntityTypes, type ListEntityType } from '../NewListDialog/NewListDialog'
import { ACCESS_LEVEL } from '../../util/listAccessControl'
import type { EntityList } from '@shared/api'

// why a list can't be added to (shown but disabled); undefined = addable
// access-restricted lists are hidden (see listsFilter), not disabled — this only covers type mismatch
const getDisabledReason = (
  list: EntityList,
  entities: ListEntityInput[],
  isReview?: boolean,
): string | undefined => {
  // generic lists must match the selected entities' type (review sessions accept any via actions)
  if (!isReview && !entities.some((e) => e.entityType === list.entityType))
    return `This list only accepts ${list.entityType} items`
  return undefined
}

const TableContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: 0;
  width: 100%;

  /* type-mismatch rows: muted, not struck through; the reason gets the space it needs (name truncates first) so it never paints over other text (&& outranks SimpleTable's disabled rule) */
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

export interface AddToListDialogProps {
  entityType: string
  entities: ListEntityInput[]
  // owning provider's project — used to supply a ProjectContext where none exists (UserDashboard)
  projectName?: string
  isReview?: boolean
  listFilter?: (list: EntityList) => boolean
  addToList: (
    listId: string,
    entityType: string,
    entities: ListEntityInput[],
    listEntityListType?: string,
  ) => Promise<void>
  openCreateNewList: (
    entityType: ListEntityType,
    selectedEntities: ListEntityInput[],
    entityListType?: string,
  ) => void
  onClose: () => void
}

const AddToListDialogInner: FC<AddToListDialogProps> = ({
  entityType,
  entities,
  isReview,
  addToList,
  openCreateNewList,
  onClose,
}) => {
  const { selectedLists } = useListsContext()
  const { listsMap } = useListsDataContext()
  const [isLoading, setIsLoading] = useState(false)

  const addTo = async (lists: EntityList[]) => {
    if (!lists.length) return
    setIsLoading(true)
    const results = await Promise.allSettled(
      lists.map((list) =>
        // review sessions add via the picked entity type; generic lists use their own type
        addToList(list.id, isReview ? entityType : list.entityType, entities, list.entityListType),
      ),
    )
    setIsLoading(false)
    // addToList toasts its own errors; keep the dialog open so the user can retry failed lists
    if (results.every((r) => r.status === 'fulfilled')) onClose()
  }

  const handleRowSubmit = (listId: string) => {
    // double-click can hit a disabled row (SimpleTable only blocks click/keyboard selection)
    const list = listsMap.get(listId)
    if (!list || getDisabledReason(list, entities, isReview)) return
    addTo([list])
  }

  // creating a list is only supported for the types NewListDialog knows (no 'product')
  const canCreateList = listEntityTypes.includes(entityType as ListEntityType)
  const handleCreateList = () => {
    onClose()
    openCreateNewList(entityType as ListEntityType, entities, isReview ? 'review-session' : undefined)
  }

  const count = selectedLists.length

  return (
    <Dialog
      isOpen
      onClose={onClose}
      size="full"
      className="add-to-list-dialog block-shortcuts"
      header={isReview ? 'Add to review list' : 'Add to list'}
      style={{ width: '100%', maxWidth: 800, height: '80vh' }}
      footer={
        <Button
          label={count > 1 ? `Add to ${count} lists` : 'Add to list'}
          variant="filled"
          disabled={count === 0 || isLoading}
          // @ts-expect-error - loading prop exists on Button but is missing from its typings
          loading={isLoading}
          onClick={() => addTo(selectedLists)}
        />
      }
    >
      <TableContainer>
        <ListsTable
          picker
          isReview={isReview}
          onRowSubmit={handleRowSubmit}
          onCreateList={canCreateList ? handleCreateList : undefined}
        />
      </TableContainer>
    </Dialog>
  )
}

export const AddToListDialog: FC<AddToListDialogProps> = (props) => {
  const { entities, isReview, listFilter, projectName } = props
  const existingProject = useOptionalProjectContext()

  const listsFilter = useCallback(
    (list: EntityList) => {
      if ((list.accessLevel ?? 0) < ACCESS_LEVEL.EDITOR) return false
      if (listFilter && !listFilter(list)) return false
      return true
    },
    [listFilter],
  )
  const listDisabled = useCallback(
    (list: EntityList) => getDisabledReason(list, entities, isReview),
    [entities, isReview],
  )

  const tree = (
    <ListsDataProvider
      picker
      isReview={isReview}
      entityListTypes={isReview ? ['review-session'] : ['generic']}
      listsFilter={listsFilter}
      listDisabled={listDisabled}
    >
      <ListsProvider picker isReview={isReview}>
        <AddToListDialogInner {...props} />
      </ListsProvider>
    </ListsDataProvider>
  )

  // ListsDataProvider/ListsProvider read useProjectContext; supply one where the page
  // doesn't (e.g. UserDashboard details panel) using the owning provider's projectName
  if (existingProject) return tree
  return <ProjectContextProvider projectName={projectName ?? ''}>{tree}</ProjectContextProvider>
}

export default AddToListDialog
