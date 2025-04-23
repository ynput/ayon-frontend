import { v1 as uuid1 } from 'uuid'
import { formatISO } from 'date-fns'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { useFeedContext } from '@context/FeedContext'

// Type definitions
interface Entity {
  id: string
  subTitle?: string
}

interface File {
  id: string
  [key: string]: any
}

export interface Activity {
  activityId: string
  entityId: string
  body: string
  files: File[]
  [key: string]: any
}

interface CommentPatch {
  body: string
  activityType: string
  activityId: string
  entityId: string
  referenceType: string
  authorName: string
  authorFullName?: string
  createdAt: string
  files: File[]
  reactions: any[]
  origin: {
    id: string
    type: string
    name?: string
  }
  author: {
    active: boolean
    deleted: boolean
  }
}

interface CommentMutationsProps {
  projectName: string
  entityType: string
  entities: Entity[]
  activityTypes: string[]
  filter: any
}

interface CommentPayload {
  entityId: string
  newId: string
  subTitle?: string
  value: string
  files?: File[]
}

// does the body have a checklist anywhere in it
// * [ ] or * [x]
export const bodyHasChecklist = (body: string): boolean => {
  return body.includes('* [ ]') || body.includes('* [x]')
}

const useCommentMutations = ({
  projectName,
  entityType,
  entities = [],
  activityTypes,
  filter,
}: CommentMutationsProps) => {
  const { createEntityActivity, updateActivity, deleteActivity, isUpdatingActivity } =
    useFeedContext()
  const { name, attrib = {} } = useSelector((state: any) => state.user)
  const entityIds = entities.map((entity) => entity.id)

  const createPatch = ({
    entityId,
    newId,
    subTitle,
    value,
    files = [],
  }: CommentPayload): CommentPatch => {
    const patch: CommentPatch = {
      body: value,
      activityType: 'comment',
      activityId: newId,
      entityId: entityId,
      referenceType: 'origin',
      authorName: name,
      authorFullName: attrib.fullName,
      createdAt: formatISO(new Date()),
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

  const getActivityId = (): string => uuid1().replace(/-/g, '')

  const submitComment = async (value: string, files: File[] = []): Promise<void> => {
    // map over all the entities and create a new comment for each
    let patchId: string | null = null
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
      })
    })

    await Promise.all(promises)
  }

  const updateComment = async (
    activity: Activity,
    value: string,
    files: File[] = [],
  ): Promise<void> => {
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
        entityId: activity.entityId,
        patch,
        filter,
        ...argsForCachingMatching,
      })
    } catch (error: any) {
      console.error(error)
      toast.error(error?.data?.detail)
      // so higher level can detect the error
      throw error
    }
  }

  const deleteComment = async (id: string, entityId: string, refs: any[] = []): Promise<void> => {
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
      })
    } catch (error) {
      // error is handled in the mutation
    }
  }

  return {
    submitComment,
    updateComment,
    deleteComment,
    isSaving: isUpdatingActivity,
  }
}

export default useCommentMutations
