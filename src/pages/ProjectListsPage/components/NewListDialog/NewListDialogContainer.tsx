import { useListsContext } from '@pages/ProjectListsPage/context'
import { FC } from 'react'
import { NewListDialog } from './NewListDialog'
import NewReviewSessionDialog from '../NewReviewSessionDialog/NewReviewSessionDialog'

interface NewListDialogContainerProps {}

const NewListDialogContainer: FC<NewListDialogContainerProps> = ({}) => {
  const {
    closeNewList,
    newList,
    setNewList,
    isCreatingList,
    createNewList,
    createReviewSessionList,
    isReview,
  } = useListsContext()

  if (isReview && newList) {
    return (
      <NewReviewSessionDialog
        isOpen={true}
        onClose={closeNewList}
        onSubmit={createReviewSessionList}
        submitLoading={isCreatingList}
        header="Select a version list to create a review session"
        size="md"
      />
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
        cancelButton: 'Cancel',
      }}
      hidden={isReview ? ['entityType'] : []}
    />
  )
}

export default NewListDialogContainer
