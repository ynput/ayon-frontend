import { useListsContext } from '@pages/ProjectListsPage/context'
import { FC, useState } from 'react'
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

  // Track whether to show list selection or label input for empty review
  const [showLabelInput, setShowLabelInput] = useState(false)

  const handleClose = () => {
    setShowLabelInput(false)
    closeNewList()
  }

  if (isReview && newList) {
    const handleCreateEmpty = () => {
      // Switch to label input dialog
      setShowLabelInput(true)
    }

    // Show label input dialog for empty review session
    if (showLabelInput) {
      return (
        <NewListDialog
          isOpen={true}
          onClose={handleClose}
          form={newList}
          onChange={setNewList}
          onSubmit={createNewList}
          submitLoading={isCreatingList}
          dialogTitle="Create New Review Session"
          labels={{
            listLabel: 'Review session name',
            createButton: 'Create review session',
            cancelButton: 'Cancel',
          }}
          hidden={['entityType']}
        />
      )
    }

    // Show list selection dialog
    return (
      <NewReviewSessionDialog
        isOpen={true}
        onClose={handleClose}
        onSubmit={(id) => createReviewSessionList?.(id, { showToast: true })}
        onCreateEmpty={handleCreateEmpty}
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
