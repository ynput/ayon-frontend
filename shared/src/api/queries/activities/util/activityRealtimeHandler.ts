import { PubSub } from '@shared/util'
import { ActivitiesResult } from './activitiesHelpers'
import { GetActivitiesQueryVariables, gqlApi } from '@shared/api'
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
  queryArg: Omit<GetActivitiesQueryVariables, 'last' | 'first' | 'cursor'> & { filter?: string },
  {
    updateCachedData,
    cacheDataLoaded,
    cacheEntryRemoved,
    dispatch,
    getCacheEntry,
  }: CacheLifecycleApi,
) => {
  console.log('[Activity RT] Setting up real-time handler for query args:', queryArg)
  let token: string | undefined

  try {
    // Wait for the initial query to resolve before proceeding
    await cacheDataLoaded
    console.log('[Activity RT] Cache data loaded, handler is ready')

    const handlePubSub = async (topic: string, message: ActivityMessage) => {
      console.log('[Activity RT] Received message:', { topic, message })

      const activityId = message.summary?.activity_id
      if (!activityId) {
        console.warn('[Activity RT] Activity message missing activity_id', message)
        return
      }

      const projectName = message.project
      const references = message.summary?.references || []
      const entityIds = references
        .filter((reference) => reference.reference_type === 'origin')
        .map((reference) => reference.entity_id)

      console.log('[Activity RT] Extracted data:', { activityId, projectName, entityIds })

      // Check if this activity is relevant to the current cache
      const queryEntityIds = Array.isArray(queryArg.entityIds)
        ? queryArg.entityIds
        : [queryArg.entityIds]

      const isRelevant = queryEntityIds.some((qId) => entityIds.includes(qId))
      console.log('[Activity RT] Relevance check:', {
        queryEntityIds,
        entityIds,
        isRelevant,
        hasQueryEntityIds: queryEntityIds.length > 0,
      })

      if (!isRelevant && queryEntityIds.length > 0) {
        console.log('[Activity RT] Activity not relevant to this cache, skipping')
        return
      }

      const activityType = message.summary?.activity_type
      if (!activityType) {
        console.warn('[Activity RT] Activity message missing activity_type', message)
        return
      }

      console.log('[Activity RT] Activity type:', activityType)

      // Handle deletion
      if (topic === 'activity.deleted') {
        console.log('[Activity RT] Handling deletion for activity:', activityId)
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
              console.log('[Activity RT] Deleting activity at index:', index)
              page.activities.splice(index, 1)
              deleted = true
            }
          }

          if (deleted) {
            console.log('[Activity RT] Activity deleted successfully')
          } else {
            console.log('[Activity RT] Activity not found in cache for deletion')
          }
        })
        return
      }

      // Handle creation and updates
      console.log('[Activity RT] Fetching activity data from server')
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

        console.log('[Activity RT] Fetch result:', result)

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
        console.log('[Activity RT] Fetched activities:', {
          count: newActivities.length,
          activities: newActivities,
        })

        if (newActivities.length === 0) {
          console.warn('[Activity RT] No activities found for activity_id', activityId)
          return
        }

        const newActivity: FeedActivity = newActivities[0]
        console.log('[Activity RT] New activity data:', newActivity)

        // Determine activity types to check against
        const activityTypes = [activityType]
        if (activityType === 'comment') {
          const body = newActivity?.body
          const hasChecklist = bodyHasChecklist(body || '')
          console.log('[Activity RT] Comment checklist check:', { hasChecklist, body })
          if (hasChecklist) {
            activityTypes.push('checklist')
          }
        }

        console.log('[Activity RT] Activity types for filtering:', activityTypes)

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

        console.log('[Activity RT] Activity type relevance check:', {
          queryActivityTypes: queryActivityTypesArray,
          activityTypes,
          isActivityTypeRelevant,
        })

        if (!isActivityTypeRelevant) {
          console.log('[Activity RT] Activity type not relevant to this cache, skipping')
          return
        }

        // Update the cache
        console.log('[Activity RT] Updating cache')
        updateCachedData((draft) => {
          if (!draft || !draft.pages) {
            console.warn('[Activity RT] No draft or pages found for update')
            return
          }

          console.log('[Activity RT] Current cache state:', {
            pageCount: draft.pages.length,
            firstPageActivityCount: draft.pages[0]?.activities?.length,
          })

          // Check if activity already exists in any page
          let existingActivityFound = false
          for (const page of draft.pages) {
            const index = page.activities?.findIndex(
              (activity) => activity.activityId === activityId,
            )
            if (index !== -1) {
              // Update existing activity
              console.log('[Activity RT] Updating existing activity at index:', index)
              page.activities[index] = newActivity
              existingActivityFound = true
              break
            }
          }

          // If it's a new activity (topic is 'activity.created'), add it to the first page
          if (!existingActivityFound && topic === 'activity.created') {
            console.log('[Activity RT] Adding new activity to first page')
            if (draft.pages.length > 0 && draft.pages[0].activities) {
              // Add to the beginning of the first page (most recent activities first)
              // Since we're using reverse chronological order (last: N), prepend to the beginning
              draft.pages[0].activities.unshift(newActivity)
              console.log(
                '[Activity RT] Activity added. New count:',
                draft.pages[0].activities.length,
              )
            } else {
              console.warn('[Activity RT] Cannot add activity: no pages or activities array')
            }
          } else if (!existingActivityFound) {
            console.log('[Activity RT] Activity not found and topic is not creation:', topic)
          } else {
            console.log('[Activity RT] Activity updated successfully')
          }
        })

        console.log('[Activity RT] Cache update complete')
      } catch (error) {
        console.error('[Activity RT] Error fetching activity data for real-time update:', error)

        // Invalidate the cache for these entities to trigger a refetch
        console.log('[Activity RT] Invalidating cache tags for entities:', entityIds)
        dispatch(
          gqlApi.util.invalidateTags(
            entityIds.map((entityId) => ({ type: 'entityActivities', id: entityId })),
          ),
        )
      }
    }

    // Subscribe to activity topic
    token = PubSub.subscribe(['activity', 'inbox.message'], handlePubSub)
    console.log(PubSub.getSubscriptions())
    console.log('[Activity RT] Subscribed to activity topic with token:', token)
  } catch (error) {
    console.error('[Activity RT] Error in activity real-time handler setup:', error)
    // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`
  }

  // Wait for cache entry to be removed
  await cacheEntryRemoved
  console.log('[Activity RT] Cache entry removed, cleaning up')

  // Cleanup: unsubscribe from PubSub
  if (token) {
    console.log('[Activity RT] Unsubscribing from activity topic')
    PubSub.unsubscribe(token)
  }
}
