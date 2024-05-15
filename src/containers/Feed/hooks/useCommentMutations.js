import { v1 as uuid1 } from 'uuid'
import { formatISO } from 'date-fns'
import {
  useCreateEntityActivityMutation,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
} from '/src/services/activities/updateActivities'
import { useSelector } from 'react-redux'

const useCommentMutations = ({ projectName, entityType, entities = [], activityTypes, filter }) => {
  const { name, fullName } = useSelector((state) => state.user)
  const entityIds = entities.map((entity) => entity.id)

  // used to create and update activities (comments)
  const [createEntityActivity] = useCreateEntityActivityMutation()
  const [updateActivity] = useUpdateActivityMutation()
  const [deleteActivity] = useDeleteActivityMutation()

  const submitComment = async (value, files) => {
    // map over all the entities and create a new comment for each
    const promises = entities.map(({ id: entityId, subTitle }) => {
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
        entityId: entityId,
        referenceType: 'origin',
        authorName: name,
        authorFullName: fullName,
        createdAt: formatISO(new Date()),
        isOwner: true,
        files: files,
        origin: {
          id: '8090c2dafcc811eeaf820242c0a80002',
          type: entityType,
          name: subTitle,
        },
        author: {
          active: true,
          deleted: false,
        },
      }

      // we only need these args to update the cache of the original query
      const argsForCachingMatching = { entityIds, activityTypes }

      return createEntityActivity({
        projectName,
        entityType,
        entityId,
        data: newComment,
        patch,
        filter,
        ...argsForCachingMatching,
      }).unwrap()
    })

    return await Promise.all(promises)
  }

  const updateComment = async (activity, value, files = []) => {
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

    return await updateActivity({
      projectName,
      data: updatedActivity,
      activityId: activity.activityId,
      entityId: activity.entityId,
      patch,
      filter,
      ...argsForCachingMatching,
    }).unwrap()
  }

  const deleteComment = async (id, entityId) => {
    // we only need these args to update the cache of the original query
    const argsForCachingMatching = { entityType, entityIds, activityTypes }

    if (!id) return

    try {
      await deleteActivity({
        projectName,
        activityId: id,
        entityId,
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
