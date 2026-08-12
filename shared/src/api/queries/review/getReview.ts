import { createRealtimeBatcher, PubSub } from '@shared/util'
import { reviewablesApi, ReviewableModel, VersionReviewablesModel } from '@shared/api/generated'
import { addonsQueries } from '../addons'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'
import {
  Summary,
  GetReviewablesResponse,
  GetViewerReviewablesParams,
  TagTypes,
  UpdatedDefinitions,
} from './types'

const getViewerReviewablesTags = (
  result: (GetReviewablesResponse | VersionReviewablesModel | undefined)[] | undefined,
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
  viewer?: boolean,
) => {
  const tags: { type: string; id: string }[] = []

  // different ways to open the viewer
  if (productId) tags.push({ type: 'review', id: productId })

  if (taskId) tags.push({ type: 'review', id: taskId })
  if (folderId) tags.push({ type: 'review', id: folderId })

  if (viewer) {
    // viewer specific tags for invalidating just the viewer
    if (productId) tags.push({ type: 'viewer', id: productId })

    if (taskId) tags.push({ type: 'viewer', id: taskId })
    if (folderId) tags.push({ type: 'viewer', id: folderId })
    if (versionId) tags.push({ type: 'viewer', id: versionId })

    tags.push({ type: 'viewer', id: 'LIST' })
  }

  // reviewables list caches
  if (versionId) tags.push({ type: 'review', id: versionId })

  if (result) {
    // create a unique list of productIds
    const productIds: string[] = [...new Set(result.flatMap((version) => version?.productId || []))]

    // if no productId was provided in the args, use the one from the result
    productIds.forEach((productId) => {
      if (!tags.find((tag) => tag.id === productId && tag.type === 'review'))
        tags.push({ type: 'review', id: productId })
      // if opening the viewer, add the viewer tag
      if (viewer && !tags.find((tag) => tag.id === productId && tag.type === 'viewer'))
        tags.push({ type: 'viewer', id: productId })
    })

    const versionTags = result.flatMap((version) =>
      version
        ? {
            type: 'review',
            id: version.id,
          }
        : [],
    )

    tags.push(...versionTags)

    // also add viewer tags for viewer
    if (viewer) {
      versionTags.forEach((tag) => {
        if (!tags.find((t) => t.id === tag.id && t.type === 'viewer')) {
          tags.push({ type: 'viewer', id: tag.id })
        }
      })
    }

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

const enhancedApi = reviewablesApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
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

        // handle
        const mediaProcessingBatcher = createRealtimeBatcher(
          (messages: { message: any }[]) => {
            const cache = getCacheEntry()
            const progressUpdates: { index: number; progress: number; eventId: string }[] = []
            const reviewVersionIds = new Set<string>()
            const viewerProductIds = new Set<string>()

            messages.forEach(({ message }) => {
              const summary = (message?.summary as Summary) || {}

              // check if the message is for the current versionId
              if (summary.versionId !== versionId) return

              // find the index of the reviewable in the cache data
              const index = cache.data?.reviewables?.findIndex(
                (reviewable: ReviewableModel) => reviewable?.fileId === summary.sourceFileId,
              )

              // if the message is a progress update, update the progress in the cache
              if (message.status !== 'finished' && index !== undefined && index !== -1) {
                progressUpdates.push({
                  index,
                  progress: message?.progress || 0,
                  eventId: message.id,
                })
                return
              } else {
                // if the message is finished, invalidate the cache for the versionId and productId
                reviewVersionIds.add(summary.versionId)
                if (message.status === 'finished' && cache.data?.productId) {
                  viewerProductIds.add(cache.data.productId)
                }
              }
            })

            // for each progress update, update the cache data with the new progress
            if (progressUpdates.length) {
              updateCachedData((data) => {
                const reviewables = data.reviewables
                if (!reviewables) return
                progressUpdates.forEach(({ index, progress, eventId }) => {
                  const reviewable = reviewables[index]
                  if (!reviewable) return
                  reviewables[index] = {
                    ...reviewable,
                    processing: {
                      ...reviewable.processing,
                      progress,
                      eventId,
                    },
                  }
                })
              })
            }

            // invalidate the cache for the versionId and productId if there are any finished messages
            if (reviewVersionIds.size) {
              dispatch(
                reviewablesApi.util.invalidateTags(
                  [...reviewVersionIds].map((id) => ({ type: 'review', id })),
                ),
              )
            }

            // invalidate the cache for the productId if there are any finished messages
            if (viewerProductIds.size) {
              dispatch(
                reviewablesApi.util.invalidateTags(
                  [...viewerProductIds].map((id) => ({ type: 'viewer', id })),
                ),
              )
            }
          },
          ({ message }) => message?.summary?.sourceFileId || message?.id || '',
          500,
        )
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          // handle pubsub messages for media processing events like conversion progress
          const handleMediaProcessingEvent = (_topic: string, message: any) => {
            if (message?.summary?.versionId !== versionId) return
            mediaProcessingBatcher.add({ message })
          }

          // sub to websocket topic
          token = PubSub.subscribe('reviewable.process', handleMediaProcessingEvent)
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        PubSub.unsubscribe(token)
        mediaProcessingBatcher.clear()
      },
    },
  },
})

