import { v1 as uuid1 } from 'uuid'
import { formatISO } from 'date-fns'
import {
  useCreateEntityActivityMutation,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
} from '/src/services/activities/updateActivities'
import { useSelector } from 'react-redux'

const useCommentMutations = ({ projectName, entityType, entityId, entitiesToQuery }) => {
  const { name, fullName } = useSelector((state) => state.user)

  // used to create and update activities (comments)
  const [createEntityActivity] = useCreateEntityActivityMutation()
  const [updateActivity] = useUpdateActivityMutation()
  const [deleteActivity] = useDeleteActivityMutation()

  const submitComment = async (value) => {
    const newId = uuid1().replace(/-/g, '')

    const newComment = {
      body: value,
      activityType: 'comment',
      id: newId,
    }

    // create a new patch for optimistic update
    const patch = {
      body: value,
      activityType: 'comment',
      activityId: newId,
      referenceType: 'origin',
      authorName: name,
      authorFullName: fullName,
      createdAt: formatISO(new Date()),
    }

    // we only need these args to update the cache of the original query
    const argsForCachingMatching = { entities: entitiesToQuery }

    try {
      await createEntityActivity({
        projectName,
        entityType,
        entityId,
        data: newComment,
        patch,
        ...argsForCachingMatching,
      }).unwrap()
    } catch (error) {
      console.error(error)
    }
  }

  const updateComment = async (activity, value) => {
    const updatedActivity = {
      body: value,
    }

    const patch = {
      ...activity,
      ...updatedActivity,
    }

    // we only need these args to update the cache of the original query
    const argsForCachingMatching = { entityType, entityId, entities: entitiesToQuery }

    try {
      await updateActivity({
        projectName,
        data: updatedActivity,
        activityId: activity.activityId,
        patch,
        ...argsForCachingMatching,
      }).unwrap()
    } catch (error) {
      // error is handled in the mutation
    }
  }

  const deleteComment = async (id) => {
    // we only need these args to update the cache of the original query
    const argsForCachingMatching = { entityType, entityId, entities: entitiesToQuery }

    if (!id) return

    try {
      await deleteActivity({
        projectName,
        activityId: id,
        patch: { activityId: id },
        ...argsForCachingMatching,
      }).unwrap()
    } catch (error) {
      // error is handled in the mutation
    }
  }

  return { submitComment, updateComment, deleteComment }
}

export default useCommentMutations
