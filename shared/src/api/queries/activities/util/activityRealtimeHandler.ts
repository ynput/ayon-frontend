import {
  createRealtimeBatcher,
  PubSub,
  subscribeToThumbnailUpdates,
  ThumbnailUpdateMessage,
  waitForRealtimeJitter,
} from '@shared/util'
import { ActivitiesResult } from './activitiesHelpers'
import type { GetActivitiesQueryVariables } from '@shared/api'
import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { FeedActivity } from '../types'

type ActivitiesGqlApi = {
  endpoints: {
    GetActivitiesById: {
      initiate: (
        args: { projectName: string; activityIds: string[]; entityIds: string | string[] },
        options?: { forceRefetch?: boolean },
      ) => any
    }
  }
  util: {
    invalidateTags: (tags: { type: string; id: string }[]) => any
  }
}

export type ActivityMessage = {
  topic: string
  project: string
  user: string
  createdAt: string
  updatedAt: string
  id: string
  status: string
  summary?: {
    activity_id: string
    activity_type: string
    references: {
      entity_id: string
      entity_type: string
      reference_type: string
    }[]
  }
}

type InfiniteDataDraft = {
  pages: ActivitiesResult[]
}

type CacheLifecycleApi = {
  updateCachedData: (updateRecipe: (draft: InfiniteDataDraft) => void) => void
  cacheDataLoaded: Promise<unknown>
  cacheEntryRemoved: Promise<void>
  dispatch: ThunkDispatch<unknown, unknown, UnknownAction>
  getCacheEntry: () => { data?: InfiniteDataDraft }
  gqlApi: ActivitiesGqlApi
}

const bodyHasChecklist = (body: string): boolean => {
  if (!body) return false
  return body.includes('* [ ]') || body.includes('* [x]')
}

