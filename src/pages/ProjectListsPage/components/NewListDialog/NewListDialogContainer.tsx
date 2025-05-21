import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { FC } from 'react'
import { NewListDialog } from './NewListDialog'
import { Dialog } from '@ynput/ayon-react-components'

interface NewListDialogContainerProps {}

const NewListDialogContainer: FC<NewListDialogContainerProps> = ({}) => {
  const { closeNewList, newList, setNewList, isCreatingList, createNewList, isReview } =
    useListsContext()

  if (isReview) {
    return (
      <Dialog
        isOpen={!!newList}
        onClose={closeNewList}
        header="Create New Review Session"
        size="md"
      >
        Create new review sessions by selecting multiple versions and running the action "Create
        Review Session".
      </Dialog>
    )
  }

  return (
    <NewListDialog
      isOpen={!!newList}
      onClose={closeNewList}
      form={newList}
      onChange={setNewList}
      onSubmit={createNewList}
      submitLoading={isCreatingList}
      dialogTitle={isReview ? 'Create New Review Session' : 'Create New List'}
      labels={{
        listLabel: isReview ? 'Review session name' : 'List label',
        createButton: isReview ? 'Create review session' : 'Create list',
      }}
      hidden={isReview ? ['entityType'] : []}
    />
  )
}

export default NewListDialogContainer
