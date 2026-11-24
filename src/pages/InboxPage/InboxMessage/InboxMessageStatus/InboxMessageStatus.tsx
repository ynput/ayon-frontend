import { StatusLabel } from '@shared/components'
import * as Styled from './InboxMessageStatus.styled'
import type { InboxStatusChange } from '../../types'

interface InboxMessageStatusProps {
  statuses?: InboxStatusChange[]
}

// a status change: each status as its icon in a square of its colour and its name, shortened when narrow
const InboxMessageStatus = ({ statuses = [] }: InboxMessageStatusProps) => {
  return (
    <Styled.MessageStatus>
      <StatusLabel
        statuses={statuses.map(({ name = '', ...status }) => ({ name, ...status }))}
        arrowIcon="arrow_right_alt"
        arrowClassName="type"
      />
    </Styled.MessageStatus>
  )
}

export default InboxMessageStatus
