import { createPortal } from 'react-dom'
import EntityTooltip from '../../Tooltips/EntityTooltip/EntityTooltip'
import UserTooltip from '../../Tooltips/UserTooltip/UserTooltip'
import useReferenceTooltip from '/src/containers/Feed/hooks/useReferenceTooltip'

const ActivityReferenceTooltip = ({ dispatch, ...props }) => {
  const [refTooltip = {}] = useReferenceTooltip({ dispatch })
  const { type, label, name, pos, id } = refTooltip

  if (!id) return

  return createPortal(
    type === 'user' ? (
      <UserTooltip name={name} label={label} pos={pos} />
    ) : (
      <EntityTooltip {...{ type, label, name, pos, id, ...props }} />
    ),
    document.body,
  )
}

export default ActivityReferenceTooltip
