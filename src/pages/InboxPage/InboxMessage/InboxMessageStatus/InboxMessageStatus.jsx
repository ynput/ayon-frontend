import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './InboxMessageStatus.styled'
import { Fragment } from 'react'

const InboxMessageStatus = ({ statuses = [] }) => {
  return (
    <Styled.MessageStatus>
      {statuses.map(({ icon = 'fiber_manual_record', color, name }, index) => (
        <Fragment key={index}>
          <Icon icon={icon} style={{ color }} className="status" />
          <Styled.Name>{name}</Styled.Name>
          {index < statuses.length - 1 && <Icon icon="arrow_right_alt" className="type" />}
        </Fragment>
      ))}
    </Styled.MessageStatus>
  )
}

export default InboxMessageStatus
