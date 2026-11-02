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

  // Show list selection dialog for review sessions (unless showing label input)
  if (isReview && newList && !showLabelInput) {
    return (
      <NewReviewSessionDialog
        isOpen={true}
        onClose={handleClose}
        onSubmit={(id) => createReviewSessionList?.(id, { showToast: true })}
        onCreateEmpty={() => setShowLabelInput(true)}
        submitLoading={isCreatingList}
        header="Select a version list to create a review session"
        size="md"
      />
    )
  }

  const handleSubmit = async () => {
    try {
      await createNewList()
      setShowLabelInput(false)
    } catch (error) {
      // Error handling is already done in createNewList
      throw error
    }
  }

  return (
    <NewListDialog
      isOpen={!!newList}
      onClose={handleClose}
      form={newList}
      onChange={setNewList}
      onSubmit={handleSubmit}
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
