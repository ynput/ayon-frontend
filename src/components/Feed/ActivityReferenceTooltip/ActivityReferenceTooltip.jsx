import * as Styled from './ActivityReferenceTooltip.styled'
import { createPortal } from 'react-dom'
import EntityTooltip from '../../Tooltips/EntityTooltip/EntityTooltip'
import UserTooltip from '../../Tooltips/UserTooltip/UserTooltip'

const ActivityReferenceTooltip = ({ type, label, name, pos = {}, id, projectName }) => {
  return createPortal(
    <Styled.Popup style={pos || {}}>
      {type === 'user' ? (
        <UserTooltip name={name} label={label} />
      ) : (
        <EntityTooltip {...{ type, label, name, id, projectName }} />
      )}
    </Styled.Popup>,
    document.body,
  )
}

export default ActivityReferenceTooltip
