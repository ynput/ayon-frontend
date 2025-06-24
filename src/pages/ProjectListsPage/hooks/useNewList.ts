import React, { useEffect, useState } from 'react'
import {
  useLazyGetListsItemsForReviewSessionQuery,
  useLazyGetListsQuery,
  type EntityListPostModel,
  type EntityListSummary,
} from '@shared/api'
import { toast } from 'react-toastify'
import buildReviewListLabel from '../util/buildReviewListLabel'

const reviewSessionListsFilterString =
  '{"conditions":[{"key":"entityType","value":["version"],"operator":"in"},{"key":"entityListType","value":["review-session"],"operator":"in"}],"operator":"and"}'

export interface NewListForm extends EntityListPostModel {}

export interface UseNewListProps {
  onCreateNewList: (list: EntityListPostModel) => Promise<EntityListSummary>
  onCreated?: (list: EntityListSummary) => void
  isReview?: boolean
  projectName: string
}

export interface UseNewListReturn {
  newList: NewListForm | null
  setNewList: React.Dispatch<React.SetStateAction<NewListForm | null>>
  openNewList: (init?: Partial<NewListForm>) => void
  closeNewList: () => void
  createNewList: (list?: NewListForm) => Promise<EntityListSummary>
  createReviewSessionList: (
    label: string,
    options: { listId: string } | { versionIds: string[] },
  ) => Promise<EntityListSummary>
}
type V = UseNewListReturn

export const listDefaultName = (listType: string = 'List') => {
  const date = new Date()
  return `${listType} ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

const useNewList = ({
  onCreateNewList,
  onCreated,
  isReview,
  projectName,
}: UseNewListProps): UseNewListReturn => {
  const [newList, setNewList] = useState<V['newList']>(null)
  const openNewList: V['openNewList'] = React.useCallback((init) => {
    // generate default name based on date and time

    setNewList({
      label: listDefaultName(isReview ? 'Review' : undefined),
      entityListType: isReview ? 'review-session' : 'generic',
      entityType: isReview ? 'version' : 'folder',
      access: {},
      ...init,
    })
  }, [])

  const closeNewList: V['closeNewList'] = React.useCallback(() => setNewList(null), [])

  const createNewList: V['createNewList'] = React.useCallback(
    async (listData) => {
      if (!newList) return Promise.reject()

      try {
        // create the new list using data provided in the function or from the state
        const res = await onCreateNewList(listData ?? newList)
        // close the dialog
        closeNewList()

        onCreated?.(res)
        return res
      } catch (error: any) {
        toast.error(`Failed to create list: ${error.data?.detail}`)
        throw error
      }
    },
    [newList, closeNewList, onCreated],
  )

  // get lists that also have their items with the reviewable flag
  const [getListsWithItemsForReview] = useLazyGetListsItemsForReviewSessionQuery()
  // get all review lists so that we can avoid duplicates when creating a new review session list
  const [getLists] = useLazyGetListsQuery()

  /**
   * Creates a new review session list from either a listId (fetches versionIds from that list)
   * or directly from provided versionIds.
   */
  const createReviewSessionList: V['createReviewSessionList'] = React.useCallback(
    async (label, options): Promise<EntityListSummary> => {
      try {
        let versionIds: string[] = []

        const reviewLists = await getLists({
          first: 1000,
          projectName,
          filter: reviewSessionListsFilterString,
        }).unwrap()
        const reviewListsLabels = reviewLists.lists.map((list) => list.label)
        if ('listId' in options) {
          // for the listId, fetch the list items with reviewable flag
          const versionLists = await getListsWithItemsForReview({
            projectName,
            ids: [options.listId],
          }).unwrap()

          const versionList = versionLists.lists[0]
          if (!versionList) {
            throw new Error(`List with ID ${options.listId} not found`)
          }

          // filter items that have the reviewable flag
          const versionItemsIds = versionList.items
            .filter((item) => item && 'hasReviewables' in item && item?.hasReviewables)
            .map((item) => item?.id) as string[]
          if (!versionItemsIds.length) {
            throw new Error(`No reviewable versions found in the selected list.`)
          }

          versionIds = versionItemsIds
        } else {
          versionIds = options.versionIds
        }

        if (!versionIds.length) {
          throw new Error('No versionIds provided')
        }

        console.log(
          'Creating review session list with label:',
          label,
          'and versionIds:',
          versionIds,
        )
        //   create new list (review session) object data
        const newReviewSessionList: NewListForm = {
          entityType: 'version',
          entityListType: 'review-session',
          label: buildReviewListLabel(label, reviewListsLabels),
          items: versionIds.map((id) => ({
            entityId: id,
          })),
        }

        // create new list in API
        return await createNewList(newReviewSessionList)
      } catch (error) {
        toast.error(
          `Failed to create review session list: ${
            error instanceof Error ? error.message : String(error)
          }`,
        )
        throw error
      }
    },
    [createNewList, projectName],
  )

  //   open new list with n key shortcut
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // check we are not in an input field
      if (event.target instanceof HTMLInputElement) return

      if (event.key === 'n' && !newList) {
        event.preventDefault()
        openNewList()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [newList])

  return {
    newList,
    setNewList,
    openNewList,
    closeNewList,
    createNewList,
    createReviewSessionList,
  }
}

export default useNewList
