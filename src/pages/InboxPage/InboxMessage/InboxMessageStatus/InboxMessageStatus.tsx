import { Icon } from '@ynput/ayon-react-components'
import { ValuePill } from '@shared/components'
import * as Styled from './InboxMessageStatus.styled'
import { Fragment } from 'react'
import type { InboxStatusChange } from '../../types'

interface InboxMessageStatusProps {
  statuses?: InboxStatusChange[]
}

// a status change: each status filled with its colour, like in the tables
const InboxMessageStatus = ({ statuses = [] }: InboxMessageStatusProps) => {
  return (
    <Styled.MessageStatus>
      {statuses.map(({ icon = 'fiber_manual_record', color, colorLight, name = '' }, index) => (
        <Fragment key={index}>
          <ValuePill variant="filled" label={name} {...{ icon, color, colorLight }} />
          {index < statuses.length - 1 && <Icon icon="arrow_right_alt" className="type" />}
        </Fragment>
      ))}
    </Styled.MessageStatus>
  )
}

export default InboxMessageStatus
