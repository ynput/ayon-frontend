import { FC, useLayoutEffect, useMemo, useState } from 'react'
import { NewListDialog } from './NewListDialog'
import { useEntityListsContext } from '@pages/ProjectListsPage/context'
import { listDefaultName, NewListForm } from '@pages/ProjectListsPage/hooks/useNewList'
import { buildListFolderOptions } from '@pages/ProjectListsPage/util/listFolders'
import { useGetEntityListFoldersQuery } from '@shared/api'
import { usePowerpack } from '@shared/context'

interface NewListFromContextProps {}

const NewListFromContext: FC<NewListFromContextProps> = ({}) => {
  const { projectName, closeCreateNewList, newListData, createNewList, newListErrorMessage } =
    useEntityListsContext()
  const { powerLicense } = usePowerpack()

  const [listForm, setListForm] = useState<NewListForm | null>(null)

  // list folders are a powerpack feature; same cache entry as the lists table, fetched once the dialog opens
  const { data: listFolders = [] } = useGetEntityListFoldersQuery(
    { projectName },
    { skip: !newListData || !powerLicense || !projectName },
  )
  const isReview = newListData?.entityListType === 'review-session'
  const folderOptions = useMemo(
    () => (powerLicense ? buildListFolderOptions(listFolders, isReview) : []),
    [powerLicense, listFolders, isReview],
  )

  useLayoutEffect(() => {
    if (newListData) {
      setListForm({
        entityType: newListData.entityType,
        label: listDefaultName(
          newListData.entityListType === 'review-session' ? 'Review' : undefined,
        ),
        entityListType: newListData.entityListType,
        entityListFolderId: newListData.entityListFolderId,
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
    createNewList(listForm.label, {
      // a folder that isn't offered (no license, other scope) is never sent
      entityListFolderId: folderOptions.some((o) => o.value === listForm.entityListFolderId)
        ? listForm.entityListFolderId
        : undefined,
    })
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
      folderOptions={folderOptions}
      error={newListErrorMessage}
    />
  )
}

export default NewListFromContext