export const handleActivityRealtimeUpdates = async (
  queryArg: Omit<GetActivitiesQueryVariables, 'last' | 'first' | 'cursor'> & { filter?: any },
  {
    updateCachedData,
    cacheDataLoaded,
    cacheEntryRemoved,
    dispatch,
    getCacheEntry,
    gqlApi,
  }: CacheLifecycleApi,
) => {
  let token: string | undefined
  let unsubscribeThumbnails: (() => void) | undefined
  const batcher = createRealtimeBatcher(
    async (updates: { topic: string; message: ActivityMessage }[], isActive) => {
      const queryEntityIds = Array.isArray(queryArg.entityIds)
        ? queryArg.entityIds
        : [queryArg.entityIds]
      const relevantReferenceTypes = ['origin', 'mention', 'relation']
      const queryActivityTypes = queryArg.activityTypes
      const queryActivityTypesArray = Array.isArray(queryActivityTypes)
        ? queryActivityTypes
        : queryActivityTypes
        ? [queryActivityTypes]
        : []
      const deletedIds: string[] = []
      const activityTopics = new Map<string, string>()
      const activityIds = new Set<string>()
      const activityEntityIds = new Set<string>()

      updates.forEach(({ topic, message }) => {
        const activityId = message.summary?.activity_id
        if (!activityId) return

        const entityIds = (message.summary?.references || [])
          .filter((reference) => relevantReferenceTypes.includes(reference.reference_type))
          .map((reference) => reference.entity_id)
        const isRelevant = queryEntityIds.some((entityId) => entityIds.includes(entityId))
        if (!isRelevant && queryEntityIds.length > 0) return

        if (topic === 'activity.deleted') {
          deletedIds.push(activityId)
          return
        }

        if (!message.summary?.activity_type) return
        activityIds.add(activityId)
        activityTopics.set(activityId, topic)
        entityIds.forEach((entityId) => activityEntityIds.add(entityId))
      })

      if (deletedIds.length) {
        updateCachedData((draft) => {
          draft.pages?.forEach((page) => {
            page.activities = page.activities?.filter(
              (activity) => !deletedIds.includes(activity.activityId),
            )
          })
        })
      }

      const activityIdList = [...activityIds]
      if (!activityIdList.length) return

      try {
        await waitForRealtimeJitter()
        const firstUpdate = updates.find(({ message }) => message.summary?.activity_id)
        const result = await dispatch(
          gqlApi.endpoints.GetActivitiesById.initiate(
            {
              projectName: firstUpdate?.message.project || '',
              activityIds: activityIdList,
              entityIds: [...activityEntityIds],
            },
            { forceRefetch: true },
          ),
        )

        if ('error' in result && result.error) throw new Error('Failed to fetch activities')
        if (!isActive()) return

        const newActivities = ((result.data as unknown as ActivitiesResult)?.activities ||
          []) as FeedActivity[]
        const activityById = new Map(
          newActivities.map((activity) => [activity.activityId, activity]),
        )

        updateCachedData((draft) => {
          activityById.forEach((newActivity, activityId) => {
            const activityTypes = [newActivity.activityType]
            if (
              newActivity.activityType === 'comment' &&
              bodyHasChecklist(newActivity.body || '')
            ) {
              activityTypes.push('checklist')
            }
            if (
              queryActivityTypesArray.length > 0 &&
              !queryActivityTypesArray.some((type: string) => activityTypes.includes(type))
            ) {
              return
            }

            let existingActivityFound = false
            draft.pages?.forEach((page) => {
              const index = page.activities?.findIndex(
                (activity) => activity.activityId === activityId,
              )
              if (index !== undefined && index !== -1 && page.activities) {
                page.activities[index] = newActivity
                existingActivityFound = true
              }
            })

            if (!existingActivityFound && activityTopics.get(activityId) === 'activity.created') {
              draft.pages?.[0]?.activities?.unshift(newActivity)
            }

            if (
              newActivity.activityType !== 'status.change' ||
              newActivity.origin?.type !== 'version'
            ) {
              return
            }

            const versionId = newActivity.origin.id
            const newStatus = newActivity.activityData?.newValue
            if (!newStatus) return

            draft.pages?.forEach((page) => {
              page.activities?.forEach((activity) => {
                if (
                  activity.activityType === 'version.publish' &&
                  activity.origin?.id === versionId
                ) {
                  if (!activity.version) activity.version = {} as any
                  activity.version!.status = newStatus
                }
              })
            })
          })
        })
      } catch (error) {
        console.error('[Activity RT] Error fetching activity data for real-time update:', error)
        dispatch(
          gqlApi.util.invalidateTags(
            [...new Set([...queryEntityIds, ...activityEntityIds])].map((entityId) => ({
              type: 'entityActivities',
              id: entityId,
            })),
          ),
        )
      }
    },
    ({ topic, message }) => `${topic}:${message.summary?.activity_id ?? ''}`,
    500,
  )

  try {
    await cacheDataLoaded

    unsubscribeThumbnails = subscribeToThumbnailUpdates(
      (messages: ThumbnailUpdateMessage[]) => {
        const draftData = getCacheEntry().data
        if (!draftData?.pages?.length) return

        const versionHashesData = messages.reduce((acc, message) => {
          if (message.summary.entityType === 'version') {
            acc[message.summary.entityId] = message.summary.thumbnailHash || ''
          }
          return acc
        }, {} as Record<string, string>)

        if (Object.keys(versionHashesData).length === 0) return

        updateCachedData((draft) => {
          if (!draft || !draft.pages) return
          draft.pages.forEach((page) => {
            page.activities?.forEach((activity) => {
              if (
                activity.referenceType === 'version' &&
                activity.referenceId &&
                versionHashesData[activity.referenceId] !== undefined
              ) {
                if (!activity.version) activity.version = {} as any
                activity.version!.thumbnailHash = versionHashesData[activity.referenceId]
              }
              if (
                activity.origin.type === 'version' &&
                activity.origin.id &&
                versionHashesData[activity.origin.id] !== undefined
              ) {
                if (!activity.version) activity.version = {} as any
                activity.version!.thumbnailHash = versionHashesData[activity.origin.id]
              }
            })
          })
        })
      },
      ['version'],
    )

    const handlePubSub = (topic: string, message: ActivityMessage) => {
      if (!message.summary?.activity_id) {
        console.warn('[Activity RT] Activity message missing activity_id', message)
        return
      }
      batcher.add({ topic, message })
    }

    token = PubSub.subscribe(['activity'], handlePubSub)
  } catch (error) {
    console.error('[Activity RT] Error in activity real-time handler setup:', error)
  }

  await cacheEntryRemoved

  if (token) PubSub.unsubscribe(token)
  if (unsubscribeThumbnails) unsubscribeThumbnails()
  batcher.clear()
}
