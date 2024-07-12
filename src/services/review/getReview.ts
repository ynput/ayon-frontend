import PubSub from '@/pubsub'
import { $Any } from '@/types'
import api from '@api'
import {
  Summary,
  GetReviewablesResponse,
  GetViewerReviewablesParams,
  TagTypes,
  UpdatedDefinitions,
} from './types'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'

const getViewerReviewablesTags = (
  result: (GetReviewablesResponse | undefined)[] | undefined,
  {
    productId,
    taskId,
    folderId,
    versionId,
  }: {
    productId?: string
    taskId?: string
    folderId?: string
    versionId?: string
  },
) => {
  const tags = []

  if (productId) tags.push({ type: 'review', id: productId })
  if (taskId) tags.push({ type: 'review', id: taskId })
  if (folderId) tags.push({ type: 'review', id: folderId })
  if (versionId) tags.push({ type: 'review', id: versionId })

  if (result) {
    const versionTags = result.flatMap((version) =>
      version
        ? {
            type: 'review',
            id: version.id,
          }
        : [],
    )

    tags.push(...versionTags)

    const reviewableTags = result.flatMap((version) =>
      version
        ? version.reviewables?.flatMap((reviewable) => [
            {
              type: 'review',
              id: reviewable.fileId,
            },
            {
              type: 'review',
              id: reviewable.activityId,
            },
          ])
        : [],
    ) as { type: 'review'; id: string }[]

    tags.push(...reviewableTags)
  }

  return tags
}

const enhancedApi = api.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    getReviewablesForVersion: {
      keepUnusedDataFor: 1,
      providesTags: (result, _error, { versionId }) =>
        getViewerReviewablesTags([result], { versionId, productId: result?.productId }),

      async onCacheEntryAdded(
        { versionId },
        { updateCachedData, cacheDataLoaded, cacheEntryRemoved, dispatch, getCacheEntry },
      ) {
        let token
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = (topic: string, message: $Any) => {
            if (topic !== 'reviewable.process') return

            const summary = (message?.summary as Summary) || {}

            // check it's for the right version
            if (summary.versionId !== versionId) return

            const cache = getCacheEntry()

            // check if the reviewable is in the cache
            const index = cache.data?.reviewables?.findIndex(
              (r) => r?.fileId === summary.sourceFileId,
            )

            if (index && index !== -1 && message.status !== 'finished') {
              // update the progress of the reviewable
              const progress = message?.progress || 0
              // update the cache reviewable

              updateCachedData((data) => {
                const reviewables = data.reviewables

                // check if there are reviewables
                if (!reviewables) return
                const processing = reviewables[index].processing

                // update the reviewable with the new progress
                reviewables[index] = {
                  ...reviewables[index],
                  processing: {
                    ...processing,
                    progress,
                    eventId: message.id,
                  },
                }
              })
            } else {
              console.log(
                'Reviewable not found in cache, refreshing to get data:',
                summary.sourceFileId,
                summary.versionId,
              )
              // get data for this new reviewable
              dispatch(api.util.invalidateTags([{ type: 'review', id: summary.versionId }]))

              // if it's finished, also invalidate
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
    },
  },
})

const injectedReview = enhancedApi.injectEndpoints({
  endpoints: (build) => ({
    // custom endpoint to get reviewables from product/task/folder
    // utilizes getReviewablesForProduct, getReviewablesForTask, getReviewablesForFolder
    getViewerReviewables: build.query<GetReviewablesResponse[], GetViewerReviewablesParams>({
      queryFn: async ({ productId, taskId, folderId, projectName }, { dispatch, forced }) => {
        let query: any
        if (productId) {
          query = api.endpoints.getReviewablesForProduct.initiate(
            {
              productId,
              projectName,
            },
            { forceRefetch: forced },
          )
        } else if (taskId) {
          query = api.endpoints.getReviewablesForTask.initiate(
            { taskId, projectName },
            { forceRefetch: forced },
          )
        } else if (folderId) {
          query = api.endpoints.getReviewablesForFolder.initiate({
            folderId,
            projectName,
          })

          const result = await dispatch(
            api.endpoints.getReviewablesForFolder.initiate(
              { folderId, projectName },
              { forceRefetch: forced },
            ),
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
        { productId, taskId, folderId },
        { cacheDataLoaded, cacheEntryRemoved, dispatch, getCacheEntry },
      ) {
        let token
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = (topic: string, message: $Any) => {
            if (topic !== 'reviewable.process') return

            const summary = (message?.summary as Summary) || {}

            const versionIds = new Set(getCacheEntry().data?.map((version) => version.id) || [])

            // check that one of the versions is the right one
            if (!versionIds?.has(summary.versionId || '')) return

            if (message.status === 'finished') {
              let id: string | undefined
              if (productId) id = productId
              else if (taskId) id = taskId
              else if (folderId) id = folderId

              console.log('Reviewable finished, refreshing to get data:', { id })
              // "838977a81dab11ef95ad0242ac180005"
              if (id) {
                // get data for this new reviewable (invalidate self)
                dispatch(api.util.invalidateTags([{ type: 'review', id: id }]))
              }
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