const getReviewApi = enhancedApi.injectEndpoints({
  endpoints: (build) => ({
    // custom endpoint to get reviewables from product/task/folder
    // utilizes getReviewablesForProduct, getReviewablesForTask, getReviewablesForFolder
    getViewerReviewables: build.query<GetReviewablesResponse[], GetViewerReviewablesParams>({
      keepUnusedDataFor: 5,
      queryFn: async ({ productId, taskId, folderId, projectName }, { dispatch }) => {
        let query: any

        if (productId) {
          query = reviewablesApi.endpoints.getReviewablesForProduct.initiate(
            {
              productId,
              projectName,
            },
            { forceRefetch: true },
          )
        } else if (taskId) {
          query = reviewablesApi.endpoints.getReviewablesForTask.initiate(
            { taskId, projectName },
            { forceRefetch: true },
          )
        } else if (folderId) {
          query = reviewablesApi.endpoints.getReviewablesForFolder.initiate(
            {
              folderId,
              projectName,
            },
            { forceRefetch: true },
          )

          const result = await dispatch(
            reviewablesApi.endpoints.getReviewablesForFolder.initiate(
              { folderId, projectName },
              { forceRefetch: true },
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
      providesTags: (result, _error, args) => getViewerReviewablesTags(result, args, true),
      async onCacheEntryAdded(
        { productId, taskId, folderId },
        { cacheDataLoaded, cacheEntryRemoved, dispatch, getCacheEntry },
      ) {
        let token
        const mediaProcessingBatcher = createRealtimeBatcher(
          (messages: { message: any }[]) => {
            const versionIds = new Set(getCacheEntry().data?.map((version) => version.id) || [])
            const entityId = productId || taskId || folderId
            if (!entityId) return

            const shouldInvalidate = messages.some(
              ({ message }) =>
                message.status === 'finished' &&
                versionIds.has((message?.summary as Summary)?.versionId || ''),
            )
            if (shouldInvalidate) {
              dispatch(reviewablesApi.util.invalidateTags([{ type: 'review', id: entityId }]))
            }
          },
          ({ message }) => message?.summary?.versionId || message?.id || '',
        )
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handleMediaProcessingEvent = (_topic: string, message: any) => {
            if (message?.status !== 'finished') return
            mediaProcessingBatcher.add({ message })
          }

          // sub to websocket topic
          token = PubSub.subscribe('reviewable.process', handleMediaProcessingEvent)
        } catch {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
        }
        // cacheEntryRemoved will resolve when the cache subscription is no longer active
        await cacheEntryRemoved
        // perform cleanup steps once the `cacheEntryRemoved` promise resolves
        PubSub.unsubscribe(token)
        mediaProcessingBatcher.clear()
      },
    }),
    hasTranscoder: build.query<boolean, undefined>({
      queryFn: async (_arg, { dispatch }) => {
        // get list of installed addons
        const res = await dispatch(addonsQueries.endpoints.listAddons.initiate({ details: false }))

        if (res.data) {
          const hasTranscoder = res.data.addons.some((addon) => addon.name === 'transcoder')

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
} = getReviewApi
export { getReviewApi }
