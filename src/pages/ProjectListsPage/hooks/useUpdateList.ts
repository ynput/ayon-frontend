import { useState } from 'react'

export interface UseUpdateListProps {}

export interface UseUpdateListReturn {
  renamingList: string | null
  openRenameList: (listId: string) => void
  closeRenameList: () => void
  renameList: (listId: string, newName: string) => Promise<void>
}

const useUpdateList = ({}: UseUpdateListProps) => {
  const [renamingList, setRenamingList] = useState<UseUpdateListReturn['renamingList']>(null)

  const openRenameList: UseUpdateListReturn['openRenameList'] = (listId) => {
    setRenamingList(listId)
  }
  const closeRenameList = () => {
    setRenamingList(null)
  }

  const renameList: UseUpdateListReturn['renameList'] = async (listId, newName) => {}

  return {
    renamingList,
    openRenameList,
    closeRenameList,
    renameList,
  }
}

export default useUpdateList
