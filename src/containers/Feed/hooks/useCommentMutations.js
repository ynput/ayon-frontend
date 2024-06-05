import { v1 as uuid1 } from 'uuid'
import { formatISO } from 'date-fns'
import {
  useCreateEntityActivityMutation,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
} from '/src/services/activities/updateActivities'
import { useSelector } from 'react-redux'
import { ayonApi } from '/src/services/ayon'

const useCommentMutations = ({
  projectName,
  entityType,
  entities = [],
  activityTypes,
  filter,
  dispatch,
}) => {
  const { name, attrib = {} } = useSelector((state) => state.user)
  const entityIds = entities.map((entity) => entity.id)

  // used to create and update activities (comments)
  const [createEntityActivity] = useCreateEntityActivityMutation()
  const [updateActivity] = useUpdateActivityMutation()
  const [deleteActivity] = useDeleteActivityMutation()

  const invalidateRefs = (refs = []) => {
    const entityIds = refs.filter((v) => v.type !== 'user').map((v) => v.id)
    const uniqueEntityIds = [...new Set(entityIds)]
    const tags = uniqueEntityIds.map((id) => ({ type: 'entityActivities', id }))

    dispatch(ayonApi.util.invalidateTags(tags))
  }

  // type:"entityActivities"
  // id:"80528aac1dab11ef95ad0242ac180005"

  // id: "80528aac1dab11ef95ad0242ac180005"
  // type: "entityActivities"

  const submitComment = async (value, files = [], refs = []) => {
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
        authorFullName: attrib.fullName,
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

    try {
      const results = await Promise.all(promises)

      invalidateRefs(refs)

      return results
    } catch (error) {
      return []
    }
  }

  const updateComment = async (activity, value, files = [], refs = []) => {
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

      invalidateRefs(refs)

      return res
    } catch (error) {
      console.error(error)
      return []
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
        ...argsForCachingMatching,
      }).unwrap()

      invalidateRefs(refs)
    } catch (error) {
      // error is handled in the mutation
    }
  }

  return { submitComment, updateComment, deleteComment }
}

export default useCommentMutations
