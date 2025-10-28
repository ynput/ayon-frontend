import React, { useMemo, useState } from 'react'
import {
  SessionFromListResponse,
  useCreateSessionFromListMutation,
  type EntityListPostModel,
  type EntityListSummary,
} from '@shared/api'
import { toast } from 'react-toastify'
import semver from 'semver'
import { useNavigate } from 'react-router-dom'

const MIN_REVIEW_VERSION = '0.0.3'

export interface NewListForm extends EntityListPostModel {}

export interface UseNewListProps {
  onCreateNewList: (list: EntityListPostModel) => Promise<EntityListSummary>
  onCreated?: (list: Pick<EntityListSummary, 'id'>) => void
  isReview?: boolean
  projectName: string
  reviewVersion?: string // need for creating review session lists
}

export interface CreateReviewSessionListConfig {
  showToast?: boolean
  navigateOnSuccess?: boolean | string | ((sessionId: string) => string)
}

export interface UseNewListReturn {
  newList: NewListForm | null
  setNewList: React.Dispatch<React.SetStateAction<NewListForm | null>>
  openNewList: (init?: Partial<NewListForm>) => void
  closeNewList: () => void
  createNewList: (list?: NewListForm) => Promise<EntityListSummary>
  createReviewSessionList?: (
    listId: string,
    config?: CreateReviewSessionListConfig,
  ) => Promise<SessionFromListResponse> // only available if review addon is installed (but not necessarily correct version)
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
  reviewVersion,
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
      try {
        const dataToUse = listData ?? newList
        if (!dataToUse) throw new Error('New list or listData is not set')
        // create the new list using data provided in the function or from the state
        const res = await onCreateNewList(dataToUse)
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

  const [createSessionFromList] = useCreateSessionFromListMutation()

  const navigate = useNavigate()

  const hasReviewAddon = useMemo(() => {
    // check if review addon version is available
    if (!reviewVersion) return false
    // check if review addon version is compatible
    return (
      semver.gte(reviewVersion, MIN_REVIEW_VERSION) || reviewVersion === MIN_REVIEW_VERSION + '-dev'
    )
  }, [reviewVersion])

  /**
   * Creates a new review session list from either a listId (fetches versionIds from that list)
   * or directly from provided versionIds.
   * Optionally shows toast and navigates on success.
   */
  const createReviewSessionList: V['createReviewSessionList'] = React.useCallback(
    async (listId: string, config?: CreateReviewSessionListConfig) => {
      const { showToast = false, navigateOnSuccess = false } = config || {}
      let loadingToast: any
      try {
        if (showToast) {
          loadingToast = toast.loading('Creating review session...')
        }
        // check if review addon version is available
        if (!reviewVersion) throw 'Review addon version is not available'

        // check if review addon version is compatible
        if (!hasReviewAddon)
          throw 'Review addon version is too old, please update to at least ' + MIN_REVIEW_VERSION

        const res = await createSessionFromList({
          projectName,
          addonVersion: reviewVersion,
          sessionFromListRequest: { listId: listId },
        }).unwrap()

        // close dialog if open
        closeNewList()

        // select the new list using callback
        onCreated?.({
          id: res.sessionId,
        })

        if (showToast) {
          toast.update(loadingToast, {
            render: 'Review session created',
            type: 'success',
            isLoading: false,
            autoClose: 3000,
          })
        }

        if (navigateOnSuccess) {
          let path: string
          if (typeof navigateOnSuccess === 'string') {
            path = navigateOnSuccess
          } else if (typeof navigateOnSuccess === 'function') {
            path = navigateOnSuccess(res.sessionId)
          } else {
            path = `/projects/${projectName}/reviews?review=${res.sessionId}`
          }
          navigate(path)
        }

        return res
      } catch (error: any) {
        if (showToast && loadingToast) {
          toast.update(loadingToast, {
            render: `Failed to create review session: ${error}`,
            type: 'error',
            isLoading: false,
            autoClose: 5000,
          })
        }
        console.error(error)
        throw error
      }
    },
    [projectName, reviewVersion, hasReviewAddon, closeNewList, onCreated, navigate],
  )

  return {
    newList,
    setNewList,
    openNewList,
    closeNewList,
    createNewList,
    createReviewSessionList: reviewVersion ? createReviewSessionList : undefined,
  }
}

export default useNewList
