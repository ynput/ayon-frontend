import PubSub from '@/pubsub'
import { $Any } from '@/types'
import api from '@api'
import { TagTypes, UpdatedDefinitions, Summary } from './types'

const enhancedReview = api.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    getReviewablesForProduct: {
      providesTags: (result, _error, { productId }) =>
        result
          ? [
              // product id
              { type: 'review', id: productId },
              // version ids
              ...(result?.map((version) => ({
                type: 'review',
                id: version.id,
              })) || []),
              // reviewable file ids
              ...(result?.flatMap(
                (version) =>
                  version.reviewables?.map((reviewable) => ({
                    type: 'review',
                    id: reviewable.fileId,
                  })) || [],
              ) || []),
            ]
          : [{ type: 'review', id: productId }],
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
    },
    getReviewablesForVersion: {
      keepUnusedDataFor: 0.1,
      providesTags: (result, _error, { versionId }) =>
        result
          ? [
              { type: 'review', id: versionId },
              ...(result.reviewables?.map((reviewable) => ({
                type: 'review',
                id: reviewable.fileId,
              })) || []),
            ]
          : [{ type: 'review', id: versionId }],
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

const injectedReview = enhancedReview.injectEndpoints({
  endpoints: (build) => ({
    hasTranscoder: build.query<boolean, undefined>({
      queryFn: async (_arg, { dispatch }) => {
        // get list of installed addons
        const res = await dispatch(enhancedReview.endpoints.getInstalledAddonsList.initiate())

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
  useGetReviewablesForProductQuery,
  useGetReviewablesForVersionQuery,
  useHasTranscoderQuery,
} = injectedReview
