import React from 'react'
import PropTypes from 'prop-types'
import { Panel } from '@ynput/ayon-react-components'
import styled from 'styled-components'
import UserImage from './UserImage'
import { useGetUserByNameQuery } from '/src/services/user/getUsers'
import { useSelector } from 'react-redux'

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

const UserTile = ({ user, onClick, userName, suspence }) => {
  const currentUser = useSelector((state) => state.user.name)

  // RTK QUERY
  const { data, isLoading, isFetching, isError } = useGetUserByNameQuery(
    { name: userName },
    {
      skip: user || !userName,
    },
  )

  // if user is not passed in, use data from query
  if (!user) {
    if ((data?.length && !isLoading && !isFetching) || suspence) {
      // using useGetUserByNameQuery
      user = { ...data[0] }
      if (user.roles) {
        user.roles = JSON.parse(user.roles)
      }
    } else if (isError) return <PanelStyled>Not Found</PanelStyled>
  }

  const { name, attrib, updatedAt, isManager, isAdmin, isService, roles } = user || {}
  const isSelf = name === currentUser

  let rolesHeader = []
  if (!isLoading) {
    // add admin, manager, service
    if (isAdmin) rolesHeader.push('admin')
    else if (isService) rolesHeader.push('service')
    else if (isManager) rolesHeader.push('manager')
    else if (roles) {
      Object.values(roles).forEach((roles2) => {
        roles2.forEach((role) => !rolesHeader.includes(role) && rolesHeader.push(role))
      })
    }
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
      <UserImage src={attrib?.avatarUrl} fullName={attrib?.fullName || name} highlight={isSelf} />
      <div style={{ flex: 1 }}>
        <strong>
          {attrib?.fullName} ({name})
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
  userName: PropTypes.string,
}

export default UserTile
