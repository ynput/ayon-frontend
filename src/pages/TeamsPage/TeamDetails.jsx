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
import DetailHeader from '@components/DetailHeader'

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
      ? `${selectedTeams.length} Teams Selected (${selectedTeams.join(', ')})`
      : selectedTeams[0]
  const subTitle = `${totalMembers - totalLeaders} Members - ${totalLeaders} Leaders`

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

  return (
    <>
      <Panel
        style={{
          overflow: 'auto',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Team Settings</h2>
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
        <Divider style={{ margin: '10px 0' }} />

        <FormLayout>
          <FormRow label="Team Name">
            <LockedInput
              value={name}
              disabled={disableName}
              onSubmit={onRenameTeam}
              saveLabel=""
              cancelLabel=""
            />
          </FormRow>
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
              <LockedInput
                value={role}
                style={{ flex: 1 }}
                onSubmit={(v) => handleRoleRename(role, v)}
                saveLabel=""
                cancelLabel=""
              />{' '}
              <Button icon={'delete'} onClick={() => handleRoleRename(role, null)} />
            </div>
          ))}
        </FormLayout>
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
