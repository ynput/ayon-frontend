import { FC, useLayoutEffect, useState } from 'react'
import { NewListDialog } from './NewListDialog'
import { useEntityListsContext } from '@pages/ProjectListsPage/context/EntityListsContext'
import { listDefaultName, NewListForm } from '@pages/ProjectListsPage/hooks/useNewList'

interface NewListFromContextProps {}

const NewListFromContext: FC<NewListFromContextProps> = ({}) => {
  const { closeCreateNewList, newListData, createNewList, newListErrorMessage } =
    useEntityListsContext()

  const [listForm, setListForm] = useState<NewListForm | null>(null)

  useLayoutEffect(() => {
    if (newListData) {
      setListForm({
        entityType: newListData.entityType,
        label: listDefaultName(),
      })
    } else {
      setListForm(null)
    }

    return () => {
      setListForm(null)
    }
  }, [newListData])

  const handleSubmit = () => {
    if (!listForm) return
    createNewList(listForm.label)
  }

  if (!listForm) return null

  return (
    <NewListDialog
      form={listForm}
      onChange={setListForm}
      onSubmit={handleSubmit}
      onClose={closeCreateNewList}
      isOpen
      hidden={['entityType']}
      error={newListErrorMessage}
    />
  )
}

export default NewListFromContext
