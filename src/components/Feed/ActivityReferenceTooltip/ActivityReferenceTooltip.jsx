import UserImage from '/src/components/UserImage'
import * as Styled from './ActivityReferenceTooltip.styled'
import Thumbnail from '/src/containers/thumbnail'
import { createPortal } from 'react-dom'

const ActivityReferenceTooltip = ({ type, label, name, pos = {} }) => {
  return createPortal(
    <Styled.Popup style={pos || {}}>
      {type === 'user' ? (
        <UserImage name={name} />
      ) : (
        <Thumbnail entityType={type} icon="directions_run" />
      )}
      <Styled.Content>
        <span>{type === 'user' ? label : 'ShotName'}</span>
        <span className={'label'}>{type === 'user' ? name : label}</span>
      </Styled.Content>
    </Styled.Popup>,
    document.body,
  )
}

export default ActivityReferenceTooltip
