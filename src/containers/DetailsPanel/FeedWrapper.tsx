import ActivityReferenceTooltip from '@components/Feed/ActivityReferenceTooltip/ActivityReferenceTooltip'
import Feed, { FeedProps } from '@containers/Feed/Feed'
import { FeedContextProps, FeedProvider } from '@context/FeedContext'
import {
  useCreateEntityActivityMutation,
  useDeleteActivityMutation,
  useUpdateActivityMutation,
} from '@queries/activities/updateActivities'
import { onCommentImageOpen } from '@state/context'
import { openSlideOut } from '@state/details'
import { useAppDispatch, useAppSelector } from '@state/store'
import { Status } from '@ynput/ayon-react-components'
import { FC } from 'react'

interface FeedWrapperProps {
  entities: any[]
  activeUsers: any[]
  projectInfo: any
  projectName: string
  entityType: string
  isMultiProjects: boolean
  statePath: string
  readOnly?: boolean
  statuses: Status[]
  scope: string
}

// handles all redux states and dispatching
// forwards any props
const FeedWrapper: FC<FeedWrapperProps> = ({ scope = 'dashboard', statePath, ...props }) => {
  const userName = useAppSelector((state) => state.user.name)
  //   @ts-ignore
  const activityTypes = useAppSelector((state) => state.details[statePath][scope].activityTypes)
  //   @ts-ignore
  const filter = useAppSelector((state) => state.details[statePath][scope].filter)
  //   @ts-ignore
  const highlighted = useAppSelector((state) => state.details[statePath].highlighted) || []

  const selectedProjects = useAppSelector((state) => state.dashboard.selectedProjects)

  console.log({ filter })

  const reduxStateProps = { activityTypes, highlighted, selectedProjects }

  //   handlers
  const dispatch = useAppDispatch()
  const onOpenSlideOut: FeedProps['onOpenSlideOut'] = (args) => {
    // open slide out panel
    dispatch(openSlideOut({ ...args, scope }))
  }

  const onOpenImage: FeedProps['onOpenImage'] = (args) => {
    dispatch(onCommentImageOpen(args))
  }

  const handlerProps = {
    onOpenSlideOut,
    onOpenImage,
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

  const queryProps = {
    createEntityActivity,
    updateActivity,
    deleteActivity,
    isUpdatingActivity,
  }

  return (
    <FeedProvider {...{ scope, statePath, filter, userName }} {...queryProps}>
      <Feed {...props} {...reduxStateProps} {...handlerProps} />
      <ActivityReferenceTooltip projectName={props.projectName} projectInfo={props.projectInfo} />
    </FeedProvider>
  )
}

export default FeedWrapper
