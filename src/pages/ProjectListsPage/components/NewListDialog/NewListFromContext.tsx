import { FC, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { NewListDialog } from './NewListDialog'
import { useEntityListsContext } from '@pages/ProjectListsPage/context'
import { listDefaultName, NewListForm } from '@pages/ProjectListsPage/hooks/useNewList'
import { buildListFolderOptions } from '@pages/ProjectListsPage/util/listFolders'
import { useGetEntityListFoldersQuery } from '@shared/api'
import { usePowerpack } from '@shared/context'
import { readDialogMemory, writeDialogMemory } from '@shared/util'

// the list folder the last list or review session went into, per project and kind of list
type FolderMemory = { entityListFolderId?: string }
const folderMemoryKey = (isReview: boolean) =>
  isReview ? 'new-review-session-folder' : 'new-list-folder'

interface NewListFromContextProps {}

const NewListFromContext: FC<NewListFromContextProps> = ({}) => {
  const { projectName, closeCreateNewList, newListData, createNewList, newListErrorMessage } =
    useEntityListsContext()
  const { powerLicense } = usePowerpack()

  const [listForm, setListForm] = useState<NewListForm | null>(null)

  // list folders are a powerpack feature; same cache entry as the lists table, fetched once the dialog opens
  const { data: listFolders = [], isSuccess: foldersLoaded } = useGetEntityListFoldersQuery(
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
      const isReviewList = newListData.entityListType === 'review-session'
      const remembered = readDialogMemory<FolderMemory>(folderMemoryKey(isReviewList), projectName)
      setListForm({
        entityType: newListData.entityType,
        label: listDefaultName(
          newListData.entityListType === 'review-session' ? 'Review' : undefined,
        ),
        entityListType: newListData.entityListType,
        entityListFolderId: newListData.entityListFolderId ?? remembered.entityListFolderId,
      })
    } else {
      setListForm(null)
    }

    return () => {
      setListForm(null)
    }
  }, [newListData, projectName])

  // a remembered folder that was deleted (or is not offered here) is dropped once folders load
  useEffect(() => {
    if (!foldersLoaded || !listForm?.entityListFolderId) return
    if (!folderOptions.some((o) => o.value === listForm.entityListFolderId)) {
      setListForm((prev) => prev && { ...prev, entityListFolderId: undefined })
    }
  }, [foldersLoaded, folderOptions, listForm?.entityListFolderId])

  const handleSubmit = () => {
    if (!listForm) return
    // a folder that isn't offered (no license, other scope) is never sent
    const entityListFolderId = folderOptions.some((o) => o.value === listForm.entityListFolderId)
      ? listForm.entityListFolderId || undefined
      : undefined
    if (powerLicense && foldersLoaded) {
      writeDialogMemory<FolderMemory>(
        folderMemoryKey(isReview),
        { entityListFolderId },
        projectName,
      )
    }
    createNewList(listForm.label, { entityListFolderId })
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
