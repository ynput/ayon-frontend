import { PubSub } from '@shared/util'
import { ActivitiesResult } from './activitiesHelpers'
import type { GetActivitiesQueryVariables } from '@shared/api'
import { getActivitiesGQLApi as gqlApi } from '../getActivities'
import { ThunkDispatch, UnknownAction } from '@reduxjs/toolkit'
import { FeedActivity } from '../types'

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
}

/**
 * Checks if a comment body contains a checklist
 */
const bodyHasChecklist = (body: string): boolean => {
  if (!body) return false
  return body.includes('* [ ]') || body.includes('* [x]')
}

/**
 * Handles real-time activity updates for the infinite query cache
 */
export const handleActivityRealtimeUpdates = async (
  queryArg: Omit<GetActivitiesQueryVariables, 'last' | 'first' | 'cursor'> & { filter?: any },
  {
    updateCachedData,
    cacheDataLoaded,
    cacheEntryRemoved,
    dispatch,
    getCacheEntry,
  }: CacheLifecycleApi,
) => {
  let token: string | undefined

  try {
    // Wait for the initial query to resolve before proceeding
    await cacheDataLoaded

    const handlePubSub = async (topic: string, message: ActivityMessage) => {
      const activityId = message.summary?.activity_id
      if (!activityId) {
        console.warn('[Activity RT] Activity message missing activity_id', message)
        return
      }

      const projectName = message.project
      const references = message.summary?.references || []
      const relevantReferenceTypes = ['origin', 'mention', 'relation']
      const entityIds = references
        .filter((reference) => relevantReferenceTypes.includes(reference.reference_type))
        .map((reference) => reference.entity_id)

      // Check if this activity is relevant to the current cache
      const queryEntityIds = Array.isArray(queryArg.entityIds)
        ? queryArg.entityIds
        : [queryArg.entityIds]

      const isRelevant = queryEntityIds.some((qId) => entityIds.includes(qId))

      if (!isRelevant && queryEntityIds.length > 0) {
        return
      }

      const activityType = message.summary?.activity_type
      if (!activityType) {
        return
      }

      // Handle deletion
      if (topic === 'activity.deleted') {
        updateCachedData((draft) => {
          if (!draft || !draft.pages) {
            console.warn('[Activity RT] No draft or pages found for deletion')
            return
          }

          let deleted = false
          for (const page of draft.pages) {
            const index = page.activities?.findIndex(
              (activity) => activity.activityId === activityId,
            )
            if (index !== -1) {
              page.activities.splice(index, 1)
              deleted = true
            }
          }

          if (deleted) {
          } else {
          }
        })
        return
      }

      // Handle creation and updates
      try {
        // Fetch the updated activity data using the enhanced endpoint
        // The GetActivitiesById endpoint is enhanced to return ActivitiesResult via transformResponse
        const result = await dispatch(
          gqlApi.endpoints.GetActivitiesById.initiate(
            {
              projectName,
              activityIds: [activityId],
              entityIds,
            },
            {
              forceRefetch: true, // Always fetch fresh data
            },
          ),
        )

        // Check if we have an error
        if ('error' in result && result.error) {
          console.error('[Activity RT] Error fetching activity:', result.error)
          throw new Error('Failed to fetch activity')
        }

        // The transformResponse in enhanceActivitiesApi converts GetActivitiesByIdQuery to ActivitiesResult
        // TypeScript doesn't see this transformation, so we cast through unknown
        const unknownData: unknown = result.data
        const res = unknownData as ActivitiesResult
        const newActivities = res?.activities || []

        if (newActivities.length === 0) {
          console.warn('[Activity RT] No activities found for activity_id', activityId)
          return
        }

        const newActivity: FeedActivity = newActivities[0]

        // Determine activity types to check against
        const activityTypes = [activityType]
        if (activityType === 'comment') {
          const body = newActivity?.body
          const hasChecklist = bodyHasChecklist(body || '')
          if (hasChecklist) {
            activityTypes.push('checklist')
          }
        }

        // Check if this activity type is relevant to the query
        const queryActivityTypes = queryArg.activityTypes
        const queryActivityTypesArray = Array.isArray(queryActivityTypes)
          ? queryActivityTypes
          : queryActivityTypes
          ? [queryActivityTypes]
          : []
        const isActivityTypeRelevant =
          queryActivityTypesArray.length === 0 ||
          queryActivityTypesArray.some((type: string) => activityTypes.includes(type))

        if (!isActivityTypeRelevant) {
          return
        }

        // Update the cache
        updateCachedData((draft) => {
          if (!draft || !draft.pages) {
            console.warn('[Activity RT] No draft or pages found for update')
            return
          }

          // Check if activity already exists in any page
          let existingActivityFound = false
          for (const page of draft.pages) {
            const index = page.activities?.findIndex(
              (activity) => activity.activityId === activityId,
            )
            if (index !== -1) {
              // Update existing activity
              page.activities[index] = newActivity
              existingActivityFound = true
              break
            }
          }

          // If it's a new activity (topic is 'activity.created'), add it to the first page
          if (!existingActivityFound && topic === 'activity.created') {
            if (draft.pages.length > 0 && draft.pages[0].activities) {
              // Add to the beginning of the first page (most recent activities first)
              // Since we're using reverse chronological order (last: N), prepend to the beginning
              draft.pages[0].activities.unshift(newActivity)
            } else {
              console.warn('[Activity RT] Cannot add activity: no pages or activities array')
            }
          } else if (!existingActivityFound) {
          } else {
          }
        })
      } catch (error) {
        console.error('[Activity RT] Error fetching activity data for real-time update:', error)

        // Invalidate the cache for these entities to trigger a refetch
        dispatch(
          gqlApi.util.invalidateTags(
            entityIds.map((entityId) => ({ type: 'entityActivities', id: entityId })),
          ),
        )
      }
    }

    // Subscribe to activity topic
    token = PubSub.subscribe(['activity'], handlePubSub)
  } catch (error) {
    console.error('[Activity RT] Error in activity real-time handler setup:', error)
    // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`
  }

  // Wait for cache entry to be removed
  await cacheEntryRemoved

  // Cleanup: unsubscribe from PubSub
  if (token) {
    PubSub.unsubscribe(token)
  }
}
