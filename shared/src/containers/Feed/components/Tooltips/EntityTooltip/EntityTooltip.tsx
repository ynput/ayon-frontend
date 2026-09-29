import { EntityTooltip as SharedEntityTooltip } from '@shared/components/EntityTooltip'
import { useFeedContext } from '@shared/containers/Feed/context/FeedContext'

interface EntityTooltipProps {
  type?: string
  id?: string
  pos?: {
    left?: number
    top?: number
  }
}

const EntityTooltip: React.FC<EntityTooltipProps> = ({ type, id, pos }) => {
  const { projectInfo, projectName } = useFeedContext()

  return (
    <SharedEntityTooltip
      entityType={type}
      entityId={id}
      projectName={projectName}
      projectInfo={projectInfo}
      pos={pos}
    />
  )
}

export default EntityTooltip
