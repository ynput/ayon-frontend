import { useListsContext } from '@pages/ProjectListsPage/context/ListsContext'
import { FC } from 'react'
import { NewListDialog } from './NewListDialog'

interface NewListDialogContainerProps {}

const NewListDialogContainer: FC<NewListDialogContainerProps> = ({}) => {
  const { closeNewList, newList, setNewList, isCreatingList, createNewList } = useListsContext()

  return (
    <NewListDialog
      isOpen={!!newList}
      onClose={closeNewList}
      form={newList}
      onChange={setNewList}
      onSubmit={createNewList}
      submitLoading={isCreatingList}
    />
  )
}

export default NewListDialogContainer
