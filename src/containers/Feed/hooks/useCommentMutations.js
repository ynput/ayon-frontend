import { v1 as uuid1 } from 'uuid'
import { formatISO } from 'date-fns'
import {
  useCreateEntityActivityMutation,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
} from '/src/services/activities/updateActivities'
import { useSelector } from 'react-redux'
import { ayonApi } from '/src/services/ayon'
import { filterActivityTypes } from '/src/features/details'

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

  // type:"entityActivities"
  // id:"80528aac1dab11ef95ad0242ac180005"

  // id: "80528aac1dab11ef95ad0242ac180005"
  // type: "entityActivities"

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

  // does the body have a checklist anywhere in it
  // * [ ] or * [x]
  const bodyHasChecklist = (body) => {
    return body.includes('* [ ]') || body.includes('* [x]')
  }

  const patchAllRefs = ({ refs = [], value = '', files = [], isDelete = false, id }) => {
    const hasChecklist = bodyHasChecklist(value)
    // We need to try and update the cache for all the refs
    refs.forEach((ref) => {
      // create a new patch for optimistic update of refs
      const patch = !isDelete
        ? createPatch({
            entityId: ref.id,
            newId: id,
            subTitle: '',
            value,
            files,
          })
        : {}
      //  we don't know which filters the refs are using, so we need to update all of them
      Object.entries(filterActivityTypes).forEach(([filter, activityTypes]) => {
        // a comment never shows up in publishes
        if (filter === 'publishes') return

        // only add to checklist if the comment has a checklist
        if (filter === 'checklists' && !hasChecklist) return

        const argsForCachingMatching = { entityIds: [ref.id], activityTypes, projectName, filter }
        dispatch(
          ayonApi.util.updateQueryData('getActivities', argsForCachingMatching, (draft) => {
            if (isDelete) {
              // delete the comment from the list
              draft.activities = draft.activities.filter((activity) => activity.body !== value)
            } else {
              // add the new comment to the top of the list
              draft.activities = [patch, ...draft.activities]
            }
          }),
        )
      })
    })
  }

  const submitComment = async (value, files = [], refs = []) => {
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

    try {
      const results = await Promise.all(promises)

      // try and patch any ref caches
      patchAllRefs({ value, refs, files, id: patchId })

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

      // try and patch any ref caches
      patchAllRefs({ value, refs, files, id: activity.activityId })

      return res
    } catch (error) {
      console.error(error)
      return []
    }
  }

  const deleteComment = async (id, entityId, refs = [], body) => {
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

      // try and patch any ref caches
      patchAllRefs({ refs, isDelete: true, value: body })
    } catch (error) {
      // error is handled in the mutation
    }
  }

  return { submitComment, updateComment, deleteComment }
}

export default useCommentMutations
