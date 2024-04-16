import * as Styled from './EntityTooltip.styled'
import Thumbnail from '/src/containers/thumbnail'
import { useGetEntityTooltipQuery } from '/src/services/activities/getActivities'

const EntityTooltip = ({ type, label, id, projectName }) => {
  const { data } = useGetEntityTooltipQuery(
    { entityType: type, entityId: id, projectName },
    { skip: !projectName | !type | !id },
  )

  return (
    <div>
      <Thumbnail entityType={type} icon="directions_run" />
      <Styled.Content>
        <span>{label}</span>
      </Styled.Content>
    </div>
  )
}

export default EntityTooltip
