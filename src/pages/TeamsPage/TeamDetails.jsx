import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  Button,
  Divider,
  FormLayout,
  FormRow,
  LockedInput,
  Panel,
} from '@ynput/ayon-react-components'
import { DetailHeader, EmptyPlaceholderFlex } from '@shared/components'
import { pluralize } from '@shared/util'
import styled from 'styled-components'
import { useFlatSettingsLayout } from '@hooks/useFlatSettingsLayout'
import { FlatFormCard } from '@components/FlatFormCard'

// a role's row in the flat layout: rename it, or delete it
const FlatRoleField = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  min-width: 0;

  > form {
    flex: 1;
  }
`

const TeamDetails = ({
  teams = [],
  selectedTeams = [],
  onUpdateTeams,
  roles = [],
  onRenameTeam,
}) => {
  const noneSelected = selectedTeams.length === 0
  const disableName = noneSelected || selectedTeams.length > 1

  const [name, setName] = useState('')
  const flatLayout = useFlatSettingsLayout()
  //   set initial team names
  useEffect(() => {
    if (selectedTeams.length === 1) {
      setName(selectedTeams[0])
    } else {
      setName(selectedTeams.join(', '))
    }
  }, [selectedTeams])

  const totalMembers = teams.reduce((total, team) => {
    if (selectedTeams.includes(team.name)) {
      return total + team.members.length
    }
    return total
  }, 0)
  const totalLeaders = teams.reduce((total, team) => {
    if (selectedTeams.includes(team.name)) {
      return total + team.members.filter((member) => member.leader).length
    }
    return total
  }, 0)

  const title =
    selectedTeams.length > 1
      ? `${selectedTeams.length} teams selected (${selectedTeams.join(', ')})`
      : selectedTeams[0]
  const subTitle = `${pluralize(totalMembers - totalLeaders, 'member')} · ${pluralize(
    totalLeaders,
    'leader',
  )}`

  const handleRoleRename = (role, value) => {
    // loop through every team and every member on each team to rename the role
    // {[teamName]: { [memberName]: [roles] }
    let updatedTeams = []
    teams.forEach((team) => {
      let rolesChanged = false
      const updatedMembers = []
      team.members.forEach((member) => {
        const updatedRoles = []

        member.roles.forEach((memberRole) => {
          if (memberRole === role) {
            if (!rolesChanged) rolesChanged = true
            // if value is empty string, don't add it to the array (delete)
            if (!value) return

            updatedRoles.push(value)
          } else {
            updatedRoles.push(memberRole)
          }
        })
        updatedMembers.push({ ...member, roles: updatedRoles })
      })
      if (rolesChanged) updatedTeams.push({ ...team, members: updatedMembers })
    })

    onUpdateTeams(updatedTeams)
  }

  const nameRow = (
    <FormRow label="Team name">
      <LockedInput
        value={name}
        disabled={disableName}
        onSubmit={onRenameTeam}
        saveLabel=""
        cancelLabel=""
      />
    </FormRow>
  )
  const roleInput = (role) => (
    <LockedInput
      value={role}
      style={{ flex: 1 }}
      onSubmit={(v) => handleRoleRename(role, v)}
      saveLabel=""
      cancelLabel=""
    />
  )
  const roleDelete = (role) => (
    <Button icon={'delete'} aria-label="Delete role" onClick={() => handleRoleRename(role, null)} />
  )

  if (noneSelected)
    return (
      <Panel>
        <h2 style={{ marginTop: 0 }}>Team settings</h2>
        <EmptyPlaceholderFlex
          className="compact"
          icon="groups"
          message="Select a team to rename it or edit its roles"
        />
      </Panel>
    )

  return (
    <>
      <Panel
        style={{
          overflow: 'auto',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Team settings</h2>
        <DetailHeader
          style={{
            padding: 0,
          }}
        >
          <div
            style={{
              overflow: 'hidden',
            }}
          >
            <h2>{title}</h2>
            <span>{subTitle}</span>
          </div>
        </DetailHeader>
        {flatLayout ? (
          // flat settings layout: cards of rows, like a flat settings page
          <div className="flat-form" style={{ marginTop: 'var(--base-gap-large)' }}>
            <FlatFormCard title="Team">
              <FormLayout>{nameRow}</FormLayout>
            </FlatFormCard>
            <FlatFormCard title="Roles">
              <FormLayout>
                {roles.map((role) => (
                  <FormRow key={role} label={role}>
                    <FlatRoleField>
                      {roleInput(role)}
                      {roleDelete(role)}
                    </FlatRoleField>
                  </FormRow>
                ))}
                {!roles.length && <p className="flat-form-note">No roles</p>}
              </FormLayout>
            </FlatFormCard>
          </div>
        ) : (
          <>
            <Divider style={{ margin: '10px 0' }} />

            <FormLayout>
              {nameRow}
              <h2>Roles</h2>
              {roles.map((role) => (
                <div
                  key={role}
                  style={{
                    display: 'flex',
                    gap: 4,
                    width: '100%',
                  }}
                >
                  {roleInput(role)} {roleDelete(role)}
                </div>
              ))}
            </FormLayout>
          </>
        )}
      </Panel>
    </>
  )
}

TeamDetails.propTypes = {
  teams: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      roles: PropTypes.arrayOf(PropTypes.string),
      leader: PropTypes.bool,
    }),
  ),

  selectedTeams: PropTypes.arrayOf(PropTypes.string),
  rolesList: PropTypes.arrayOf(PropTypes.string),
}

export default TeamDetails
