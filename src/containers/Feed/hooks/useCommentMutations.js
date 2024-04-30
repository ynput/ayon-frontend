import { v1 as uuid1 } from 'uuid'
import { formatISO } from 'date-fns'
import {
  useCreateEntityActivityMutation,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
} from '/src/services/activities/updateActivities'
import { useSelector } from 'react-redux'

const useCommentMutations = ({
  projectName,
  entityType,
  entityId,
  entityIds,
  activityTypes,
  filter,
}) => {
  const { name, fullName } = useSelector((state) => state.user)

  // used to create and update activities (comments)
  const [createEntityActivity] = useCreateEntityActivityMutation()
  const [updateActivity] = useUpdateActivityMutation()
  const [deleteActivity] = useDeleteActivityMutation()

  const submitComment = async (value, files) => {
    const newId = uuid1().replace(/-/g, '')
    const fileIds = files.map((file) => file.id)

    const newComment = {
      body: value,
      activityType: 'comment',
      id: newId,
      files: fileIds,
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
      isOwner: true,
      files: files,
    }

    // we only need these args to update the cache of the original query
    const argsForCachingMatching = { entityIds, activityTypes }

    try {
      await createEntityActivity({
        projectName,
        entityType,
        entityId,
        data: newComment,
        patch,
        filter,
        ...argsForCachingMatching,
      }).unwrap()
    } catch (error) {
      console.error(error)
    }
  }

  const updateComment = async (activity, value, files) => {
    const fileIds = files.map((file) => file.id)

    const updatedActivity = {
      body: value,
      files: fileIds,
    }

    const patch = {
      ...activity,
      ...updatedActivity,
      files,
    }

    // we only need these args to update the cache of the original query
    const argsForCachingMatching = { entityType, entityIds, activityTypes }

    try {
      await updateActivity({
        projectName,
        data: updatedActivity,
        activityId: activity.activityId,
        patch,
        filter,
        ...argsForCachingMatching,
      }).unwrap()
    } catch (error) {
      // error is handled in the mutation
    }
  }

  const deleteComment = async (id) => {
    // we only need these args to update the cache of the original query
    const argsForCachingMatching = { entityType, entityIds, activityTypes }

    if (!id) return

    try {
      await deleteActivity({
        projectName,
        activityId: id,
        filter,
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
