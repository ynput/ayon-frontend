import PubSub from '@/pubsub'
import { $Any } from '@/types'
import api from '@api'
import { Summary, GetReviewablesResponse, GetViewerReviewablesParams } from './types'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'

const getViewerReviewablesTags = (
  result: GetReviewablesResponse[] | undefined,
  {
    productId,
    taskId,
    folderId,
  }: {
    productId?: string
    taskId?: string
    folderId?: string
  },
) => {
  const tags = []

  if (productId) tags.push({ type: 'review', id: productId })
  if (taskId) tags.push({ type: 'review', id: taskId })
  if (folderId) tags.push({ type: 'review', id: folderId })

  if (result) {
    const versionTags = result.map((version) => ({
      type: 'review',
      id: version.id,
    }))

    tags.push(...versionTags)

    const reviewableTags = result.flatMap(
      (version) =>
        version.reviewables?.map((reviewable) => ({
          type: 'review',
          id: reviewable.fileId,
        })) || [],
    )

    tags.push(...reviewableTags)
  }

  return tags
}

const injectedReview = api.injectEndpoints({
  endpoints: (build) => ({
    // custom endpoint to get reviewables from product/task/folder
    // utilizes getReviewablesForProduct, getReviewablesForTask, getReviewablesForFolder
    getViewerReviewables: build.query<GetReviewablesResponse[], GetViewerReviewablesParams>({
      queryFn: async ({ productId, taskId, folderId, projectName }, { dispatch }) => {
        let query: any
        if (productId) {
          query = api.endpoints.getReviewablesForProduct.initiate({
            productId,
            projectName,
          })
        } else if (taskId) {
          query = api.endpoints.getReviewablesForTask.initiate({ taskId, projectName })
        } else if (folderId) {
          query = api.endpoints.getReviewablesForFolder.initiate({
            folderId,
            projectName,
          })

          const result = await dispatch(
            api.endpoints.getReviewablesForFolder.initiate({ folderId, projectName }),
          )
          result.error
        }

        if (!query)
          return {
            error: { status: 'CUSTOM_ERROR', error: 'No query found' } as FetchBaseQueryError,
          }

        const result = await dispatch(query)

        if (result.error) {
          const error = result.error as FetchBaseQueryError

          console.error(error)
          return { error: error }
        } else {
          const data = result.data as GetReviewablesResponse[]
          return { data }
        }
      },
      providesTags: (result, _error, args) => getViewerReviewablesTags(result, args),
      async onCacheEntryAdded(
        { productId },
        { cacheDataLoaded, cacheEntryRemoved, dispatch, getCacheEntry },
      ) {
        let token
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = (topic: string, message: $Any) => {
            if (topic !== 'reviewable.process') return

            const summary = (message?.summary as Summary) || {}

            const versionIds = getCacheEntry().data?.map((version) => version.id)

            // check that one of the versions is the right one
            if (!versionIds?.includes(summary.versionId || '')) return

            // check it's for the right version
            // if (summary.productId !== productId) return

            if (message.status === 'finished') {
              // get data for this new reviewable
              dispatch(api.util.invalidateTags([{ type: 'review', id: productId }]))
            }
          }

          // sub to websocket topic
          token = PubSub.subscribe('reviewable.process', handlePubSub)
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        PubSub.unsubscribe(token)
      },
    }),
    hasTranscoder: build.query<boolean, undefined>({
      queryFn: async (_arg, { dispatch }) => {
        // get list of installed addons
        const res = await dispatch(api.endpoints.getInstalledAddonsList.initiate())

        if (res.data) {
          const hasTranscoder = res.data.items.some((addon) => addon.addonName === 'transcoder')

          return { data: hasTranscoder }
        } else if (res.error) {
          console.error(res.error)
          return { data: false }
        } else return { data: false }
      },
    }),
  }),
})

export const {
  useGetViewerReviewablesQuery,
  useGetReviewablesForVersionQuery,
  useHasTranscoderQuery,
} = injectedReview
