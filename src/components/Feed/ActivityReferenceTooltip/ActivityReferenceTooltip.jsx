import { createPortal } from 'react-dom'
import EntityTooltip from '../../Tooltips/EntityTooltip/EntityTooltip'
import UserTooltip from '../../Tooltips/UserTooltip/UserTooltip'

const ActivityReferenceTooltip = ({ type, label, name, pos = {}, ...props }) => {
  return createPortal(
    type === 'user' ? (
      <UserTooltip name={name} label={label} pos={pos} />
    ) : (
      <EntityTooltip {...{ type, label, name, pos, ...props }} />
    ),
    document.body,
  )
}

export default ActivityReferenceTooltip
