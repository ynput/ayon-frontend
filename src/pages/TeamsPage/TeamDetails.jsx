import React, { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import { Button, FormLayout, FormRow, LockedInput, Panel } from '@ynput/ayon-react-components'
import DetailHeader from '/src/components/DetailHeader'

const TeamDetails = ({ teams = [], selectedTeams = [] }) => {
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

  //   create array of all roles for selected teams
  const teamsRoles = useMemo(() => {
    const roles = []
    teams.forEach((team) => {
      if (selectedTeams.includes(team.name)) {
        team.members.forEach((member) => {
          member.roles.forEach((role) => {
            if (!roles.includes(role)) {
              roles.push(role)
            }
          })
        })
      }
    })
    return roles
  }, [teams, selectedTeams])

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

  return (
    <>
      <DetailHeader>
        <div
          style={{
            overflow: 'hidden',
          }}
        >
          <h2>{title}</h2>
          <span>{subTitle}</span>
        </div>
      </DetailHeader>
      <Panel>
        <FormLayout>
          <FormRow label="Team Name">
            <LockedInput value={name} disabled={disableName} />
          </FormRow>
          <h2>Roles</h2>
          {teamsRoles.map((role) => (
            <div
              key={role}
              style={{
                display: 'flex',
                gap: 4,
                width: '100%',
              }}
            >
              <LockedInput value={role} style={{ flex: 1 }} /> <Button icon={'delete'} />
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
