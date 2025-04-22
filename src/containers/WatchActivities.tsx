import usePubSub from '@hooks/usePubSub'
import api from '@api'
import { FC } from 'react'
import { useDispatch, useSelector, useStore } from 'react-redux'
import { $Any } from '@/types'
import { useLazyGetActivitiesByIdQuery } from '@/services/activities/getActivities'
import { bodyHasChecklist } from './Feed/hooks/useCommentMutations'
type ActivityMessage = {
  [key: string]: any

  summary:
    | {
        activity_id: string
        activity_type: string
        references: {
          entity_id: string
          entity_type: string
          reference_type: string
        }[]
      }
    | undefined
    | null
}

interface WatchActivitiesProps {}

const WatchActivities: FC<WatchActivitiesProps> = ({}) => {
  const dispatch = useDispatch()
  const userName: string = useSelector((state: $Any) => state.user?.name)

  const store = useStore()

  const [getActivity] = useLazyGetActivitiesByIdQuery()

  //   subscribe to inbox.message topic
  usePubSub(
    'activity',
    async (topic: string, message: ActivityMessage) => {
      // first find caches that contain this activityId
      const activityId = message.summary?.activity_id

      const state: any = store.getState()

      const projectName = message.project
      const references = message.summary?.references
      const entityIds = references?.map((reference) => reference.entity_id) || []

      // entries could include caches for checklists, versions, reviews that don't contain comments for example
      // check that this activity is relevant to the cache
      const activityType = message.summary?.activity_type

      // get all caches that this activity is referenced by
      const tags = entityIds.map((entityId) => ({ type: 'entityActivities', id: entityId }))
      const entries = api.util.selectInvalidatedBy(state, tags)

      // add to the invalidateTags as we go and then invalidate all at the end
      const invalidateTags = []

      if (topic === 'activity.deleted') {
        for (const entry of entries) {
          // remove the activity from the cache using originalArguments
          dispatch(
            // @ts-ignore
            api.util.updateQueryData('GetActivities', entry.originalArgs, (draft: $Any) => {
              //   find the activity and remove it
              const index = draft?.activities?.findIndex(
                (activity: $Any) => activity.activityId === activityId,
              )

              if (index === -1) return

              //   remove from activities
              draft?.activities?.splice(index, 1)
            }),
          )
        }
      } else {
        // nothing to update
        if (entries.length === 0) return
        try {
          // now fetch the activity/references for activity and entities
          const res = await getActivity({
            projectName: projectName,
            activityIds: [activityId],
            entityIds,
            activityTypes: [activityType],
          }).unwrap()
          const newActivities = res.activities || []

          if (newActivities.length === 0) throw new Error('No activities found')

          // comments can also have checklists, if a comment, check for checklist (hehe)
          const activityTypes = [activityType]
          if (activityType === 'comment') {
            // check if the body has a checklist
            const firstActivity = res?.activities[0] as $Any
            const body = firstActivity?.body

            const hasChecklist = bodyHasChecklist(body)

            if (hasChecklist) activityTypes.push('checklist')
          }

          // filter out the caches that are not relevant to this activity type
          const entriesToPatch = entries.filter(
            (entry) =>
              entry.originalArgs?.activityTypes?.some((type: string) =>
                activityTypes.includes(type),
              ) && entry.endpointName === 'GetActivities',
          )

          // now update the caches
          for (const entry of entriesToPatch) {
            dispatch(
              // @ts-ignore
              api.util.updateQueryData('GetActivities', entry.originalArgs, (draft: $Any) => {
                const activitiesToPatchIn = newActivities.filter((activity: $Any) =>
                  entry.originalArgs.entityIds?.includes(activity.entityId),
                )

                for (const newActivity of activitiesToPatchIn) {
                  //   find the activity to update or add
                  const index = draft?.activities?.findIndex(
                    (activity: $Any) => activity.activityId === activityId,
                  )

                  if (index === -1) {
                    // add the new activity
                    draft?.activities?.push(newActivity)
                    return
                  } else {
                    // update the activity
                    draft.activities[index] = newActivity
                  }
                }
              }),
            )
          }
        } catch (error) {
          // invalidate the activity feed for all those entities
          dispatch(
            api.util.invalidateTags(
              entityIds.map((entityId) => ({ type: 'entityActivities', id: entityId })),
            ),
          )
        }
      }

      // invalidate any checklist counts
      if (activityType === 'comment') {
        invalidateTags.push(
          ...entityIds.map((entityId) => ({
            type: 'entityActivities',
            id: 'checklist-' + entityId,
          })),
        )
      }

      //   invalidate the tags
      if (invalidateTags.length > 0) dispatch(api.util.invalidateTags(invalidateTags))
    },
    null,
    {
      deps: [store],
    },
  )

  return null
}

export default WatchActivities
