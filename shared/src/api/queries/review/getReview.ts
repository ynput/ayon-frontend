import { PubSub } from '@shared/util'
import { reviewApi, ReviewableModel, VersionReviewablesModel } from '@shared/api/generated'
import { addonsQueries } from '@shared/api/queries/addons'
import {
  Summary,
  GetReviewablesResponse,
  GetViewerReviewablesParams,
  TagTypes,
  UpdatedDefinitions,
} from './types'
import { FetchBaseQueryError } from '@reduxjs/toolkit/query'

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

const enhancedApi = reviewApi.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
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

          const handlePubSub = (topic: string, message: any) => {
            if (topic !== 'reviewable.process') return

            const summary = (message?.summary as Summary) || {}

            // check it's for the right version
            if (summary.versionId !== versionId) return

            const cache = getCacheEntry()

            // check if the reviewable is in the cache
            const index = cache.data?.reviewables?.findIndex(
              (r: ReviewableModel) => r?.fileId === summary.sourceFileId,
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
              dispatch(reviewApi.util.invalidateTags([{ type: 'review', id: summary.versionId }]))

              // if it's finished, also invalidate viewer
              if (message.status === 'finished') {
                // also invalidate the viewer cache
                if (cache.data?.productId) {
                  dispatch(
                    reviewApi.util.invalidateTags([{ type: 'viewer', id: cache.data?.productId }]),
                  )
                }
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
    },
  },
})

export const getReviewApi = enhancedApi.injectEndpoints({
  endpoints: (build) => ({
    // custom endpoint to get reviewables from product/task/folder
    // utilizes getReviewablesForProduct, getReviewablesForTask, getReviewablesForFolder
    getViewerReviewables: build.query<GetReviewablesResponse[], GetViewerReviewablesParams>({
      queryFn: async ({ productId, taskId, folderId, projectName }, { dispatch }) => {
        let query: any

        if (productId) {
          query = reviewApi.endpoints.getReviewablesForProduct.initiate(
            {
              productId,
              projectName,
            },
            { forceRefetch: true },
          )
        } else if (taskId) {
          query = reviewApi.endpoints.getReviewablesForTask.initiate(
            { taskId, projectName },
            { forceRefetch: true },
          )
        } else if (folderId) {
          query = reviewApi.endpoints.getReviewablesForFolder.initiate(
            {
              folderId,
              projectName,
            },
            { forceRefetch: true },
          )

          const result = await dispatch(
            reviewApi.endpoints.getReviewablesForFolder.initiate(
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
        try {
          // wait for the initial query to resolve before proceeding
          await cacheDataLoaded

          const handlePubSub = (topic: string, message: any) => {
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
                dispatch(reviewApi.util.invalidateTags([{ type: 'review', id: id }]))
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
