import React from 'react'
import PropTypes from 'prop-types'
import { Panel, UserImage } from '@ynput/ayon-react-components'
import styled, { css } from 'styled-components'
import { useGetUserByNameQuery } from '/src/services/user/getUsers'
import { useSelector } from 'react-redux'
import { formatDistance } from 'date-fns'
import { isObject } from 'lodash'
import getShimmerStyles from '/src/styles/getShimmerStyles'

const StyledUserImage = styled(UserImage)`
  /* isLoading */
  ${({ $isLoading }) =>
    $isLoading &&
    css`
      border: none;
      z-index: 0;
    `}
`

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

  /* isLoading */
  ${({ $isLoading }) =>
    $isLoading &&
    css`
      ${getShimmerStyles()}

      :hover {
        background-color: var(--color-grey-01);
      }
    `}
`

const TitleStyled = styled.strong`
  white-space: nowrap;
  width: 100%;
  position: relative;
  display: inline-block;
  overflow-x: clip;
  text-overflow: ellipsis;
`

const StyledLoading = styled.div`
  position: absolute;
  inset: 0;
  border-radius: var(--border-radius);
  ${getShimmerStyles('var(--color-grey-03)', 'var(--color-grey-04)')}
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
      $isLoading={loadingState}
    >
      <StyledUserImage
        src={attrib?.avatarUrl}
        fullName={attrib?.fullName || name}
        highlight={isSelf}
        $isLoading={loadingState}
      />
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <TitleStyled style={{ whiteSpace: 'nowrap' }}>
          {!loadingState && (attrib?.fullName ? `${attrib?.fullName} (${name})` : name)}
        </TitleStyled>
        <br />
        <span style={{ opacity: 0.5, height: 18, display: 'block' }}>
          {!loadingState ? (rolesHeader.length ? rolesHeader.join(', ') : 'No Roles') : ''}
        </span>
        {loadingState && <StyledLoading />}
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
