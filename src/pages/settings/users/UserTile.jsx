import React from 'react'
import PropTypes from 'prop-types'
import { Panel } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import UserImage from './UserImage'

// styled panel
const PanelStyled = styled(Panel)`
  flex-direction: row;
  align-items: center;
  background-color: var(--color-grey-01);

  &:hover {
    background-color: var(--color-grey-02);
    cursor: pointer;
  }
`

const UserTile = ({ user, onClick }) => {
  if (!user) return null

  const {
    name,
    attrib: { fullName, avatarUrl },
    updatedAt,
    self,
    isManager,
    isAdmin,
    isService,
    roles,
  } = user

  let rolesHeader = []
  // add admin, manager, service
  if (isAdmin) rolesHeader.push('admin')
  else if (isService) rolesHeader.push('service')
  else if (isManager) rolesHeader.push('manager')
  else {
    Object.values(roles).forEach((roles2) => {
      roles2.forEach((role) => !rolesHeader.includes(role) && rolesHeader.push(role))
    })
  }

  //
  // format date number days ago
  // if 0 days ago, show hours ago
  // if 0 hours ago, show minutes ago

  const createdAtDate = new Date(0)
  createdAtDate.setUTCSeconds(updatedAt)
  const now = new Date()
  const diff = now - createdAtDate
  const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diff / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diff / (1000 * 60))

  const dateText =
    diffDays > 0
      ? `${diffDays} days ago`
      : diffHours > 0
      ? `${diffHours} hrs ago`
      : `${diffMinutes} mins ago`

  return (
    <PanelStyled onClick={onClick}>
      <UserImage src={avatarUrl} fullName={fullName || name} highlight={self} />
      <div style={{ flex: 1 }}>
        <strong>
          {fullName} ({name})
        </strong>
        <br />
        <span style={{ opacity: 0.5 }}>
          {rolesHeader.length ? rolesHeader.join(', ') : 'No Roles'}
        </span>
      </div>
      {updatedAt && (
        <span style={{ textAlign: 'end', opacity: 0.5 }}>
          Updated <br />
          {dateText}
        </span>
      )}
    </PanelStyled>
  )
}

UserTile.propTypes = {
  user: PropTypes.object,
  onClick: PropTypes.func,
}

export default UserTile
