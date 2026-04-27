// shows createdBy and updatdeBy for a workfile
import { Assignees } from '@shared/api'
import { UserImage } from '@shared/components'
import { format, isDate } from 'date-fns'
import { forwardRef } from 'react'
import styled from 'styled-components'

const UsersContainer = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  align-items: center;
  max-width: clamp(100px, 10vw, 250px);
  overflow: hidden;
`

const UserName = styled.span`
  overflow: hidden;
  flex: 1;
  width: 100%;
  text-overflow: ellipsis;
`

const TOOLTIP_DELAY = 200
const formatTooltip = (user: Assignees[number], action: string, date?: string) => {
  if (!user) return ''
  let formattedDate = ''
  if (date && isDate(new Date(date))) {
    // dd//mm/yyyy, hh:mm
    formattedDate = format(new Date(date), 'dd/MM/yyyy, HH:mm')
  }

  return `${action} by ${user.fullName || user.name} ${user.fullName && `(${user.name})`}${
    formattedDate ? ` on ${formattedDate}` : ''
  }`
}

interface WorkfileUsersProps extends React.HTMLAttributes<HTMLDivElement> {
  createdBy?: string
  createdAt?: string
  updatedBy?: string
  updatedAt?: string
  users: Assignees
}

export const WorkfileUsers = forwardRef<HTMLDivElement, WorkfileUsersProps>(
  ({ createdBy, createdAt, updatedBy, updatedAt, users, ...props }, ref) => {
    const findUser = (name?: string | null) => {
      if (!name) return null
      return users.find((user) => user.name === name)
    }

    const createdByUser = findUser(createdBy)
    const updatedByUser = findUser(updatedBy)
    const isDifferentUsers =
      createdByUser && updatedByUser && createdByUser.name !== updatedByUser.name

    if (!createdBy || !createdByUser) return null

    return (
      <UsersContainer {...props} ref={ref}>
        <UserImage
          name={createdBy}
          fullName={createdByUser?.fullName ?? undefined}
          imageKey={createdByUser?.updatedAt}
          size={20}
          data-tooltip={formatTooltip(createdByUser, 'Created', createdAt)}
          data-tooltip-delay={TOOLTIP_DELAY}
        />
        {isDifferentUsers && updatedBy && updatedByUser && (
          <UserImage
            name={updatedBy}
            fullName={updatedByUser?.fullName ?? undefined}
            imageKey={updatedByUser?.updatedAt}
            size={20}
            data-tooltip={formatTooltip(updatedByUser, 'Updated', updatedAt)}
            data-tooltip-delay={TOOLTIP_DELAY}
          />
        )}
        {!isDifferentUsers && <UserName>{createdByUser?.fullName || createdBy}</UserName>}
      </UsersContainer>
    )
  },
)
