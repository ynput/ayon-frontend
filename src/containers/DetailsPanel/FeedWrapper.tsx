import { Feed, ActivityReferenceTooltip, FeedProvider } from '@shared/containers/Feed'
import type { FeedContextProps, EditingState, RefTooltip } from '@shared/containers/Feed'
import {
  useCreateEntityActivityMutation,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
} from '@queries/activities/updateActivities'
import { useGetKanbanProjectUsersQuery } from '@queries/userDashboard/getUserDashboard'
import { onCommentImageOpen } from '@state/context'
import { openSlideOut } from '@state/details'
import { useAppDispatch, useAppSelector } from '@state/store'
import { FC, useState } from 'react'
import { Status } from '@api/rest/project'
import { useViewer } from '@context/viewerContext'
import { goToFrame, openViewer } from '@state/viewer'
import { useGetEntityMentionsQuery } from '@queries/mentions/getMentions'
import {
  useCreateReactionToActivityMutation,
  useDeleteReactionToActivityMutation,
} from '@queries/reaction/updateReaction'
import {
  useGetActivitiesInfiniteInfiniteQuery,
  useGetEntityTooltipQuery,
} from '@queries/activities/getActivities'
import { SuggestRequest } from '@api/rest/activities'

interface FeedWrapperProps {
  entities: any[]
  activeUsers: any[]
  projectInfo: any
  projectName: string
  entityType: string
  isMultiProjects: boolean
  statePath: string
  readOnly: boolean
  statuses: Status[]
  scope: string
}

// handles all redux states and dispatching
// forwards any props
const FeedWrapper: FC<FeedWrapperProps> = ({
  scope = 'dashboard',
  statePath,
  entities,
  entityType,
  projectName,
  projectInfo,
  ...props
}) => {
  const user = useAppSelector((state) => state.user)
  const userName = user?.name || ''
  const userFullName = user?.attrib?.fullName || ''
  //   @ts-ignore
  const activityTypes = useAppSelector((state) => state.details[statePath][scope].activityTypes)
  //   @ts-ignore
  const filter = useAppSelector((state) => state.details[statePath][scope].filter)
  //   @ts-ignore
  const highlighted = useAppSelector((state) => state.details[statePath].highlighted) || []

  const reduxStateProps = { activityTypes, highlighted }

  const selectedProjects = useAppSelector((state) => state.dashboard.selectedProjects)

  const { data: projectUsersData = [] } = useGetKanbanProjectUsersQuery(
    { projects: selectedProjects },
    { skip: !selectedProjects?.length },
  )

  // listen to the viewer for annotations
  // later on, other hooks can be tried here to get annotations from different sources
  const { useAnnotations } = useViewer()
  const { annotations, removeAnnotation, exportAnnotationComposite } = useAnnotations()

  const annotationsProps = { annotations, removeAnnotation, exportAnnotationComposite }

  //   handlers
  const dispatch = useAppDispatch()
  const onOpenSlideOut: FeedContextProps['onOpenSlideOut'] = (args) => {
    // open slide out panel
    dispatch(openSlideOut({ ...args, scope }))
  }

  const onOpenImage: FeedContextProps['onOpenImage'] = (args) => {
    dispatch(onCommentImageOpen(args))
  }

  const onGoToFrame = (frame: number) => {
    dispatch(goToFrame(frame))
  }

  const onOpenViewer: FeedContextProps['onOpenViewer'] = (args) => {
    dispatch(openViewer(args))
  }

  const handlerProps = {
    onOpenSlideOut,
    onOpenImage,
    onGoToFrame,
    onOpenViewer,
  }
  //   queries
  const [createEntityActivityMutation, { isLoading: isLoadingCreate }] =
    useCreateEntityActivityMutation()
  const [updateActivityMutation, { isLoading: isLoadingUpdate }] = useUpdateActivityMutation()
  const [deleteActivityMutation, { isLoading: isLoadingDelete }] = useDeleteActivityMutation()
  const isUpdatingActivity = isLoadingCreate || isLoadingUpdate || isLoadingDelete

  const createEntityActivity: FeedContextProps['createEntityActivity'] = async (args) =>
    await createEntityActivityMutation(args).unwrap()
  const updateActivity: FeedContextProps['updateActivity'] = async (args) =>
    await updateActivityMutation(args).unwrap()
  const deleteActivity: FeedContextProps['deleteActivity'] = async (args) =>
    await deleteActivityMutation(args).unwrap()

  const [createReactionToActivity] = useCreateReactionToActivityMutation()
  const [deleteReactionToActivity] = useDeleteReactionToActivityMutation()

  const createReaction: FeedContextProps['createReaction'] = async (args) =>
    await createReactionToActivity(args).unwrap()
  const deleteReaction: FeedContextProps['deleteReaction'] = async (args) =>
    await deleteReactionToActivity(args).unwrap()

  const queryProps = {
    createEntityActivity,
    updateActivity,
    deleteActivity,
    isUpdatingActivity,
    deleteReaction,
    createReaction,
  }

  const [editingId, setEditingId] = useState<EditingState>(null)
  // get all versions that can be mentioned
  const { data: mentionSuggestionsData } = useGetEntityMentionsQuery(
    {
      suggestRequest: {
        entityType: entityType as SuggestRequest['entityType'],
        entityId: entities[0]?.id,
      },
      projectName: projectName,
    },
    { skip: !editingId },
  )

  return (
    <FeedProvider
      {...{
        scope,
        statePath,
        entities,
        projectName,
        entityType,
        projectInfo,
        filter,
        userName,
        userFullName,
        activityTypes,
        useGetActivitiesInfiniteInfiniteQuery,
        useGetEntityTooltipQuery,
      }}
      {...queryProps}
      {...handlerProps}
      {...annotationsProps}
      {...{ mentionSuggestionsData, projectUsersData }}
      {...{ editingId, setEditingId }}
    >
      <Feed {...props} {...reduxStateProps} />
      <ActivityReferenceTooltip />
    </FeedProvider>
  )
}

export default FeedWrapper
