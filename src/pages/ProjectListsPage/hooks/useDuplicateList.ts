import { useCallback } from 'react'
import { toast } from 'react-toastify'
import {
  useLazyGetEntityListQuery,
  type EntityListPostModel,
  type EntityListSummary,
} from '@shared/api'
import { getRequestErrorString } from '@shared/util'
import { useListsDataContext } from '../context/lists-data'
import { buildDuplicateListPayload, getDuplicateListLabel } from '../util/duplicateList'

interface UseDuplicateListProps {
  projectName: string
  onCreateNewList: (list: EntityListPostModel) => Promise<EntityListSummary>
  onCreated?: (lists: Pick<EntityListSummary, 'id'>[]) => void
}

export interface UseDuplicateListReturn {
  duplicateLists: (listIds: string[]) => Promise<void>
}

const useDuplicateList = ({
  projectName,
  onCreateNewList,
  onCreated,
}: UseDuplicateListProps): UseDuplicateListReturn => {
  const { listsData } = useListsDataContext()
  const [getEntityList] = useLazyGetEntityListQuery()

  const duplicateLists: UseDuplicateListReturn['duplicateLists'] = useCallback(
    async (listIds) => {
      if (!listIds.length) return
      const toastId = toast.loading(
        listIds.length > 1 ? `Duplicating ${listIds.length} lists...` : 'Duplicating list...',
      )
      // labels taken so far, including the copies made in this run
      const takenLabels = new Set(listsData.map((list) => list.label))
      const created: EntityListSummary[] = []
      const failed: string[] = []

      // one at a time, so each copy gets a free label
      for (const listId of listIds) {
        try {
          // the full list with its items, never a cached one
          const list = await getEntityList({ projectName, listId }, false).unwrap()
          const label = getDuplicateListLabel(list.label, takenLabels)
          takenLabels.add(label)
          created.push(await onCreateNewList(buildDuplicateListPayload(list, label)))
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
    [listsData, projectName, getEntityList, onCreateNewList, onCreated],
  )

  return { duplicateLists }
}

export default useDuplicateList
