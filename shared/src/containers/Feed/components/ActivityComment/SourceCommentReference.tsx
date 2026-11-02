import { useGetActivitiesByIdQuery } from '@shared/api/queries/activities/getActivities'
import ActivityReference from '../ActivityReference/ActivityReference'

type SourceCommentReferenceProps = {
  projectName: string
  activityId: string
  entityId: string
  onClick: () => void
  categoryPrimary?: string
  categorySecondary?: string
}

const SourceCommentReference = ({
  projectName,
  activityId,
  entityId,
  onClick,
  categoryPrimary,
  categorySecondary,
}: SourceCommentReferenceProps) => {
  const { data: currentData, isError } = useGetActivitiesByIdQuery({
    projectName,
    entityIds: [entityId],
    activityIds: [activityId],
  })

  //   check if the user has access to the source comment
  if (isError || !currentData?.activities.some((activity) => activity.activityId === activityId)) {
    return null
  }

  return (
    <ActivityReference
      type="activity"
      id={`source-${activityId}`}
      icon="chat_paste_go"
      onClick={onClick}
      categoryPrimary={categoryPrimary}
      categorySecondary={categorySecondary}
      data-tooltip="Go to source comment"
    >
      Source
    </ActivityReference>
  )
}

export default SourceCommentReference
