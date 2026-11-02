import { useCallback } from 'react'
import { toast } from 'react-toastify'
import { useDuplicateEntityListMutation, type EntityListSummary } from '@shared/api'
import { getRequestErrorString } from '@shared/util'

interface UseDuplicateListProps {
  projectName: string
  onCreated?: (lists: Pick<EntityListSummary, 'id'>[]) => void
}

export interface UseDuplicateListReturn {
  duplicateLists: (listIds: string[]) => Promise<void>
}

const useDuplicateList = ({
  projectName,
  onCreated,
}: UseDuplicateListProps): UseDuplicateListReturn => {
  const [duplicateEntityList] = useDuplicateEntityListMutation()

  const duplicateLists: UseDuplicateListReturn['duplicateLists'] = useCallback(
    async (listIds) => {
      if (!listIds.length) return
      const toastId = toast.loading(
        listIds.length > 1 ? `Duplicating ${listIds.length} lists...` : 'Duplicating list...',
      )
      const created: EntityListSummary[] = []
      const failed: string[] = []

      // one at a time: the server picks each copy's free label, parallel requests could pick the same one
      for (const listId of listIds) {
        try {
          created.push(await duplicateEntityList({ projectName, listId }).unwrap())
        } catch (error) {
          failed.push(getRequestErrorString(error))
        }
      }

      if (created.length) onCreated?.(created)

      if (failed.length) {
        toast.update(toastId, {
          render: `Failed to duplicate ${failed.length > 1 ? `${failed.length} lists` : 'list'}: ${
            failed[0]
          }`,
          type: 'error',
          isLoading: false,
          autoClose: 5000,
        })
      } else {
        toast.update(toastId, {
          render: created.length > 1 ? `Duplicated ${created.length} lists` : 'List duplicated',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
        })
      }
    },
    [projectName, duplicateEntityList, onCreated],
  )

  return { duplicateLists }
}

export default useDuplicateList
