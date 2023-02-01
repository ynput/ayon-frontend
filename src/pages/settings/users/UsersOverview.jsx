import React from 'react'
import PropTypes from 'prop-types'
import { Button, Section, Panel } from '@ynput/ayon-react-components'
import { PanelButtonsStyled } from './userDetail'
import { Link } from 'react-router-dom'
import styled, { css } from 'styled-components'
import UserTile from './UserTile'

// panel with two buttons
// - one to add a new user
// - add a new user attribute

const LinkStyled = styled(Link)`
  text-decoration: none;
  color: unset;

  button {
    width: 100%;
  }
`

export const TotalsStyledPanel = styled(Panel)`
  flex-direction: row;
  flex: 4;

  h2 {
    width: 100%;
  }
`

// total styled Button
export const TotalStyledButton = styled(Button)`
  flex: 1;

  &:focus {
    outline: none;
  }

  ${({ highlighted }) =>
    highlighted &&
    css`
      background-color: var(--color-grey-04);
      outline: 1px solid var(--color-hl-00);
      &:focus {
        outline: 1px solid var(--color-hl-00);
      }
    `}
`

const UsersOverview = ({
  userList = [],
  onNewUser,
  onUserSelect,
  onTotal,
  selectedProjects,
  search,
}) => {
  // get last createdAt user
  const lastUser = userList.reduce((acc, user) => {
    if (!acc) return user
    if (user.createdAt > acc.createdAt) return user
    return acc
  }, null)

  //   get self user
  const selfUser = userList.filter((u) => u.self)[0]

  return (
    <Section className="wrap" style={{ gap: '5px', bottom: 'unset', maxHeight: '100%' }}>
      <TotalsStyledPanel style={{ flexWrap: 'wrap' }}>
        <h2 style={{ width: '100%' }}>{selectedProjects ? selectedProjects.join(', ') : 'All'}</h2>
        <TotalStyledButton
          label={`Total - ${userList.length}`}
          onClick={() => onTotal('total')}
          highlighted={search === 'total'}
        />
        <TotalsStyledPanel
          style={{
            padding: '0',
          }}
        >
          <TotalStyledButton
            label={`Admins - ${userList.filter((u) => u.isAdmin).length}`}
            onClick={() => onTotal('admin')}
            highlighted={search === 'admin'}
          />
          <TotalStyledButton
            label={`Managers - ${
              userList.filter((u) => !u.isAdmin && !u.isService && u.isManager).length
            }
        `}
            onClick={() => onTotal('manager')}
            highlighted={search === 'manager'}
          />
          <TotalStyledButton
            label={`Services - ${userList.filter((u) => !u.isAdmin && u.isService).length}`}
            onClick={() => onTotal('service')}
            highlighted={search === 'service'}
          />
          <TotalStyledButton
            label={`Users - ${
              userList.filter((u) => !u.isAdmin && !u.isService && !u.isManager).length
            }`}
            onClick={() => onTotal('!admin, !service, !manager')}
            highlighted={search === '!admin, !service, !manager'}
          />
        </TotalsStyledPanel>
      </TotalsStyledPanel>

      <Panel>
        <h2>Latest User</h2>
        <UserTile user={lastUser} onClick={() => onUserSelect(lastUser)} />
        <h2>Me</h2>
        <UserTile user={selfUser} onClick={() => onUserSelect(selfUser)} />
      </Panel>
      <PanelButtonsStyled>
        <Button label="Add New User" icon="person_add" onClick={onNewUser} />
        <LinkStyled to={'/settings/attributes'}>
          <Button label="Add New User Attribute" icon="add" />
        </LinkStyled>
      </PanelButtonsStyled>
    </Section>
  )
}

UsersOverview.propTypes = {
  userList: PropTypes.array.isRequired,
  onNewUser: PropTypes.func.isRequired,
  onUserSelect: PropTypes.func,
  onTotal: PropTypes.func,
  selectedProjects: PropTypes.array,
}

export default UsersOverview
