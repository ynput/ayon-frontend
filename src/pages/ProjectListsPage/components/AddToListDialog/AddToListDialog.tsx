import { FC, useCallback, useState } from 'react'
import { Button, Dialog } from '@ynput/ayon-react-components'
import { ProjectContextProvider, useOptionalProjectContext } from '@shared/context'
import { ListPicker } from '@shared/containers/ListPicker'
import type { ListEntityInput } from '../../hooks/useBuildListMenuItems'
import { type ListEntityType } from '../NewListDialog/NewListDialog'
import { listEntityTypes } from '../NewListDialog/NewListDialogHelpers'
import { ACCESS_LEVEL } from '../../util/listAccessControl'
import type { NewListOptions } from '../../context/entity-lists/EntityListsContext'
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
    options?: NewListOptions,
  ) => void
  onClose: () => void
}

const AddToListDialogInner: FC<AddToListDialogProps> = ({
  entityType,
  entities,
  isReview,
  listFilter,
  addToList,
  openCreateNewList,
  onClose,
}) => {
  const [selectedLists, setSelectedLists] = useState<EntityList[]>([])
  const [isLoading, setIsLoading] = useState(false)

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

  // creating a list is only supported for the types NewListDialog knows (no 'product')
  const canCreateList = listEntityTypes.includes(entityType as ListEntityType)
  // the new list starts in the folder the user is looking at (they can change it in the dialog)
  const handleCreateList = (entityListFolderId?: string) => {
    onClose()
    openCreateNewList(
      entityType as ListEntityType,
      entities,
      isReview ? 'review-session' : undefined,
      { entityListFolderId },
    )
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
      <ListPicker
        multiSelect
        entityListTypes={isReview ? ['review-session'] : ['generic']}
        listFilter={listsFilter}
        isListDisabled={listDisabled}
        onSelect={setSelectedLists}
        // double-click a list (or Enter) adds right away
        onSubmit={addTo}
        onCreateList={canCreateList ? handleCreateList : undefined}
      />
    </Dialog>
  )
}

export const AddToListDialog: FC<AddToListDialogProps> = (props) => {
  const existingProject = useOptionalProjectContext()
  const { projectName } = props

  // the picker reads useProjectContext; supply one where the page doesn't
  // (e.g. UserDashboard details panel) using the owning provider's projectName
  if (existingProject) return <AddToListDialogInner {...props} />
  return (
    <ProjectContextProvider projectName={projectName ?? ''}>
      <AddToListDialogInner {...props} />
    </ProjectContextProvider>
  )
}

export default AddToListDialog
