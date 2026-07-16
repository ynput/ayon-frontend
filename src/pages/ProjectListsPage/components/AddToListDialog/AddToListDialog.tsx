import { FC, useCallback, useState } from 'react'
import { Button, Dialog } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import { ListsDataProvider } from '@pages/ProjectListsPage/context/ListsDataContext'
import { ListsProvider } from '@pages/ProjectListsPage/context/ListsProvider'
import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import ListsTable from '../ListsTable/ListsTable'
import type { ListEntityInput } from '../../hooks/useBuildListMenuItems'
import { listEntityTypes, type ListEntityType } from '../NewListDialog/NewListDialog'
import type { EntityList } from '@shared/api'

const EDITOR_ACCESS_LEVEL = 20

const TableContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 60vh;
  min-height: 0;
  width: 100%;
`

export interface AddToListDialogProps {
  entityType: string
  entities: ListEntityInput[]
  isReview?: boolean
  listFilter?: (list: EntityList) => boolean
  addToList: (listId: string, entityType: string, entities: ListEntityInput[]) => Promise<void>
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
  const [isLoading, setIsLoading] = useState(false)

  const addTo = async (lists: EntityList[]) => {
    if (!lists.length) return
    setIsLoading(true)
    const results = await Promise.allSettled(
      lists.map((list) =>
        // review sessions add via the picked entity type; generic lists use their own type
        addToList(list.id, isReview ? entityType : list.entityType, entities),
      ),
    )
    setIsLoading(false)
    // addToList toasts its own errors; keep the dialog open so the user can retry failed lists
    if (results.every((r) => r.status === 'fulfilled')) onClose()
  }

  const handleRowSubmit = (listId: string) => {
    const list = selectedLists.find((l) => l.id === listId) || { id: listId, entityType }
    addTo([list as EntityList])
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
      size="md"
      className="add-to-list-dialog block-shortcuts"
      header={isReview ? 'Add to review list' : 'Add to list'}
      style={{ width: 480, maxWidth: '90vw' }}
      footer={
        <Button
          label={count > 1 ? `Add to ${count} lists` : 'Add to list'}
          variant="filled"
          disabled={count === 0 || isLoading}
          // @ts-ignore - loading prop exists on Button
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
  const { entities, isReview, listFilter } = props

  const listsFilter = useCallback(
    (list: EntityList) => {
      if ((list.accessLevel ?? 0) < EDITOR_ACCESS_LEVEL) return false
      // generic lists must match the selected entities' type (review sessions accept any via actions)
      if (!isReview && !entities.some((e) => e.entityType === list.entityType)) return false
      if (listFilter && !listFilter(list)) return false
      return true
    },
    [entities, isReview, listFilter],
  )

  return (
    <ListsDataProvider
      picker
      isReview={isReview}
      entityListTypes={isReview ? ['review-session'] : ['generic']}
      listsFilter={listsFilter}
    >
      <ListsProvider picker isReview={isReview}>
        <AddToListDialogInner {...props} />
      </ListsProvider>
    </ListsDataProvider>
  )
}

export default AddToListDialog
