import React from 'react'
import PropTypes from 'prop-types'
import { Panel } from '@ynput/ayon-react-components'
import styled, { css } from 'styled-components'
import UserImage from './UserImage'
import { useGetUserByNameQuery } from '/src/services/user/getUsers'
import { useSelector } from 'react-redux'
import { formatDistance } from 'date-fns'

// styled panel
const PanelStyled = styled(Panel)`
  flex-direction: row;
  align-items: center;
  background-color: var(--color-grey-01);
  padding: 8px;
  gap: 8px;

  /* if not disable hover */
  ${({ disableHover }) =>
    !disableHover &&
    css`
      &:hover {
        background-color: var(--color-grey-02);
        cursor: pointer;
      }
    `}
`

const UserTile = ({ user, onClick, userName, suspense, children, disableHover, style }) => {
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
    if ((data?.length && !isLoading && !isFetching) || suspense) {
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

  return (
    <PanelStyled onClick={onClick} disableHover={disableHover} style={style}>
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
          {formatDistance(new Date(updatedAt), new Date(), {
            addSuffix: true,
            includeSeconds: true,
          })}
        </span>
      )}
      {children}
    </PanelStyled>
  )
}

UserTile.propTypes = {
  user: PropTypes.object,
  onClick: PropTypes.func,
  userName: PropTypes.string,
  suspense: PropTypes.bool,
  children: PropTypes.node,
  disableHover: PropTypes.bool,
}

export default UserTile
