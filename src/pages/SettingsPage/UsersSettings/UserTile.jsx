import React from 'react'
import PropTypes from 'prop-types'
import { Panel } from '@ynput/ayon-react-components'
import UserImage from '@shared/components/UserImage'

import styled, { css } from 'styled-components'
import { useGetUserByNameQuery } from '@shared/api'
import { useSelector } from 'react-redux'
import { formatDistance } from 'date-fns'
import { isObject } from 'lodash'
import clsx from 'clsx'

// styled panel
const PanelStyled = styled(Panel)`
  flex-direction: row;
  align-items: center;
  background-color: var(--md-sys-color-surface-container-high);
  padding: 8px;
  gap: var(--base-gap-large);

  /* if not disable hover */
  ${({ disableHover }) =>
    !disableHover &&
    css`
      &:hover {
        background-color: var(--md-sys-color-surface-container-high-hover);
        cursor: pointer;
      }
      &:active {
        background-color: var(--md-sys-color-surface-container-high-active);
      }
    `}
`

const TitleStyled = styled.span`
  white-space: nowrap;
  width: 100%;
  position: relative;
  display: inline-block;
  overflow-x: clip;
  text-overflow: ellipsis;

  font-weight: bold;
`

const UserTile = ({
  user,
  onClick,
  userName,
  suspense,
  children,
  disableHover,
  style,
  leaderRoles,
  isWaiting,
}) => {
  const currentUser = useSelector((state) => state.user.name)

  // RTK QUERY
  const { data, isLoading, isFetching, isError } = useGetUserByNameQuery(
    { name: userName },
    {
      skip: user || !userName || isWaiting,
    },
  )

  if (!data || !data.length) return null

  const loadingState = isLoading || isFetching || isWaiting

  // if user is not passed in, use data from query
  if (!user) {
    if ((data?.length && !isLoading && !isFetching) || suspense) {
      // using useGetUserByNameQuery
      user = { ...data[0] }
      if (user.accessGroups) {
        user.accessGroups = JSON.parse(user.accessGroups)
      }
    } else if (isError) return <PanelStyled>Not Found</PanelStyled>
  }

  const { name, attrib, updatedAt, isManager, isAdmin, isService, accessGroups } = user || {}
  const isSelf = name === currentUser

  // TODO: change names here
  let rolesHeader = leaderRoles || []
  if (!isLoading && !leaderRoles) {
    // add admin, manager, service
    if (isAdmin) rolesHeader.push('admin')
    else if (isService) rolesHeader.push('service')
    else if (isManager) rolesHeader.push('manager')
    else if (isObject(accessGroups) && !Array.isArray(accessGroups)) {
      Object.values(accessGroups).forEach((roles2) => {
        roles2.forEach((role) => !rolesHeader.includes(role) && rolesHeader.push(role))
      })
    }
  }

  return (
    <PanelStyled
      onClick={onClick}
      disableHover={disableHover}
      style={style}
      className={clsx({ loading: loadingState }, 'HELLO')}
    >
      <UserImage name={name} highlight={isSelf} />
      <div
        style={{ flex: 1, overflow: 'hidden', position: 'relative' }}
        className={clsx({
          loading: loadingState,
        })}
      >
        <TitleStyled style={{ whiteSpace: 'nowrap' }}>
          {!loadingState && (attrib?.fullName ? `${attrib?.fullName} (${name})` : name)}
        </TitleStyled>
        <span style={{ opacity: 0.5, height: 18, display: 'block' }}>
          {!loadingState ? (rolesHeader.length ? rolesHeader.join(', ') : 'No Roles') : ''}
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
      {!loadingState && children}
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
  style: PropTypes.object,
  leaderRoles: PropTypes.array,
  isWaiting: PropTypes.bool,
}

export default UserTile
