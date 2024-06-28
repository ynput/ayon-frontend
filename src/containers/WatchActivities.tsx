import usePubSub from '@hooks/usePubSub'
import { ayonApi } from '@/services/ayon'
import { FC } from 'react'
import { useDispatch, useStore } from 'react-redux'
import { $Any } from '@/types'
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

  const store = useStore()

  //   subscribe to inbox.message topic
  usePubSub(
    'activity',
    (topic: string, message: ActivityMessage) => {
      const references = message.summary?.references
      const entityIds = references?.map((reference) => reference.entity_id) || []

      if (topic === 'activity.deleted') {
        // because invalidation merges changes into the feed on top of the current cache, it can't remove messages.
        // we need to remove the messages from the cache manually

        // first find caches that contain this activityId
        const activityId = message.summary?.activity_id

        const state: any = store.getState()

        const entries = ayonApi.util.selectInvalidatedBy(state, [
          { type: 'activity', id: activityId },
        ])

        for (const entry of entries) {
          // remove the activity from the cache using originalArguments
          dispatch(
            // @ts-ignore
            ayonApi.util.updateQueryData('getActivities', entry.originalArgs, (draft: $Any) => {
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
        // invalidate the activity feed for all those entities
        dispatch(
          ayonApi.util.invalidateTags(
            entityIds.map((entityId) => ({ type: 'entityActivities', id: entityId })),
          ),
        )
      }
    },
    null,
    {
      deps: [store],
    },
  )

  return null
}

export default WatchActivities
