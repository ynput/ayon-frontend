import { v1 as uuid1 } from 'uuid'
import { formatISO } from 'date-fns'
import {
  useCreateEntityActivityMutation,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
} from '@queries/activities/updateActivities'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'

// does the body have a checklist anywhere in it
// * [ ] or * [x]
export const bodyHasChecklist = (body) => {
  return body.includes('* [ ]') || body.includes('* [x]')
}

const useCommentMutations = ({ projectName, entityType, entities = [], activityTypes, filter }) => {
  const { name, attrib = {} } = useSelector((state) => state.user)
  const entityIds = entities.map((entity) => entity.id)

  // used to create and update activities (comments)
  const [createEntityActivity, { isLoading: isLoadingCreate }] = useCreateEntityActivityMutation()
  const [updateActivity, { isLoading: isLoadingUpdate }] = useUpdateActivityMutation()
  const [deleteActivity] = useDeleteActivityMutation()

  const createPatch = ({ entityId, newId, subTitle, value, files = [] }) => {
    const patch = {
      body: value,
      activityType: 'comment',
      activityId: newId,
      entityId: entityId,
      referenceType: 'origin',
      authorName: name,
      authorFullName: attrib.fullName,
      createdAt: formatISO(new Date()),
      isOwner: true,
      files: files,
      reactions: [],
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

    return patch
  }

  const getActivityId = () => uuid1().replace(/-/g, '')

  const submitComment = async (value, files = []) => {
    // map over all the entities and create a new comment for each
    let patchId = null
    const promises = entities.map(({ id: entityId, subTitle }) => {
      const newId = getActivityId()
      if (!patchId) patchId = newId
      const fileIds = files.map((file) => file.id)

      const newComment = {
        body: value,
        activityType: 'comment',
        id: newId,
        files: fileIds,
      }

      // create a new patch for optimistic update
      const patch = createPatch({ entityId, newId, subTitle, value, files })

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

    await Promise.all(promises)
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

    try {
      const res = await updateActivity({
        projectName,
        data: updatedActivity,
        activityId: activity.activityId,
        entityId: activity.entityId,
        patch,
        filter,
        ...argsForCachingMatching,
      }).unwrap()
    } catch (error) {
      console.error(error)
      toast.error(error?.data?.detail)
      // so higher level can detect the error
      throw error
    }
  }

  const deleteComment = async (id, entityId, refs = []) => {
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
        refs,
        ...argsForCachingMatching,
      }).unwrap()
    } catch (error) {
      // error is handled in the mutation
    }
  }

  return {
    submitComment,
    updateComment,
    deleteComment,
    isSaving: isLoadingCreate || isLoadingUpdate,
  }
}

export default useCommentMutations
