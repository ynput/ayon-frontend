import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './InboxMessageStatus.styled'

const InboxMessageStatus = ({
  fromStatus: { icon: fromIcon = 'fiber_manual_record', color: fromColor, name: fromName } = {},
  toStatus: { icon: toIcon = 'fiber_manual_record', color: toColor, name: toName } = {},
}) => {
  return (
    <Styled.MessageStatus>
      <Icon icon={fromIcon} style={{ color: fromColor }} className="status" />
      <Styled.Name>{fromName}</Styled.Name>
      <Icon icon="arrow_right_alt" className="type" />
      <Icon icon={toIcon} style={{ color: toColor }} className="status" />
      <Styled.Name>{toName}</Styled.Name>
    </Styled.MessageStatus>
  )
}

export default InboxMessageStatus
